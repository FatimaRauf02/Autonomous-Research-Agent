import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
   
    GROQ_API_KEY: str = ""

    
    BASE_DATA_DIR: str = "F:/research_agent/data"
    PAPERS_DIR: str = "F:/research_agent/data/papers"
    CHROMA_DIR: str = "F:/research_agent/data/chroma"
    REPORTS_DIR: str = "F:/research_agent/data/reports"
    MODELS_CACHE_DIR: str = "F:/research_agent/data/models_cache"

    
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "research_agent_pass"
    DATABASE_URL: str = "postgresql://research_user:research_pass@localhost:5432/research_agent"
    REDIS_URL: str = "redis://localhost:6379/0"

   
    SEMANTIC_SCHOLAR_API_KEY: str = ""

  
    MAX_PAPERS_PER_JOB: int = 30
    MAX_SEARCH_ITERATIONS: int = 5
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 64
    TOP_K_RETRIEVAL: int = 20
    RERANK_TOP_K: int = 5

   
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    class Config:
        env_file = ".env"
        extra = "ignore"

    def setup_directories(self):
        """Create all required directories on F drive."""
        dirs = [
            self.BASE_DATA_DIR,
            self.PAPERS_DIR,
            self.CHROMA_DIR,
            self.REPORTS_DIR,
            self.MODELS_CACHE_DIR,
            f"{self.BASE_DATA_DIR}/neo4j/data",
            f"{self.BASE_DATA_DIR}/neo4j/logs",
            f"{self.BASE_DATA_DIR}/redis",
            f"{self.BASE_DATA_DIR}/postgres",
        ]
        for d in dirs:
            Path(d).mkdir(parents=True, exist_ok=True)

       
        os.environ["HF_HOME"] = self.MODELS_CACHE_DIR
        os.environ["TRANSFORMERS_CACHE"] = self.MODELS_CACHE_DIR
        os.environ["SENTENCE_TRANSFORMERS_HOME"] = self.MODELS_CACHE_DIR


settings = Settings()
settings.setup_directories()
