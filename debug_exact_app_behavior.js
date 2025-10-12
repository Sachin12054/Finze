// Debug the exact data the app is showing you
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

async function simulateEnhancedFirebaseService() {
  try {
    console.log('🔍 SIMULATING ENHANCED FIREBASE SERVICE EXACTLY AS YOUR APP DOES\n');
    
    // Get user ID
    const usersSnapshot = await db.collection('users').limit(1).get();
    const userId = usersSnapshot.docs[0].id;
    console.log(`👤 User ID: ${userId}\n`);
    
    // Simulate exactly what getTransactionsListener does
    console.log('📊 Simulating getTransactionsListener...\n');
    
    // 1. Get manual transactions (same as in enhancedFirebaseService)
    const manualExpensesRef = db.collection(`users/${userId}/expenses`);
    const manualSnapshot = await manualExpensesRef.orderBy('created_at', 'desc').get();
    
    const manualTransactions = [];
    console.log(`📝 Manual Transactions (${manualSnapshot.docs.length} found):`);
    manualSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const transaction = {
        id: doc.id,
        userId: data.user_id,
        title: data.title,
        amount: data.amount,
        category: data.category,
        type: data.type,
        source: data.source || 'Manual',
        description: data.description,
        date: data.date,
        paymentMethod: data.payment_method,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      manualTransactions.push(transaction);
      console.log(`   - ${transaction.title}: ₹${transaction.amount} (${transaction.category}) [${transaction.type}]`);
    });
    
    // 2. Get scanner transactions (same as in enhancedFirebaseService)  
    const scannerExpensesRef = db.collection(`users/${userId}/scanner_expenses`);
    const scannerSnapshot = await scannerExpensesRef.orderBy('createdAt', 'desc').get();
    
    const scannerTransactions = [];
    console.log(`\n📷 Scanner Transactions (${scannerSnapshot.docs.length} found):`);
    scannerSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Clean up the merchant name (same logic as enhancedFirebaseService)
      let cleanTitle = data.merchantName || 'Receipt Transaction';
      if (cleanTitle.toLowerCase().startsWith('receipt from ')) {
        cleanTitle = cleanTitle.substring('receipt from '.length);
      }
      cleanTitle = cleanTitle.replace(/extracted text\s*/gi, '').trim();
      if (!cleanTitle || cleanTitle === 'Receipt Transaction') {
        cleanTitle = data.extractedText?.split('\n')[0] || 'Scanner Expense';
      }
      
      const transaction = {
        id: doc.id,
        userId: data.userId || userId,
        title: cleanTitle,
        amount: data.totalAmount || data.amount || 0,
        category: data.category || 'Other',
        type: 'expense',
        source: 'OCR',
        description: data.extractedText || '',
        date: data.date || data.createdAt,
        paymentMethod: 'Card',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt || data.createdAt,
      };
      scannerTransactions.push(transaction);
      console.log(`   - ${transaction.title}: ₹${transaction.amount} (${transaction.category}) [${transaction.type}]`);
    });
    
    // 3. Combine transactions (same logic as enhancedFirebaseService)
    let allTransactions = [...manualTransactions, ...scannerTransactions];
    console.log(`\n🔄 Combined transactions before dedup: ${allTransactions.length}`);
    
    // 4. Remove duplicates (same logic as enhancedFirebaseService)
    const uniqueTransactions = [];
    for (const transaction of allTransactions) {
      const isDuplicate = uniqueTransactions.some(existing => {
        const isSameAmount = Math.abs(existing.amount - transaction.amount) < 0.01;
        const isSameDate = new Date(existing.date).toDateString() === new Date(transaction.date).toDateString();
        
        if (!isSameAmount || !isSameDate) return false;
        
        const cleanTitle1 = transaction.title.toLowerCase().replace(/receipt\s+from\s+/g, '').replace(/extracted\s+text\s*/g, '').replace(/\s+/g, ' ').trim();
        const cleanTitle2 = existing.title.toLowerCase().replace(/receipt\s+from\s+/g, '').replace(/extracted\s+text\s*/g, '').replace(/\s+/g, ' ').trim();
        
        return cleanTitle1 === cleanTitle2 || cleanTitle1.includes(cleanTitle2) || cleanTitle2.includes(cleanTitle1);
      });
      
      if (!isDuplicate) {
        uniqueTransactions.push(transaction);
      } else {
        console.log(`   🗑️ Filtered duplicate: ${transaction.title}`);
      }
    }
    
    // 5. Sort by date (same as enhancedFirebaseService)
    uniqueTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`\n✅ FINAL RESULT (what your app sees):`);
    console.log(`   Total Transactions: ${uniqueTransactions.length}`);
    
    const totalAmount = uniqueTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    console.log(`   Total Amount: ₹${totalAmount.toFixed(2)}`);
    
    console.log(`\n📱 YOUR APP SHOWS:`);
    console.log(`   Transactions: 13`);
    console.log(`   Total Spent: ₹1,62,258.2`);
    console.log(`   Monthly Expenses: ₹52,258.20`);
    
    console.log(`\n❗ DISCREPANCY:`);
    console.log(`   Missing Transactions: ${13 - uniqueTransactions.length}`);
    console.log(`   Missing Amount: ₹${(162258.2 - totalAmount).toFixed(2)}`);
    
    if (uniqueTransactions.length !== 13 || Math.abs(totalAmount - 162258.2) > 1) {
      console.log(`\n💡 POSSIBLE REASONS FOR DISCREPANCY:`);
      console.log(`   1. Your app might be using cached/old data`);
      console.log(`   2. There might be demo/sample data being shown`);
      console.log(`   3. The data might be in a different user account`);
      console.log(`   4. There might be additional data sources we haven't found`);
      console.log(`   5. The app might be using mock data for demonstration`);
    }
    
  } catch (error) {
    console.error('❌ Error simulating enhanced firebase service:', error);
  }
}

simulateEnhancedFirebaseService();