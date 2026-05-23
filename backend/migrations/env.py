from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import settings
from app.core.database import Base

# Import all model modules so Alembic's autogenerate can detect every table.
# Each import ensures the SQLAlchemy mapper registers the table in Base.metadata.
from app.models.tenant import Tenant  # noqa: F401
from app.models.foundation import OrganisationNode  # noqa: F401
from app.models.auth import User, Role  # noqa: F401
from app.models.people import Employee, Certification, TrainingRequirement, TrainingCompletion  # noqa: F401
from app.models.vendors import Vendor, VendorDocument  # noqa: F401
from app.models.assets import Asset, AssetInspection  # noqa: F401
from app.models.risks import RiskAssessment, HazardObservation  # noqa: F401
from app.models.permits import Permit, PermitApproval  # noqa: F401
from app.models.compliance import AuditChecklist, AuditExecution, Finding, Capa  # noqa: F401
from app.models.incidents import Incident, Investigation  # noqa: F401
from app.models.knowledge import KnowledgeDocument  # noqa: F401
from app.models.files import FileObject  # noqa: F401
from app.models.ai import AiConversation, AIRecommendation, PredictiveRiskScore  # noqa: F401
from app.models.workflow import (  # noqa: F401
    WorkflowCase,
    WorkflowStageEvent,
    WorkflowApproval,
    WorkflowCAPA,
    WorkflowResolution,
    WorkflowAlert,
)
from app.models.outputs import Report, AlertRule, ExportJob, Integration  # noqa: F401
from app.models.learning import MLModel, MLModelVersion, DetectedPattern, OperationalEvent  # noqa: F401
from app.models.sync import MobileSyncItem  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.generic_record import GenericRecord  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
