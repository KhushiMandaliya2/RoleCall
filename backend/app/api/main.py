from fastapi import APIRouter
from app.api.job_postings import router as job_postings_router


from app.api.routes import items, login, private, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(job_postings_router, prefix="/job-postings", tags=["job_postings"])



if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
