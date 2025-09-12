# Firebase Storage Rules Deployment

This file contains Firebase Storage security rules that need to be deployed to your Firebase project.

## To deploy these rules:

1. **Using Firebase CLI (Recommended):**
   ```bash
   # Install Firebase CLI if not already installed
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase in your project (if not already done)
   firebase init storage
   
   # Deploy the storage rules
   firebase deploy --only storage
   ```

2. **Using Firebase Console (Web):**
   - Go to Firebase Console: https://console.firebase.google.com/
   - Select your project: finze-d5d1c
   - Navigate to Storage > Rules
   - Copy the contents from `storage.rules` file
   - Paste and publish the rules

## Current Rules Summary:
- Users can upload, read, update and delete their own profile pictures
- Profile pictures are stored in `/profile-pictures/` folder
- All operations require authentication
- Files are named with pattern: `profile_{userId}_{timestamp}.jpg`

## Troubleshooting:
- If you get "storage/unauthorized" errors, make sure the rules are deployed
- If you get "storage/unauthenticated" errors, ensure user is logged in
- Check the console logs for detailed error information

## Testing:
The app now includes detailed logging and connection testing to help diagnose issues.
