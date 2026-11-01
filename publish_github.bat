@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
set "EVENTS_PUBLISH_VERSION="
if not exist "js\version.js" goto version_error
for /f "tokens=2 delims=:" %%V in ('findstr /c:"FRONTEND_VERSION:" "js\version.js"') do set "EVENTS_PUBLISH_VERSION=%%V"
if not defined EVENTS_PUBLISH_VERSION goto version_error
set "EVENTS_PUBLISH_VERSION=%EVENTS_PUBLISH_VERSION:"=%"
set "EVENTS_PUBLISH_VERSION=%EVENTS_PUBLISH_VERSION:,=%"
set "EVENTS_PUBLISH_VERSION=%EVENTS_PUBLISH_VERSION: =%"
if not defined EVENTS_PUBLISH_VERSION goto version_error
git add --all -- .
if errorlevel 1 exit /b 1
git diff --cached --quiet
if errorlevel 2 exit /b 1
if not errorlevel 1 goto push
git commit -m "Events Management %EVENTS_PUBLISH_VERSION%"
if errorlevel 1 exit /b 1
:push
git push
if errorlevel 1 exit /b 1
echo Published %EVENTS_PUBLISH_VERSION%
exit /b 0
:version_error
echo Could not read FRONTEND_VERSION from js\version.js. Nothing was published.
exit /b 1
