from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select
from app.models import JobPosting, UserJob, User
from app.api.deps import SessionDep
import uuid
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/")
def get_available_jobs(session: SessionDep, user_id: Optional[str] = Query(None)):
    """Get all available job postings with application status for the specified user"""
    try:
        # Get the specified user or fallback to first user
        if user_id:
            user_statement = select(User).where(User.id == user_id)
            user = session.exec(user_statement).first()
        else:
            user_statement = select(User).limit(1)
            user = session.exec(user_statement).first()
        
        # Get all job postings
        jobs_statement = select(JobPosting)
        jobs = session.exec(jobs_statement).all()
        
        # Get user's applications if user exists
        user_applications = set()
        if user:
            applications_statement = select(UserJob.job_posting_id).where(UserJob.user_id == user.id)
            applications = session.exec(applications_statement).all()
            user_applications = set(str(app) for app in applications)
        
        # Build response with application status
        jobs_with_status = []
        for job in jobs:
            job_dict = {
                "id": str(job.id),
                "title": job.title,
                "description": job.description,
                "has_applied": str(job.id) in user_applications,
                "user_id": str(user.id) if user else None
            }
            jobs_with_status.append(job_dict)
        
        return jobs_with_status
        
    except Exception as e:
        print(f"Error getting jobs with application status: {e}")
        # Fallback: return jobs without application status
        statement = select(JobPosting)
        jobs = session.exec(statement).all()
        return [
            {
                "id": str(job.id),
                "title": job.title,
                "description": job.description,
                "has_applied": False,
                "user_id": None
            }
            for job in jobs
        ]

@router.get("/{job_id}")  # Remove response_model here too
def get_job_details(job_id: str, session: SessionDep):
    """Get detailed information about a specific job with application status"""
    try:
        statement = select(JobPosting).where(JobPosting.id == job_id)
        job = session.exec(statement).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Get the first user from the database (temporary until auth is implemented)
        user_statement = select(User).limit(1)
        user = session.exec(user_statement).first()
        
        # Check if user has applied
        has_applied = False
        if user:
            application_statement = select(UserJob).where(
                UserJob.user_id == user.id,
                UserJob.job_posting_id == job_id
            )
            application = session.exec(application_statement).first()
            has_applied = application is not None
        
        return {
            "id": str(job.id),
            "title": job.title,
            "description": job.description,
            "has_applied": has_applied,
            "user_id": str(user.id) if user else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting job details: {e}")
        # Fallback
        statement = select(JobPosting).where(JobPosting.id == job_id)
        job = session.exec(statement).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
            
        return {
            "id": str(job.id),
            "title": job.title,
            "description": job.description,
            "has_applied": False,
            "user_id": None
        }

@router.post("/{job_id}/apply")
def apply_to_job(job_id: str, session: SessionDep, user_id: Optional[str] = Query(None)):
    """Apply to a specific job posting"""
    try:
        # Check if the job exists
        statement = select(JobPosting).where(JobPosting.id == job_id)
        job = session.exec(statement).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Get the specified user
        if user_id:
            user_statement = select(User).where(User.id == user_id)
            user = session.exec(user_statement).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
        else:
            # Fallback to first user or create one
            user_statement = select(User).limit(1)
            user = session.exec(user_statement).first()
            
            if not user:
                # Create a dummy user if no users exist
                dummy_user = User(
                    email="demo@example.com",
                    full_name="Demo User",
                    hashed_password="dummy_hash",
                    is_active=True,
                    is_superuser=False
                )
                session.add(dummy_user)
                session.commit()
                session.refresh(dummy_user)
                user = dummy_user
        
        # Check if user already applied
        existing_application = session.exec(
            select(UserJob).where(
                UserJob.user_id == user.id,
                UserJob.job_posting_id == job_id
            )
        ).first()
        
        if existing_application:
            raise HTTPException(status_code=400, detail="Already applied to this job")
        
        # Create new application
        new_application = UserJob(
            user_id=user.id,
            job_posting_id=uuid.UUID(job_id),
            status="applied"
        )
        
        session.add(new_application)
        session.commit()
        session.refresh(new_application)
        
        return {
            "message": f"Successfully applied to job: {job.title}",
            "job_id": job_id,
            "job_title": job.title,
            "application_id": str(new_application.id),
            "user_id": str(user.id),
            "has_applied": True
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Roll back the session on any error
        session.rollback()
        print(f"Error applying to job: {e}")
        raise HTTPException(status_code=500, detail="Failed to apply to job")

@router.get("/applications/{user_id}")
def get_user_applications(user_id: str, session: SessionDep):
    """Get all applications for a specific user"""
    try:
        statement = select(UserJob, JobPosting).join(JobPosting).where(UserJob.user_id == user_id)
        results = session.exec(statement).all()
        
        applications = []
        for user_job, job_posting in results:
            applications.append({
                "application_id": str(user_job.id),
                "job_id": str(job_posting.id),
                "job_title": job_posting.title,
                "job_description": job_posting.description,
                "status": user_job.status,
            })
        
        return applications
    except Exception as e:
        print(f"Error getting applications: {e}")
        return []

@router.get("/applications")
def get_all_applications(session: SessionDep):
    """Get all job applications"""
    try:
        statement = select(UserJob, JobPosting, User).join(JobPosting).join(User)
        results = session.exec(statement).all()
        
        applications = []
        for user_job, job_posting, user in results:
            applications.append({
                "application_id": str(user_job.id),
                "job_id": str(job_posting.id),
                "job_title": job_posting.title,
                "user_name": user.full_name,
                "user_email": user.email,
                "status": user_job.status,
            })
        
        return applications
    except Exception as e:
        print(f"Error getting all applications: {e}")
        return []