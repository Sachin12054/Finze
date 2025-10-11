# Troubleshooting Guide - Receipt Scanner Errors

## 🔍 Issues Identified

### 1. Metro Bundler Error
```
Error: ENOENT: no such file or directory, open 'InternalBytecode.js'
```

### 2. Backend AI Service Error
```
ERROR  Receipt upload failed: 422
"Failed to connect to AI service after multiple attempts"
```

---

## ✅ Solutions

### Solution 1: Clear Metro Cache (REQUIRED)

This fixes the `InternalBytecode.js` error.

```bash
# Stop the development server (Ctrl+C)

# Clear caches
npx expo start -c

# OR manually clear:
rm -rf node_modules/.cache
rm -rf .expo
npx expo start
```

**Windows PowerShell:**
```powershell
# Stop the server first
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
npm start
```

---

### Solution 2: Start Backend Server (REQUIRED)

The AI service error means your Python backend isn't running or isn't accessible.

#### Option A: Start Local Backend

1. **Open a new terminal in the Backend directory:**
   ```bash
   cd Backend
   ```

2. **Activate virtual environment (if exists):**
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Mac/Linux
   source venv/bin/activate
   ```

3. **Install dependencies (first time only):**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the backend:**
   ```bash
   # Windows
   Start_Backend_New.bat
   
   # OR directly
   python app.py
   ```

5. **Verify it's running:**
   - Open browser: http://localhost:8001/api/health
   - Should show: `{"status": "healthy", ...}`

#### Option B: Use Production Backend

If you don't want to run the backend locally, the app is configured to use the production backend at:
```
https://finze-backend-fnah.onrender.com/api
```

**Check if it's working:**
1. Open browser: https://finze-backend-fnah.onrender.com/api/health
2. If it shows an error, you need to start your local backend

---

### Solution 3: Update Network IP (If using physical device)

If testing on a physical Android/iOS device on the same network:

1. **Find your computer's IP address:**
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   
   # Mac/Linux
   ifconfig
   # Look for inet address
   ```

2. **Update backend config:**
   Edit `src/config/backendConfig.ts`:
   ```typescript
   export const BACKEND_URLS = [
     'https://finze-backend-fnah.onrender.com/api',  // Production
     'http://YOUR_IP_ADDRESS:8001/api',  // Replace with your IP
     'http://localhost:8001/api',
     // ... rest
   ];
   ```

3. **Ensure backend allows connections:**
   In `Backend/app.py`, check:
   ```python
   if __name__ == '__main__':
       app.run(host='0.0.0.0', port=8001, debug=True)
       # host='0.0.0.0' allows external connections
   ```

---

## 🚀 Complete Fix Procedure

### Step 1: Clear Metro Cache
```bash
npx expo start -c
```

### Step 2: Start Backend
**Open a NEW terminal window:**
```bash
cd Backend
python app.py
```

You should see:
```
 * Running on http://0.0.0.0:8001
 * Running on http://127.0.0.1:8001
 * Running on http://YOUR_IP:8001
```

### Step 3: Test Backend Connection
**Open browser:**
- http://localhost:8001/api/health

**Expected response:**
```json
{
  "status": "healthy",
  "services": {
    "ai_categorization": true,
    "receipt_scanning": true,
    "firestore": true
  }
}
```

### Step 4: Restart App
```bash
# In your main terminal
npm start
# Press 'r' to reload the app
```

---

## 🔧 Troubleshooting

### Backend Won't Start

**Problem:** Missing dependencies
```bash
cd Backend
pip install -r requirements.txt
```

**Problem:** Port already in use
```bash
# Windows - Kill process on port 8001
netstat -ano | findstr :8001
taskkill /PID <PID_NUMBER> /F

# Mac/Linux
lsof -ti:8001 | xargs kill -9
```

**Problem:** Python not found
```bash
# Install Python 3.8+ from python.org
python --version  # Should show Python 3.8 or higher
```

### Backend Running but AI Service Fails

**Check the backend logs** for errors like:
- `OPENAI_API_KEY not set` → Need to set up environment variables
- `Model not found` → ML model files missing
- `Firebase connection failed` → Firebase credentials issue

**Solution:** Check Backend `.env` file:
```bash
cd Backend
# Create .env file if missing
cp .env.example .env  # If .env.example exists
```

Required environment variables:
```
OPENAI_API_KEY=your_key_here
GOOGLE_APPLICATION_CREDENTIALS=path/to/firebase-credentials.json
```

### Metro Cache Still Has Issues

**Nuclear option - full clean:**
```bash
# Stop all running processes

# Clear everything
rm -rf node_modules
rm -rf .expo
rm -rf node_modules/.cache
npm install

# Start fresh
npx expo start -c
```

---

## 📱 Testing the Fix

### Test 1: Backend Health Check
```bash
curl http://localhost:8001/api/health
```

**Expected:**
```json
{"status": "healthy", "services": {...}}
```

### Test 2: Receipt Upload
1. Open the app
2. Try to scan a receipt
3. Check backend terminal for logs
4. Should see: "Processing receipt upload..."

### Test 3: App Logs
**In Expo terminal, should see:**
```
✅ Connected to backend: http://localhost:8001/api
✅ Backend services ready for receipt scanning
```

---

## 🎯 Quick Commands Reference

```bash
# Clear Metro cache and restart
npx expo start -c

# Start backend (from Backend directory)
python app.py

# Check backend health
curl http://localhost:8001/api/health

# Full clean (if all else fails)
rm -rf node_modules .expo node_modules/.cache
npm install
npx expo start -c
```

---

## 📞 Still Having Issues?

1. **Check Backend Terminal Logs** - Look for specific error messages
2. **Check App Console** - Look for connection errors
3. **Verify Network** - Ensure device/emulator can reach backend
4. **Check Firewall** - May need to allow port 8001

### Common Error Messages & Fixes

| Error | Fix |
|-------|-----|
| `ENOENT: InternalBytecode.js` | Clear Metro cache: `npx expo start -c` |
| `Failed to connect to AI service` | Start backend: `python Backend/app.py` |
| `Network request failed` | Check backend is running, verify URL |
| `422 Unprocessable Entity` | Backend received request but processing failed - check backend logs |
| `Connection refused` | Backend not running or wrong port |

---

**Last Updated:** October 2, 2025  
**Status:** Ready to fix receipt scanner issues
