@echo off
echo ===============================================
echo           Firebase Rules Deployment
echo ===============================================
echo.

echo Checking Firebase CLI...
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI not found. Please install it first:
    echo npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

echo ✅ Firebase CLI found

echo.
echo Checking login status...
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔐 Not logged in. Logging in to Firebase...
    firebase login
    if %errorlevel% neq 0 (
        echo ❌ Login failed
        pause
        exit /b 1
    )
)

echo ✅ Firebase login verified

echo.
echo 🚀 Deploying Firestore rules...
firebase deploy --only firestore:rules

if %errorlevel% eq 0 (
    echo.
    echo ✅ SUCCESS: Firestore rules deployed!
    echo.
    echo 📱 You can now:
    echo - Restart your app
    echo - The profile permissions should work
    echo - Users can access their own data
    echo.
) else (
    echo.
    echo ❌ FAILED: Rules deployment failed
    echo Please check the error above and try again
    echo.
)

echo Press any key to close...
pause >nul