/**
 * Console warning suppression utility
 * Suppresses known React 19 compatibility warnings and Expo Go limitations
 */

let originalConsoleWarn: any;
let originalConsoleError: any;

// Immediate suppression function
const suppressWarning = (message: string): boolean => {
  const suppressedPatterns = [
    'useInsertionEffect must not schedule updates',
    'Warning: useInsertionEffect must not schedule updates',
    'ERROR  Warning: useInsertionEffect must not schedule updates',
    'useInsertionEffect',
    'TurboModuleRegistry.getEnforcing(...): \'RNGoogleSignin\' could not be found',
    'TurboModuleRegistry.getEnforcing(...): \'RNFBSDKCoreManager\' could not be found',
    'Invariant Violation: TurboModuleRegistry.getEnforcing(...): \'RNGoogleSignin\' could not be found',
    'ScreenContentWrapper',
    'RNSScreenStack',
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
      return; // Suppress this warning
    }
    
    // Allow other warnings through
    originalConsoleWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    if (suppressWarning(message)) {
      return; // Suppress this error
    }
    
    // Allow other errors through
    originalConsoleError.apply(console, args);
  };
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
};

// Auto-suppress in development
if (__DEV__) {
  suppressReactWarnings();
}

// Immediate global suppression as backup
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