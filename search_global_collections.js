// Search for expenses in global collections
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

async function searchGlobalCollections() {
  try {
    console.log('🌍 SEARCHING GLOBAL COLLECTIONS FOR MISSING DATA\n');
    
    // Get user ID
    const usersSnapshot = await db.collection('users').limit(1).get();
    const userId = usersSnapshot.docs[0].id;
    console.log(`👤 User ID: ${userId}\n`);
    
    // 1. Check global expenses collection
    console.log('💰 1. Checking global "expenses" collection:');
    try {
      const expensesSnapshot = await db.collection('expenses').where('user_id', '==', userId).get();
      console.log(`   Found ${expensesSnapshot.docs.length} expenses for this user`);
      
      let globalTotal = 0;
      expensesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const amount = Math.abs(data.amount || 0);
        globalTotal += amount;
        console.log(`   - ${data.title || data.description}: ₹${amount} (${data.category || 'No category'}) [${data.date || data.created_at}]`);
      });
      console.log(`   Global expenses total: ₹${globalTotal.toFixed(2)}\n`);
    } catch (e) {
      console.log('   Error or collection does not exist:', e.message);
    }
    
    // 2. Check transactions collection
    console.log('💳 2. Checking global "transactions" collection:');
    try {
      const transactionsSnapshot = await db.collection('transactions').where('userId', '==', userId).get();
      console.log(`   Found ${transactionsSnapshot.docs.length} transactions for this user`);
      
      let transactionsTotal = 0;
      transactionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const amount = Math.abs(data.amount || 0);
        transactionsTotal += amount;
        console.log(`   - ${data.title}: ₹${amount} (${data.category || 'No category'}) [${data.type}]`);
      });
      console.log(`   Transactions total: ₹${transactionsTotal.toFixed(2)}\n`);
    } catch (e) {
      console.log('   Error or collection does not exist:', e.message);
    }
    
    // 3. Check if there's a user document with embedded data
    console.log('👤 3. Checking user document for embedded data:');
    try {
      const userDocSnapshot = await db.doc(`users/${userId}`).get();
      if (userDocSnapshot.exists) {
        const userData = userDocSnapshot.data();
        console.log('   User document fields:', Object.keys(userData));
        
        // Check for any arrays or objects that might contain transaction data
        Object.entries(userData).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            console.log(`   - ${key}: Array with ${value.length} items`);
            console.log(`     Sample: ${JSON.stringify(value[0]).substring(0, 100)}...`);
          } else if (typeof value === 'object' && value !== null) {
            console.log(`   - ${key}: Object with keys: ${Object.keys(value).join(', ')}`);
          }
        });
      }
    } catch (e) {
      console.log('   Error reading user document:', e.message);
    }
    
    // 4. List all root collections to see what exists
    console.log('\n📂 4. Listing all root collections:');
    try {
      const collections = await db.listCollections();
      console.log('   Available collections:');
      collections.forEach(collection => {
        console.log(`   - ${collection.id}`);
      });
    } catch (e) {
      console.log('   Error listing collections:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Error searching global collections:', error);
  }
}

searchGlobalCollections();