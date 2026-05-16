from app.helpers.datetime import utc_now_iso


class ReportService:
    def generate(self, report_key: str, filters: dict) -> dict:
        return {
            "reportKey": report_key,
            "status": "generated",
            "generatedAt": utc_now_iso(),
            "filters": filters,
            "downloadUrl": f"local://reports/{report_key}.pdf",
        }
