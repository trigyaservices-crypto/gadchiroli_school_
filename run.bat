@echo off
echo ==================================================
echo Starting Lighthouse School Visit Local Server
echo ==================================================

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
  node build.js
)

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
  echo Serving on http://localhost:8000
  cd dist
  python -m http.server 8000
  pause
  exit /b
)

echo Opening index.html in your default web browser...
start index.html
pause
