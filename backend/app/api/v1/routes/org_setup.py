from fastapi import APIRouter
from app.api.v1.route_factory import register_catalog_routes

router = APIRouter()

ENDPOINTS = [
    ("GET",  "/progress",          "org_setup_progress_get",          "Get setup progress"),
    ("POST", "/step1",             "org_setup_step1_save",            "Save step 1 – org details"),
    ("GET",  "/step1",             "org_setup_step1_get",             "Get step 1 – org details"),
    ("POST", "/step2",             "org_setup_step2_save",            "Save step 2 – compliance"),
    ("GET",  "/step2",             "org_setup_step2_get",             "Get step 2 – compliance"),
    ("POST", "/step3/site",        "org_setup_step3_site_create",     "Create a site"),
    ("POST", "/step3/bulk",        "org_setup_step3_bulk_upload",     "Bulk upload sites"),
    ("GET",  "/step3/sites",       "org_setup_step3_sites_list",      "List sites"),
    ("POST", "/step4/user",        "org_setup_step4_user_create",     "Create a user"),
    ("POST", "/step4/bulk",        "org_setup_step4_bulk_upload",     "Bulk upload users"),
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
