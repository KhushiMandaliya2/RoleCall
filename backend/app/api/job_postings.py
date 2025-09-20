# filepath: /Users/khushi/Desktop/RoleCall/backend/app/api/job_postings.py
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.models import JobPosting
from app.db import get_session

router = APIRouter()

@router.post("/", response_model=JobPosting)
def create_job_posting(job_posting: JobPosting, session: Session = Depends(get_session)):
    session.add(job_posting)
    session.commit()
    session.refresh(job_posting)
    return job_posting

@router.get("/", response_model=list[JobPosting])
def read_job_postings(session: Session = Depends(get_session)):
    return session.query(JobPosting).all()