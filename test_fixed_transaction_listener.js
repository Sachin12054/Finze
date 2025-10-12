const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
const serviceAccount = require('./Finze Backend/Finze_Backend/finze-d5d1c-firebase-adminsdk-fbsvc-5400815126.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://finze-d5d1c-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

async function simulateFixedTransactionListener() {
  console.log('🔧 Testing Fixed Transaction Listener Logic...\n');
  
  const userId = 'h30MlWtPyaT35EcKKpbGTtLrmg03';
  
  try {
    // Simulate the FIXED getTransactionsListener behavior
    console.log('📊 Simulating getTransactionsListener with EXPENSE-ONLY filter...\n');
    
    let manualTransactions = [];
    let scannerTransactions = [];
    
    // Get manual transactions (with income filtering)
    const manualSnapshot = await db.collection(`users/${userId}/expenses`).get();
    console.log('Manual expenses snapshot received:', manualSnapshot.docs.length, 'documents');
    
    manualTransactions = manualSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        // ONLY include expenses, exclude income transactions
        const isExpense = data.type === 'expense' || !data.type;
        if (!isExpense) {
          console.log('Filtering out income transaction:', data.title, data.amount, data.type);
        }
        return isExpense;
      })
      .map(doc => {
        const data = doc.data();
        console.log('Processing manual expense:', doc.id, data.title, data.amount);
        return {
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
      });
    
    console.log('Total manual transactions (expenses only):', manualTransactions.length);
    
    // Get scanner transactions (always expenses)
    const scannerSnapshot = await db.collection(`users/${userId}/scanner_expenses`).get();
    console.log('\nScanner expenses snapshot received:', scannerSnapshot.docs.length, 'documents');
    
    scannerTransactions = scannerSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Processing scanner expense:', doc.id, data.merchantName, data.totalAmount);
      
      // Clean up merchant name
      let cleanTitle = data.merchantName || 'Receipt Transaction';
      if (cleanTitle.toLowerCase().startsWith('receipt from ')) {
        cleanTitle = cleanTitle.substring('receipt from '.length);
      }
      cleanTitle = cleanTitle.replace(/extracted text\s*/gi, '').trim();
      if (!cleanTitle || cleanTitle === 'Receipt Transaction') {
        cleanTitle = data.extractedText?.split('\n')[0] || 'Scanner Expense';
      }
      
      return {
        id: doc.id,
        userId: data.userId,
        title: cleanTitle,
        amount: data.totalAmount || data.amount,
        category: data.category || 'Other',
        type: 'expense', // Scanner transactions are always expenses
        source: 'Scanner',
        description: data.extractedText || '',
        date: data.date || data.createdAt,
        paymentMethod: 'Unknown',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });
    
    console.log('Total scanner transactions:', scannerTransactions.length);
    
    // Combine transactions (same logic as getTransactionsListener)
    let allTransactions = [...manualTransactions, ...scannerTransactions];
    console.log('\nTotal combined transactions before dedup:', allTransactions.length);
    
    // Remove duplicates (simplified logic)
    const uniqueTransactions = [];
    for (const transaction of allTransactions) {
      const isDuplicate = uniqueTransactions.some(existing => {
        const isSameAmount = Math.abs(existing.amount - transaction.amount) < 0.01;
        const isSameDate = new Date(existing.date).toDateString() === new Date(transaction.date).toDateString();
        if (!isSameAmount || !isSameDate) return false;
        
        const cleanTitle1 = transaction.title.toLowerCase().replace(/\s+/g, ' ').trim();
        const cleanTitle2 = existing.title.toLowerCase().replace(/\s+/g, ' ').trim();
        return cleanTitle1 === cleanTitle2 || cleanTitle1.includes(cleanTitle2) || cleanTitle2.includes(cleanTitle1);
      });
      
      if (!isDuplicate) {
        uniqueTransactions.push(transaction);
      } else {
        console.log('Filtered out duplicate transaction:', transaction.title, transaction.amount);
      }
    }
    
    // Sort by date (newest first)
    uniqueTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log('\n🎯 FIXED TRANSACTION LISTENER RESULTS:');
    console.log('=====================================');
    const totalAmount = uniqueTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgAmount = uniqueTransactions.length > 0 ? totalAmount / uniqueTransactions.length : 0;
    
    console.log(`💸 Total Spent: ₹${totalAmount.toFixed(2)}`);
    console.log(`📊 Total Transactions: ${uniqueTransactions.length}`);
    console.log(`💳 Avg Transaction: ₹${avgAmount.toFixed(2)}`);
    console.log('=====================================');
    
    console.log('\n📋 Transaction List:');
    uniqueTransactions.forEach((t, index) => {
      console.log(`   ${index + 1}. ${t.title} - ₹${t.amount} (${t.category}) [${t.source}]`);
    });
    
    console.log('\n🔍 COMPARISON WITH APP:');
    console.log('=====================================');
    console.log(`❌ App currently shows: ₹1,62,258.2 (13 transactions)`);
    console.log(`✅ Fixed calculation: ₹${totalAmount.toFixed(2)} (${uniqueTransactions.length} transactions)`);
    console.log(`🎯 Should match your expected: ₹52,258.20 (11 transactions)`);
    
    const isCorrect = Math.abs(totalAmount - 52258.20) < 1 && uniqueTransactions.length === 11;
    console.log(`✨ Fix Status: ${isCorrect ? '✅ PERFECT MATCH!' : '❌ Still needs adjustment'}`);
    
  } catch (error) {
    console.error('❌ Error in simulation:', error);
  }
}

// Run the simulation
simulateFixedTransactionListener()
  .then(() => {
    console.log('\n✅ Simulation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  });