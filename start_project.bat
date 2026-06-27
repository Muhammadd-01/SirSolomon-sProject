@echo off
title Sir Solomon's Portal
color 0A
echo.
echo ============================================================
echo.
echo        Starting Sir Solomon's Management Portal...
echo.
echo ============================================================
echo.
echo  Principal Login Credentials:
echo  Email:    principal@school.com
echo  Password: Password123
echo.
echo  (These are auto-created on first run)
echo.
echo ============================================================
echo.

echo [1/2] Starting Backend Server...
cd "%~dp0backend"
start start.bat

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server...
cd "%~dp0frontend"
start start.bat

cd "%~dp0"

echo.
echo Opening browser...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ============================================================
echo  Both servers are starting!
echo.
echo  Frontend: http://localhost:5173  (opens automatically)
echo  Backend:  http://localhost:5000
echo.
echo  Close this window anytime. Servers run independently.
echo ============================================================
echo.
pause
