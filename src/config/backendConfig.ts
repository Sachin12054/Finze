/**
 * Backend Configuration for React Native
 * Automatically detects the best backend URL for different environments
 */

// Backend URL options in order of preference
export const BACKEND_URLS = [
  'https://finze-backend-fnah.onrender.com/api',  // Render production deployment (primary)
  'http://10.195.3.148:8001/api',  // Network IP (for physical devices)
  'http://localhost:8001/api',      // Localhost (for web/desktop) 
  'http://127.0.0.1:8001/api',     // Loopback (backup)
  'http://10.0.2.2:8001/api',      // Android emulator
] as const;

export interface BackendHealthResponse {
  status: string;
  services: {
    ai_categorization: boolean;
    receipt_scanning: boolean;
    firestore: boolean;
  };
}

/**
 * Test a single backend URL
 */
export async function testBackendUrl(url: string, timeout: number = 3000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const healthData: BackendHealthResponse = await response.json();
      return healthData.status === 'healthy' && 
             healthData.services.receipt_scanning && 
             healthData.services.firestore;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Find the best working backend URL
 */
export async function findBestBackendUrl(): Promise<string | null> {
  for (const url of BACKEND_URLS) {
    const isWorking = await testBackendUrl(url);
    if (isWorking) {
      console.log(`✅ Connected to backend: ${url}`);
      return url;
    }
  }
  
  console.warn('⚠️ No backend connection found - using sample data');
  return null;
}

/**
 * Get the default backend URL (Render production)
 */
export function getDefaultBackendUrl(): string {
  return BACKEND_URLS[0]; // Render production URL
}

/**
 * Configuration constants
 */
export const BACKEND_CONFIG = {
  DEFAULT_URL: getDefaultBackendUrl(),
  TIMEOUT: 30000, // 30 seconds for image processing
  HEALTH_CHECK_TIMEOUT: 5000, // 5 seconds for health checks
} as const;