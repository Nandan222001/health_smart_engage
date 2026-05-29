import csv
import io
from typing import Annotated

import httpx
from fastapi import APIRouter, Body, Depends, File, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_catalog_controller
from app.api.v1.route_factory import register_catalog_routes
from app.controllers.catalog_controller import CatalogController
from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user
from app.helpers.response import accepted
from app.services.org_setup_service import OrgSetupService

router = APIRouter()

# Bulk-upload routes are handled below as direct file-upload endpoints.
ENDPOINTS = [
    ("GET",  "/progress",          "org_setup_progress_get",          "Get setup progress"),
    ("POST", "/step1",             "org_setup_step1_save",            "Save step 1 – org details"),
    ("GET",  "/step1",             "org_setup_step1_get",             "Get step 1 – org details"),
    ("POST", "/step2",             "org_setup_step2_save",            "Save step 2 – compliance"),
    ("GET",  "/step2",             "org_setup_step2_get",             "Get step 2 – compliance"),
    ("POST", "/step3/site",        "org_setup_step3_site_create",     "Create a site"),
    ("GET",  "/step3/sites",       "org_setup_step3_sites_list",      "List sites"),
    ("POST", "/step4/user",        "org_setup_step4_user_create",     "Create a user"),
    ("GET",  "/step4/users",       "org_setup_step4_users_list",      "List users"),
    ("POST", "/step5",             "org_setup_step5_save",            "Save step 5 – workflow config"),
    ("GET",  "/step5",             "org_setup_step5_get",             "Get step 5 – workflow config"),
    ("POST", "/step6/upload",      "org_setup_step6_upload",          "Upload knowledge document"),
    ("GET",  "/step6/documents",   "org_setup_step6_documents_list",  "List knowledge documents"),
    ("POST", "/step6a/import",     "org_setup_step6a_import",         "Import historical data"),
    ("GET",  "/step6a/imports",    "org_setup_step6a_imports_list",   "List data imports"),
    ("POST", "/step7",             "org_setup_step7_save",            "Save step 7 – AI config"),
    ("GET",  "/step7",             "org_setup_step7_get",             "Get step 7 – AI config"),
    ("POST", "/activate",          "org_setup_activate",              "Activate organisation (step 8)"),
]

register_catalog_routes(router, "org_setup", ENDPOINTS)

# ── File-parsing helper ────────────────────────────────────────────────────────

def _parse_file(content: bytes, filename: str) -> list[dict]:
    """Parse CSV or Excel bytes into a list of row dicts."""
    name = (filename or "").lower()
    if name.endswith(".csv"):
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        return [dict(row) for row in reader]
    # Excel (.xlsx / .xls)
    try:
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            return []
        headers = [str(h or "").strip() for h in rows[0]]
        result = []
        for row in rows[1:]:
            if any(v is not None for v in row):
                result.append({headers[i]: (str(v) if v is not None else "") for i, v in enumerate(row)})
        return result
    except ImportError:
        raise ValueError("openpyxl not installed – please upload a CSV file instead")


def _normalise(row: dict, *keys: str) -> str:
    """Return first matching value from row by trying multiple key variants."""
    lowered = {k.lower().strip(): v for k, v in row.items()}
    for key in keys:
        val = lowered.get(key.lower())
        if val is not None:
            return str(val).strip()
    return ""


# ── Step 3: Bulk upload sites ─────────────────────────────────────────────────

@router.post(
    "/step3/bulk",
    summary="Bulk upload sites from Excel/CSV",
    status_code=status.HTTP_202_ACCEPTED,
)
async def bulk_upload_sites(
    file: UploadFile = File(...),
    user: Annotated[CurrentUser, Depends(get_current_user)] = None,
    db: Annotated[Session, Depends(get_db)] = None,
):
    content = await file.read()
    rows = _parse_file(content, file.filename or "upload.csv")
    sites = [
        {
            "name":    _normalise(r, "name", "site name", "site"),
            "type":    _normalise(r, "type", "site type") or "Site",
            "address": _normalise(r, "address", "location"),
        }
        for r in rows
        if _normalise(r, "name", "site name", "site")
    ]
    svc = OrgSetupService(db)
    result = svc.bulk_upload_sites(user, {"sites": sites})
    db.commit()
    return accepted(result, f"Uploaded {result['count']} sites")


# ── Step 4: Bulk upload users ─────────────────────────────────────────────────

@router.post(
    "/step4/bulk",
    summary="Bulk upload users from Excel/CSV",
    status_code=status.HTTP_202_ACCEPTED,
)
async def bulk_upload_users(
    file: UploadFile = File(...),
    user: Annotated[CurrentUser, Depends(get_current_user)] = None,
    db: Annotated[Session, Depends(get_db)] = None,
):
    content = await file.read()
    rows = _parse_file(content, file.filename or "upload.csv")
    users = [
        {
            "name":       _normalise(r, "name", "full name", "employee name"),
            "email":      _normalise(r, "email", "email address"),
            "role":       _normalise(r, "role", "job title", "position"),
            "department": _normalise(r, "department", "dept", "team"),
        }
        for r in rows
        if _normalise(r, "email", "email address")
    ]
    svc = OrgSetupService(db)
    result = svc.bulk_upload_users(user, {"users": users})
    db.commit()
    return accepted(result, f"Uploaded {result['count']} users")


# ── Step 4: HRMS import ───────────────────────────────────────────────────────

class HrmsImportPayload(BaseModel):
    url: str
    token: str = ""


@router.post(
    "/step4/hrms-import",
    summary="Import employees from HRMS API",
    status_code=status.HTTP_202_ACCEPTED,
)
async def hrms_import(
    payload: HrmsImportPayload = Body(...),
    user: Annotated[CurrentUser, Depends(get_current_user)] = None,
    db: Annotated[Session, Depends(get_db)] = None,
):
    headers = {}
    if payload.token:
        headers["Authorization"] = f"Bearer {payload.token}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(payload.url, headers=headers)
            resp.raise_for_status()
            raw = resp.json()
    except httpx.HTTPError as exc:
        return accepted({"count": 0, "error": str(exc)}, "HRMS connection failed")

    # Try to extract a list from common HRMS response shapes
    employees: list = []
    if isinstance(raw, list):
        employees = raw
    elif isinstance(raw, dict):
        for key in ("data", "employees", "items", "results", "records"):
            if isinstance(raw.get(key), list):
                employees = raw[key]
                break

    users = [
        {
            "name":       str(emp.get("name") or emp.get("full_name") or emp.get("fullName") or ""),
            "email":      str(emp.get("email") or emp.get("work_email") or emp.get("workEmail") or ""),
            "role":       str(emp.get("role") or emp.get("job_title") or emp.get("jobTitle") or emp.get("designation") or ""),
            "department": str(emp.get("department") or emp.get("dept") or ""),
        }
        for emp in employees
        if emp.get("email") or emp.get("work_email") or emp.get("workEmail")
    ]

    svc = OrgSetupService(db)
    result = svc.bulk_upload_users(user, {"users": users})
    db.commit()
    return accepted(result, f"Imported {result['count']} employees from HRMS")


# ── Step 1: Excel parse ───────────────────────────────────────────────────────

_FIELD_MAP = {
    "organization name": "organizationName",
    "org name": "organizationName",
    "company name": "organizationName",
    "name": "organizationName",
    "industry type": "industryType",
    "industry": "industryType",
    "employee count": "employeeCount",
    "employees": "employeeCount",
    "number of sites": "numberOfSites",
    "sites": "numberOfSites",
    "official email": "officialEmail",
    "email": "officialEmail",
    "contact number": "contactNumber",
    "phone": "contactNumber",
    "contact": "contactNumber",
    "country": "country",
    "timezone": "timezone",
    "time zone": "timezone",
    "headquarters address": "headquartersAddress",
    "address": "headquartersAddress",
    "hq address": "headquartersAddress",
}


@router.post("/step1/parse-excel", summary="Parse org details from Excel/CSV", status_code=200)
async def parse_org_excel(
    file: UploadFile = File(...),
    user: Annotated[CurrentUser, Depends(get_current_user)] = None,
    db: Annotated[Session, Depends(get_db)] = None,
):
    content = await file.read()
    rows = _parse_file(content, file.filename or "upload.csv")
    result: dict = {}

    # Support two layouts:
    # 1. Key-value pairs: rows have "Field" and "Value" columns
    # 2. Header row with org field names as columns (single data row)
    if rows and "field" in {k.lower().strip() for k in rows[0].keys()}:
        for row in rows:
            field = str(row.get("Field") or row.get("field") or "").lower().strip()
            value = str(row.get("Value") or row.get("value") or "").strip()
            mapped = _FIELD_MAP.get(field)
            if mapped:
                result[mapped] = value
    else:
        for row in rows[:1]:
            for col, val in row.items():
                mapped = _FIELD_MAP.get(col.lower().strip())
                if mapped and val:
                    result[mapped] = str(val).strip()

    return {"success": True, "data": result}


# ── Step 1: API connect ───────────────────────────────────────────────────────

class OrgApiConnectPayload(BaseModel):
    url: str
    api_key: str = ""
    token: str = ""


@router.post("/step1/api-connect", summary="Connect to external system and pull org data", status_code=200)
async def org_api_connect(
    payload: OrgApiConnectPayload = Body(...),
    user: Annotated[CurrentUser, Depends(get_current_user)] = None,
    db: Annotated[Session, Depends(get_db)] = None,
):
    headers: dict[str, str] = {}
    if payload.token:
        headers["Authorization"] = f"Bearer {payload.token}"
    elif payload.api_key:
        headers["X-API-Key"] = payload.api_key

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(payload.url, headers=headers)
            resp.raise_for_status()
            raw = resp.json()
    except httpx.HTTPError as exc:
        return {"success": False, "message": str(exc), "data": {}}

    # Normalise common API response shapes into org details
    org: dict = {}
    if isinstance(raw, dict):
        # Try common keys for org name
        for key in ("name", "organization_name", "org_name", "company_name", "companyName"):
            if raw.get(key):
                org["organizationName"] = str(raw[key])
                break
        for key in ("industry", "industry_type", "industryType", "sector"):
            if raw.get(key):
                org["industryType"] = str(raw[key])
                break
        for key in ("employee_count", "employeeCount", "employees", "headcount"):
            if raw.get(key):
                org["employeeCount"] = str(raw[key])
                break
        for key in ("email", "contact_email", "official_email"):
            if raw.get(key):
                org["officialEmail"] = str(raw[key])
                break
        for key in ("country",):
            if raw.get(key):
                org["country"] = str(raw[key])
                break

    return {"success": True, "data": org, "raw_preview": str(raw)[:500]}


# ── Step 1 template ───────────────────────────────────────────────────────────

@router.get("/step1/template", summary="Download org details CSV template")
def download_org_template():
    content = (
        "Field,Value\n"
        "Organization Name,\n"
        "Industry Type,\n"
        "Employee Count,\n"
        "Number of Sites,\n"
        "Official Email,\n"
        "Contact Number,\n"
        "Country,\n"
        "Timezone,\n"
        "Headquarters Address,\n"
    )
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=org_details_template.csv"},
    )


# ── Template downloads ────────────────────────────────────────────────────────

@router.get("/step3/template", summary="Download sites CSV template")
def download_sites_template():
    content = (
        "Name,Type,Address\n"
        "Head Office,Site,123 Corporate Blvd\n"
        "Plant A,Plant,456 Industrial Ave\n"
        "Warehouse B,Branch,789 Logistics Road\n"
    )
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sites_template.csv"},
    )


@router.get("/step4/template", summary="Download users CSV template")
def download_users_template():
    content = (
        "Name,Email,Role,Department\n"
        "John Smith,john.smith@company.com,HSE Manager,Safety\n"
        "Jane Doe,jane.doe@company.com,Supervisor,Operations\n"
        "Bob Wilson,bob.wilson@company.com,Site HSE Manager,Environment\n"
    )
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users_template.csv"},
    )


# ── Generic module templates ──────────────────────────────────────────────────

_MODULE_TEMPLATES: dict[str, tuple[str, str]] = {
    "organisation": (
        "Organisation Name,Industry Type,Employee Count,Country,Official Email,Contact Number,HQ Address,ISO 45001 Status\n"
        "WindTech Ltd,Manufacturing,150,United Kingdom,safety@windtech.com,+44 1656 000100,123 Industrial Park,Certified\n",
        "organisation_template.csv",
    ),
    "departments": (
        "Department Name,Manager Name,Number of Teams,Assigned Site\n"
        "Heavy Assembly,James Thompson,3,Bridgend Complex\n"
        "Maintenance,Sarah Lee,2,Bridgend Complex\n",
        "departments_template.csv",
    ),
    "roles": (
        "Role Name,Description,Access Level,Module Access\n"
        "HSE Manager,Manages HSE compliance,Manager,Incidents Audits Risk\n"
        "Site Inspector,Inspects site safety,Supervisor,Audits Inspections\n",
        "roles_template.csv",
    ),
    "incidents": (
        "Incident Date,Location / Station,Incident Type,Severity,Description,Immediate Cause,Reported By\n"
        "2024-01-15,Zone 4 - Chemical Handling,Injury,Minor,Worker slipped on wet floor,Wet floor not marked,John Smith\n"
        "2024-02-10,STN005 - Heavy Assembly,Near-miss,Significant,Tool nearly fell from height,Improper tool storage,Jane Doe\n",
        "incidents_template.csv",
    ),
    "permits": (
        "Permit Type,Work Location,Start Date,End Date,Assigned To,Description,Hazards\n"
        "Hot Work,Zone 4 - Welding Bay,2024-03-01,2024-03-01,Tom Baker,Welding repairs on pipe,Fire Chemical\n"
        "Work at Height,Roof Level B,2024-03-05,2024-03-05,Alice Brown,Roof inspection,Fall from height\n",
        "permits_template.csv",
    ),
    "risk": (
        "Hazard Description,Location,Risk Level,Likelihood (1-5),Consequence (1-5),Controls,Responsible Person\n"
        "Machinery Contact/Crushing,STN001 Heavy Assembly,High,4,4,Machine guards fitted safety signs posted,Safety Manager\n"
        "Chemical Spill,Zone 4 Chemical Store,Critical,3,5,COSHH training spill kits secondary containment,EHS Lead\n",
        "risk_template.csv",
    ),
    "capa": (
        "Title,Description,Priority,Assigned To,Due Date,Source Type\n"
        "Replace machine guard,Broken guard on conveyor belt needs urgent replacement,High,john@company.com,2024-02-28,Incident\n"
        "Update fire drill procedure,Annual review overdue requires updated evacuation maps,Medium,jane@company.com,2024-03-15,Audit\n",
        "capa_template.csv",
    ),
    "training": (
        "Training Name,Employee,Completed Date,Expiry Date,Trainer / Provider,Result\n"
        "Fire Safety Training,John Smith,2024-01-10,2025-01-10,Internal HSE Team,Pass\n"
        "Manual Handling,Jane Doe,2024-01-15,2025-01-15,External Provider,Pass\n",
        "training_template.csv",
    ),
    "audits": (
        "Audit Title,Audit Type,Standard,Scheduled Date,Lead Auditor,Status,Site\n"
        "Q1 Fire Safety Audit,Internal,ISO 45001,2024-03-15,Jane Doe,Scheduled,Bridgend Complex\n"
        "Annual External Audit,External,OSHA,2024-06-01,External Auditor,Scheduled,All Sites\n",
        "audits_template.csv",
    ),
    "kpis": (
        "KPI Name,Period (Month),Value,Target,Unit,Site\n"
        "Incident Rate (TRIR),2024-01,2.4,3.0,per 100k hours,All Sites\n"
        "Near Miss Reports,2024-01,12,10,count,Bridgend Complex\n",
        "kpis_template.csv",
    ),
    "vendors": (
        "Company Name,Contact Email,Contact Phone,Service Type,HSE Rating,Contract Start,Contract End\n"
        "SafeWork Contractors Ltd,contact@safework.com,+44 1234 567890,Construction,Approved,2024-01-01,2024-12-31\n"
        "CleanTech Services,info@cleantech.com,+44 9876 543210,Cleaning,Conditional,2024-02-01,2024-07-31\n",
        "vendors_template.csv",
    ),
}


@router.get("/template/{module_key}", summary="Download CSV template for any module")
def download_module_template(module_key: str):
    if module_key == "sites":
        content = (
            "Name,Type,Address,Region,Hazard Level,Employee Count,Workstations\n"
            "Head Office,Site,123 Corporate Blvd,London,Low Risk,50,12\n"
            "Plant A,Plant,456 Industrial Ave,South Wales,High Risk,150,32\n"
        )
        filename = "sites_template.csv"
    elif module_key == "users":
        content = (
            "Name,Email,Role,Department,Site,Phone\n"
            "John Smith,john.smith@company.com,HSE Manager,Safety,Plant A,+44 7700 900001\n"
            "Jane Doe,jane.doe@company.com,Supervisor,Operations,Head Office,+44 7700 900002\n"
        )
        filename = "users_template.csv"
    else:
        entry = _MODULE_TEMPLATES.get(module_key)
        if not entry:
            content, filename = "Field,Value\n", f"{module_key}_template.csv"
        else:
            content, filename = entry

    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ── Generic onboarding bulk import ────────────────────────────────────────────

@router.post(
    "/onboarding-bulk",
    summary="Bulk import any module during onboarding",
    status_code=status.HTTP_202_ACCEPTED,
)
async def onboarding_bulk_import(
    file: UploadFile = File(...),
    module: str = "incidents",
    user: Annotated[CurrentUser, Depends(get_current_user)] = None,
    db: Annotated[Session, Depends(get_db)] = None,
):
    content = await file.read()
    try:
        rows = _parse_file(content, file.filename or "upload.csv")
    except Exception as exc:
        return accepted({"count": 0, "error": str(exc)}, "Parse failed")

    svc = OrgSetupService(db)
    result = svc.bulk_import_module(user, module, rows)
    db.commit()
    return accepted(result, f"Imported {result.get('count', 0)} records for {module}")
