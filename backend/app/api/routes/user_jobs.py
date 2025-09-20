from fastapi import APIRouter, HTTPException
from sqlmodel import select
from app.models import JobPosting
from app.api.deps import SessionDep

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/", response_model=list[JobPosting], tags=["jobs"])
def get_available_jobs(session: SessionDep):
    """Get all available job postings for users to view and apply"""
    statement = select(JobPosting)
    jobs = session.exec(statement).all()
    return jobs

@router.get("/{job_id}", response_model=JobPosting, tags=["jobs"])
def get_job_details(job_id: str, session: SessionDep):
    """Get detailed information about a specific job"""
    statement = select(JobPosting).where(JobPosting.id == job_id)
    job = session.exec(statement).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job

@router.post("/{job_id}/apply", tags=["jobs"])
def apply_to_job(job_id: str, session: SessionDep):
    """Apply to a specific job posting"""
    # First, check if the job exists
    statement = select(JobPosting).where(JobPosting.id == job_id)
    job = session.exec(statement).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # For now, just return a success message
    # Later you can implement actual application logic (save to database, send emails, etc.)
    return {
        "message": f"Successfully applied to job: {job.title}",
        "job_id": job_id,
        "job_title": job.title
    }