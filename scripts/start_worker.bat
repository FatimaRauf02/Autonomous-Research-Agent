@echo off
echo Starting Celery worker...
cd /d "F:\research_agent\backend"
call "F:\research_agent\venv\Scripts\activate.bat"

set HF_HOME=F:\research_agent\data\models_cache
set TRANSFORMERS_CACHE=F:\research_agent\data\models_cache
set SENTENCE_TRANSFORMERS_HOME=F:\research_agent\data\models_cache

echo Worker running. Waiting for research jobs...
echo.
celery -A core.celery_app worker --loglevel=info --pool=solo --concurrency=1
pause
