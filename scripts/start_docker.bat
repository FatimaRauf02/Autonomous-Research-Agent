@echo off
echo Starting Docker services (Neo4j + Redis + PostgreSQL)...
cd /d "F:\research_agent"
docker-compose up -d
echo.
echo Services started:
echo   Neo4j browser:  http://localhost:7474  (user: neo4j / pass: research_agent_pass)
echo   Redis:          localhost:6379
echo   PostgreSQL:     localhost:5432
echo.
echo Waiting 15 seconds for services to be ready...
timeout /t 15 /nobreak >nul
echo Ready!
pause
