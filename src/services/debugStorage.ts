import { auth, storage } from './firebase/firebase';

// Test Firebase Storage connection
export const testStorageConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Firebase Storage connection...');
    console.log('Storage instance:', storage);
    console.log('Storage app:', storage.app);
    console.log('Auth current user:', auth.currentUser);
    
    // Try to get a reference to test the connection
    const { ref } = await import('firebase/storage');
    const testRef = ref(storage, 'test-connection');
    console.log('Test reference created:', testRef.fullPath);
    
    return true;
  } catch (error) {
    console.error('Storage connection test failed:', error);
    return false;
  }
};

// Get current user token for debugging
export const getUserToken = async (): Promise<string | null> => {
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      console.log('User token exists:', !!token);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting user token:', error);
    return null;
  }
};
