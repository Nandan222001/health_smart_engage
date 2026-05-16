from app.services.ai_service import AiService
from app.services.file_storage_service import FileStorageService
from app.services.mobile_sync_service import MobileSyncService
from app.services.report_service import ReportService


def test_report_generation_returns_download_url() -> None:
    result = ReportService().generate("permits", {"status": "active"})

    assert result["status"] == "generated"
    assert result["downloadUrl"].endswith("permits.pdf")


def test_mobile_sync_detects_conflicts() -> None:
    result = MobileSyncService().push(
        "u1",
        [{"id": "1", "clientVersion": 1, "serverVersion": 2}],
    )

    assert result["accepted"] == 0
    assert len(result["conflicts"]) == 1


def test_ai_empty_question_escalates() -> None:
    result = AiService().answer("")

    assert result["status"] == "needs_human_escalation"


def test_file_storage_local_fallback() -> None:
    result = FileStorageService().create_upload_target("evidence.jpg")

    assert result.url.startswith("local://") or "blob.core.windows.net" in result.url
