/**
 * Direct Database Test - Run this in browser console to debug
 * This will directly test Firebase queries to see what's in your TransactionHistory
 */

// Test function to directly query Firebase TransactionHistory
window.testFirebaseDirectly = async () => {
  try {
    console.log('🔍 Testing Firebase TransactionHistory directly...');
    
    // Import Firebase modules
    const { auth, db } = await import('./src/services/firebase/firebase');
    const { collection, getDocs } = await import('firebase/firestore');
    const { getCollectionPath, COLLECTIONS } = await import('./src/types/database');
    
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ No user authenticated - please log in first');
      return;
    }
    
    console.log(`👤 Testing for user: ${user.uid}`);
    
    // Test the exact same path used by getAllExpenses
    const transactionPath = getCollectionPath(user.uid, COLLECTIONS.TRANSACTION_HISTORY);
    console.log(`📍 Collection path: ${transactionPath}`);
    
    // Try to fetch from transaction history
    const transactionSnapshot = await getDocs(collection(db, transactionPath));
    console.log(`📊 Raw Firebase result: ${transactionSnapshot.docs.length} documents found`);
    
    if (transactionSnapshot.docs.length === 0) {
      console.log('❌ No documents found in TransactionHistory collection');
      console.log('🔍 Possible issues:');
      console.log('  1. Collection path is wrong');
      console.log('  2. User ID mismatch');
      console.log('  3. Data is in a different collection');
      
      // Let's try to check what collections exist for this user
      console.log('🔍 Checking user collections...');
      const userDocPath = `users/${user.uid}`;
      console.log(`📍 User doc path: ${userDocPath}`);
      
      return null;
    }
    
    // Process the documents
    let totalAmount = 0;
    const transactions = [];
    
    transactionSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📄 Transaction ${index + 1}:`, data);
      
      // Check if it matches the format we expect
      if (data.amount !== undefined) {
        const amount = Math.abs(data.amount);
        totalAmount += amount;
        transactions.push({
          id: doc.id,
          description: data.description,
          amount: amount,
          originalAmount: data.amount,
          type: data.type,
          category: data.category,
          date: data.date
        });
      }
    });
    
    console.log('✅ Summary:');
    console.log(`📊 Total transactions: ${transactions.length}`);
    console.log(`💰 Total amount: ₹${totalAmount}`);
    console.log('📋 Sample transactions:', transactions.slice(0, 3));
    
    return {
      count: transactions.length,
      total: totalAmount,
      transactions: transactions
    };
    
  } catch (error) {
    console.error('❌ Direct Firebase test failed:', error);
    return null;
  }
};

// Test function to check getAllExpenses step by step
window.testGetAllExpensesDebug = async () => {
  try {
    console.log('🔍 Testing getAllExpenses with debug...');
    
    const { auth } = await import('./src/services/firebase/firebase');
    const { getAllExpenses } = await import('./src/services/databaseService');
    
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ No user authenticated');
      return;
    }
    
    console.log(`👤 Testing getAllExpenses for user: ${user.uid}`);
    
    // Call the function and see what happens
    const expenses = await getAllExpenses(user.uid);
    
    console.log('📊 getAllExpenses result:');
    console.log(`  Total expenses: ${expenses.length}`);
    
    if (expenses.length > 0) {
      // Group by type
      const byType = expenses.reduce((acc, exp) => {
        acc[exp.type] = (acc[exp.type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 By type:', byType);
      
      // Show transaction history ones specifically
      const transactionHistoryExpenses = expenses.filter(exp => exp.type === 'transaction_history');
      console.log(`💰 TransactionHistory expenses: ${transactionHistoryExpenses.length}`);
      
      if (transactionHistoryExpenses.length > 0) {
        console.log('📄 Sample TransactionHistory expenses:', transactionHistoryExpenses.slice(0, 3));
      }
    }
    
    return expenses;
    
  } catch (error) {
    console.error('❌ getAllExpenses debug failed:', error);
    return null;
  }
};

console.log('🧪 Enhanced debug functions loaded!');
console.log('');
console.log('🔍 Run these in order:');
console.log('1. testFirebaseDirectly() - Test direct Firebase query');
console.log('2. testGetAllExpensesDebug() - Test getAllExpenses function');
console.log('');
console.log('📝 Make sure you are logged in before running these tests');