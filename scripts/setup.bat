@echo off
echo ============================================================
echo   Autonomous Research Agent - F Drive Setup
echo ============================================================
echo.

REM ── Step 1: Create all directories on F drive ────────────────
echo [1/6] Creating directories on F:\research_agent\...
mkdir "F:\research_agent\data\papers" 2>nul
mkdir "F:\research_agent\data\chroma" 2>nul
mkdir "F:\research_agent\data\reports" 2>nul
mkdir "F:\research_agent\data\models_cache" 2>nul
mkdir "F:\research_agent\data\neo4j\data" 2>nul
mkdir "F:\research_agent\data\neo4j\logs" 2>nul
mkdir "F:\research_agent\data\neo4j\plugins" 2>nul
mkdir "F:\research_agent\data\redis" 2>nul
mkdir "F:\research_agent\data\postgres" 2>nul
echo    Done.
echo.

REM ── Step 2: Copy project to F drive if not already there ─────
if not exist "F:\research_agent\backend" (
    echo [2/6] Copying project files to F:\research_agent\...
    xcopy /E /I /Y "%~dp0" "F:\research_agent\" >nul
    echo    Done.
) else (
    echo [2/6] Project already on F drive. Skipping copy.
)
echo.

REM ── Step 3: Create Python venv on F drive ────────────────────
echo [3/6] Creating Python virtual environment at F:\research_agent\venv...
if not exist "F:\research_agent\venv" (
    python -m venv "F:\research_agent\venv"
    echo    Venv created.
) else (
    echo    Venv already exists. Skipping.
)
echo.

REM ── Step 4: Install requirements ─────────────────────────────
echo [4/6] Installing Python packages (this takes a few minutes)...
"F:\research_agent\venv\Scripts\pip.exe" install --upgrade pip --quiet
"F:\research_agent\venv\Scripts\pip.exe" install -r "F:\research_agent\backend\requirements.txt" --quiet
echo    Packages installed.
echo.

REM ── Step 5: Download spaCy model ─────────────────────────────
echo [5/6] Downloading spaCy English model...
"F:\research_agent\venv\Scripts\python.exe" -m spacy download en_core_web_sm
echo.

REM ── Step 6: Copy env file ────────────────────────────────────
echo [6/6] Setting up .env file...
if not exist "F:\research_agent\backend\.env" (
    copy "F:\research_agent\configs\.env.example" "F:\research_agent\backend\.env"
    echo    IMPORTANT: Edit F:\research_agent\backend\.env and add your GROQ_API_KEY
) else (
    echo    .env already exists. Skipping.
)
echo.

echo ============================================================
echo   Setup Complete!
echo ============================================================
echo.
echo   Next steps:
echo   1. Edit F:\research_agent\backend\.env  ^<-- Add GROQ_API_KEY
echo   2. Run: start_docker.bat                ^<-- Start Neo4j + Redis
echo   3. Run: start_backend.bat               ^<-- Start FastAPI
echo   4. Run: start_worker.bat                ^<-- Start Celery worker
echo   5. Run: start_frontend.bat              ^<-- Start React app
echo.
pause
