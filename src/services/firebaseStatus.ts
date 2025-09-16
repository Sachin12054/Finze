import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface FirebaseStatus {
  rulesDeployed: boolean;
  canAccessProfile: boolean;
  error?: string;
}

export const checkFirebaseStatus = async (userId: string): Promise<FirebaseStatus> => {
  try {
    // Try to access a user document to test permissions
    const testDoc = await getDoc(doc(db, 'users', userId));
    
    return {
      rulesDeployed: true,
      canAccessProfile: true
    };
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      return {
        rulesDeployed: false,
        canAccessProfile: false,
        error: 'Firestore rules need to be deployed'
      };
    }
    
    return {
      rulesDeployed: true, // Rules might be deployed but other issue
      canAccessProfile: false,
      error: error.message
    };
  }
};

export const getFirebaseSetupMessage = (status: FirebaseStatus): string => {
  if (!status.rulesDeployed) {
    return '🔒 Database setup required. Run: firebase deploy --only firestore:rules';
  }
  
  if (!status.canAccessProfile) {
    return `❌ Profile access error: ${status.error}`;
  }
  
  return '✅ Database ready';
};