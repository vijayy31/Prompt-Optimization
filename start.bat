@echo off
echo.
echo ✦ Prompt Optimizer — LangChain Backend
echo ─────────────────────────────────────────

cd /d "%~dp0backend"

python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install from https://python.org
    pause
    exit /b
)

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -q -r requirements.txt

echo.
echo Starting server on http://localhost:5000
echo Keep this window open while using the extension.
echo Press Ctrl+C to stop.
echo.

python server.py
pause
