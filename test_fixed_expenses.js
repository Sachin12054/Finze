const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
const serviceAccount = require('./Finze Backend/Finze_Backend/finze-d5d1c-firebase-adminsdk-fbsvc-5400815126.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://finze-d5d1c-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

async function testFixedExpenseCalculation() {
  console.log('🔧 Testing Fixed Expense Calculation...\n');
  
  const userId = 'h30MlWtPyaT35EcKKpbGTtLrmg03'; // Correct user ID
  
  try {
    // Simulate the FIXED getAllExpenses function behavior
    console.log(`📊 Starting getAllExpenses simulation for user: ${userId}`);
    const allExpenses = [];

    // Fetch from users/{userId}/expenses (manual expenses)
    const manualExpensesRef = db.collection(`users/${userId}/expenses`);
    const manualSnapshot = await manualExpensesRef.get();
    console.log(`📁 Found ${manualSnapshot.docs.length} manual transactions from users/${userId}/expenses\n`);
    
    manualSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`📝 Processing manual transaction: ${data.title}, amount: ${data.amount}, type: ${data.type}`);
      
      // ONLY include actual expenses, exclude income transactions (FIXED BEHAVIOR)
      if (data.type === 'expense' || !data.type) { // Default to expense if type is missing
        const expense = {
          expenseId: doc.id,
          amount: Math.abs(data.amount || 0),
          date: data.date || new Date().toISOString(),
          category: data.category || 'Other',
          type: 'manual',
          title: data.title || 'Manual Transaction',
          transactionType: data.type || 'expense'
        };
        allExpenses.push(expense);
        console.log(`✅ Added expense: ${expense.title} - ₹${expense.amount} (${data.type})`);
      } else {
        console.log(`⏭️ Skipping income transaction: ${data.title} - ₹${data.amount} (${data.type})`);
      }
    });

    // Fetch from users/{userId}/scanner_expenses (scanner expenses)
    const scannerExpensesRef = db.collection(`users/${userId}/scanner_expenses`);
    const scannerSnapshot = await scannerExpensesRef.get();
    console.log(`\n📷 Found ${scannerSnapshot.docs.length} scanner expenses from users/${userId}/scanner_expenses\n`);
    
    scannerSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`📷 Processing scanner expense: ${data.title || data.extractedText}, amount: ${data.totalAmount}`);
      
      // Clean up merchant name
      let cleanTitle = data.merchantName || data.title || 'Receipt Transaction';
      if (cleanTitle.toLowerCase().startsWith('receipt from ')) {
        cleanTitle = cleanTitle.substring('receipt from '.length);
      }
      cleanTitle = cleanTitle.replace(/extracted text\s*/gi, '').trim();
      if (!cleanTitle || cleanTitle === 'Receipt Transaction') {
        cleanTitle = data.extractedText?.split('\n')[0] || 'Scanner Expense';
      }
      
      const expense = {
        expenseId: doc.id,
        amount: Math.abs(data.amount || data.totalAmount || 0),
        date: data.date || data.createdAt || new Date().toISOString(),
        category: data.category || 'Other',
        type: 'scanner',
        title: cleanTitle,
        transactionType: 'expense' // Scanner transactions are always expenses
      };
      allExpenses.push(expense);
      console.log(`✅ Added scanner expense: ${expense.title} - ₹${expense.amount}`);
    });

    console.log(`\n📊 Total expenses retrieved: ${allExpenses.length}`);
    
    if (allExpenses.length > 0) {
      const totalAmount = allExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      console.log(`💰 Total EXPENSE amount: ₹${totalAmount.toFixed(2)}`);
      
      // Category breakdown
      const categoryBreakdown = {};
      allExpenses.forEach(exp => {
        const category = exp.category || 'Other';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (exp.amount || 0);
      });
      
      console.log('\n📋 Category Breakdown (EXPENSES ONLY):');
      Object.entries(categoryBreakdown).forEach(([category, amount]) => {
        console.log(`   ${category}: ₹${amount.toFixed(2)}`);
      });
      
      // Log sample expenses
      console.log('\n📋 Sample expenses:');
      allExpenses.slice(0, 5).forEach((exp, index) => {
        console.log(`   ${index + 1}. ${exp.title} - ₹${exp.amount} (${exp.category}) [${exp.type}]`);
      });
    } else {
      console.log('⚠️ No expenses found in any collection');
    }
    
    console.log('\n🎯 FIXED CALCULATION RESULTS:');
    console.log('=====================================');
    const expenseTotal = allExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    console.log(`💸 Total Expenses (CORRECTED): ₹${expenseTotal.toFixed(2)}`);
    console.log(`📊 Total Transactions: ${allExpenses.length}`);
    console.log(`💳 Average per Transaction: ₹${allExpenses.length > 0 ? (expenseTotal / allExpenses.length).toFixed(2) : '0.00'}`);
    console.log('=====================================');
    
    console.log('\n🔍 COMPARISON:');
    console.log('=====================================');
    console.log(`❌ Previous (WRONG): ₹1,62,258.2 (included income)`);
    console.log(`✅ Fixed (CORRECT): ₹${expenseTotal.toFixed(2)} (expenses only)`);
    console.log(`🔢 Should match app Financial Overview: ₹52,258.20`);
    console.log(`✨ Match status: ${Math.abs(expenseTotal - 52258.20) < 1 ? '✅ PERFECT MATCH!' : '❌ Still mismatch'}`);
    
  } catch (error) {
    console.error('❌ Error in fixed calculation:', error);
  }
}

// Run the test
testFixedExpenseCalculation()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });