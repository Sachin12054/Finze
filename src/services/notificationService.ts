import Constants from 'expo-constants';
import { Alert } from 'react-native';

// Conditional import for expo-notifications to avoid Expo Go errors
let Notifications: any = null;
try {
  // Only import if not in Expo Go environment
  if (Constants.appOwnership !== 'expo') {
    Notifications = require('expo-notifications');
  }
} catch (error) {
  console.warn('expo-notifications not available in this environment');
}

export class NotificationService {
  
  // Check if notifications are supported in current environment
  static isSupported(): boolean {
    // In Expo Go, notifications are limited since SDK 53
    if (Constants.appOwnership === 'expo') {
      console.warn('Push notifications are not fully supported in Expo Go. Use development build instead.');
      return false;
    }
    return Notifications !== null;
  }

  // Request notification permissions with fallback
  static async requestPermissionsAsync(): Promise<{ status: string }> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported in Expo Go');
      this.showDevelopmentBuildInfo();
      return { status: 'denied' };
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return { status };
    } catch (error) {
      console.warn('Failed to request notification permissions:', error);
      return { status: 'denied' };
    }
  }

  // Show development build information
  static showDevelopmentBuildInfo() {
    Alert.alert(
      'Notifications Not Available',
      'Push notifications are not supported in Expo Go since SDK 53. To use notifications, you need to create a development build.\n\nLearn more at: https://docs.expo.dev/develop/development-builds/introduction/',
      [
        { text: 'OK', style: 'default' },
        {
          text: 'Learn More',
          style: 'default',
          onPress: () => {
            console.log('📚 Development build info: https://docs.expo.dev/develop/development-builds/introduction/');
          }
        }
      ]
    );
  }

  // Get notification settings (mock for Expo Go)
  static async getPermissionsAsync(): Promise<{ status: string }> {
    if (!this.isSupported()) {
      return { status: 'denied' };
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      return { status };
    } catch (error) {
      console.warn('Failed to get notification permissions:', error);
      return { status: 'denied' };
    }
  }

  // Set notification handler (safe wrapper)
  static setNotificationHandler(handler: any) {
    if (!this.isSupported()) {
      console.warn('⚠️ Notification handler not available in Expo Go environment');
      return;
    }

    try {
      Notifications.setNotificationHandler(handler);
      console.log('✅ Notification handler set successfully');
    } catch (error) {
      console.warn('Failed to set notification handler:', error);
    }
  }

  // Mock notification for Expo Go testing
  static mockNotification(title: string, body: string) {
    if (!this.isSupported()) {
      Alert.alert(
        `📱 Mock Notification: ${title}`,
        body,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    // In development build, you could use actual notifications here
    console.log(`📱 Notification: ${title} - ${body}`);
  }
}

export default NotificationService;