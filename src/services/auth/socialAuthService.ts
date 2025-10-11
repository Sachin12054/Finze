import { FacebookAuthProvider, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { EnhancedFirebaseService } from '../firebase/enhancedFirebaseService';
import { auth } from '../firebase/firebase';

// Conditional imports for native modules
let GoogleSignin: any;
let AccessToken: any;
let LoginManager: any;

try {
  const GoogleSignInModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = GoogleSignInModule.GoogleSignin;
} catch (error) {
  console.log('Google Sign-In not available in this environment');
}

try {
  const FacebookModule = require('react-native-fbsdk-next');
  AccessToken = FacebookModule.AccessToken;
  LoginManager = FacebookModule.LoginManager;
} catch (error) {
  console.log('Facebook SDK not available in this environment');
}

export interface SocialAuthResult {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
  isNewUser?: boolean;
}

export class SocialAuthService {
  
  // Configure Google Sign-In
  static configureGoogleSignIn() {
    if (!GoogleSignin) {
      console.log('Google Sign-In not available - using fallback');
      return;
    }
    
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'your-google-web-client-id',
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        offlineAccess: true,
      });
    } catch (error) {
      console.log('Google Sign-In configuration failed:', error);
    }
  }

  // Google Sign-In
  static async signInWithGoogle(): Promise<SocialAuthResult> {
    if (!GoogleSignin) {
      throw new Error('EXPO_GO_LIMITATION');
    }
    
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.data?.idToken) {
        throw new Error('No ID token received from Google');
      }

      // Create Firebase credential
      const credential = GoogleAuthProvider.credential(userInfo.data.idToken);
      
      // Sign in to Firebase
      const result = await signInWithCredential(auth, credential);
      const user = result.user;

      // Create or update user profile (assume new user for simplicity)
      try {
        await EnhancedFirebaseService.createUserProfile({
          displayName: user.displayName || 'Google User',
          email: user.email || '',
          bio: '',
          phoneNumber: '',
          location: '',
          totalBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          role: 'customer',
        });
      } catch (error) {
        // Profile might already exist, continue
      }

      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        isNewUser: true, // Simplified for now
      };
    } catch (error: any) {
      if (error.code === 'statusCodes.SIGN_IN_CANCELLED') {
        throw new Error('Google Sign-In was canceled');
      }
      throw new Error(`Google Sign-In failed: ${error.message}`);
    }
  }

  // Facebook Sign-In
  static async signInWithFacebook(): Promise<SocialAuthResult> {
    if (!LoginManager || !AccessToken) {
      throw new Error('EXPO_GO_LIMITATION');
    }
    
    try {
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      
      if (result.isCancelled) {
        throw new Error('Facebook Sign-In was canceled');
      }

      // Get Facebook access token
      const data = await AccessToken.getCurrentAccessToken();
      
      if (!data) {
        throw new Error('Failed to get Facebook access token');
      }

      // Create Firebase credential
      const credential = FacebookAuthProvider.credential(data.accessToken);
      
      // Sign in to Firebase
      const authResult = await signInWithCredential(auth, credential);
      const user = authResult.user;

      // Create or update user profile (assume new user for simplicity)
      try {
        await EnhancedFirebaseService.createUserProfile({
          displayName: user.displayName || 'Facebook User',
          email: user.email || '',
          bio: '',
          phoneNumber: '',
          location: '',
          totalBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          role: 'customer',
        });
      } catch (error) {
        // Profile might already exist, continue
      }

      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        isNewUser: true, // Simplified for now
      };
    } catch (error: any) {
      throw new Error(`Facebook Sign-In failed: ${error.message}`);
    }
  }

  // Sign out from all social providers
  static async signOut(): Promise<void> {
    try {
      // Sign out from Firebase
      await auth.signOut();
      
      // Sign out from Google
      if (GoogleSignin) {
        try {
          await GoogleSignin.signOut();
        } catch (error) {
          // Ignore Google sign-out errors
        }
      }
      
      // Sign out from Facebook
      if (LoginManager) {
        try {
          LoginManager.logOut();
        } catch (error) {
          // Ignore Facebook sign-out errors
        }
      }
    } catch (error) {
      throw new Error('Failed to sign out from all providers');
    }
  }

  // Check if Google Play Services is available
  static async isGooglePlayServicesAvailable(): Promise<boolean> {
    if (!GoogleSignin) {
      return false;
    }
    
    try {
      await GoogleSignin.hasPlayServices();
      return true;
    } catch {
      return false;
    }
  }
}

export default SocialAuthService;