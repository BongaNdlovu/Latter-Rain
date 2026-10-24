@echo off
rem Test server with no caching. Opens the game on this PC; phones on the same Wi-Fi can use the address printed below.
cd /d "%~dp0"
echo.
echo   This PC:  http://localhost:8131
echo   Phone (same Wi-Fi):  http://YOUR-PC-IP:8131   ^(run  ipconfig  and use the IPv4 address^)
echo   Windows may ask to allow Python on the network: allow it for private networks.
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul & start "" http://localhost:8131"
python dev\serve_nocache.py 8131 0.0.0.0
pause
