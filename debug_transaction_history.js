/**
 * Debug Script for Transaction History Data
 * Copy and paste this into your browser's developer console to test the updated function
 */

// Test function to check if getAllExpenses now finds TransactionHistory data
window.testTransactionHistory = async () => {
  try {
    console.log('🧪 Testing updated getAllExpenses with TransactionHistory...');
    
    // Import required modules
    const { auth } = await import('./src/services/firebase/firebase');
    const { getAllExpenses } = await import('./src/services/databaseService');
    
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ No user authenticated - please log in first');
      return;
    }
    
    console.log(`👤 Testing for user: ${user.uid}`);
    
    // Test the updated getAllExpenses function
    const expenses = await getAllExpenses(user.uid);
    
    console.log('✅ Updated getAllExpenses Results:');
    console.log(`📊 Total expenses found: ${expenses.length}`);
    
    if (expenses.length > 0) {
      // Group by source type
      const byType = expenses.reduce((acc, exp) => {
        acc[exp.type] = (acc[exp.type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Expenses by source type:', byType);
      
      // Show transaction_history expenses specifically
      const transactionHistoryExpenses = expenses.filter(exp => exp.type === 'transaction_history');
      console.log(`💰 TransactionHistory expenses: ${transactionHistoryExpenses.length}`);
      
      if (transactionHistoryExpenses.length > 0) {
        console.log('📄 Sample TransactionHistory expenses:', transactionHistoryExpenses.slice(0, 3));
        
        const totalFromTransactions = transactionHistoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        console.log(`💵 Total from TransactionHistory: ₹${totalFromTransactions}`);
      }
      
      // Show all types
      console.log('📋 Sample expenses by type:');
      Object.keys(byType).forEach(type => {
        const typeExpenses = expenses.filter(exp => exp.type === type);
        console.log(`  ${type}: ${typeExpenses.length} expenses`);
        if (typeExpenses.length > 0) {
          console.log(`    Sample: ${typeExpenses[0].title || typeExpenses[0].description} - ₹${typeExpenses[0].amount}`);
        }
      });
      
    } else {
      console.log('📭 No expenses found in any collection');
      console.log('💡 Make sure you have added some expenses and they are in the TransactionHistory collection');
    }
    
    return expenses;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return null;
  }
};

// Test function to specifically check AI insights
window.testUpdatedAIInsights = async () => {
  try {
    console.log('🤖 Testing AI Insights with updated data fetching...');
    
    const { auth } = await import('./src/services/firebase/firebase');
    const { geminiAIInsightsService } = await import('./src/services/geminiAIInsightsService');
    
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ No user authenticated');
      return;
    }
    
    const insights = await geminiAIInsightsService.generateAIInsights(user.uid, 'month');
    
    console.log('🎯 AI Insights Results:');
    console.log(`💰 Total Spent: ₹${insights.totalSpent}`);
    console.log(`📊 Total Transactions: ${insights.totalTransactions}`);
    console.log(`📈 Average Transaction: ₹${insights.avgTransactionAmount.toFixed(2)}`);
    console.log(`📝 Summary: ${insights.summary}`);
    console.log(`💡 Recommendations:`, insights.recommendations);
    
    return insights;
    
  } catch (error) {
    console.error('❌ AI Insights test failed:', error);
    return null;
  }
};

console.log('🧪 Debug functions loaded! Use:');
console.log('- testTransactionHistory() to check if TransactionHistory data is being fetched');
console.log('- testUpdatedAIInsights() to test AI insights with the updated data');
console.log('');
console.log('📝 Steps to test:');
console.log('1. Make sure you are logged in');
console.log('2. Run testTransactionHistory() to verify data fetching');
console.log('3. Run testUpdatedAIInsights() to test AI insights');
console.log('4. Click the AI Insights button in the app to see the UI');