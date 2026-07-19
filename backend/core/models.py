from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid

from core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ResearchJob(Base):
    __tablename__ = "research_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    topic = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, running, done, failed
    progress = Column(Integer, default=0)
    current_step = Column(String, default="")
    papers_found = Column(Integer, default=0)
    claims_extracted = Column(Integer, default=0)
    contradictions_found = Column(Integer, default=0)
    report_path = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    celery_task_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Paper(Base):
    __tablename__ = "papers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    arxiv_id = Column(String, unique=True, nullable=True)
    title = Column(String, nullable=False)
    authors = Column(JSON, default=list)
    abstract = Column(Text, nullable=True)
    year = Column(Integer, nullable=True)
    venue = Column(String, nullable=True)
    citation_count = Column(Integer, default=0)
    pdf_path = Column(String, nullable=True)
    source = Column(String, default="arxiv")  # arxiv, semantic_scholar, pubmed, web
    job_id = Column(String, nullable=True)
    is_indexed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Claim(Base):
    __tablename__ = "claims"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(String, nullable=False)
    paper_title = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    predicate = Column(String, nullable=False)
    obj = Column(String, nullable=False)
    full_text = Column(Text, nullable=False)
    confidence = Column(Float, default=0.0)
    chunk_index = Column(Integer, default=0)
    page_number = Column(Integer, default=0)
    year = Column(Integer, nullable=True)
    job_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Contradiction(Base):
    __tablename__ = "contradictions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    claim_a_id = Column(String, nullable=False)
    claim_b_id = Column(String, nullable=False)
    claim_a_text = Column(Text, nullable=False)
    claim_b_text = Column(Text, nullable=False)
    paper_a_title = Column(String, nullable=False)
    paper_b_title = Column(String, nullable=False)
    paper_a_year = Column(Integer, nullable=True)
    paper_b_year = Column(Integer, nullable=True)
    nli_score = Column(Float, default=0.0)
    job_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")


if __name__ == "__main__":
    init_db()
