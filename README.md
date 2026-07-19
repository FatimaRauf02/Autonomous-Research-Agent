# Autonomous Research Agent

Full-stack AI research agent: autonomous web search → paper ingestion → claim extraction → contradiction detection → knowledge graph → structured report.

## Setup on F: Drive (Windows)

### 1. Clone / copy project to F drive
```
F:\research_agent\
```

### 2. Install prerequisites
- Python 3.11 (NOT 3.14) — from python.org
- Node.js 18+ — from nodejs.org
- Docker Desktop — for Neo4j and Redis

### 3. Create virtual environment on F drive
```cmd
cd F:\research_agent\backend
python -m venv F:\research_agent\venv
F:\research_agent\venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Start infrastructure (Neo4j + Redis)
```cmd
cd F:\research_agent
docker-compose up -d
```

### 5. Create .env file
Copy `configs/.env.example` → `backend\.env` and fill in your API keys.

### 6. Run database migrations
```cmd
F:\research_agent\venv\Scripts\activate
cd F:\research_agent\backend
python -m core.db_init
```

### 7. Start backend
```cmd
F:\research_agent\venv\Scripts\activate
cd F:\research_agent\backend
uvicorn api.main:app --reload --port 8000
```

### 8. Start Celery worker (new terminal)
```cmd
F:\research_agent\venv\Scripts\activate
cd F:\research_agent\backend
celery -A core.celery_app worker --loglevel=info --pool=solo
```

### 9. Start frontend (new terminal)
```cmd
cd F:\research_agent\frontend
npm install
npm run dev
```

Open: http://localhost:5173

## Architecture
- FastAPI backend on port 8000
- React/Vite frontend on port 5173
- Neo4j graph DB on port 7474 (browser) / 7687 (bolt)
- Redis on port 6379
- ChromaDB: local persistent storage at F:\research_agent\data\chroma

## Data storage (all on F drive)
- Papers PDF cache: `F:\research_agent\data\papers\`
- ChromaDB vectors: `F:\research_agent\data\chroma\`
- Neo4j data: `F:\research_agent\data\neo4j\`
- Redis data: `F:\research_agent\data\redis\`
- Reports output: `F:\research_agent\data\reports\`
