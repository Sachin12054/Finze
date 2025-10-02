import Constants from 'expo-constants';
import { Alert } from 'react-native';

interface MockAuthResult {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
  isNewUser?: boolean;
}

export class ExpoGoSocialAuthService {
  
  // Mock Google Sign-In for Expo Go
  static async signInWithGoogle(): Promise<MockAuthResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Development Mode',
        'Google Sign-In is not available in Expo Go. Use email authentication or build a development build.',
        [
          {
            text: 'Use Email Instead',
            onPress: () => {
              // This will be handled by the calling component
              throw new Error('EXPO_GO_LIMITATION');
            }
          },
          {
            text: 'Mock Sign-In (Dev)',
            onPress: () => {
              resolve({
                user: {
                  uid: 'mock-google-user',
                  email: 'dev@example.com',
                  displayName: 'Google Dev User',
                  photoURL: null,
                },
                isNewUser: false,
              });
            }
          }
        ]
      );
    });
  }

  // Mock Facebook Sign-In for Expo Go
  static async signInWithFacebook(): Promise<MockAuthResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Development Mode',
        'Facebook Sign-In is not available in Expo Go. Use email authentication or build a development build.',
        [
          {
            text: 'Use Email Instead',
            onPress: () => {
              // This will be handled by the calling component
              throw new Error('EXPO_GO_LIMITATION');
            }
          },
          {
            text: 'Mock Sign-In (Dev)',
            onPress: () => {
              resolve({
                user: {
                  uid: 'mock-facebook-user',
                  email: 'dev-fb@example.com',
                  displayName: 'Facebook Dev User',
                  photoURL: null,
                },
                isNewUser: false,
              });
            }
          }
        ]
      );
    });
  }

  // Check if running in Expo Go
  static isExpoGo(): boolean {
    return Constants.appOwnership === 'expo';
  }

  // Always return false for Google Play Services in Expo Go
  static async isGooglePlayServicesAvailable(): Promise<boolean> {
    return false;
  }

  // Configure Google Sign-In (no-op in Expo Go)
  static configureGoogleSignIn() {
    // No configuration needed for mock service
    console.log('Google Sign-In configuration skipped in Expo Go');
  }

  // Mock sign out
  static async signOut(): Promise<void> {
    console.log('Mock sign out from social providers');
  }
}

export default ExpoGoSocialAuthService;