@echo off
setlocal
set "PROJECT_VERSION=V1.1.90A19P2F14M"

echo Publishing %PROJECT_VERSION% to GitHub...

if not exist ".git" (
  echo ERROR: .git folder was not found.
  echo Run this file from the root of the existing GitHub repository.
  exit /b 1
)

git --version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Git is not installed or not available in PATH.
  exit /b 1
)

git status --short
git add .

git diff --cached --quiet
if not errorlevel 1 (
  echo No changes to publish.
  exit /b 0
)

git commit -m "%PROJECT_VERSION%"
if errorlevel 1 exit /b 1

git push origin main
if errorlevel 1 exit /b 1

echo Published %PROJECT_VERSION% successfully.
endlocal
