@echo off
echo Stopping all Research Agent services...
cd /d "F:\research_agent"
docker-compose down
echo Docker services stopped.
echo.
echo (Close the backend, worker, and frontend terminal windows manually)
pause
