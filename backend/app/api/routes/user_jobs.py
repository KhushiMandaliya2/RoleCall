from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select
from app.models import JobPosting, UserJob, User
from app.api.deps import SessionDep
import uuid
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/")
def get_available_jobs(session: SessionDep, user_id: str = Query(..., description="User ID to check applications for")):
    """Get all available job postings with application status for specified user"""
    try:
        # Validate user exists
        user_statement = select(User).where(User.id == user_id)
        user = session.exec(user_statement).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get all job postings
        jobs_statement = select(JobPosting)
        jobs = session.exec(jobs_statement).all()
        
        # Get user's applications
        applications_statement = select(UserJob.job_posting_id).where(UserJob.user_id == user_id)
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
                "user_id": user_id
            }
            jobs_with_status.append(job_dict)
        
        return jobs_with_status
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting jobs with application status: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")

@router.get("/{job_id}")
def get_job_details(job_id: str, session: SessionDep, user_id: str = Query(..., description="User ID to check application status")):
    """Get detailed information about a specific job with application status for specified user"""
    try:
        # Validate user exists
        user_statement = select(User).where(User.id == user_id)
        user = session.exec(user_statement).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        statement = select(JobPosting).where(JobPosting.id == job_id)
        job = session.exec(statement).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Check if specified user has applied
        application_statement = select(UserJob).where(
            UserJob.user_id == user_id,
            UserJob.job_posting_id == job_id
        )
        application = session.exec(application_statement).first()
        has_applied = application is not None
        
        return {
            "id": str(job.id),
            "title": job.title,
            "description": job.description,
            "has_applied": has_applied,
            "user_id": user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting job details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch job details")

@router.post("/{job_id}/apply")
def apply_to_job(job_id: str, session: SessionDep, user_id: str = Query(..., description="User ID applying to job")):
    """Apply to a specific job posting for specified user"""
    try:
        # Validate user exists
        user_statement = select(User).where(User.id == user_id)
        user = session.exec(user_statement).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Check if the job exists
        job_statement = select(JobPosting).where(JobPosting.id == job_id)
        job = session.exec(job_statement).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Check if user already applied
        existing_application = session.exec(
            select(UserJob).where(
                UserJob.user_id == user_id,
                UserJob.job_posting_id == job_id
            )
        ).first()
        
        if existing_application:
            raise HTTPException(status_code=400, detail="Already applied to this job")
        
        # Create new application
        new_application = UserJob(
            user_id=uuid.UUID(user_id),
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
            "user_id": user_id,
            "has_applied": True
        }
    
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        print(f"Error applying to job: {e}")
        raise HTTPException(status_code=500, detail="Failed to apply to job")

@router.get("/applications/{user_id}")
def get_user_applications(user_id: str, session: SessionDep):
    """Get all applications for a specific user"""
    try:
        # Validate user exists
        user_statement = select(User).where(User.id == user_id)
        user = session.exec(user_statement).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
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
                "user_id": user_id
            })
        
        return applications
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting applications: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch applications")

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