from unittest.mock import Mock

import pytest

from app.core.exceptions import AppError
from app.core.security import CurrentUser
from app.services.business_rules import BusinessRuleService


def test_capa_closure_requires_evidence() -> None:
    service = BusinessRuleService(Mock())

    with pytest.raises(AppError) as exc:
        service.validate_command(
            CurrentUser("u1", "t1"),
            "capas_submit_closure",
            {"data": {}},
            {},
        )

    assert exc.value.code == "CAPA_EVIDENCE_REQUIRED"


def test_vendor_rejection_requires_comment() -> None:
    service = BusinessRuleService(Mock())

    with pytest.raises(AppError) as exc:
        service.validate_command(
            CurrentUser("u1", "t1"),
            "vendor_documents_review",
            {"data": {"decision": "rejected"}},
            {},
        )

    assert exc.value.code == "REJECTION_COMMENT_REQUIRED"
