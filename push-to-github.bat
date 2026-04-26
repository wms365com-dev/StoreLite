@echo off
setlocal

cd /d "%~dp0"

set "REMOTE_URL=https://github.com/wms365com-dev/StoreLite.git"
set "BRANCH=main"

where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed or not available in PATH.
  pause
  exit /b 1
)

if not exist ".git" (
  echo Initializing Git repository...
  git init
  if errorlevel 1 goto failed
)

git branch -M %BRANCH%
if errorlevel 1 goto failed

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  echo Adding GitHub remote...
  git remote add origin "%REMOTE_URL%"
) else (
  echo Updating GitHub remote...
  git remote set-url origin "%REMOTE_URL%"
)
if errorlevel 1 goto failed

echo.
echo Current status:
git status --short

echo.
echo Staging files...
git add .
if errorlevel 1 goto failed

git diff --cached --quiet
if not errorlevel 1 (
  echo No changes to commit.
) else (
  echo Creating commit...
  git commit -m "Initial StoreLite app"
  if errorlevel 1 goto failed
)

echo.
echo Pushing to GitHub...
git push -u origin %BRANCH%
if errorlevel 1 goto failed

echo.
echo Done. Pushed to %REMOTE_URL%
pause
exit /b 0

:failed
echo.
echo Push failed. Check the message above.
echo If GitHub asks for authentication, sign in with Git Credential Manager or use a personal access token.
pause
exit /b 1
