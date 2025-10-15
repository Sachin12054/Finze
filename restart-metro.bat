@echo off
echo ========================================
echo  CLEARING METRO CACHE AND RESTARTING
echo ========================================
echo.

echo [1/3] Stopping any running Metro processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Clearing Metro cache...
call npx expo start --clear --reset-cache

echo.
echo [3/3] Metro restarted with cleared cache!
echo.
echo ========================================
echo  NEXT STEPS:
echo  1. Wait for Metro to fully start
echo  2. Press 'r' to reload the app
echo  3. Check console for [NEW CODE] logs
echo ========================================
