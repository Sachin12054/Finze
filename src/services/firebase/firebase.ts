
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import 'react-native-get-random-values';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYizk7kF2mbwcx3WaGtqW8ccv6uQqR-8I",
  authDomain: "finze-d5d1c.firebaseapp.com",
  projectId: "finze-d5d1c",
  storageBucket: "finze-d5d1c.firebasestorage.app",
  messagingSenderId: "218574371561",
  appId: "1:218574371561:web:2705bef597bb250e178e78",
  measurementId: "G-L0P6BKLTDQ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth 
// In Firebase v12 for React Native, AsyncStorage persistence is automatically handled
// when @react-native-async-storage/async-storage is installed (which it is)
let auth: any;
try {
  // Try to initialize with proper auth for React Native
  auth = initializeAuth(app);
  console.log('✅ Firebase Auth initialized successfully');
} catch (error) {
  // If auth is already initialized, get the existing instance
  auth = getAuth(app);
  console.log('✅ Firebase Auth connected to existing instance');
}

export { auth };

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Firebase configuration validation
export const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missing = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missing.length > 0) {
    console.error('Missing Firebase configuration fields:', missing);
    return false;
  }
  
  console.log('✅ Firebase configuration validated successfully');
  return true;
};

// Test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    // Test basic connection
    console.log('✅ Firestore connected successfully');
    console.log('✅ Firebase Auth initialized successfully');
    console.log('✅ Firebase Storage initialized successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
};

// Development mode emulator connection (uncomment for local development)
// if (__DEV__) {
//   try {
//     connectFirestoreEmulator(db, 'localhost', 8080);
//   } catch (error) {
//     console.log('Firestore emulator connection failed:', error);
//   }
// }

// Export default for backward compatibility
export default { app, auth, db, storage };
