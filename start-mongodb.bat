@echo off
echo ========================================
echo   MongoDB Startup Script
echo ========================================
echo.

echo Checking MongoDB service status...
sc query MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo MongoDB service found.
    echo Attempting to start MongoDB...
    net start MongoDB
    if %errorlevel% equ 0 (
        echo.
        echo ✅ MongoDB started successfully!
        echo.
        echo Testing connection...
        timeout /t 2 /nobreak >nul
        mongosh --eval "db.adminCommand('ping')" >nul 2>&1
        if %errorlevel% equ 0 (
            echo ✅ MongoDB is running and responding!
        ) else (
            echo ⚠️  MongoDB started but connection test failed.
            echo    Please check MongoDB logs.
        )
    ) else (
        echo.
        echo ❌ Failed to start MongoDB service.
        echo.
        echo Possible reasons:
        echo   1. MongoDB is already running
        echo   2. Insufficient permissions (run as Administrator)
        echo   3. MongoDB service is not installed
        echo.
        echo Solutions:
        echo   - Run this script as Administrator
        echo   - Check if MongoDB is already running: net start ^| findstr MongoDB
        echo   - Install MongoDB from: https://www.mongodb.com/try/download/community
        echo   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
    )
) else (
    echo.
    echo ❌ MongoDB service not found!
    echo.
    echo MongoDB is not installed as a Windows service.
    echo.
    echo Options:
    echo   1. Install MongoDB Community Server
    echo      Download from: https://www.mongodb.com/try/download/community
    echo      During installation, select "Install MongoDB as a Service"
    echo.
    echo   2. Use MongoDB Atlas (Cloud - Free)
    echo      Sign up at: https://www.mongodb.com/cloud/atlas
    echo      Create free cluster and update .env file
    echo.
    echo   3. Start MongoDB manually (if installed)
    echo      cd "C:\Program Files\MongoDB\Server\<version>\bin"
    echo      mongod.exe --dbpath "C:\data\db"
    echo.
)

echo.
echo ========================================
pause





