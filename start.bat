@echo off
echo Starting SimpleBI...

:: Start Backend
echo Starting Backend...
start "SimpleBI Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload"

:: Start Frontend
echo Starting Frontend...
start "SimpleBI Frontend" cmd /k "cd frontend && npm run dev"

echo Both services are starting in separate windows.
