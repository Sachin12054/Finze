/**
 * Quick test script to verify backend connectivity
 */

const BACKEND_URLS = [
  'http://10.12.228.72:8001/api',  // Working backend IP (highest priority)
  'http://localhost:8001/api',      // Localhost
  'http://127.0.0.1:8001/api',     // Loopback
  'http://10.0.2.2:8001/api',      // Android emulator
  'http://10.220.12.202:8001/api',  // Previous IP
];

async function testBackendUrl(url, timeout = 3000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    console.log(`🔍 Testing: ${url}/health`);
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const healthData = await response.json();
      console.log(`✅ ${url} - Status: ${healthData.status}`);
      console.log(`   Services available: ${Object.keys(healthData.services || {}).join(', ')}`);
      return healthData.status === 'healthy';
    } else {
      console.log(`❌ ${url} - HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${url} - Error: ${error.message}`);
    return false;
  }
}

async function findBestBackendUrl() {
  console.log('🔍 Testing backend connectivity...\n');
  
  for (const url of BACKEND_URLS) {
    const isWorking = await testBackendUrl(url);
    if (isWorking) {
      console.log(`\n🎉 Best backend URL found: ${url}`);
      return url;
    }
  }
  
  console.log('\n❌ No working backend found!');
  return null;
}

// Run the test
findBestBackendUrl().then(result => {
  if (result) {
    console.log('\n✅ Backend connectivity test PASSED');
    console.log('Your React Native app should now be able to connect to the backend.');
  } else {
    console.log('\n❌ Backend connectivity test FAILED');
    console.log('Please check if the backend is running and accessible.');
  }
}).catch(error => {
  console.error('Test failed:', error);
});