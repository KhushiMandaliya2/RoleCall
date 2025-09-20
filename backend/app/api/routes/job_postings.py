# filepath: /Users/khushi/Desktop/RoleCall/backend/app/api/job_postings.py
from fastapi import APIRouter
from sqlmodel import select
from app.models import JobPosting
from app.db import get_session
from app.api.deps import SessionDep
from fastapi import APIRouter, HTTPException  


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

@router.delete("/{job_id}", tags=["job_postings"])
def delete_job_posting(job_id: str, session: SessionDep):
    # Find the job posting
    statement = select(JobPosting).where(JobPosting.id == job_id)
    job_posting = session.exec(statement).first()
    
    if not job_posting:
        raise HTTPException(status_code=404, detail="Job posting not found")
    
    # Delete the job posting
    session.delete(job_posting)
    session.commit()
    
    return {"message": "Job posting deleted successfully"}

@router.put("/{job_id}", response_model=JobPosting, tags=["job_postings"])
def update_job_posting(job_id: str, job_data: JobPosting, session: SessionDep):
    # Find the job posting
    statement = select(JobPosting).where(JobPosting.id == job_id)
    job_posting = session.exec(statement).first()
    
    if not job_posting:
        raise HTTPException(status_code=404, detail="Job posting not found")
    
    # Update the job posting
    job_posting.title = job_data.title
    job_posting.description = job_data.description
    
    session.add(job_posting)
    session.commit()
    session.refresh(job_posting)
    
    return job_posting