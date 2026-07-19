"""
Run this once after setup to initialize the PostgreSQL database.
Usage: python -m core.db_init
       OR: python backend/core/db_init.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import settings
from core.models import Base, engine, init_db


def main():
    print("=" * 50)
    print("  Autonomous Research Agent — DB Init")
    print("=" * 50)
    print(f"\nDatabase: {settings.DATABASE_URL}")
    print(f"Data dir: {settings.BASE_DATA_DIR}")
    print()

   
    settings.setup_directories()
    print("✓ F drive directories created")

   
    try:
        init_db()
        print("✓ PostgreSQL tables created")
    except Exception as e:
        print(f"✗ PostgreSQL failed: {e}")
        print("  Make sure Docker is running: scripts/start_docker.bat")

   
    try:
        from graph.knowledge_graph import KnowledgeGraph
        kg = KnowledgeGraph()
        kg._connect()
        if kg._driver:
            print("✓ Neo4j connected")
            kg.close()
        else:
            print("✗ Neo4j not reachable. Start Docker first.")
    except Exception as e:
        print(f"✗ Neo4j error: {e}")

    
    try:
        import redis
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        print("✓ Redis connected")
    except Exception as e:
        print(f"✗ Redis error: {e}")

    
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your_groq_api_key_here":
        print("✓ GROQ_API_KEY set")
    else:
        print("✗ GROQ_API_KEY missing — edit F:\\research_agent\\backend\\.env")

    print()
    print("Done. Run scripts/start_backend.bat to launch the API.")


if __name__ == "__main__":
    main()
