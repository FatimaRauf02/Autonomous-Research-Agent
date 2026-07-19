# Autonomous Research Agent

A full-stack AI system that conducts academic literature reviews autonomously. Give it a research topic — it searches arXiv, reads papers, extracts factual claims, detects contradictions between studies, maps concepts into a knowledge graph and delivers a structured report with citations. The kind of work that takes a PhD student weeks takes this agent minutes.

<img width="960" height="418" alt="3" src="https://github.com/user-attachments/assets/9f5ab3cb-dcdd-4e60-8dcd-6047f9ff1d87" />
<img width="917" height="421" alt="2" src="https://github.com/user-attachments/assets/e1c13c67-8dd2-4d9e-b26e-8b65f9e93ea8" />
<img width="569" height="408" alt="1" src="https://github.com/user-attachments/assets/3c21853c-0e70-45c3-bac3-6fb7bfd8f93a" />
<img width="951" height="385" alt="4" src="https://github.com/user-attachments/assets/73c1e897-8c94-490f-9d4c-5f81317f0815" />
<img width="952" height="403" alt="8" src="https://github.com/user-attachments/assets/214b41da-cfae-4881-9bb4-572422e21c2b" />
<img width="960" height="411" alt="9" src="https://github.com/user-attachments/assets/c4ca2714-668e-4a9f-ae04-bbbf2d0c5f32" />
<img width="945" height="314" alt="5" src="https://github.com/user-attachments/assets/62a5b851-ffa6-45e2-bcaf-55f476066012" />



## What it actually does

Most "AI research tools" are wrappers around a search engine. This is different. The agent runs a genuine multi-step reasoning loop:

1. **Breaks down your topic** into targeted sub-queries using an LLM
2. **Searches arXiv and Semantic Scholar** via MCP tool calls — the agent decides which source to query based on what's missing
3. **Downloads and parses PDFs** — not just abstracts, full paper text chunked into overlapping windows
4. **Extracts factual claims** using spaCy dependency parsing and SciBERT — outputs subject → predicate → object triples with confidence scores
5. **Detects contradictions** by running every new claim through an NLI (Natural Language Inference) model against the existing claim store — flags conflicting findings with evidence from both papers
6. **Identifies research gaps** using BERTopic clustering — underrepresented topic clusters drive the next round of search queries
7. **Loops autonomously** until the paper budget is hit or gaps are filled
8. **Generates a structured report** — executive summary, subtopic findings, contradictions table, research gaps, recommended next steps — all claims auto-cited

---

## Stack

**Agent & Orchestration**
- LangGraph — stateful agent graph, each node is one pipeline step
- FastAPI — async REST backend, exposes job management and RAG query endpoints
- Celery + Redis (Upstash) — background task queue, research jobs run asynchronously

**AI / ML**
- Groq (LLaMA 3.1) — LLM for query decomposition, gap analysis, and report generation
- spaCy + SciBERT — NLP pipeline for claim extraction from scientific text
- NLI model (facebook/bart-large-mnli) — contradiction detection via Natural Language Inference
- BERTopic — topic clustering to identify research gaps
- sentence-transformers — dense embeddings for vector search
- Cross-encoder reranker — re-ranks retrieval results for higher precision

**Retrieval (3-stage hybrid RAG)**
- ChromaDB — persistent vector store for dense retrieval
- BM25 — keyword index running in parallel with dense retrieval
- Cross-encoder — re-ranks the merged dense + BM25 results before passing to LLM

**Data & Graph**
- SQLite — job tracking and metadata
- Neo4j AuraDB — knowledge graph (papers, concepts, contradiction edges)
- arXiv API — primary paper source
- Semantic Scholar — citation counts and cross-domain search

**Frontend**
- React + Vite
- Force-directed knowledge graph visualization with interactive hover tooltips
- Real-time job progress with step-by-step pipeline status
- Download reports as PDF or Word

---

## Why hybrid RAG

Dense retrieval alone misses exact keyword matches. BM25 alone misses semantic meaning. Neither alone is good enough for scientific literature where terminology is precise and domain-specific. Running both in parallel and re-ranking the merged results with a cross-encoder is what production RAG systems at serious companies actually look like. The cross-encoder reads query + chunk together — not just comparing vectors — which catches relevance that cosine similarity misses.

---

## Why the contradiction detector matters

When you're reading 20-30 papers manually, you catch maybe 40-60% of conflicting findings. You're tired, you're skimming, papers use different terminology for the same concept. The NLI model checks every new claim against the full existing claim store automatically. It doesn't get tired. In medical and clinical research this is genuinely important — conflicting trial results buried in a large literature review have real consequences.

---

## Setup

### Prerequisites
- Python 3.11
- Node.js 18+
- Docker Desktop (for local Neo4j + Redis) — or use cloud services

### 1. Clone and navigate
```bash
git clone https://github.com/FatimaRauf02/autonomous-research-agent.git
cd autonomous-research-agent
```

### 2. Create virtual environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

### 3. Install backend dependencies
```bash
pip install -r backend/requirements.txt
python -m spacy download en_core_web_sm
```

### 4. Configure environment
```bash
cp configs/.env.example backend/.env
```

Edit `backend/.env` and fill in:
```
GROQ_API_KEY=your_key_here          # free at console.groq.com
NEO4J_URI=neo4j+s://your_instance   # free at neo4j.com/cloud/aura-free
NEO4J_USER=your_user
NEO4J_PASSWORD=your_password
REDIS_URL=rediss://...              # free at upstash.com
CELERY_BROKER_URL=rediss://...
CELERY_RESULT_BACKEND=rediss://...
DATABASE_URL=sqlite:///./data/research.db
```

### 5. Initialize database
```bash
cd backend
python -c "from core.models import init_db; init_db()"
```

### 6. Start services (3 terminals)

**Terminal 1 — API server**
```bash
cd backend
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Background worker**
```bash
cd backend
celery -A core.celery_app worker --loglevel=info --pool=solo
```

**Terminal 3 — Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Project structure

```
autonomous-research-agent/
├── backend/
│   ├── agents/
│   │   ├── research_agent.py     # LangGraph agent graph definition
│   │   └── llm_client.py         # Groq API calls for all GenAI tasks
│   ├── api/
│   │   ├── main.py               # FastAPI routes
│   │   └── routes_export.py      # PDF/Word export endpoints
│   ├── core/
│   │   ├── config.py             # Settings, F-drive path config
│   │   ├── models.py             # SQLAlchemy models
│   │   ├── fetchers.py           # arXiv, Semantic Scholar, PubMed clients
│   │   └── pdf_parser.py         # PDF → overlapping text chunks
│   ├── nlp/
│   │   ├── claim_extractor.py    # spaCy + SciBERT claim extraction
│   │   ├── contradiction_detector.py  # NLI-based contradiction detection
│   │   └── topic_clusterer.py    # BERTopic gap detection
│   ├── rag/
│   │   └── retriever.py          # ChromaDB + BM25 + cross-encoder pipeline
│   ├── graph/
│   │   └── knowledge_graph.py    # Neo4j operations
│   ├── scheduler/
│   │   ├── tasks.py              # Celery task definitions
│   │   └── monitor.py            # arXiv RSS monitoring
│   └── utils/
│       ├── helpers.py            # Text cleaning, deduplication, scoring
│       └── report_exporter.py    # Markdown and Word export
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── SearchPage.jsx    # Research input + live progress
│       │   ├── GraphPage.jsx     # Interactive knowledge graph
│       │   ├── QueryPage.jsx     # RAG-powered Q&A over papers
│       │   └── JobsPage.jsx      # All research jobs with status
│       └── components/
│           └── ReportModal.jsx   # Full report viewer + download
├── configs/
│   └── .env.example
└── docker-compose.yml
```

---

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/research/start` | Start a new research job |
| GET | `/research/{id}/status` | Poll job progress |
| GET | `/research/{id}/report` | Get completed report JSON |
| POST | `/research/{id}/query` | Ask a question via RAG |
| GET | `/research/{id}/graph` | Get knowledge graph data |
| GET | `/export/{id}/markdown` | Download report as Markdown |
| GET | `/export/{id}/json` | Download report as JSON |
| GET | `/jobs` | List all research jobs |
| DELETE | `/jobs/{id}` | Delete a job |

---

## AI disciplines used

| Discipline | Where | Why |
|---|---|---|
| **Agentic AI** | LangGraph loop | Self-directing pipeline, no human input between steps |
| **NLP** | spaCy + SciBERT | Claim extraction from scientific language |
| **Deep Learning** | NLI model, cross-encoder | Contradiction detection, retrieval reranking |
| **GenAI** | Groq / LLaMA 3.1 | Query decomposition, report generation |
| **RAG** | ChromaDB + BM25 | Grounded answers from ingested papers |
| **ML** | BERTopic | Unsupervised topic clustering for gap detection |
| **MCP** | Tool server layer | Pluggable data sources (arXiv, Semantic Scholar, PubMed) |

---

## Real-world use cases

**Academic research** — literature review for a thesis chapter in hours instead of weeks. Contradiction detection catches conflicting studies that manual review misses.

**Corporate R&D** — point it at a technology area and get a structured briefing on the state of research, key players, open problems, and what your competitors are publishing.

**Medical evidence synthesis** — automated systematic review preparation. NLI contradiction detection surfaces conflicting clinical trial results automatically.

**Investment research** — index earnings call transcripts and analyst reports, query across all of them in one interface.

---

