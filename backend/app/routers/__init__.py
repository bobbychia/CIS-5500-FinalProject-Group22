from fastapi import APIRouter

from app.routers import auth, meta, zip_areas

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(zip_areas.router, prefix="/zip-areas", tags=["zip-areas"])
api_router.include_router(meta.router, prefix="/meta", tags=["meta"])
