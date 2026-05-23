from fastapi import APIRouter

from app.api.v1.routes import admin, ai, integrations, mobile, shared, web, health
from app.api.v1.routes import workflow, outputs, learning, onboarding

api_router = APIRouter()

api_router.include_router(shared.router, tags=["shared-platform"])
api_router.include_router(web.router, tags=["web"])
api_router.include_router(mobile.router, tags=["mobile"])
api_router.include_router(admin.router, tags=["admin"])
api_router.include_router(integrations.router, tags=["integrations"])
api_router.include_router(ai.router, tags=["ai"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(workflow.router, tags=["workflow"])
api_router.include_router(outputs.router, tags=["outputs"])
api_router.include_router(learning.router, tags=["learning"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
