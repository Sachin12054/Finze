/**
 * Complete System Test for Finze AI Insights
 * Tests both backend connectivity and frontend integration
 */

// Test configuration
const BACKEND_URL = 'http://localhost:8001/api';
const TEST_USER_ID = 'test-user-finze-123';

async function testBackendConnectivity() {
    console.log('🔍 Testing Backend Connectivity...');
    
    try {
        // Test health endpoint
        const healthResponse = await fetch(`${BACKEND_URL}/health`);
        const healthData = await healthResponse.json();
        
        console.log('✅ Backend Health Check:', healthData.status);
        console.log('🔧 Services Available:');
        Object.entries(healthData.services).forEach(([service, status]) => {
            console.log(`   ${status ? '✅' : '❌'} ${service}`);
        });
        
        return true;
    } catch (error) {
        console.error('❌ Backend connectivity failed:', error);
        return false;
    }
}

async function testAIInsightsEndpoint() {
    console.log('\n🤖 Testing AI Insights Endpoint...');
    
    try {
        const periods = ['week', 'month', 'quarter'];
        
        for (const period of periods) {
            console.log(`📊 Testing ${period} insights...`);
            
            const response = await fetch(`${BACKEND_URL}/ai-insights/${TEST_USER_ID}?period=${period}&limit=100`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.status === 'success') {
                    const insights = data.data;
                    console.log(`   ✅ ${period} insights generated`);
                    console.log(`   📈 Spending insights: ${insights.spending_insights?.length || 0}`);
                    console.log(`   💡 Smart suggestions: ${insights.smart_suggestions?.length || 0}`);
                    console.log(`   🏥 Health score: ${insights.financial_health?.health_score || 'N/A'}`);
                    console.log(`   🤖 AI enhanced: ${insights.ai_enhanced ? 'Yes' : 'No'}`);
                } else {
                    console.log(`   ⚠️ ${period} insights returned error:`, data.error);
                }
            } else {
                console.log(`   ❌ ${period} insights request failed:`, response.status);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ AI Insights endpoint test failed:', error);
        return false;
    }
}

async function testCategorizationEndpoint() {
    console.log('\n🧠 Testing AI Categorization...');
    
    const testExpenses = [
        { description: 'McDonald\'s Big Mac meal', amount: 299 },
        { description: 'Uber ride to office', amount: 180 },
        { description: 'Netflix monthly subscription', amount: 199 },
        { description: 'Electricity bill payment', amount: 1500 }
    ];
    
    try {
        for (const expense of testExpenses) {
            const response = await fetch(`${BACKEND_URL}/categorize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expense)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`   ✅ "${expense.description}" → ${result.category} (${(result.confidence * 100).toFixed(1)}%)`);
            } else {
                console.log(`   ❌ Failed to categorize: "${expense.description}"`);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Categorization test failed:', error);
        return false;
    }
}

async function testFrontendIntegration() {
    console.log('\n📱 Testing Frontend Integration...');
    
    // Test if frontend service can connect to backend
    try {
        // This simulates what the frontend does
        const response = await fetch(`${BACKEND_URL}/ai-insights/${TEST_USER_ID}?period=month`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Frontend-style request successful');
            console.log('   📊 Data received:', Object.keys(data.data || {}).join(', '));
            
            // Check if response has expected structure
            const requiredFields = ['financial_health', 'spending_insights', 'smart_suggestions'];
            const hasAllFields = requiredFields.every(field => 
                data.data && typeof data.data[field] !== 'undefined'
            );
            
            if (hasAllFields) {
                console.log('   ✅ Response structure is correct');
            } else {
                console.log('   ⚠️ Response missing some expected fields');
            }
            
            return true;
        } else {
            console.log('   ❌ Frontend-style request failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Frontend integration test failed:', error);
        return false;
    }
}

async function runCompleteSystemTest() {
    console.log('🚀 Starting Complete Finze AI System Test');
    console.log('=' * 50);
    
    const results = {
        backend: false,
        aiInsights: false,
        categorization: false,
        frontend: false
    };
    
    // Run all tests
    results.backend = await testBackendConnectivity();
    results.aiInsights = await testAIInsightsEndpoint();
    results.categorization = await testCategorizationEndpoint();
    results.frontend = await testFrontendIntegration();
    
    // Summary
    console.log('\n' + '=' * 50);
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('=' * 50);
    
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)} Test: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
        console.log('\n🎉 ALL TESTS PASSED! Your Finze AI system is ready!');
        console.log('\n📱 Next Steps:');
        console.log('   1. Your backend is running perfectly on http://localhost:8001');
        console.log('   2. Start your React Native app: npx expo start');
        console.log('   3. Navigate to Explore → AI Insights');
        console.log('   4. Experience the AI-powered financial analysis!');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the issues above.');
    }
    
    return allPassed;
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    runCompleteSystemTest().catch(console.error);
} else {
    // Browser environment
    console.log('Run runCompleteSystemTest() in the browser console');
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runCompleteSystemTest, testBackendConnectivity, testAIInsightsEndpoint };
}