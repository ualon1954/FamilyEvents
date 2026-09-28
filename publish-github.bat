@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "PROJECT_VERSION=V1.1.90A19P2F12"

echo =================================================
echo Family Events Management - GitHub publish
echo Version: %PROJECT_VERSION%
echo =================================================
echo.

if not exist ".git\\" (
  echo ERROR: .git folder was not found in:
  echo %CD%
  echo.
  echo Extract this GITHUB ZIP into the ROOT of the existing local Git repository.
  echo Do not delete the .git folder.
  pause
  exit /b 1
)

where git >nul 2>nul
if errorlevel 1 (
  echo ERROR: Git was not found in PATH.
  pause
  exit /b 1
)

echo [1/4] Repository status...
git status --short
if errorlevel 1 goto :error

echo.
echo [2/4] Staging new, changed and deleted files...
git add -A
if errorlevel 1 goto :error

echo.
echo [3/4] Creating commit...
git diff --cached --quiet
if not errorlevel 1 (
  echo No changes to publish. Repository is already synchronized.
  goto :done
)

git commit -m "Family Events Management %PROJECT_VERSION%"
if errorlevel 1 goto :error

echo.
echo [4/4] Pushing to GitHub...
git push
if errorlevel 1 goto :error

echo.
echo SUCCESS: GitHub repository published with %PROJECT_VERSION%.
goto :done

:error
echo.
echo ERROR: Publish stopped. Review the message above.
pause
exit /b 1

:done
echo.
pause
exit /b 0
