// Test with the CORRECT user account that has your real data
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

async function testCorrectUserData() {
  try {
    console.log('🎯 TESTING WITH CORRECT USER ACCOUNT\n');
    
    // Use the CORRECT user ID that has your real data
    const CORRECT_USER_ID = 'h30MlWtPyaT35EcKKpbGTtLrmg03'; // sachin11jg@gmail.com
    console.log(`👤 Using CORRECT User ID: ${CORRECT_USER_ID}\n`);
    
    let allExpenses = [];
    let totalExpenseAmount = 0;
    let totalIncomeAmount = 0;
    
    // 1. Get manual expenses from correct user
    console.log('📝 1. Manual Expenses from CORRECT user:');
    const manualSnapshot = await db.collection(`users/${CORRECT_USER_ID}/expenses`).get();
    console.log(`   Found ${manualSnapshot.docs.length} manual expenses`);
    
    manualSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = Math.abs(data.amount || 0);
      
      console.log(`   - ${data.title}: ₹${amount} (${data.type}) [${data.category}]`);
      
      if (data.type === 'expense') {
        allExpenses.push({
          expenseId: doc.id,
          amount: amount,
          date: data.date,
          category: data.category || 'Other',
          type: 'manual',
          title: data.title,
          notes: data.description || '',
          transactionType: 'expense'
        });
        totalExpenseAmount += amount;
      } else if (data.type === 'income') {
        totalIncomeAmount += amount;
      }
    });
    
    // 2. Get scanner expenses from correct user
    console.log(`\n📷 2. Scanner Expenses from CORRECT user:`);
    const scannerSnapshot = await db.collection(`users/${CORRECT_USER_ID}/scanner_expenses`).get();
    console.log(`   Found ${scannerSnapshot.docs.length} scanner expenses`);
    
    scannerSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = Math.abs(data.amount || data.totalAmount || 0);
      
      let cleanTitle = data.merchantName || data.title || 'Receipt Transaction';
      if (cleanTitle.toLowerCase().startsWith('receipt from ')) {
        cleanTitle = cleanTitle.substring('receipt from '.length);
      }
      cleanTitle = cleanTitle.replace(/extracted text\s*/gi, '').trim();
      if (!cleanTitle || cleanTitle === 'Receipt Transaction') {
        cleanTitle = data.extractedText?.split('\n')[0] || 'Scanner Expense';
      }
      
      console.log(`   - ${cleanTitle}: ₹${amount} [${data.category}]`);
      
      allExpenses.push({
        expenseId: doc.id,
        amount: amount,
        date: data.date || data.createdAt,
        category: data.category || 'Other',
        type: 'scanner',
        title: cleanTitle,
        notes: data.extractedText || '',
        transactionType: 'expense'
      });
      totalExpenseAmount += amount;
    });
    
    // Calculate totals
    console.log('\n📊 FINAL RESULTS WITH CORRECT USER:');
    console.log('=====================================');
    console.log(`💰 Total Expenses: ₹${totalExpenseAmount.toFixed(2)}`);
    console.log(`💚 Total Income: ₹${totalIncomeAmount.toFixed(2)}`);
    console.log(`📊 Total Transactions: ${allExpenses.length}`);
    console.log(`📈 Average per Transaction: ₹${(totalExpenseAmount / allExpenses.length).toFixed(2)}`);
    
    // Category breakdown
    const categoryBreakdown = {};
    allExpenses.forEach(exp => {
      const category = exp.category || 'Other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + exp.amount;
    });
    
    console.log('\n📋 Category Breakdown:');
    Object.entries(categoryBreakdown).forEach(([category, total]) => {
      const percentage = ((total / totalExpenseAmount) * 100).toFixed(1);
      console.log(`   ${category}: ₹${total.toFixed(2)} (${percentage}%)`);
    });
    
    console.log('\n📱 COMPARISON WITH YOUR APP:');
    console.log(`   App Shows: ₹52,258.20 expenses`);
    console.log(`   We Found: ₹${totalExpenseAmount.toFixed(2)} expenses`);
    console.log(`   Difference: ₹${Math.abs(52258.20 - totalExpenseAmount).toFixed(2)}`);
    
    if (Math.abs(totalExpenseAmount - 52258.20) < 100) {
      console.log('\n✅ PERFECT MATCH! We found your correct data!');
      console.log('🔧 Now we need to update the AI insights to use the correct user ID');
    } else {
      console.log(`\n⚠️ Still ${Math.abs(52258.20 - totalExpenseAmount).toFixed(2)} difference`);
    }
    
    return {
      userId: CORRECT_USER_ID,
      expenses: allExpenses,
      totalExpenses: totalExpenseAmount,
      totalIncome: totalIncomeAmount
    };
    
  } catch (error) {
    console.error('❌ Error testing correct user data:', error);
  }
}

testCorrectUserData();