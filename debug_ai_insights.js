/**
 * Debug AI Insights - Real User Data Checker
 * This script helps diagnose why AI insights might show ₹0
 */

const BACKEND_URL = 'http://localhost:8001';

async function debugAIInsights() {
    console.log('🔍 AI INSIGHTS DEBUGGING TOOL');
    console.log('=====================================\n');
    
    try {
        // Step 1: Check Backend Health
        console.log('1️⃣ CHECKING BACKEND STATUS...');
        try {
            const healthResponse = await fetch(`${BACKEND_URL}/health`);
            const healthData = await healthResponse.json();
            console.log('✅ Backend is healthy!');
            console.log('📊 Services Status:');
            Object.entries(healthData.services || {}).forEach(([service, status]) => {
                console.log(`   ${status ? '✅' : '❌'} ${service}`);
            });
            console.log();
        } catch (error) {
            console.log('❌ Backend is NOT running!');
            console.log('💡 Solution: Start the backend server first');
            console.log('   Command: cd "Finze Backend/Finze_Backend" && python finze_backend_single.py');
            return;
        }

        // Step 2: Test AI Insights with Common User Patterns
        console.log('2️⃣ SEARCHING FOR REAL USER DATA...');
        
        const userPatterns = [
            // Common Firebase Auth UID patterns
            'test_user_123',
            'user_123',
            'demo_user',
            'sample_user',
            'admin',
            // Try some realistic UID patterns
            'KjHgFdSa123',
            'AbC123dEf456',
            'user_finze_123',
            'finze_user_1',
            'testuser123'
        ];

        let foundUsers = [];

        for (const userId of userPatterns) {
            try {
                console.log(`🔍 Testing user: ${userId}`);
                
                const response = await fetch(`${BACKEND_URL}/api/ai-insights/${userId}?period=month&limit=200`);
                const data = await response.json();
                
                if (data.status === 'success') {
                    const transactionCount = data.data?.financial_health?.transaction_count || 0;
                    const totalSpending = data.data?.financial_health?.total_spending || 0;
                    
                    if (transactionCount > 0 || totalSpending > 0) {
                        console.log(`✅ FOUND USER WITH DATA: ${userId}`);
                        console.log(`   💰 Total Spending: ₹${totalSpending}`);
                        console.log(`   📊 Transactions: ${transactionCount}`);
                        
                        foundUsers.push({
                            userId,
                            totalSpending,
                            transactionCount,
                            data: data.data
                        });
                    } else {
                        console.log(`   ⚪ No data for ${userId}`);
                    }
                } else {
                    console.log(`   ❌ Error: ${data.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.log(`   ❌ Network error: ${error.message}`);
            }
        }

        console.log('\n3️⃣ ANALYSIS RESULTS:');
        console.log('============================');
        
        if (foundUsers.length > 0) {
            console.log(`🎉 Found ${foundUsers.length} user(s) with expense data!`);
            
            foundUsers.forEach((user, index) => {
                console.log(`\n👤 User ${index + 1}: ${user.userId}`);
                console.log(`   💰 Total Spending: ₹${user.totalSpending}`);
                console.log(`   📊 Transaction Count: ${user.transactionCount}`);
                
                // Show category breakdown if available
                const categories = user.data.category_analysis || {};
                if (Object.keys(categories).length > 0) {
                    console.log('   📋 Categories:');
                    Object.entries(categories).forEach(([category, analysis]) => {
                        console.log(`      ${category}: ₹${analysis.total} (${analysis.count} transactions)`);
                    });
                }
                
                // Show insights if available
                const insights = user.data.spending_insights || [];
                if (insights.length > 0) {
                    console.log('   💡 Insights:');
                    insights.forEach(insight => {
                        console.log(`      - ${insight.title}: ${insight.description}`);
                    });
                }
            });
            
            console.log('\n✅ YOUR AI INSIGHTS SYSTEM IS WORKING!');
            console.log('💡 To fix the ₹0 issue:');
            console.log('   1. Make sure you\'re signed in with the correct user account');
            console.log('   2. Check that your user ID matches one of the working IDs above');
            console.log('   3. Add some expense data if your account is new');
            
        } else {
            console.log('⚠️ No users found with expense data in common patterns.');
            console.log('\n🔧 TROUBLESHOOTING STEPS:');
            console.log('1. Check if you\'re signed in to the app');
            console.log('2. Add some expense data to your account');
            console.log('3. Verify your user ID by checking browser console');
            console.log('4. Make sure Firestore has your expense data');
            
            console.log('\n🧪 TESTING WITH YOUR ACTUAL USER ID:');
            console.log('1. Open the web app and sign in');
            console.log('2. Open browser dev tools (F12)');
            console.log('3. Look for console logs showing your user ID');
            console.log('4. Run this test: curl "http://localhost:8001/api/ai-insights/YOUR_USER_ID?period=month"');
        }

        // Step 4: Test Direct Expense Data Access
        console.log('\n4️⃣ TESTING DIRECT EXPENSE ACCESS...');
        
        // Try to get expenses directly for found users
        for (const user of foundUsers.slice(0, 2)) { // Test only first 2 users
            try {
                console.log(`\n📊 Getting expenses for ${user.userId}:`);
                const expensesResponse = await fetch(`${BACKEND_URL}/api/expenses/${user.userId}`);
                
                if (expensesResponse.ok) {
                    const expensesData = await expensesResponse.json();
                    console.log(`   Found ${expensesData.length || 0} expenses`);
                    
                    if (expensesData.length > 0) {
                        expensesData.slice(0, 3).forEach((expense, i) => {
                            console.log(`   ${i+1}. ₹${expense.amount} - ${expense.description || 'No description'} (${expense.category || 'No category'})`);
                        });
                    }
                } else {
                    console.log(`   ❌ Could not fetch expenses: ${expensesResponse.status}`);
                }
            } catch (error) {
                console.log(`   ❌ Error fetching expenses: ${error.message}`);
            }
        }

        console.log('\n🎯 FINAL RECOMMENDATIONS:');
        console.log('=========================');
        
        if (foundUsers.length > 0) {
            console.log('✅ Your backend and AI system are working correctly!');
            console.log('💡 The ₹0 issue is likely because:');
            console.log('   - You\'re not signed in with the right account');
            console.log('   - Your user ID doesn\'t match the test data');
            console.log('   - You need to add expense data to your account');
        } else {
            console.log('⚠️ No expense data found in the system.');
            console.log('💡 Next steps:');
            console.log('   1. Sign in to the web app');
            console.log('   2. Add some expenses (KFC ₹280, Coffee ₹180, etc.)');
            console.log('   3. Wait a moment for data to sync');
            console.log('   4. Refresh the AI Insights page');
        }

    } catch (error) {
        console.error('❌ Debug test failed:', error);
    }
}

// Run the debug test
debugAIInsights();