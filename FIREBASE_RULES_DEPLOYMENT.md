# Firebase Deployment Instructions

## The Issue
You're getting a "Missing or insufficient permissions" error when trying to fetch user profiles. This is because the Firestore security rules haven't been deployed to Firebase yet.

## Quick Fix Option 1: Deploy Rules via Firebase CLI

1. **Login to Firebase CLI:**
   ```bash
   firebase login
   ```

2. **Deploy the rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Restart your app** - the profile permissions should work now.

## Alternative Option 2: Deploy via Firebase Console

If CLI doesn't work, you can deploy rules manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `finze-d5d1c`
3. Go to **Firestore Database** → **Rules**
4. Copy the content from `firestore.rules` file in your project
5. Paste it into the Firebase Console rules editor
6. Click **Publish**

## Option 3: Temporary App-Level Fix

I can also implement a temporary fix in the app that gracefully handles permission errors until you deploy the rules. This would:

- Show a friendly message instead of crashing
- Allow the app to continue working with limited functionality
- Automatically retry once rules are deployed

## What's Happening

Your Firestore rules are currently set to the default (deny all), but we've updated the local `firestore.rules` file to allow users to access their own data. The updated rules just need to be deployed to Firebase.

## Current Rules Status

✅ **Local rules file** - Updated and ready
❌ **Deployed rules** - Still using default (deny all)
✅ **App code** - Ready for new user-centric structure

Let me know which option you'd prefer!