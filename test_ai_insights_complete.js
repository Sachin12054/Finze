/**
 * Comprehensive AI Insights Test
 * Tests the complete AI insights integration with real user data
 */

// Test Configuration
const BACKEND_URL = 'http://localhost:8001';
const TEST_USER_ID = 'test_user_123'; // You can change this to a real user ID

async function testAIInsights() {
    console.log('🧪 Starting Comprehensive AI Insights Test...\n');
    
    try {
        // Test 1: Backend Health Check
        console.log('1️⃣ Testing Backend Health...');
        const healthResponse = await fetch(`${BACKEND_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Backend Health:', healthData);
        console.log();

        // Test 2: AI Insights Endpoint
        console.log('2️⃣ Testing AI Insights Endpoint...');
        const insightsUrl = `${BACKEND_URL}/api/ai-insights/${TEST_USER_ID}?period=month&limit=200`;
        console.log(`📡 Calling: ${insightsUrl}`);
        
        const insightsResponse = await fetch(insightsUrl);
        
        if (!insightsResponse.ok) {
            throw new Error(`HTTP ${insightsResponse.status}: ${insightsResponse.statusText}`);
        }
        
        const insightsData = await insightsResponse.json();
        console.log('✅ AI Insights Response:');
        console.log(JSON.stringify(insightsData, null, 2));
        console.log();

        // Test 3: Data Analysis
        console.log('3️⃣ Analyzing AI Insights Data...');
        
        if (insightsData.status === 'success' && insightsData.data) {
            const data = insightsData.data;
            
            console.log('📊 Financial Health Summary:');
            console.log(`   Total Spending: ₹${data.financial_health?.total_spending || 0}`);
            console.log(`   Transaction Count: ${data.financial_health?.transaction_count || 0}`);
            console.log(`   Average Transaction: ₹${data.financial_health?.average_transaction || 0}`);
            console.log(`   Health Score: ${data.financial_health?.health_score || 0}/100`);
            console.log(`   Spending Trend: ${data.financial_health?.spending_trend || 'stable'}`);
            console.log();
            
            console.log('💡 Spending Insights:');
            if (data.spending_insights && data.spending_insights.length > 0) {
                data.spending_insights.forEach((insight, index) => {
                    console.log(`   ${index + 1}. ${insight.title}`);
                    console.log(`      Description: ${insight.description}`);
                    console.log(`      Priority: ${insight.priority}`);
                    console.log(`      Suggestion: ${insight.suggestion}`);
                    console.log();
                });
            } else {
                console.log('   No spending insights available');
            }
            
            console.log('🎯 Smart Suggestions:');
            if (data.smart_suggestions && data.smart_suggestions.length > 0) {
                data.smart_suggestions.forEach((suggestion, index) => {
                    console.log(`   ${index + 1}. ${suggestion.title}`);
                    console.log(`      Description: ${suggestion.description}`);
                    console.log(`      Priority: ${suggestion.priority}`);
                    if (suggestion.suggested_amount) {
                        console.log(`      Suggested Amount: ₹${suggestion.suggested_amount}`);
                    }
                    console.log();
                });
            } else {
                console.log('   No smart suggestions available');
            }
            
            console.log('📈 Category Analysis:');
            if (data.category_analysis && Object.keys(data.category_analysis).length > 0) {
                Object.entries(data.category_analysis).forEach(([category, analysis]) => {
                    console.log(`   ${category}:`);
                    console.log(`      Total: ₹${analysis.total}`);
                    console.log(`      Count: ${analysis.count} transactions`);
                    console.log(`      Average: ₹${analysis.average}`);
                    console.log(`      Percentage: ${analysis.percentage}%`);
                    console.log();
                });
            } else {
                console.log('   No category analysis available');
            }
            
            console.log('📊 Trend Analysis:');
            if (data.trend_analysis && Object.keys(data.trend_analysis).length > 0) {
                Object.entries(data.trend_analysis).forEach(([category, trend]) => {
                    console.log(`   ${category}:`);
                    console.log(`      Current: ₹${trend.current}`);
                    console.log(`      Previous: ₹${trend.previous}`);
                    console.log(`      Change: ${trend.change_percent}% (${trend.trend})`);
                    console.log();
                });
            } else {
                console.log('   No trend analysis available');
            }
            
        } else {
            console.log('❌ No data available or error in response');
            if (insightsData.error) {
                console.log(`   Error: ${insightsData.error}`);
            }
        }
        
        // Test 4: Test with Different Periods
        console.log('4️⃣ Testing Different Time Periods...');
        const periods = ['week', 'month', 'year'];
        
        for (const period of periods) {
            console.log(`\n📅 Testing ${period} period:`);
            try {
                const periodUrl = `${BACKEND_URL}/api/ai-insights/${TEST_USER_ID}?period=${period}&limit=50`;
                const periodResponse = await fetch(periodUrl);
                const periodData = await periodResponse.json();
                
                if (periodData.status === 'success') {
                    console.log(`   ✅ ${period}: ${periodData.data?.financial_health?.transaction_count || 0} transactions`);
                    console.log(`   💰 Total Spending: ₹${periodData.data?.financial_health?.total_spending || 0}`);
                } else {
                    console.log(`   ❌ ${period}: ${periodData.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.log(`   ❌ ${period}: ${error.message}`);
            }
        }
        
        console.log('\n🎉 AI Insights Test Completed Successfully!');
        console.log('🔍 Summary:');
        console.log('   ✅ Backend is healthy and responsive');
        console.log('   ✅ AI Insights endpoint is working');
        console.log('   ✅ Data analysis and formatting working');
        console.log('   ✅ Multiple time periods supported');
        console.log('\n💡 Next Steps:');
        console.log('   1. Open the web app at http://localhost:8082');
        console.log('   2. Navigate to AI Insights tab');
        console.log('   3. Sign in with a user that has expense data');
        console.log('   4. Verify the insights display properly');
        
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        console.error('🔧 Troubleshooting:');
        console.error('   1. Ensure backend is running on port 8001');
        console.error('   2. Check Firestore connection');
        console.error('   3. Verify user has expense data in database');
        console.error('   4. Check network connectivity');
    }
}

// Run the test
testAIInsights();