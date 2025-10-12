/**
 * Async error handling utilities
 * Provides safe wrappers for async operations to prevent unhandled promise rejections
 */

export interface AsyncResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

/**
 * Safely executes an async operation and catches any errors
 * @param operation The async operation to execute
 * @param fallback Optional fallback value if operation fails
 * @returns Promise that always resolves with success/error status
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<AsyncResult<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    console.warn('⚠️ Async operation failed:', error instanceof Error ? error.message : 'Unknown error');
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error'),
      data: fallback 
    };
  }
}

/**
 * Wraps an async operation with timeout
 * @param operation The async operation to execute
 * @param timeoutMs Timeout in milliseconds (default: 10000)
 * @returns Promise that resolves or rejects within the timeout
 */
export function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    operation()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Debounces async operations to prevent multiple concurrent calls
 * @param operation The async operation to debounce
 * @param delayMs Delay in milliseconds (default: 300)
 * @returns Debounced function
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  operation: T,
  delayMs: number = 300
): T {
  let timeoutId: any = null;
  let lastArgs: Parameters<T>;

  return ((...args: Parameters<T>) => {
    lastArgs = args;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await operation(...lastArgs);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);
    });
  }) as T;
}

/**
 * Retries an async operation with exponential backoff
 * @param operation The async operation to retry
 * @param maxRetries Maximum number of retries (default: 3)
 * @param initialDelayMs Initial delay in milliseconds (default: 1000)
 * @returns Promise that resolves or rejects after all retries
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = initialDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Global promise rejection handler setup
 */
export function setupGlobalAsyncErrorHandling() {
  // Only set up event listeners in web environment where window and addEventListener exist
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 Unhandled Promise Rejection:', event.reason);
      
      // Prevent the default behavior that would log to console
      // event.preventDefault();
    });

    // Handle general errors
    window.addEventListener('error', (event) => {
      console.error('🚨 Global Error:', event.error);
    });
  } else {
    // React Native environment - use alternative error handling
    console.log('🔧 Setting up React Native error handling');
    
    // Set up global error handler for React Native
    try {
      const globalErrorUtils = (global as any)?.ErrorUtils;
      if (globalErrorUtils && typeof globalErrorUtils.setGlobalHandler === 'function') {
        const originalHandler = globalErrorUtils.getGlobalHandler();
        
        globalErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
          console.error('🚨 React Native Global Error:', error);
          
          // Call original handler
          if (originalHandler) {
            originalHandler(error, isFatal);
          }
        });
      }
    } catch (error) {
      console.log('⚠️ Could not set up React Native error handler:', error);
    }
  }
}