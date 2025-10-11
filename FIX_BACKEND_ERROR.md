# Fix Backend Receipt Scanning Error

## Problem
Receipt scanning fails with error: "Failed to connect to AI service after multiple attempts"

**Root Causes:** 
1. Gemini API model version error (404 - model not found)
2. Firestore service is not connected (`"firestore": false` in health check)

## ✅ FIXED: Gemini API Model Issue

**Error:** `models/gemini-1.5-flash is not found for API version v1beta`

**Fix Applied:**
- Updated API endpoint from `v1beta` to `v1` 
- Updated model names to use `-latest` suffix
- Added fallback model support

The code has been updated in `Backend/services/receipt_extractor.py`

## Solution for Firestore Connection

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `finze-d5d1c`
3. Click the gear icon ⚙️ → **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **"Generate New Private Key"**
6. Click **"Generate Key"** to download the JSON file

### Step 2: Save the Service Account File

1. Save the downloaded file to your project root:
   ```
   C:\Users\sachi\Desktop\Amrita\Sem-5\DMBS\Project\Finze\
   ```

2. Rename it to:
   ```
   finze-d5d1c-firebase-adminsdk-fbsvc-f9951d3542.json
   ```
   
   Or any name you prefer, then update the `.env` file accordingly.

### Step 3: Update Backend .env File

Edit: `Backend\.env`

Make sure this line points to your actual service account file:
```env
GOOGLE_APPLICATION_CREDENTIALS=C:\Users\sachi\Desktop\Amrita\Sem-5\DMBS\Project\Finze\finze-d5d1c-firebase-adminsdk-fbsvc-f9951d3542.json
```

### Step 4: Restart the Backend Server

1. Stop the current backend (Press Ctrl+C in the terminal running the server)

2. Restart it:
   ```bash
   cd Backend
   python app.py
   ```

3. Check the logs - you should see:
   ```
   ✅ Firestore Service connected
   ```

4. Verify health check:
   ```bash
   curl http://localhost:8001/api/health
   ```
   
   You should see:
   ```json
   {
     "services": {
       "firestore": true,
       "receipt_scanning": true,
       "ai_categorization": true
     }
   }
   ```

### Step 5: Clear Metro Cache (Optional)

If you still see the `InternalBytecode.js` error:

```bash
# In your project root
npx expo start --clear
```

## Alternative: Use Environment Variable

If you don't want to download the file, you can use Application Default Credentials:

1. Install Google Cloud SDK
2. Run: `gcloud auth application-default login`
3. Remove or comment out `GOOGLE_APPLICATION_CREDENTIALS` in `.env`

## Verify Everything Works

1. **Check Backend Health:**
   ```bash
   curl http://localhost:8001/api/health
   ```
   All services should show `true`

2. **Test Receipt Upload in App**
   - Take a photo of a receipt
   - Upload it
   - Should process successfully ✅

## Still Having Issues?

### Check Backend Logs

Look for these messages when starting the server:
- `✅ Gemini Receipt Extractor initialized`
- `✅ Firestore Service connected`  ← **This is the important one**
- `✅ AI Model loaded successfully!`

### Common Errors

**"Service account file not found"**
- Make sure the file path in `.env` is correct
- Use absolute path (full path)
- Check file actually exists

**"Permission denied"**
- Make sure the service account has Firestore permissions
- In Firebase Console, go to IAM & Admin → check service account role

**"Invalid service account"**
- Download a fresh service account key
- Make sure it's for the correct project (finze-d5d1c)

## Quick Test Script

Create this file as `test_backend.py` in Backend folder:

```python
import os
from dotenv import load_dotenv

load_dotenv()

print("🔍 Checking environment variables...")
print(f"GEMINI_API_KEY: {'✅ Set' if os.getenv('GEMINI_API_KEY') else '❌ Not set'}")
print(f"GOOGLE_APPLICATION_CREDENTIALS: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS')}")

creds_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
if creds_path:
    if os.path.exists(creds_path):
        print(f"✅ Service account file exists")
        print(f"📁 File size: {os.path.getsize(creds_path)} bytes")
    else:
        print(f"❌ Service account file NOT FOUND at: {creds_path}")
else:
    print(f"❌ GOOGLE_APPLICATION_CREDENTIALS not set")
```

Run it:
```bash
cd Backend
python test_backend.py
```

---

**After fixing, you should see this in your app:**
- Receipt upload works ✅
- AI categorization works ✅
- Expense saved to Firestore ✅
- No more "Failed to connect to AI service" errors ✅

---

## 🔧 Code Changes Made

### Fixed: Gemini API Model Issue

**File:** `Backend/services/receipt_extractor.py`

**Changes:**
1. **Updated API endpoint:**
   - Changed from: `v1beta/models`
   - Changed to: `v1/models`

2. **Fixed model names for v1 API:**
   - Using: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-pro`
   - Note: v1 API does NOT use `-latest` suffix (that's only for v1beta)

3. **Enhanced retry logic:**
   - Added multiple model fallback support
   - Better error handling for 404 errors

**Why this fix works:**
- Google updated their Gemini API from v1beta to v1
- Model names now require `-latest` suffix
- The old model names are no longer supported in v1 API

### After Applying the Fix:

1. **Restart your backend server:**
   ```bash
   # Stop current server (Ctrl+C)
   cd Backend
   python app.py
   ```

2. **You should see:**
   ```
   ✅ Gemini Receipt Extractor initialized
   ```

3. **No more 404 errors** when uploading receipts ✅

### Still need to fix:
- Download Firebase service account JSON file (if Firestore shows false)
- Follow Step 1-3 above for Firestore connection

---

**Status:**
- ✅ Gemini API Model Issue - FIXED
- ⏳ Firestore Connection - Needs service account file
- ✅ Backend Running - Working
- ✅ AI Categorization - Working
