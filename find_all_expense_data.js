// Comprehensive search for all expense data sources
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
    console.log('🔍 COMPREHENSIVE SEARCH FOR ALL EXPENSE DATA\n');
    
    // Get user ID
    const usersSnapshot = await db.collection('users').limit(1).get();
    const userId = usersSnapshot.docs[0].id;
    console.log(`👤 User ID: ${userId}\n`);
    
    let totalTransactions = 0;
    let totalAmount = 0;
    
    // 1. Check users/{userId}/expenses
    console.log('📝 1. Checking users/{userId}/expenses:');
    const manualSnapshot = await db.collection(`users/${userId}/expenses`).get();
    console.log(`   Found ${manualSnapshot.docs.length} documents`);
    manualSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = Math.abs(data.amount || 0);
      totalAmount += amount;
      totalTransactions++;
      console.log(`   - ${data.title}: ₹${amount} (${data.category || 'No category'}) [${data.date || 'No date'}]`);
    });
    
    // 2. Check users/{userId}/scanner_expenses
    console.log('\n📷 2. Checking users/{userId}/scanner_expenses:');
    const scannerSnapshot = await db.collection(`users/${userId}/scanner_expenses`).get();
    console.log(`   Found ${scannerSnapshot.docs.length} documents`);
    scannerSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = Math.abs(data.amount || data.totalAmount || 0);
      totalAmount += amount;
      totalTransactions++;
      console.log(`   - ${data.title || data.extractedText}: ₹${amount} (${data.category || 'No category'})`);
    });
    
    // 3. Check users/{userId}/manual (legacy path)
    console.log('\n📝 3. Checking users/{userId}/manual:');
    try {
      const manualLegacySnapshot = await db.collection(`users/${userId}/manual`).get();
      console.log(`   Found ${manualLegacySnapshot.docs.length} documents`);
      manualLegacySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const amount = Math.abs(data.amount || 0);
        totalAmount += amount;
        totalTransactions++;
        console.log(`   - ${data.title}: ₹${amount} (${data.category || 'No category'})`);
      });
    } catch (e) {
      console.log('   Collection does not exist');
    }
    
    // 4. Check users/{userId}/scanner (legacy path)
    console.log('\n📷 4. Checking users/{userId}/scanner:');
    try {
      const scannerLegacySnapshot = await db.collection(`users/${userId}/scanner`).get();
      console.log(`   Found ${scannerLegacySnapshot.docs.length} documents`);
      scannerLegacySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const amount = Math.abs(data.amount || 0);
        totalAmount += amount;
        totalTransactions++;
        console.log(`   - ${data.title}: ₹${amount} (${data.category || 'No category'})`);
      });
    } catch (e) {
      console.log('   Collection does not exist');
    }
    
    // 5. Check users/{userId}/ai_categorise
    console.log('\n🤖 5. Checking users/{userId}/ai_categorise:');
    try {
      const aiSnapshot = await db.collection(`users/${userId}/ai_categorise`).get();
      console.log(`   Found ${aiSnapshot.docs.length} documents`);
      aiSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const amount = Math.abs(data.amount || 0);
        totalAmount += amount;
        totalTransactions++;
        console.log(`   - ${data.title}: ₹${amount} (${data.category || 'No category'})`);
      });
    } catch (e) {
      console.log('   Collection does not exist');
    }
    
    // 6. Check for any other collections under users/{userId}/
    console.log('\n🔍 6. Checking all subcollections under users/{userId}/:');
    const userDocRef = db.doc(`users/${userId}`);
    const collections = await userDocRef.listCollections();
    console.log(`   Found ${collections.length} subcollections:`);
    for (const collection of collections) {
      console.log(`   - ${collection.id}`);
      
      // Check if we haven't already checked this collection
      if (!['expenses', 'scanner_expenses', 'manual', 'scanner', 'ai_categorise'].includes(collection.id)) {
        try {
          const snapshot = await collection.get();
          console.log(`     └─ ${snapshot.docs.length} documents`);
          if (snapshot.docs.length > 0) {
            snapshot.docs.slice(0, 3).forEach(doc => {
              const data = doc.data();
              console.log(`        - ${JSON.stringify(data).substring(0, 100)}...`);
            });
          }
        } catch (e) {
          console.log(`     └─ Error reading: ${e.message}`);
        }
      }
    }
    
    console.log('\n📊 CURRENT TOTALS:');
    console.log(`   Transactions found: ${totalTransactions}`);
    console.log(`   Total amount: ₹${totalAmount.toFixed(2)}`);
    console.log('\n📱 YOUR APP SHOWS:');
    console.log(`   Transactions: 13`);
    console.log(`   Total amount: ₹1,62,258.2`);
    console.log('\n❓ DISCREPANCY ANALYSIS:');
    console.log(`   Missing transactions: ${13 - totalTransactions}`);
    console.log(`   Missing amount: ₹${(162258.2 - totalAmount).toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error searching for expense data:', error);
  }
}

findAllExpenseData();