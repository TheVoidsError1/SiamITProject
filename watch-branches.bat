@echo off
echo Starting continuous git branch monitoring...
echo Press Ctrl+C to stop
echo.

:loop
cls
echo [%date% %time%] Current Git Branches:
echo ======================================
git branch --all
echo.
echo Waiting 10 seconds before next check...
timeout /t 10 /nobreak >nul
goto loop 