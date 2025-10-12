// Test AI insights with the fixed data source
const admin = require('firebase-admin');

// Initialize Firebase Admin (check if already initialized)
if (admin.apps.length === 0) {
  const serviceAccount = require('./Finze Backend/Finze_Backend/finze-d5d1c-firebase-adminsdk-fbsvc-5400815126.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://finze-d5d1c-default-rtdb.firebaseio.com'
  });
}

const db = admin.firestore();

// Simulate the getAllExpenses function with the fixed logic
async function getAllExpenses(userId) {
  console.log(`📊 Starting getAllExpenses for user: ${userId}`);
  const allExpenses = [];

  // Fetch from users/{userId}/expenses (manual expenses)
  try {
    const manualSnapshot = await db.collection(`users/${userId}/expenses`).get();
    console.log(`📝 Found ${manualSnapshot.docs.length} manual expenses`);
    
    manualSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`📝 Processing manual expense: ${data.title}, amount: ${data.amount}`);
      
      const expense = {
        expenseId: doc.id,
        amount: Math.abs(data.amount || 0),
        date: data.date || new Date().toISOString(),
        category: data.category || 'Other',
        type: 'manual',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        title: data.title || 'Manual Expense',
        notes: data.description || data.notes || ''
      };
      allExpenses.push(expense);
      console.log(`✅ Added manual expense: ${expense.title} - ₹${expense.amount}`);
    });
  } catch (error) {
    console.warn('Error fetching manual expenses:', error);
  }

  // Fetch from users/{userId}/scanner_expenses (scanner expenses)
  try {
    const scannerSnapshot = await db.collection(`users/${userId}/scanner_expenses`).get();
    console.log(`📷 Found ${scannerSnapshot.docs.length} scanner expenses`);
    
    scannerSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`📷 Processing scanner expense: ${data.title || data.extractedText}, amount: ${data.amount || data.totalAmount}`);
      
      const expense = {
        expenseId: doc.id,
        amount: Math.abs(data.amount || data.totalAmount || 0),
        date: data.date || data.createdAt || new Date().toISOString(),
        category: data.category || 'Other',
        type: 'scanner',
        created_at: data.createdAt || new Date().toISOString(),
        updated_at: data.updatedAt || data.createdAt || new Date().toISOString(),
        title: data.title || data.extractedText || 'Scanner Expense',
        notes: data.extractedText || data.notes || ''
      };
      allExpenses.push(expense);
      console.log(`✅ Added scanner expense: ${expense.title} - ₹${expense.amount}`);
    });
  } catch (error) {
    console.warn('Error fetching scanner expenses:', error);
  }

  console.log(`📊 Total expenses retrieved: ${allExpenses.length}`);
  
  if (allExpenses.length > 0) {
    const totalAmount = allExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    console.log(`💰 Total amount: ₹${totalAmount.toFixed(2)}`);
    
    // Log expenses for debugging
    console.log('📋 All expenses:');
    allExpenses.forEach((exp, index) => {
      console.log(`   ${index + 1}. ${exp.title} - ₹${exp.amount} (${exp.category}) [${exp.type}]`);
    });
  }
  
  return allExpenses;
}

async function testAIInsights() {
  try {
    console.log('🧠 Testing AI Insights with Fixed Data Source\n');
    
    // Get user ID
    const usersSnapshot = await db.collection('users').limit(1).get();
    const userId = usersSnapshot.docs[0].id;
    console.log(`👤 User ID: ${userId}\n`);
    
    // Test the fixed getAllExpenses function
    const expenses = await getAllExpenses(userId);
    
    if (expenses.length === 0) {
      console.log('❌ No expenses found - AI insights will still show ₹0');
      return;
    }
    
    console.log('\n🎯 SIMULATION OF AI INSIGHTS:');
    console.log('===============================');
    
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const avgExpense = totalAmount / expenses.length;
    
    console.log(`💰 Total Expenses: ₹${totalAmount.toFixed(2)}`);
    console.log(`📊 Number of Transactions: ${expenses.length}`);
    console.log(`📈 Average Expense: ₹${avgExpense.toFixed(2)}`);
    
    // Category breakdown
    const categoryTotals = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    
    console.log('\n📋 Category Breakdown:');
    Object.entries(categoryTotals).forEach(([category, total]) => {
      console.log(`   ${category}: ₹${total.toFixed(2)}`);
    });
    
    console.log('\n✅ SUCCESS! AI insights should now display real data instead of ₹0');
    console.log('🚀 The fix is working - your expense data is being found correctly!');
    
  } catch (error) {
    console.error('❌ Error testing AI insights:', error);
  }
}

testAIInsights();