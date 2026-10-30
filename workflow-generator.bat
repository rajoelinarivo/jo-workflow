@echo off
rem workflow-generator.bat - launcher for the Node.js engine (src\cli.js).
rem Usage: workflow-generator.bat --help
setlocal

where node >nul 2>nul
if errorlevel 1 (
  echo Error: Node.js 18+ is required ^(https://nodejs.org^). 1>&2
  exit /b 1
)

node "%~dp0src\cli.js" %*
exit /b %errorlevel%
