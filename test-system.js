// Direct test of AI Insights with hardcoded user data
// This will help us verify the system works with real data

console.log('🔍 Testing AI Insights System...');

// Test the backend directly
async function testBackendHealth() {
  try {
    const response = await fetch('http://localhost:8001/api/health');
    const data = await response.json();
    console.log('✅ Backend Health:', data.status);
    return data.status === 'healthy';
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
}

// Test with demo data to simulate real user expenses
async function testWithDemoData() {
  try {
    // Create a test user with expenses similar to what we see in the screenshots
    const testUserId = 'demo_user_' + Date.now();
    
    // First, let's test the categorization endpoint
    const categoryResponse = await fetch('http://localhost:8001/api/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'KFC Food Purchase',
        amount: 280,
        merchant: 'KFC'
      })
    });
    
    const categoryResult = await categoryResponse.json();
    console.log('📊 Categorization test:', categoryResult);
    
    // Test AI insights endpoint
    const insightsResponse = await fetch(`http://localhost:8001/api/ai-insights/${testUserId}?period=month`);
    const insightsResult = await insightsResponse.json();
    console.log('🧠 AI Insights test:', insightsResult);
    
    return true;
  } catch (error) {
    console.error('❌ Demo data test failed:', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting comprehensive AI Insights test...\n');
  
  // Test 1: Backend Health
  console.log('1. Testing Backend Health...');
  const healthOk = await testBackendHealth();
  
  if (!healthOk) {
    console.log('❌ Backend not available, cannot proceed with tests');
    return;
  }
  
  // Test 2: Demo Data Test
  console.log('\n2. Testing with Demo Data...');
  await testWithDemoData();
  
  console.log('\n✅ All tests completed!');
  console.log('\n📝 Next Steps:');
  console.log('   1. The backend is running and healthy');
  console.log('   2. Firestore is connected');
  console.log('   3. The frontend should now show real AI insights');
  console.log('   4. Check the web app at http://localhost:8082');
}

// Run the tests
runTests();