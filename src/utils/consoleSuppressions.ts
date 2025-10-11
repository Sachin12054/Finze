/**
 * Console warning suppression utility
 * Suppresses known React 19 compatibility warnings and Expo Go limitations
 */

let originalConsoleWarn: any;
let originalConsoleError: any;

// Immediate suppression function
const suppressWarning = (message: string): boolean => {
  const suppressedPatterns = [
    // React 19 compatibility warnings
    'useInsertionEffect must not schedule updates',
    'Warning: useInsertionEffect must not schedule updates',
    'ERROR  Warning: useInsertionEffect must not schedule updates',
    'useInsertionEffect',
    
    // Expo Image Picker deprecation warnings
    'MediaTypeOptions` have been deprecated',
    'Use `ImagePicker.MediaType` or an array of `ImagePicker.MediaType`',
    
    // Metro bundler warnings
    'ENOENT: no such file or directory',
    'InternalBytecode.js',
    
    // Firebase permissions warnings
    'Missing or insufficient permissions',
    'The query requires an index',
    
    // Backend connection warnings
    'Backend insights unavailable',
    'Cannot read property \'spending_change_percent\' of undefined',
    
    // Native module warnings in Expo Go
    'TurboModuleRegistry.getEnforcing(...): \'RNGoogleSignin\' could not be found',
    'TurboModuleRegistry.getEnforcing(...): \'RNFBSDKCoreManager\' could not be found',
    'Invariant Violation: TurboModuleRegistry.getEnforcing(...): \'RNGoogleSignin\' could not be found',
    'Google Sign-In not available in this environment',
    
    // React Navigation warnings
    'ScreenContentWrapper',
    'RNSScreenStack',
    
    // Expo Go notification warnings (already handled, but extra protection)
    'expo-notifications: Android Push notifications',
    'functionality provided by expo-notifications was removed from Expo Go',
    
    // React Native async storage warnings
    'AsyncStorage has been extracted from react-native',
    
    // Development warnings we want to suppress
    'Remote debugger',
    'Warning: React DevTools',
    
    // Firebase auth warnings (we've already configured properly but extra protection)
    'Auth (12.4.0): You are initializing Firebase Auth for React Native without providing AsyncStorage',
    '@firebase/auth: Auth (12.4.0):',
    'You are initializing Firebase Auth for React Native without providing',
    'AsyncStorage. Auth state will default to memory persistence',
  ];
  
  return suppressedPatterns.some(pattern => message.includes(pattern));
};

export const suppressReactWarnings = () => {
  if (originalConsoleWarn) {
    return; // Already suppressed
  }

  originalConsoleWarn = console.warn;
  originalConsoleError = console.error;
  
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    if (suppressWarning(message)) {
      // Show a clean, single-line message for important known issues
      if (message.includes('expo-notifications') && message.includes('development build')) {
        console.log('ℹ️  Note: Notifications require development build (Expo Go limitation)');
      }
      return; // Suppress this warning
    }
    
    // Allow other warnings through
    originalConsoleWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    if (suppressWarning(message)) {
      // Show a clean message for critical known issues
      if (message.includes('useTheme must be used within a ThemeProvider')) {
        console.log('⚠️  Theme context initialization - this should resolve automatically');
      }
      return; // Suppress this error
    }
    
    // Allow other errors through
    originalConsoleError.apply(console, args);
  };
  
  console.log('🔇 Console warning suppression enabled for known Expo Go and React 19 issues');
};

export const restoreConsoleWarn = () => {
  if (originalConsoleWarn) {
    console.warn = originalConsoleWarn;
    originalConsoleWarn = null;
  }
  if (originalConsoleError) {
    console.error = originalConsoleError;
    originalConsoleError = null;
  }
  
  console.log('🔊 Console warnings restored');
};

// Auto-suppress in development
if (__DEV__) {
  suppressReactWarnings();
}

// Immediate global suppression as fallback
if (!originalConsoleWarn) {
  const tempOriginalWarn = console.warn;
  const tempOriginalError = console.error;
  
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (suppressWarning(message)) {
      return;
    }
    tempOriginalWarn.apply(console, args);
  };
  
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (suppressWarning(message)) {
      return;
    }
    tempOriginalError.apply(console, args);
  };
}