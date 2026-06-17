@echo off
echo.
echo  ====================================================
echo   GreenRoute AI - Starting All Servers
echo  ====================================================
echo.

echo  [1/2] Starting Backend (FastAPI on port 8000)...
start "GreenRoute Backend" powershell -NoExit -Command "cd '%~dp0backend'; uvicorn main:app --reload --port 8000 --host 0.0.0.0"

timeout /t 3 /nobreak > nul

echo  [2/2] Starting Frontend (Vite on port 5173)...
start "GreenRoute Frontend" powershell -NoExit -Command "cd '%~dp0frontend'; npm run dev"

timeout /t 5 /nobreak > nul

echo.
echo  ====================================================
echo   Both servers started!
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo  ====================================================
echo.

start "" "http://localhost:5173"
