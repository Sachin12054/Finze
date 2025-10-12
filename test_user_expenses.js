// Simple test to check if user has expense data
// Run this in React Native debugger console

import { getAllExpenses } from './src/services/databaseService';
import { auth } from './src/services/firebase/firebase';

const testUserExpenses = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.log('❌ No authenticated user');
      return;
    }

    console.log(`🔍 Testing getAllExpenses for user: ${userId}`);
    
    const expenses = await getAllExpenses(userId);
    console.log(`📊 Found ${expenses.length} total expenses`);
    
    if (expenses.length > 0) {
      console.log('📄 Sample expenses:', expenses.slice(0, 3));
      
      // Analyze the data
      const byType = expenses.reduce((acc, exp) => {
        acc[exp.type] = (acc[exp.type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Expenses by type:', byType);
      
      const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      console.log(`💰 Total spending: ₹${totalAmount}`);
    } else {
      console.log('📭 No expenses found for this user');
      console.log('💡 You need to add some expenses first!');
    }
    
  } catch (error) {
    console.error('❌ Error testing expenses:', error);
  }
};

// Run the test
testUserExpenses();

console.log('🧪 Expense data test started - check results above');