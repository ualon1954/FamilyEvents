@echo off
setlocal
cd /d "%~dp0"
git add --all -- .
if errorlevel 1 exit /b 1
git diff --cached --quiet
if errorlevel 2 exit /b 1
if not errorlevel 1 goto push
git commit -m "Events Management FIX67 1.1.90A19P2F14Z58D5D55Z41FIX67Q64"
if errorlevel 1 exit /b 1
:push
git push
if errorlevel 1 exit /b 1
echo Published FIX67Q64
