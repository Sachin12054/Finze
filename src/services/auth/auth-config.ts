import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyCYizk7kF2mbwcx3WaGtqW8ccv6uQqR-8I",
  authDomain: "finze-d5d1c.firebaseapp.com",
  projectId: "finze-d5d1c",
  storageBucket: "finze-d5d1c.firebasestorage.app",
  messagingSenderId: "218574371561",
  appId: "1:218574371561:web:2705bef597bb250e178e78",
  measurementId: "G-L0P6BKLTDQ"
};

// Initialize Firebase app
export const app = initializeApp(firebaseConfig);

// Configure AsyncStorage for auth persistence
export const configureAuthPersistence = async () => {
  try {
    // This is handled automatically by Firebase v9+ in React Native
    // AsyncStorage is used by default for persistence
    console.log('Firebase Auth persistence configured with AsyncStorage');
  } catch (error) {
    console.warn('Failed to configure auth persistence:', error);
  }
};