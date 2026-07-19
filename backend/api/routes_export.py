"""
Extra API routes for report export and monitoring.
Included by api/main.py
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
from core.config import settings

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/{job_id}/markdown")
def export_markdown(job_id: str):
    """Export report as a Markdown file for download."""
    from utils.report_exporter import ReportExporter
    try:
        exporter = ReportExporter()
        md_path = exporter.export_markdown(job_id)
        return FileResponse(
            md_path,
            media_type="text/markdown",
            filename=f"research_report_{job_id[:8]}.md",
        )
    except FileNotFoundError:
        raise HTTPException(404, "Report not found. Complete a research job first.")
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/{job_id}/json")
def export_json(job_id: str):
    """Download report JSON file."""
    report_path = Path(settings.REPORTS_DIR) / f"{job_id}.json"
    if not report_path.exists():
        raise HTTPException(404, "Report not found")
    return FileResponse(
        str(report_path),
        media_type="application/json",
        filename=f"research_report_{job_id[:8]}.json",
    )


@router.get("/list")
def list_reports():
    """List all saved reports on F drive."""
    from utils.report_exporter import ReportExporter
    return ReportExporter().list_reports()


@router.post("/monitor/start")
def start_monitor(topic: str, job_id: str = None):
    """Trigger a one-off arXiv monitor check for a topic."""
    from scheduler.monitor import check_new_papers
    task = check_new_papers.delay(topic, job_id)
    return {"task_id": task.id, "topic": topic, "status": "queued"}
