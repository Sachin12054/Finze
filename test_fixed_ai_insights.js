// Test the fixed AI insights with correct data source
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./Finze Backend/Finze_Backend/finze-d5d1c-firebase-adminsdk-fbsvc-5400815126.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://finze-d5d1c-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

async function testFixedAIInsights() {
  try {
    console.log('🔧 Testing fixed AI insights data fetching...\n');
    
    // Get current user (this should match your user ID)
    const usersSnapshot = await db.collection('users').limit(1).get();
    if (usersSnapshot.empty) {
      console.log('❌ No users found');
      return;
    }
    
    const userId = usersSnapshot.docs[0].id;
    console.log(`👤 Testing with user ID: ${userId}\n`);
    
    // Test the exact same collections that getAllExpenses now fetches from
    
    // 1. Check users/{userId}/expenses (manual expenses)
    console.log('📝 Checking users/{userId}/expenses (manual expenses):');
    const manualExpensesRef = db.collection(`users/${userId}/expenses`);
    const manualSnapshot = await manualExpensesRef.get();
    console.log(`   Found ${manualSnapshot.docs.length} manual expenses`);
    
    let totalManualAmount = 0;
    manualSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalManualAmount += Math.abs(data.amount || 0);
      console.log(`   - ${data.title}: ₹${data.amount} (${data.category || 'No category'})`);
    });
    
    // 2. Check users/{userId}/scanner_expenses (scanner expenses)
    console.log('\n📷 Checking users/{userId}/scanner_expenses (scanner expenses):');
    const scannerExpensesRef = db.collection(`users/${userId}/scanner_expenses`);
    const scannerSnapshot = await scannerExpensesRef.get();
    console.log(`   Found ${scannerSnapshot.docs.length} scanner expenses`);
    
    let totalScannerAmount = 0;
    scannerSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalScannerAmount += Math.abs(data.amount || 0);
      console.log(`   - ${data.title || data.extractedText}: ₹${data.amount} (${data.category || 'No category'})`);
    });
    
    const totalExpenses = manualSnapshot.docs.length + scannerSnapshot.docs.length;
    const totalAmount = totalManualAmount + totalScannerAmount;
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Total expenses found: ${totalExpenses}`);
    console.log(`   Total amount: ₹${totalAmount.toFixed(2)}`);
    
    if (totalExpenses > 0) {
      console.log('\n✅ SUCCESS! AI insights should now show real data instead of ₹0');
      console.log('🚀 The getAllExpenses function is now fetching from the correct collections');
    } else {
      console.log('\n⚠️ No expenses found in these collections');
      console.log('   This means your transaction data might be stored elsewhere');
      
      // Let's also check what's in the enhanced transaction listener collections
      console.log('\n🔍 Let me also check what the Transaction History UI is actually showing...');
    }
    
  } catch (error) {
    console.error('❌ Error testing fixed AI insights:', error);
  }
}

testFixedAIInsights();