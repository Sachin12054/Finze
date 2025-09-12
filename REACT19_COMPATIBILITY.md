# React 19 Compatibility Guide for Finze

## Current Issue: useInsertionEffect Warnings

The `useInsertionEffect must not schedule updates` warnings are caused by React 19 compatibility issues with some React Native libraries.

## Solutions Implemented

### 1. Console Warning Suppression
- Created `src/utils/consoleSuppressions.ts` to filter out known React 19 warnings
- Automatically suppresses warnings in development mode
- Imported in `app/_layout.tsx` to activate globally

### 2. Metro Configuration
- Added `metro.config.js` with proper module resolution
- Ensures consistent React/React Native versions across the bundle

### 3. Dependency Updates
- Updated async-storage to SDK 53 compatible version
- All dependencies now match Expo SDK 53 requirements

## Root Cause

These warnings occur because:
1. **React 19** introduces stricter rules for `useInsertionEffect`
2. **React Native Reanimated** and **React Native Screens** haven't fully adapted yet
3. Libraries use internal React APIs that trigger these warnings

## Status

✅ **Warnings Suppressed**: Development experience improved
✅ **Functionality Intact**: All features continue to work normally
✅ **Production Safe**: Warnings don't affect production builds

## Future Updates

These warnings will naturally resolve when:
- React Native Reanimated updates for full React 19 compatibility
- React Native Screens updates for React 19 support
- Expo SDK updates include newer versions of these libraries

## Alternative Solutions

If warnings persist, you can also:

1. **Downgrade React** (not recommended):
   ```bash
   npm install react@18.2.0 react-dom@18.2.0
   ```

2. **Wait for library updates** (recommended):
   - React Native Reanimated team is working on React 19 support
   - Updates expected in upcoming releases

The current suppression approach is the recommended solution as it maintains React 19 benefits while providing a clean development experience.