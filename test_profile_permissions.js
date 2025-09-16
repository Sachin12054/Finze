// Test profile permissions and Firebase setup
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

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

async function testProfilePermissions() {
  try {
    console.log('🔥 Testing Firebase Profile Permissions...');
    
    // Test 1: Check if we can access Firestore at all
    console.log('✅ Firebase initialized successfully');
    
    // Test 2: Check anonymous access (should fail)
    try {
      const testDoc = await getDoc(doc(db, 'users', 'test-user'));
      console.log('❌ Unexpected: Anonymous access allowed');
    } catch (error) {
      console.log('✅ Expected: Anonymous access denied -', error.code);
    }
    
    // Test 3: Try to access with authentication (you'll need to provide credentials)
    console.log('\n🔐 To test authenticated access, you need to:');
    console.log('1. Create a test user in Firebase Auth Console');
    console.log('2. Or use an existing user credentials');
    console.log('3. Update this script with test credentials');
    
    // Uncomment and modify the following section with test user credentials:
    /*
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword';
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;
      console.log('✅ User authenticated:', user.uid);
      
      // Test profile access
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        console.log('✅ Profile access successful:', userDoc.data());
      } else {
        console.log('ℹ️  No profile document exists yet');
        
        // Try to create one
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: 'Test User',
          profile: {
            totalBalance: 0,
            monthlyIncome: 0,
            monthlyExpenses: 0,
            preferences: {}
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        console.log('✅ Profile created successfully');
      }
    } catch (authError) {
      console.error('❌ Authentication failed:', authError.code, authError.message);
    }
    */
    
    console.log('\n📝 Notes:');
    console.log('- If you see "permission-denied" errors, the rules need to be deployed');
    console.log('- Run: firebase deploy --only firestore:rules');
    console.log('- Make sure you have Firebase CLI installed and logged in');
    
  } catch (error) {
    console.error('❌ Firebase setup error:', error);
  }
}

testProfilePermissions();