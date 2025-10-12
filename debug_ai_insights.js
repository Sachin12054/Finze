/**
 * Quick Debug Script for AI Insights
 * Copy and paste this into React Native debugger console to test
 */

// Test function to check AI insights
window.testAIInsights = async () => {
  try {
    // Import required modules
    const { auth } = await import('./src/services/firebase/firebase');
    const { geminiAIInsightsService } = await import('./src/services/geminiAIInsightsService');
    
    console.log('🧪 Starting AI Insights Test...');
    
    // Check authentication
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ No user authenticated');
      return;
    }
    
    console.log(`👤 User ID: ${user.uid}`);
    
    // Test the service
    const insights = await geminiAIInsightsService.generateAIInsights(user.uid, 'month');
    
    console.log('✅ AI Insights Results:');
    console.log('💰 Total Spent:', insights.totalSpent);
    console.log('📊 Total Transactions:', insights.totalTransactions);
    console.log('📈 Average Transaction:', insights.avgTransactionAmount);
    console.log('📝 Summary:', insights.summary);
    console.log('💡 Recommendations:', insights.recommendations);
    
    return insights;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return null;
  }
};

// Test function to check raw expense data
window.testExpenseData = async () => {
  try {
    const { auth } = await import('./src/services/firebase/firebase');
    const { getAllExpenses } = await import('./src/services/databaseService');
    
    console.log('🧪 Starting Expense Data Test...');
    
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ No user authenticated');
      return;
    }
    
    console.log(`👤 User ID: ${user.uid}`);
    
    const expenses = await getAllExpenses(user.uid);
    
    console.log('✅ Expense Data Results:');
    console.log('📊 Total Expenses:', expenses.length);
    
    if (expenses.length > 0) {
      console.log('📄 Sample expenses:', expenses.slice(0, 3));
      
      const totalAmount = expenses.reduce((sum, exp) => sum + (parseFloat(String(exp.amount)) || 0), 0);
      console.log('💰 Total Amount:', totalAmount);
      
      // Group by type
      const byType = expenses.reduce((acc, exp) => {
        acc[exp.type] = (acc[exp.type] || 0) + 1;
        return acc;
      }, {});
      console.log('📈 By Type:', byType);
    } else {
      console.log('📭 No expenses found');
    }
    
    return expenses;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return null;
  }
};

console.log('🧪 Debug functions loaded! Use:');
console.log('- testExpenseData() to check raw expense data');
console.log('- testAIInsights() to test AI insights generation');