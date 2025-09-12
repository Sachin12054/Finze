# Development Environment Setup Guide

## Current Status

This Finze application is configured to work in **Expo Go** for development, but some features have limitations.

## Working Features in Expo Go ✅

- **Authentication Flow**: Email/password login and signup
- **Firebase Integration**: User profiles, data persistence
- **Biometric Authentication**: Fingerprint/Face ID
- **UI Components**: All screens and navigation
- **Core App Features**: Expense tracking, budgeting, etc.

## Limited Features in Expo Go ⚠️

### 1. Social Authentication (Google/Facebook)
- **Issue**: Native modules for Google/Facebook Sign-In are not available in Expo Go
- **Current Solution**: Mock implementations that redirect to email signup
- **Production Solution**: Requires development build

### 2. Push Notifications
- **Issue**: Remote push notifications removed from Expo Go in SDK 53
- **Current Solution**: NotificationService wrapper with graceful fallbacks
- **Production Solution**: Requires development build

## Development Build Setup (Recommended for Production)

To access all features, create a development build:

### Prerequisites
```bash
npm install -g @expo/cli
npm install -g eas-cli
```

### 1. Configure EAS
```bash
eas login
eas build:configure
```

### 2. Set up Environment Variables
Create `.env` file in project root:
```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
EXPO_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
```

### 3. Build Development Build
```bash
# For Android
eas build --platform android --profile development

# For iOS (requires Apple Developer account)
eas build --platform ios --profile development
```

### 4. Install Development Build
Install the generated APK (Android) or IPA (iOS) on your device.

## Environment Detection

The app automatically detects if it's running in Expo Go and provides appropriate fallbacks:

```typescript
// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Use appropriate service
const authService = isExpoGo ? ExpoGoSocialAuthService : SocialAuthService;
```

## Firebase Configuration

Firebase Auth now uses AsyncStorage for persistence:
- Auth state persists between app restarts
- No more warning about memory-only persistence

## Testing Social Auth

### In Expo Go
1. Tap Google/Facebook sign-in
2. Choose "Use Email Instead" from the alert
3. Complete email registration

### In Development Build
1. Configure OAuth credentials in Firebase Console
2. Add environment variables
3. Social auth will work natively

## OAuth Setup (for Development Build)

### Google Sign-In
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add package name and SHA certificate fingerprint

### Facebook Login
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create/select app
3. Add Facebook Login product
4. Configure package name and key hash

## Common Issues

### 1. "TurboModuleRegistry.getEnforcing(...): 'RNGoogleSignin' could not be found"
- **Cause**: Using Google Sign-In in Expo Go
- **Solution**: Use development build or stick to email auth in Expo Go

### 2. "expo-notifications functionality is not fully supported"
- **Cause**: Push notifications limitations in Expo Go
- **Solution**: Use development build for full notification support

### 3. "Route './auth/welcome.tsx' is missing the required default export"
- **Cause**: File export issues
- **Solution**: Ensure all route files have proper default exports

## Recommended Development Workflow

1. **Development Phase**: Use Expo Go for rapid iteration
2. **Feature Testing**: Use development build for testing native features
3. **Production**: Use production builds with full feature support

## Learn More

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Firebase Setup Guide](https://docs.expo.dev/guides/using-firebase/)
- [Google Sign-In Setup](https://docs.expo.dev/guides/google-authentication/)
- [Facebook Login Setup](https://docs.expo.dev/guides/facebook-authentication/)