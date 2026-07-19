import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.celery_app import celery_app
from core.models import SessionLocal, ResearchJob
from loguru import logger


def update_job(job_id: str, step: str, progress: int):
    """Progress callback - updates DB in real time."""
    db = SessionLocal()
    try:
        job = db.query(ResearchJob).filter(ResearchJob.id == job_id).first()
        if job:
            job.current_step = step
            job.progress = progress
            job.status = "running"
            db.commit()
    except Exception as e:
        logger.error(f"DB update failed: {e}")
    finally:
        db.close()


@celery_app.task(bind=True, name="scheduler.tasks.run_research")
def run_research_task(self, job_id: str, topic: str):
    """Celery task: runs the full research agent pipeline."""
    db = SessionLocal()
    try:
        job = db.query(ResearchJob).filter(ResearchJob.id == job_id).first()
        if not job:
            return {"error": "Job not found"}
        job.status = "running"
        job.celery_task_id = self.request.id
        db.commit()
    finally:
        db.close()

    try:
        from agents.research_agent import run_research_job
        result = run_research_job(
            job_id=job_id,
            topic=topic,
            progress_callback=update_job,
        )

        db = SessionLocal()
        try:
            job = db.query(ResearchJob).filter(ResearchJob.id == job_id).first()
            if job:
                job.status = result.get("status", "done")
                job.progress = 100
                job.current_step = "Complete"
                db.commit()
        finally:
            db.close()

        return result

    except Exception as e:
        logger.error(f"Task failed for job {job_id}: {e}")
        db = SessionLocal()
        try:
            job = db.query(ResearchJob).filter(ResearchJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.error_message = str(e)
                db.commit()
        finally:
            db.close()
        raise