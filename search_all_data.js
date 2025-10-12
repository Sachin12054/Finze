// Search ALL users and collections for the missing data
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

async function searchAllData() {
  try {
    console.log('🔍 SEARCHING ALL USERS AND COLLECTIONS FOR YOUR DATA\n');
    
    // 1. List all users to see if data is under different user
    console.log('👥 1. CHECKING ALL USERS:');
    const usersSnapshot = await db.collection('users').get();
    console.log(`   Found ${usersSnapshot.docs.length} users total`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      console.log(`   👤 User: ${userDoc.id}`);
      console.log(`      - Name: ${userData.displayName || userData.email || 'No name'}`);
      console.log(`      - Email: ${userData.email || 'No email'}`);
      
      // Check expenses for each user
      try {
        const expensesSnapshot = await db.collection(`users/${userDoc.id}/expenses`).get();
        const scannerSnapshot = await db.collection(`users/${userDoc.id}/scanner_expenses`).get();
        
        if (expensesSnapshot.docs.length > 0 || scannerSnapshot.docs.length > 0) {
          console.log(`      - Manual Expenses: ${expensesSnapshot.docs.length}`);
          console.log(`      - Scanner Expenses: ${scannerSnapshot.docs.length}`);
          
          let userTotal = 0;
          expensesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.type === 'expense') {
              userTotal += Math.abs(data.amount || 0);
            }
          });
          scannerSnapshot.docs.forEach(doc => {
            const data = doc.data();
            userTotal += Math.abs(data.amount || data.totalAmount || 0);
          });
          
          console.log(`      - Total Expenses: ₹${userTotal.toFixed(2)}`);
          
          if (userTotal > 50000) {
            console.log(`      🎯 FOUND POTENTIAL MATCH! This user has high expenses!`);
          }
        }
      } catch (e) {
        console.log(`      - Error checking expenses: ${e.message}`);
      }
      console.log('');
    }
    
    // 2. Check for global expenses collection
    console.log('\n💰 2. CHECKING GLOBAL EXPENSES COLLECTION:');
    try {
      const globalExpensesSnapshot = await db.collection('expenses').get();
      console.log(`   Found ${globalExpensesSnapshot.docs.length} documents in global expenses`);
      
      let globalTotal = 0;
      let documentsWithAmount = 0;
      
      globalExpensesSnapshot.docs.slice(0, 10).forEach(doc => {
        const data = doc.data();
        if (data.amount) {
          documentsWithAmount++;
          globalTotal += Math.abs(data.amount || 0);
          console.log(`   - ${data.title || data.description || 'No title'}: ₹${data.amount} (${data.user_id || 'No user'})`);
        }
      });
      
      console.log(`   Total from first 10 docs: ₹${globalTotal.toFixed(2)}`);
      console.log(`   Documents with amounts: ${documentsWithAmount}/${Math.min(10, globalExpensesSnapshot.docs.length)}`);
      
      if (globalExpensesSnapshot.docs.length > 10) {
        console.log(`   ... ${globalExpensesSnapshot.docs.length - 10} more documents not shown`);
      }
      
    } catch (error) {
      console.log('   Error accessing global expenses:', error.message);
    }
    
    // 3. List all root collections
    console.log('\n📂 3. ALL ROOT COLLECTIONS:');
    try {
      const collections = await db.listCollections();
      console.log('   Available collections:');
      for (const collection of collections) {
        try {
          const snapshot = await collection.limit(1).get();
          console.log(`   - ${collection.id} (${snapshot.docs.length > 0 ? 'has data' : 'empty'})`);
        } catch (e) {
          console.log(`   - ${collection.id} (error reading)`);
        }
      }
    } catch (error) {
      console.log('   Error listing collections:', error.message);
    }
    
    // 4. Check your specific Firebase Console path from screenshot
    console.log('\n🔎 4. CHECKING SPECIFIC PATHS FROM YOUR SCREENSHOTS:');
    
    // From your screenshot: users > h30MIWtPyaT35EcKKpbGTtLrmg03 > expenses > H04ZtbQEGAakrGfJz4SP
    const specificUserId = 'h30MIWtPyaT35EcKKpbGTtLrmg03';
    console.log(`   Checking specific user: ${specificUserId}`);
    
    try {
      const specificUserDoc = await db.doc(`users/${specificUserId}`).get();
      if (specificUserDoc.exists) {
        console.log('   ✅ User exists!');
        
        // Check their expenses
        const specificExpensesSnapshot = await db.collection(`users/${specificUserId}/expenses`).get();
        const specificScannerSnapshot = await db.collection(`users/${specificUserId}/scanner_expenses`).get();
        
        console.log(`   📝 Manual expenses: ${specificExpensesSnapshot.docs.length}`);
        console.log(`   📷 Scanner expenses: ${specificScannerSnapshot.docs.length}`);
        
        let specificTotal = 0;
        specificExpensesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log(`      - ${data.title}: ₹${data.amount} (${data.type})`);
          if (data.type === 'expense') {
            specificTotal += Math.abs(data.amount || 0);
          }
        });
        
        specificScannerSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log(`      - ${data.title || data.extractedText}: ₹${data.amount || data.totalAmount}`);
          specificTotal += Math.abs(data.amount || data.totalAmount || 0);
        });
        
        console.log(`   💰 Total for this specific user: ₹${specificTotal.toFixed(2)}`);
        
        if (Math.abs(specificTotal - 52258.20) < 1000) {
          console.log('   🎯 BINGO! This might be your main account!');
        }
        
      } else {
        console.log('   ❌ Specific user not found');
      }
    } catch (error) {
      console.log(`   Error checking specific user: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error in comprehensive search:', error);
  }
}

searchAllData();