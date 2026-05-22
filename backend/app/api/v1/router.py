from fastapi import APIRouter
from app.api.v1.routes import auth
from app.api.v1.routes import admin, ai, integrations, mobile, shared, web, health

api_router = APIRouter()

api_router.include_router(shared.router, tags=["shared-platform"])
api_router.include_router(web.router, tags=["web"])
api_router.include_router(mobile.router, tags=["mobile"])
api_router.include_router(admin.router, tags=["admin"])
api_router.include_router(integrations.router, tags=["integrations"])
api_router.include_router(ai.router, tags=["ai"])
api_router.include_router(health.router, tags=["health"])

api_router.include_router(auth.router, tags=["authentication"])