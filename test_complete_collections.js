/**
 * Test script to check all user collections and their data
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFBwFqVrPfi1o0Po4WRCfyEtlp67HmnEc",
  authDomain: "finze-fa9c8.firebaseapp.com",
  projectId: "finze-fa9c8",
  storageBucket: "finze-fa9c8.firebasestorage.app",
  messagingSenderId: "464972373145",
  appId: "1:464972373145:web:99c4b6c6b6b7e5e4e7f8d9",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testUserCollections() {
  console.log('🔍 Testing all user collections...\n');
  
  // Test user ID (you may need to update this with actual user ID)
  const testUserId = "WYnIWDsQEKhZKHtPBNJGnKjE6I53"; // Update with actual user ID
  
  const collections = [
    { name: 'expenses', orderField: 'created_at', desc: 'Manual expenses' },
    { name: 'scanner_expenses', orderField: 'createdAt', desc: 'Scanner expenses' },
    { name: 'TransactionHistory', orderField: 'created_at', desc: 'Transaction history' },
    { name: 'budgets', orderField: 'created_at', desc: 'Budgets' },
    { name: 'goals', orderField: 'created_at', desc: 'Goals' }
  ];
  
  for (const col of collections) {
    try {
      console.log(`📁 ${col.desc} (${col.name}):`);
      const colRef = collection(db, `users/${testUserId}/${col.name}`);
      
      // Try different ordering approaches
      let snapshot;
      try {
        const q = query(colRef, orderBy(col.orderField, 'desc'));
        snapshot = await getDocs(q);
      } catch (orderError) {
        console.log(`   ⚠️ Ordering by ${col.orderField} failed, trying without order...`);
        snapshot = await getDocs(colRef);
      }
      
      console.log(`   📊 Found ${snapshot.docs.length} documents`);
      
      if (snapshot.docs.length > 0) {
        console.log(`   💰 Sample data:`);
        snapshot.docs.slice(0, 3).forEach((doc, index) => {
          const data = doc.data();
          console.log(`   ${index + 1}. ID: ${doc.id}`);
          console.log(`      Amount: ₹${data.amount || data.totalAmount || data.target_amount || 'N/A'}`);
          console.log(`      Date: ${data.date || data.createdAt || data.created_at || 'N/A'}`);
          console.log(`      Type: ${data.type || data.category || 'N/A'}`);
          if (data.description || data.title || data.merchantName) {
            console.log(`      Description: ${data.description || data.title || data.merchantName}`);
          }
          console.log('');
        });
      }
    } catch (error) {
      console.log(`   ❌ Error accessing ${col.name}:`, error.message);
    }
    console.log('');
  }
  
  // Test global collections
  console.log('🌍 Testing global collections:');
  try {
    const globalRef = collection(db, 'expenses');
    const globalSnapshot = await getDocs(globalRef);
    console.log(`   📊 Global expenses: ${globalSnapshot.docs.length} documents`);
  } catch (error) {
    console.log(`   ❌ Error accessing global expenses:`, error.message);
  }
}

testUserCollections().catch(console.error);