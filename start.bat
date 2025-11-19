@echo off
echo ========================================
echo   Plateforme ECE - Demarrage
echo ========================================
echo.
echo Demarrage du serveur backend...
echo.
start cmd /k "cd /d %~dp0 && npm run server"
timeout /t 3 /nobreak >nul
echo.
echo Demarrage du frontend React...
echo.
start cmd /k "cd /d %~dp0frontend && npm start"
echo.
echo ========================================
echo   Les serveurs sont en cours de demarrage
echo   Backend: http://localhost:5000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
pause
