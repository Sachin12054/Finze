// Test Real User AI Insights with Authentication
const http = require('http');

// Test with actual Firebase user ID (you'll need to get this from your app)
// Common test user IDs that might exist in your database
const TEST_USER_IDS = [
  'test_user',
  'user1',
  'admin',
  'demo_user',
  'default_user'
];

async function testUserInsights(userId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8001,
      path: `/api/ai-insights/${userId}?period=month&limit=200`,
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
          resolve({ status: res.statusCode, data: parsed, userId });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData, userId });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function testExpenses(userId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8001,
      path: `/api/expenses/${userId}`,
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
          resolve({ status: res.statusCode, data: parsed, userId });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData, userId });
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
  console.log('🔍 Testing Real User Data with Multiple User IDs...\n');

  for (const userId of TEST_USER_IDS) {
    console.log(`\n📊 Testing User ID: ${userId}`);
    console.log('=' * 50);

    try {
      // Test expenses first
      console.log('1. Testing Expenses...');
      const expenses = await testExpenses(userId);
      console.log(`   Status: ${expenses.status}`);
      
      if (expenses.data && typeof expenses.data === 'object' && expenses.data.length !== undefined) {
        console.log(`   Found ${expenses.data.length} expenses`);
        if (expenses.data.length > 0) {
          console.log('   Sample expense:', JSON.stringify(expenses.data[0], null, 2));
        }
      } else {
        console.log('   Expenses data:', expenses.data);
      }

      // Test AI insights
      console.log('\n2. Testing AI Insights...');
      const insights = await testUserInsights(userId);
      console.log(`   Status: ${insights.status}`);
      
      if (insights.data && insights.data.data) {
        const { financial_health, category_analysis, spending_insights, smart_suggestions } = insights.data.data;
        console.log(`   Total Spending: ₹${financial_health?.total_spending || 0}`);
        console.log(`   Transactions: ${financial_health?.transaction_count || 0}`);
        console.log(`   Categories: ${Object.keys(category_analysis || {}).length}`);
        console.log(`   Insights: ${spending_insights?.length || 0}`);
        console.log(`   Suggestions: ${smart_suggestions?.length || 0}`);
        
        if (financial_health?.total_spending > 0) {
          console.log('\n🎉 FOUND REAL DATA! This user has actual expenses!');
          console.log('   Financial Health:', financial_health);
          console.log('   Categories:', Object.keys(category_analysis || {}));
        }
      }

    } catch (error) {
      console.error(`   ❌ Error testing ${userId}:`, error.message);
    }
  }

  console.log('\n✅ All tests completed!');
}

runTests();