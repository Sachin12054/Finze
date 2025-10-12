const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
const serviceAccount = require('./Finze Backend/Finze_Backend/finze-d5d1c-firebase-adminsdk-fbsvc-5400815126.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://finze-d5d1c-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

async function debugAppCalculation() {
  console.log('🔍 Debugging App Calculation Logic...\n');
  
  // Using the exact same logic as getUserFinancialSummary from enhancedFirebaseService.ts
  const userId = 'h30MlWtPyaT35EcKKpbGTtLrmg03'; // Correct user ID
  
  try {
    // Get both manual expenses and scanner expenses (same as app)
    const [expensesSnapshot, scannerSnapshot] = await Promise.all([
      db.collection(`users/${userId}/expenses`).get(),
      db.collection(`users/${userId}/scanner_expenses`).get()
    ]);
    
    let totalIncome = 0;
    let totalExpenses = 0;
    let currentMonthIncome = 0;
    let currentMonthExpenses = 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    console.log(`📅 Current Month: ${currentMonth + 1}, Year: ${currentYear}\n`);
    
    console.log('📊 Processing Manual Expenses...');
    console.log(`Found ${expensesSnapshot.docs.length} manual transactions`);
    
    // Process manual expenses (exact same logic as app)
    expensesSnapshot.docs.forEach((doc, index) => {
      try {
        const transaction = doc.data();
        console.log(`\n--- Manual Transaction ${index + 1} ---`);
        console.log('Document ID:', doc.id);
        console.log('Raw data:', JSON.stringify(transaction, null, 2));
        
        const amount = Number(transaction.amount) || 0;
        console.log('Parsed amount:', amount);
        
        // Enhanced date handling with error protection (same as app)
        let transactionDate;
        
        try {
          if (transaction.date && transaction.date.toDate && typeof transaction.date.toDate === 'function') {
            // Firestore Timestamp
            transactionDate = transaction.date.toDate();
            console.log('Date type: Firestore Timestamp');
          } else if (typeof transaction.date === 'string') {
            // ISO string
            transactionDate = new Date(transaction.date);
            console.log('Date type: ISO String');
          } else if (transaction.date instanceof Date) {
            // Already a Date object
            transactionDate = transaction.date;
            console.log('Date type: Date Object');
          } else {
            // Fallback to current date
            transactionDate = new Date();
            console.log('Date type: Fallback to current');
          }
          
          console.log('Parsed date:', transactionDate.toISOString());
          console.log('Transaction month:', transactionDate.getMonth() + 1);
          console.log('Transaction year:', transactionDate.getFullYear());
          
        } catch (dateError) {
          transactionDate = new Date();
          console.log('Date parsing error, using current date');
        }
        
        const isCurrentMonth = transactionDate.getMonth() === currentMonth && 
                              transactionDate.getFullYear() === currentYear;
        console.log('Is current month?', isCurrentMonth);
        console.log('Transaction type:', transaction.type);
        
        if (transaction.type === 'income') {
          totalIncome += amount;
          if (isCurrentMonth) {
            currentMonthIncome += amount;
          }
          console.log(`✅ Added to income: ₹${amount}`);
        } else {
          totalExpenses += amount;
          if (isCurrentMonth) {
            currentMonthExpenses += amount;
          }
          console.log(`❌ Added to expenses: ₹${amount}`);
        }
        
      } catch (transactionError) {
        console.log('❌ Error processing transaction:', transactionError);
        // Skip transactions with errors
      }
    });
    
    console.log('\n🛍️ Processing Scanner Expenses...');
    console.log(`Found ${scannerSnapshot.docs.length} scanner transactions`);
    
    // Process scanner expenses (exact same logic as app)
    scannerSnapshot.docs.forEach((doc, index) => {
      try {
        const scannerData = doc.data();
        console.log(`\n--- Scanner Transaction ${index + 1} ---`);
        console.log('Document ID:', doc.id);
        console.log('Raw data:', JSON.stringify(scannerData, null, 2));
        
        const amount = Number(scannerData.totalAmount) || 0;
        console.log('Parsed amount:', amount);
        
        // Handle scanner date - use the same logic as in getTransactionsListener
        let transactionDate;
        
        try {
          // For scanner transactions, use createdAt (when scanned) instead of receipt date
          // This matches the logic in getTransactionsListener
          if (scannerData.createdAt) {
            if (typeof scannerData.createdAt === 'string') {
              transactionDate = new Date(scannerData.createdAt);
              console.log('Date type: createdAt string');
            } else if (scannerData.createdAt.toDate) {
              // Firestore timestamp
              transactionDate = scannerData.createdAt.toDate();
              console.log('Date type: createdAt Firestore Timestamp');
            } else {
              transactionDate = new Date(scannerData.createdAt);
              console.log('Date type: createdAt other');
            }
          } else if (typeof scannerData.date === 'string') {
            transactionDate = new Date(scannerData.date);
            console.log('Date type: date string');
          } else if (scannerData.date && typeof scannerData.date.toDate === 'function') {
            // Firestore Timestamp
            transactionDate = scannerData.date.toDate();
            console.log('Date type: date Firestore Timestamp');
          } else {
            transactionDate = new Date();
            console.log('Date type: fallback to current');
          }
          
          console.log('Parsed date:', transactionDate.toISOString());
          console.log('Transaction month:', transactionDate.getMonth() + 1);
          console.log('Transaction year:', transactionDate.getFullYear());
          
        } catch (dateError) {
          transactionDate = new Date();
          console.log('Date parsing error, using current date');
        }
        
        const isCurrentMonth = transactionDate.getMonth() === currentMonth && 
                              transactionDate.getFullYear() === currentYear;
        console.log('Is current month?', isCurrentMonth);
        
        // Scanner expenses are always expenses
        totalExpenses += amount;
        if (isCurrentMonth) {
          currentMonthExpenses += amount;
        }
        console.log(`❌ Added to expenses: ₹${amount}`);
        
      } catch (scannerError) {
        console.log('❌ Error processing scanner transaction:', scannerError);
        // Skip scanner transactions with errors
      }
    });
    
    const summary = {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      currentMonthIncome,
      currentMonthExpenses
    };
    
    console.log('\n🎯 FINAL CALCULATION RESULTS:');
    console.log('=====================================');
    console.log(`💰 Total Income: ₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`💸 Total Expenses: ₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`🏦 Balance: ₹${summary.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`📊 Current Month Income: ₹${currentMonthIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`📊 Current Month Expenses: ₹${currentMonthExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log('=====================================');
    
    // Compare with your screenshot values
    console.log('\n🔍 COMPARISON WITH APP SCREENSHOT:');
    console.log('=====================================');
    console.log(`App shows Total Spent: ₹1,62,258.2`);
    console.log(`Our calculation: ₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`Difference: ₹${(162258.2 - totalExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    
    // Get transaction count
    const totalTransactions = expensesSnapshot.docs.length + scannerSnapshot.docs.length;
    console.log(`\n📊 Transaction count: ${totalTransactions} (App shows: 13)`);
    
    return summary;
    
  } catch (error) {
    console.error('❌ Error in app calculation debug:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      currentMonthIncome: 0,
      currentMonthExpenses: 0
    };
  }
}

// Run the debug
debugAppCalculation()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });