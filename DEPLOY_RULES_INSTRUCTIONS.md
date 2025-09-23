# 🔥 Firebase Rules Deployment Instructions

## Problem
You're getting this error:
```
ERROR  Error fetching profile: [FirebaseError: Missing or insufficient permissions.]
```

This happens because the Firestore security rules haven't been deployed to Firebase.

## Solution

### Option 1: Quick Deploy (Recommended)
Run this command in your terminal:

```bash
firebase deploy --only firestore:rules
```

### Option 2: Full Firebase Setup
If you haven't set up Firebase CLI:

1. **Install Firebase CLI** (if not installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize project** (if needed):
   ```bash
   firebase init firestore
   ```

4. **Deploy rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option 3: Use the Batch Script
Double-click the `deploy-firebase-rules.bat` file in your project folder.

### Option 4: Manual Deployment via Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project `finze-d5d1c`
3. Go to Firestore Database → Rules
4. Copy the contents of `firestore.rules` and paste it there
5. Click "Publish"

## Verification

After deployment, restart your app. The profile error should be resolved.

## What the Rules Do

The deployed rules ensure:
- ✅ Users can only access their own data
- ✅ Authenticated users can read/write their own profile
- ✅ Subcollections (expenses, transactions, etc.) are properly secured
- ✅ Legacy collections maintain backward compatibility

## Troubleshooting

If you still get errors after deployment:
1. Check if you're logged into Firebase: `firebase login:list`
2. Verify project ID: `firebase projects:list`
3. Make sure you're in the correct project directory
4. Try: `firebase use finze-d5d1c` to set the correct project