
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import 'react-native-get-random-values';

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

// Initialize Firebase services (AsyncStorage warning can be ignored in development)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
