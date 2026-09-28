@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "PROJECT_VERSION=V1.1.90A19P2F13"

if not exist ".git\\" (
  echo ERROR: .git folder was not found.
  echo Copy this GITHUB package into the ROOT of the existing local Git repository.
  pause
  exit /b 1
)

where git >nul 2>nul
if errorlevel 1 (
  echo ERROR: Git was not found in PATH.
  pause
  exit /b 1
)

echo Publishing %PROJECT_VERSION%...
git add -A
if errorlevel 1 goto :error

git diff --cached --quiet
if not errorlevel 1 (
  echo No changes to publish.
  pause
  exit /b 0
)

git commit -m "%PROJECT_VERSION%"
if errorlevel 1 goto :error

git push origin main
if errorlevel 1 goto :error

echo.
echo SUCCESS: %PROJECT_VERSION% published.
pause
exit /b 0

:error
echo.
echo ERROR: Publish stopped. Review the message above.
pause
exit /b 1
