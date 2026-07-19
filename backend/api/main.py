import uuid
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session

from core.config import settings
from core.models import init_db, get_db, ResearchJob, Paper, Claim, Contradiction

app = FastAPI(
    title="Autonomous Research Agent API",
    description="AI-powered literature review agent",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from api.routes_export import router as export_router
app.include_router(export_router)


@app.on_event("startup")
def startup():
    init_db()
    settings.setup_directories()



class StartResearchRequest(BaseModel):
    topic: str
    max_papers: Optional[int] = 20


class QueryRequest(BaseModel):
    question: str
    job_id: Optional[str] = None




@app.get("/")
def root():
    return {"message": "Autonomous Research Agent API", "status": "running", "data_dir": settings.BASE_DATA_DIR}


@app.post("/research/start")
def start_research(req: StartResearchRequest, db: Session = Depends(get_db)):
    """Start a new research job. Returns job_id to poll for status."""
    job_id = str(uuid.uuid4())
    job = ResearchJob(id=job_id, topic=req.topic, status="pending")
    db.add(job)
    db.commit()

    from scheduler.tasks import run_research_task
    task = run_research_task.delay(job_id, req.topic)

    job.celery_task_id = task.id
    job.status = "running"
    db.commit()

    return {"job_id": job_id, "status": "running", "message": f"Research started for: {req.topic}"}


@app.get("/research/{job_id}/status")
def get_status(job_id: str, db: Session = Depends(get_db)):
    """Poll job status and progress."""
    job = db.query(ResearchJob).filter(ResearchJob.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    return {
        "job_id": job_id,
        "status": job.status,
        "progress": job.progress,
        "current_step": job.current_step,
        "papers_found": job.papers_found,
        "claims_extracted": job.claims_extracted,
        "contradictions_found": job.contradictions_found,
        "error": job.error_message,
    }


@app.get("/research/{job_id}/report")
def get_report(job_id: str):
    """Get the full report JSON for a completed job."""
    report_path = Path(settings.REPORTS_DIR) / f"{job_id}.json"
    if not report_path.exists():
        raise HTTPException(404, "Report not ready yet")
    with open(report_path) as f:
        return json.load(f)


@app.post("/research/{job_id}/query")
def query_papers(job_id: str, req: QueryRequest, db: Session = Depends(get_db)):
    """Ask a question against the indexed papers (RAG)."""
    from rag.retriever import HybridRetriever
    from agents.llm_client import LLMClient

    retriever = HybridRetriever()
    llm = LLMClient()

    chunks = retriever.query(req.question, top_k=5, job_id=job_id)
    if not chunks:
        return {"answer": "No relevant content found. Try starting a research job first.", "sources": []}

    answer = llm.answer_query(req.question, chunks)
    sources = [
        {
            "paper": c["metadata"].get("paper_title", "Unknown"),
            "page": c["metadata"].get("page_number", "?"),
            "score": round(c.get("rerank_score", c.get("score", 0)), 3),
        }
        for c in chunks
    ]
    return {"answer": answer, "sources": sources}


@app.get("/research/{job_id}/graph")
def get_knowledge_graph(job_id: str):
    """Get knowledge graph nodes and edges for visualization."""
    from graph.knowledge_graph import KnowledgeGraph
    kg = KnowledgeGraph()
    return kg.get_paper_network()


@app.get("/research/{job_id}/contradictions")
def get_contradictions(job_id: str):
    """Get detected contradictions for a research job."""
    report_path = Path(settings.REPORTS_DIR) / f"{job_id}.json"
    if report_path.exists():
        data = json.loads(report_path.read_text())
        return {"contradictions": data.get("contradictions", [])}
    raise HTTPException(404, "Report not ready")


@app.get("/jobs")
def list_jobs(db: Session = Depends(get_db)):
    """List all research jobs."""
    jobs = db.query(ResearchJob).order_by(ResearchJob.created_at.desc()).limit(20).all()
    return [
        {
            "id": j.id,
            "topic": j.topic,
            "status": j.status,
            "progress": j.progress,
            "created_at": j.created_at.isoformat() if j.created_at else None,
        }
        for j in jobs
    ]


@app.delete("/jobs/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db)):
    """Delete a job and its report."""
    job = db.query(ResearchJob).filter(ResearchJob.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    db.delete(job)
    db.commit()
    report_path = Path(settings.REPORTS_DIR) / f"{job_id}.json"
    if report_path.exists():
        report_path.unlink()
    return {"deleted": job_id}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "data_dir": settings.BASE_DATA_DIR,
        "chroma_dir": settings.CHROMA_DIR,
        "models_cache": settings.MODELS_CACHE_DIR,
    }
