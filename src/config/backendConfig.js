/**
 * Backend Configuration
 * Automatically detects the best backend URL for different environments
 */

// Backend URL options in order of preference
const BACKEND_URLS = [
  'http://10.12.228.72:8001/api',  // Render production deployment (primary)
  'http://10.195.3.148:8001/api',  // Network IP (for physical devices)
  'http://localhost:8001/api',      // Localhost (for web/desktop)
  'http://127.0.0.1:8001/api',     // Loopback (backup)
  'http://10.0.2.2:8001/api',      // Android emulator
];

/**
 * Test multiple backend URLs and return the first working one
 */
async function findBestBackendUrl() {
  console.log('🔍 Finding best backend connection...\n');
  
  for (const url of BACKEND_URLS) {
    try {
      console.log(`⏳ Testing: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const healthData = await response.json();
        if (healthData.status === 'healthy') {
          console.log(`✅ SUCCESS: ${url}`);
          console.log(`   📡 Services: AI:${healthData.services.ai_categorization ? '✅' : '❌'} | Scanner:${healthData.services.receipt_scanning ? '✅' : '❌'} | DB:${healthData.services.firestore ? '✅' : '❌'}`);
          return url;
        }
      }
    } catch (error) {
      console.log(`❌ Failed: ${url} (${error.message})`);
    }
  }
  
  console.log('\n❌ No backend connection found');
  return null;
}

// Export for use in React Native
const CONFIG = {
  BACKEND_URLS,
  findBestBackendUrl,
  // Default to Render production, but allow override
  DEFAULT_URL: 'https://finze-backend-fnah.onrender.com/api'
};

// Test the configuration
findBestBackendUrl().then(url => {
  if (url) {
    console.log(`\n🎯 Best backend URL: ${url}`);
    console.log('\n📱 Update your receiptScannerService to use this URL');
  } else {
    console.log('\n⚠️  No backend available - app will use sample data');
  }
});

// For Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}