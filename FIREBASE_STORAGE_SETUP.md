# Firebase Storage Setup Guide

## Current Issue: 
Firebase Storage API is not enabled for your project, causing "storage/unknown" errors.

## Solution Steps:

### 1. Enable Firebase Storage API in Google Cloud Console

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Select your project: `finze-d5d1c`

2. **Enable Firebase Storage API:**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Firebase Storage API"
   - Click on it and press "ENABLE"

3. **Also enable these related APIs:**
   - Cloud Storage API
   - Cloud Storage JSON API
   - Firebase Management API

### 2. Enable Storage in Firebase Console

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project: `finze-d5d1c`

2. **Set up Storage:**
   - Click on "Storage" in the left sidebar
   - Click "Get started"
   - Choose "Start in test mode" (we'll secure it later)
   - Select a location (preferably close to your users)

### 3. Deploy Storage Rules

After enabling the APIs, run these commands:

```bash
# In your project directory
cd "c:\Users\sachi\Desktop\Amrita\Sem-5\DMBS\Project\Finze"

# Deploy storage rules
firebase deploy --only storage
```

### 4. Update Firebase Configuration (if needed)

Make sure your `firebase.ts` has the correct storage bucket:

```typescript
const firebaseConfig = {
  // ... other config
  storageBucket: "finze-d5d1c.firebasestorage.app", // or .appspot.com
};
```

### 5. Test the Setup

After completing the above steps, the photo upload should work properly.

## Temporary Workaround

Until you complete the setup, the app will:
- Show a setup warning when trying to upload photos
- Generate a personalized avatar instead
- Save the avatar URL to Firestore
- Update the Firebase Auth profile

## Troubleshooting

1. **"Authentication credentials" error:**
   - Run `firebase login` again
   - Make sure you're using the correct Google account

2. **"Project not found" error:**
   - Verify project ID in `.firebaserc` is correct
   - Check that you have access to the project

3. **"Permission denied" error:**
   - Make sure you're an owner/editor of the Firebase project
   - Check that billing is enabled (required for some APIs)

## Once Setup is Complete

1. Restart your Expo app
2. Try uploading a photo from gallery or camera
3. The photo should upload to Firebase Storage
4. You'll see progress indicators during upload
5. The photo will be stored securely with proper permissions

## Files Created/Modified

- `.firebaserc` - Project configuration
- `firebase.json` - Firebase services configuration  
- `storage.rules` - Security rules for Firebase Storage
- `STORAGE_RULES_DEPLOYMENT.md` - This guide

Contact support if you need help with the Google Cloud Console setup!
