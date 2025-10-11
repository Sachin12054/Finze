/**
 * Test Backend Connection Script
 * Use this to verify the AI categorization and receipt scanning services are working
 */

const testBackendConnection = async () => {
  console.log('🔄 Testing backend connection...');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:8001/api/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend health check passed:', healthData);
      
      // Test AI categorization
      const categoryResponse = await fetch('http://localhost:8001/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Coffee at Starbucks' })
      });
      
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        console.log('✅ AI categorization test passed:', categoryData);
      } else {
        console.log('❌ AI categorization test failed');
      }
      
      // Test get categories
      const categoriesResponse = await fetch('http://localhost:8001/api/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        console.log('✅ Get categories test passed:', categoriesData);
      } else {
        console.log('❌ Get categories test failed');
      }
      
    } else {
      console.log('❌ Backend health check failed');
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error);
  }
};

// Run the test
testBackendConnection();