// Test Enhanced AI Insights Backend
const http = require('http');

const testEndpoint = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function testBackend() {
  console.log('🧪 Testing Enhanced AI Insights Backend...\n');

  try {
    // Test health endpoint
    console.log('1. Testing Health Endpoint...');
    const health = await testEndpoint('/api/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response:`, health.data);
    console.log('');

    // Test categories endpoint
    console.log('2. Testing Categories Endpoint...');
    const categories = await testEndpoint('/api/categories');
    console.log(`   Status: ${categories.status}`);
    console.log(`   Categories:`, categories.data);
    console.log('');

    // Test AI insights with test user
    console.log('3. Testing AI Insights Endpoint...');
    const insights = await testEndpoint('/api/ai-insights/test_user?period=month');
    console.log(`   Status: ${insights.status}`);
    console.log(`   Insights:`, JSON.stringify(insights.data, null, 2));
    console.log('');

    console.log('✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBackend();