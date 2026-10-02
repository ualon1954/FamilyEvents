@echo off
setlocal
cd /d "%~dp0"
echo Publishing Events Management V1.1.90A19P2F14Z14 to GitHub...
git add .
git commit -m "Events Management V1.1.90A19P2F14Z14"
git push origin main
echo Published V1.1.90A19P2F14Z14.
pause
