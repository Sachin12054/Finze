// Test Real User Data AI Insights
const http = require('http');

// Test with actual user data
async function testRealUserInsights() {
  return new Promise((resolve, reject) => {
    // You should replace 'test_user_id' with an actual user ID from your app
    // For now, let's test with a generic user ID
    const options = {
      hostname: 'localhost',
      port: 8001,
      path: '/api/ai-insights/test_user?period=month&limit=200',
      method: 'GET',
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

    req.end();
  });
}

async function testExpensesEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8001,
      path: '/api/expenses/test_user',
      method: 'GET',
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

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Real User Data AI Insights...\n');

  try {
    // Test expenses endpoint first
    console.log('1. Testing Expenses Endpoint...');
    const expenses = await testExpensesEndpoint();
    console.log(`   Status: ${expenses.status}`);
    console.log(`   Expenses Data:`, JSON.stringify(expenses.data, null, 2));
    console.log('');

    // Test AI insights
    console.log('2. Testing AI Insights with Real Data...');
    const insights = await testRealUserInsights();
    console.log(`   Status: ${insights.status}`);
    console.log(`   AI Insights:`, JSON.stringify(insights.data, null, 2));
    console.log('');

    console.log('✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();