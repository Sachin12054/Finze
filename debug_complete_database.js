// Comprehensive database analysis to find ALL expense data
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

async function findAllExpenseData() {
  try {
    console.log('🔍 COMPREHENSIVE DATABASE ANALYSIS TO MATCH YOUR APP DATA\n');
    
    let totalFoundExpenses = 0;
    let totalFoundAmount = 0;
    let totalFoundIncome = 0;
    
    // Get user ID
    const usersSnapshot = await db.collection('users').limit(1).get();
    const userId = usersSnapshot.docs[0].id;
    console.log(`👤 User ID: ${userId}\n`);
    
    // 1. Check ALL documents in users/{userId}/expenses
    console.log('📝 1. DETAILED ANALYSIS - users/{userId}/expenses:');
    try {
      const manualExpensesRef = db.collection(`users/${userId}/expenses`);
      const manualSnapshot = await manualExpensesRef.get();
      console.log(`   Found ${manualSnapshot.docs.length} documents`);
      
      manualSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const amount = Math.abs(data.amount || 0);
        
        console.log(`   📄 Document ID: ${doc.id}`);
        console.log(`      - Title: ${data.title}`);
        console.log(`      - Amount: ₹${amount}`);
        console.log(`      - Type: ${data.type}`);
        console.log(`      - Category: ${data.category}`);
        console.log(`      - Date: ${data.date}`);
        console.log(`      - Payment Method: ${data.payment_method}`);
        console.log('');
        
        if (data.type === 'expense') {
          totalFoundExpenses++;
          totalFoundAmount += amount;
        } else if (data.type === 'income') {
          totalFoundIncome += amount;
        }
      });
    } catch (error) {
      console.log('   ❌ Error accessing manual expenses:', error.message);
    }
    
    // 2. Check ALL documents in users/{userId}/scanner_expenses  
    console.log('\n📷 2. DETAILED ANALYSIS - users/{userId}/scanner_expenses:');
    try {
      const scannerExpensesRef = db.collection(`users/${userId}/scanner_expenses`);
      const scannerSnapshot = await scannerExpensesRef.get();
      console.log(`   Found ${scannerSnapshot.docs.length} documents`);
      
      scannerSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const amount = Math.abs(data.amount || data.totalAmount || data.gstAmount || 0);
        
        console.log(`   📄 Document ID: ${doc.id}`);
        console.log(`      - Title: ${data.title || data.merchantName || 'Scanner Expense'}`);
        console.log(`      - Amount: ₹${amount}`);
        console.log(`      - Total Amount: ₹${data.totalAmount || 0}`);
        console.log(`      - GST Amount: ₹${data.gstAmount || 0}`);
        console.log(`      - Category: ${data.category}`);
        console.log(`      - Extracted Text: ${data.extractedText}`);
        console.log(`      - Date: ${data.date || data.createdAt}`);
        console.log('');
        
        totalFoundExpenses++;
        totalFoundAmount += amount;
      });
    } catch (error) {
      console.log('   ❌ Error accessing scanner expenses:', error.message);
    }
    
    // 3. Check for additional collections under the user
    console.log('\n🔍 3. CHECKING FOR OTHER COLLECTIONS:');
    try {
      const userDocRef = db.doc(`users/${userId}`);
      const collections = await userDocRef.listCollections();
      console.log(`   Found ${collections.length} subcollections under user:`);
      
      for (const collection of collections) {
        console.log(`   📁 Collection: ${collection.id}`);
        
        try {
          const snapshot = await collection.get();
          console.log(`      - Documents: ${snapshot.docs.length}`);
          
          if (snapshot.docs.length > 0) {
            snapshot.docs.slice(0, 2).forEach(doc => {
              const data = doc.data();
              if (data.amount) {
                console.log(`      - Sample: ${data.title || 'No title'} - ₹${data.amount}`);
              }
            });
          }
        } catch (e) {
          console.log(`      - Error reading: ${e.message}`);
        }
      }
    } catch (error) {
      console.log('   ❌ Error listing collections:', error.message);
    }
    
    console.log('\n📊 CURRENT FINDINGS VS YOUR APP:');
    console.log('===============================');
    console.log(`Found Expenses: ${totalFoundExpenses} transactions`);
    console.log(`Found Amount: ₹${totalFoundAmount.toFixed(2)}`);
    console.log(`Found Income: ₹${totalFoundIncome.toFixed(2)}`);
    console.log('');
    console.log('YOUR APP SHOWS:');
    console.log(`Monthly Expenses: ₹52,258.20`);
    console.log(`Monthly Income: ₹1,10,000.00`);
    console.log(`Total Balance: ₹57,741.80`);
    console.log('');
    console.log('DISCREPANCY:');
    console.log(`Missing Expenses: ₹${(52258.20 - totalFoundAmount).toFixed(2)}`);
    console.log(`Missing Income: ₹${(110000 - totalFoundIncome).toFixed(2)}`);
    
    if (Math.abs(52258.20 - totalFoundAmount) > 100) {
      console.log('\n💡 LIKELY ISSUES:');
      console.log('   1. Data might be in different user account');
      console.log('   2. Additional expense collections exist');
      console.log('   3. Data might be aggregated differently');
      console.log('   4. Date filtering might affect results');
      console.log('   5. Currency conversion issues');
    }
    
  } catch (error) {
    console.error('❌ Error in database analysis:', error);
  }
}

findAllExpenseData();