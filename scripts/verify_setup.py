"""
Run this to verify your F drive setup is correct.
Usage: python scripts/verify_setup.py
"""
import os
import sys
from pathlib import Path

GREEN = "\033[92m"
RED   = "\033[91m"
RESET = "\033[0m"
BOLD  = "\033[1m"

ok = lambda msg: print(f"  {GREEN}✓{RESET} {msg}")
fail = lambda msg: print(f"  {RED}✗{RESET} {msg}")
header = lambda msg: print(f"\n{BOLD}{msg}{RESET}")

errors = 0

header("1. F drive directories")
required_dirs = [
    "F:/research_agent",
    "F:/research_agent/data",
    "F:/research_agent/data/papers",
    "F:/research_agent/data/chroma",
    "F:/research_agent/data/reports",
    "F:/research_agent/data/models_cache",
    "F:/research_agent/data/neo4j",
    "F:/research_agent/data/redis",
]
for d in required_dirs:
    if Path(d).exists():
        ok(d)
    else:
        fail(f"{d}  ← MISSING, run setup.bat")
        errors += 1

header("2. Python venv")
venv_python = Path("F:/research_agent/venv/Scripts/python.exe")
if venv_python.exists():
    ok(str(venv_python))
else:
    fail("F:/research_agent/venv not found — run setup.bat")
    errors += 1

header("3. .env file")
env_path = Path("F:/research_agent/backend/.env")
if env_path.exists():
    content = env_path.read_text()
    if "your_groq_api_key_here" in content:
        fail(".env exists but GROQ_API_KEY not set — edit the file!")
        errors += 1
    else:
        ok(".env file found with API key set")
else:
    fail(".env not found — copy from configs/.env.example")
    errors += 1

header("4. Backend Python files")
backend_files = [
    "F:/research_agent/backend/api/main.py",
    "F:/research_agent/backend/agents/research_agent.py",
    "F:/research_agent/backend/agents/llm_client.py",
    "F:/research_agent/backend/core/config.py",
    "F:/research_agent/backend/core/models.py",
    "F:/research_agent/backend/core/fetchers.py",
    "F:/research_agent/backend/core/pdf_parser.py",
    "F:/research_agent/backend/nlp/claim_extractor.py",
    "F:/research_agent/backend/nlp/contradiction_detector.py",
    "F:/research_agent/backend/nlp/topic_clusterer.py",
    "F:/research_agent/backend/rag/retriever.py",
    "F:/research_agent/backend/graph/knowledge_graph.py",
    "F:/research_agent/backend/scheduler/tasks.py",
    "F:/research_agent/backend/scheduler/monitor.py",
    "F:/research_agent/backend/utils/helpers.py",
    "F:/research_agent/backend/utils/report_exporter.py",
]
for f in backend_files:
    if Path(f).exists():
        ok(Path(f).name)
    else:
        fail(f"{Path(f).name}  ← MISSING")
        errors += 1

header("5. Frontend files")
frontend_files = [
    "F:/research_agent/frontend/package.json",
    "F:/research_agent/frontend/vite.config.js",
    "F:/research_agent/frontend/src/App.jsx",
    "F:/research_agent/frontend/src/main.jsx",
    "F:/research_agent/frontend/src/index.css",
    "F:/research_agent/frontend/src/pages/SearchPage.jsx",
    "F:/research_agent/frontend/src/pages/ReportPage.jsx",
    "F:/research_agent/frontend/src/pages/GraphPage.jsx",
    "F:/research_agent/frontend/src/pages/QueryPage.jsx",
    "F:/research_agent/frontend/src/pages/JobsPage.jsx",
    "F:/research_agent/frontend/src/pages/SettingsPage.jsx",
]
for f in frontend_files:
    if Path(f).exists():
        ok(Path(f).name)
    else:
        fail(f"{Path(f).name}  ← MISSING")
        errors += 1

header("6. Docker")
docker_compose = Path("F:/research_agent/docker-compose.yml")
if docker_compose.exists():
    ok("docker-compose.yml found")
else:
    fail("docker-compose.yml missing")
    errors += 1

print()
print("=" * 50)
if errors == 0:
    print(f"{GREEN}{BOLD}All checks passed! Ready to run.{RESET}")
    print("\nStart order:")
    print("  1. scripts/start_docker.bat")
    print("  2. scripts/start_backend.bat")
    print("  3. scripts/start_worker.bat")
    print("  4. scripts/start_frontend.bat")
else:
    print(f"{RED}{BOLD}{errors} issue(s) found. Fix them before running.{RESET}")
print()
