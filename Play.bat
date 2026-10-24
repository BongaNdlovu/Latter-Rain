@echo off
cd /d "%~dp0"
start "" cmd /c "timeout /t 2 /nobreak >nul & start "" http://localhost:8124"
python serve.py
pause
