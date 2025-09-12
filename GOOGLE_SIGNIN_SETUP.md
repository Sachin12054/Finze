# Google Sign-In Configuration Guide

## Step 1: Get Google Web Client ID from Firebase

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your **Finze** project
3. Go to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. You'll see a **Web client ID** - copy this value

## Step 2: Configure Environment Variables

Create a `.env` file in your project root (if it doesn't exist):

```env
# Google Sign-In Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here

# Optional: iOS Client ID (for iOS builds)
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here
```

**Important**: Replace `your_web_client_id_here` with the actual Web Client ID from Firebase.

## Step 3: Test Google Sign-In

### For Development Build:
Once you set the environment variable, Google Sign-In will work in a development build.

### For Expo Go:
The app will show a dialog explaining that Google Sign-In requires a development build and offer to redirect to email signup.

## Example Configuration

Your `.env` file should look like this:
```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

## Verification

After setting up the environment variable:

1. **Restart your development server**: `npx expo start --clear`
2. **Test in development build**: Google Sign-In should work
3. **Test in Expo Go**: Should show informative dialog

## Next Steps

- For production: Build a development/production build using EAS Build
- For iOS: Configure iOS Client ID if you plan to support iOS
- For additional security: Set up SHA certificate fingerprints in Google Cloud Console