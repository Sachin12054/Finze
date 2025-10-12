const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
const serviceAccount = require('./Finze Backend/Finze_Backend/finze-d5d1c-firebase-adminsdk-fbsvc-5400815126.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://finze-d5d1c-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

async function findAllUserExpenseData() {
  console.log('🔍 Searching for all expense data that might total ₹1,62,258.2...\n');
  
  try {
    // Check if there are multiple users or collections that might sum to ₹1,62,258.2
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`Found ${usersSnapshot.docs.length} users in the database`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\n--- Checking User: ${userId} ---`);
      
      // Get expenses and scanner_expenses for this user
      const [expensesSnapshot, scannerSnapshot] = await Promise.all([
        db.collection(`users/${userId}/expenses`).get(),
        db.collection(`users/${userId}/scanner_expenses`).get()
      ]);
      
      let totalExpenses = 0;
      let totalIncome = 0;
      
      // Process manual expenses
      expensesSnapshot.docs.forEach(doc => {
        const transaction = doc.data();
        const amount = Number(transaction.amount) || 0;
        
        if (transaction.type === 'income') {
          totalIncome += amount;
        } else {
          totalExpenses += amount;
        }
      });
      
      // Process scanner expenses
      scannerSnapshot.docs.forEach(doc => {
        const scannerData = doc.data();
        const amount = Number(scannerData.totalAmount) || 0;
        totalExpenses += amount;
      });
      
      console.log(`💸 Total Expenses: ₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      console.log(`💰 Total Income: ₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      console.log(`🧮 Income + Expenses: ₹${(totalIncome + totalExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      console.log(`📊 Manual transactions: ${expensesSnapshot.docs.length}, Scanner: ${scannerSnapshot.docs.length}`);
      
      // Check if this matches the app display
      if (Math.abs((totalIncome + totalExpenses) - 162258.2) < 1) {
        console.log('🎯 MATCH FOUND! This user\'s income + expenses = app display');
      }
      
      if (Math.abs(totalExpenses - 162258.2) < 1) {
        console.log('🎯 EXPENSE MATCH! This user\'s expenses = app display');
      }
    }
    
    // Also check if there are any global collections
    console.log('\n--- Checking for global collections ---');
    const collections = await db.listCollections();
    
    for (const collection of collections) {
      if (collection.id !== 'users') {
        console.log(`Found global collection: ${collection.id}`);
        const snapshot = await collection.get();
        console.log(`  Documents: ${snapshot.docs.length}`);
        
        // Quick check if it contains expense-like data
        if (snapshot.docs.length > 0) {
          const sampleDoc = snapshot.docs[0].data();
          if (sampleDoc.amount || sampleDoc.totalAmount) {
            console.log(`  Sample data:`, JSON.stringify(sampleDoc, null, 2));
          }
        }
      }
    }
    
    console.log('\n🔍 Mathematical Analysis:');
    console.log('=====================================');
    console.log(`App Display: ₹1,62,258.2`);
    console.log(`Correct Expenses: ₹52,258.20`);
    console.log(`Total Income: ₹1,10,000.00`);
    console.log(`Income + Expenses: ₹${(110000 + 52258.20).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log('');
    console.log('🔍 Possible causes:');
    console.log('1. App is adding income to expenses instead of calculating balance');
    console.log('2. App is using wrong calculation logic');
    console.log('3. App is reading from wrong data source');
    console.log('4. Display bug in the Financial Overview component');
    
  } catch (error) {
    console.error('❌ Error in analysis:', error);
  }
}

// Run the analysis
findAllUserExpenseData()
  .then(() => {
    console.log('\n✅ Analysis completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });