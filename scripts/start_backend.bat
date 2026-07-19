@echo off
echo Starting FastAPI backend...
cd /d "F:\research_agent\backend"
call "F:\research_agent\venv\Scripts\activate.bat"

REM Set HuggingFace cache to F drive
set HF_HOME=F:\research_agent\data\models_cache
set TRANSFORMERS_CACHE=F:\research_agent\data\models_cache
set SENTENCE_TRANSFORMERS_HOME=F:\research_agent\data\models_cache

REM Init DB tables on first run
python -c "from core.models import init_db; init_db()" 2>nul

echo.
echo Backend running at: http://localhost:8000
echo API docs:           http://localhost:8000/docs
echo.
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
pause
