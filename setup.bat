@echo off
echo ==========================================
echo      TCM Project Setup (Windows)
echo ==========================================

echo check if node is installed...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed! Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo.
echo Installing Frontend Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies.
    pause
    exit /b
)

echo.
echo Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies.
    pause
    exit /b
)
cd ..

echo.
echo ==========================================
echo      Setup Completed Successfully!
echo ==========================================
echo.
echo To start the application:
echo 1. Frontend: npm run dev
echo 2. Backend: cd backend ^&^& npm start
echo.
pause
