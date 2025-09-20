# filepath: /Users/khushi/Desktop/RoleCall/backend/app/api/job_postings.py
from fastapi import APIRouter
from sqlmodel import Session
from app.models import JobPosting
from app.db import get_session
from app.api.deps import SessionDep

router = APIRouter(prefix="/job_postings", tags=["job_postings"])

@router.post("/", response_model=JobPosting,tags=["job_postings"])
def create_job_posting(job_posting: JobPosting, session: SessionDep):
    session.add(job_posting)
    session.commit()
    session.refresh(job_posting)
    return job_posting

@router.get("/", response_model=list[JobPosting],tags=["job_postings"])
def read_job_postings(session: SessionDep):
    return session.query(JobPosting).all()