/**
 * Backend Configuration for React Native
 * Automatically detects the best backend URL for different environments
 */

import NotificationService from '../services/notificationService';
import BudgetMonitoringService from '../services/budgetMonitoringService';

// Export services for easy access
export { NotificationService, BudgetMonitoringService };

// Backend URL options in order of preference (without /api suffix - added by services)
export const BACKEND_URLS = [
  'http://172.26.246.73:8001',                 // Local development server (PRIORITY - has all services)
  'http://127.0.0.1:8001',                      // Localhost (for desktop testing)
  'http://localhost:8001',                      // Alternative localhost
  'http://192.168.0.1:8001',                   // Alternative local network IP
  'http://10.0.2.2:8001',                      // Android emulator bridge
  'https://finze-backend-fnah.onrender.com',    // Production Render deployment (fallback)
] as const;

export interface BackendHealthResponse {
  status: string;
  services: {
    ai_categorization?: any;
    receipt_scanning?: any;
    firestore?: any;
    enhanced_insights?: any;
    gemini_ai_advisor?: any;
  };
  version?: string;
  timestamp?: string;
}

/**
 * Test a single backend URL
 */
export async function testBackendUrl(url: string, timeout: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${url}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const healthData: BackendHealthResponse = await response.json();
      // Check if status is healthy, services exist, and speech service is available
      const hasServices = healthData.services && Object.keys(healthData.services).length > 0;
      const hasSpeechService = healthData.services && ('sarvam_speech' in healthData.services);
      
      return healthData.status === 'healthy' && hasServices && hasSpeechService;
    }
    
    return false;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log(`⏰ Backend test timeout for ${url}: Request took longer than ${timeout}ms`);
      } else if (error.message.includes('Network request failed')) {
        console.log(`🔌 Backend network failed for ${url}: Cannot connect (device/emulator restriction)`);
      } else {
        console.log(`❌ Backend test failed for ${url}:`, error.message);
      }
    } else {
      console.log(`❌ Backend test failed for ${url}:`, error);
    }
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
  
  return null;
}

/**
 * Get the default backend URL (Render production)
 */
export function getDefaultBackendUrl(): string {
  return BACKEND_URLS[0]; // Production Render URL
}

/**
 * Configuration constants
 */
export const BACKEND_CONFIG = {
  DEFAULT_URL: getDefaultBackendUrl(),
  TIMEOUT: 30000, // 30 seconds for image processing
  HEALTH_CHECK_TIMEOUT: 8000, // 8 seconds for health checks (increased for network latency)
} as const;