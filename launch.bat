@echo off
setlocal

cd /d "%~dp0"

if not exist node_modules (
  echo Installing dependencies...
  call npm install || goto :error
)

echo Starting development server...
call npm run dev
goto :eof

:error
echo.
echo Failed to install dependencies.
exit /b 1

