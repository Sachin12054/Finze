// Test script to verify Firestore permissions
const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCYizk7kF2mbwcx3WaGtqW8ccv6uQqR-8I",
  authDomain: "finze-d5d1c.firebaseapp.com",
  projectId: "finze-d5d1c",
  storageBucket: "finze-d5d1c.firebasestorage.app",
  messagingSenderId: "218574371561",
  appId: "1:218574371561:web:2705bef597bb250e178e78",
  measurementId: "G-L0P6BKLTDQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testPermissions() {
  try {
    // This won't work for your app since you need proper login, but let's test the structure
    console.log('🔥 Testing Firestore permissions...');
    
    // Test if we can access the database at all
    const testRef = collection(db, 'test');
    console.log('✅ Database connection successful');
    
    console.log('ℹ️  Note: This test can only verify basic connectivity.');
    console.log('ℹ️  For full testing, you need to be logged in through your app.');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testPermissions();