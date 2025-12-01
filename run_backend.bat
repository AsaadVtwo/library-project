@echo off
cd /d "%~dp0"
call .venv\Scripts\activate 2>nul
pip install -r backend\requirements.txt
uvicorn backend.main:app --reload
pause
