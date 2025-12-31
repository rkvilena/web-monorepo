"""API routes package."""

from fastapi import APIRouter

from routes.auth import router as auth_router
from routes.users import router as users_router

api_router = APIRouter()

# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(users_router)
