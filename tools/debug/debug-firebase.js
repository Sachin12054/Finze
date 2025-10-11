// Firebase connection test
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

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
const db = getFirestore(app);

async function testFirestore() {
  try {
    console.log('Testing Firestore connection...');
    
    // Test write
    const testData = {
      test: 'connection test',
      timestamp: new Date().toISOString(),
      amount: 100
    };
    
    const docRef = await addDoc(collection(db, 'debug_test'), testData);
    console.log('✅ Test document written with ID:', docRef.id);
    
    // Test read
    const querySnapshot = await getDocs(collection(db, 'debug_test'));
    console.log('✅ Documents found:', querySnapshot.size);
    
    querySnapshot.forEach((doc) => {
      console.log('Document data:', doc.id, '=>', doc.data());
    });
    
    console.log('✅ Firestore connection test successful!');
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
  }
}

testFirestore();
