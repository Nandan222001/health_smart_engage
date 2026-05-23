from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging


def create_app() -> FastAPI:
    configure_logging()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.on_event("startup")
    def _create_new_tables():
        """Ensure all new SQLAlchemy models have their tables created.
        create_all is safe to call on existing tables — it only creates missing ones."""
        try:
            from app.core.database import Base, engine
            import app.models.domain        # noqa: F401
            import app.models.tenant        # noqa: F401
            import app.models.generic_record  # noqa: F401
            import app.models.audit_log     # noqa: F401
            Base.metadata.create_all(bind=engine)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Table auto-creation skipped: %s", exc)

    return app


app = create_app()
