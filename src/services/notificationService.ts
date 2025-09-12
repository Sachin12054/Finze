import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

export class NotificationService {
  
  // Check if notifications are supported in current environment
  static isSupported(): boolean {
    // In Expo Go, notifications are limited
    if (Constants.appOwnership === 'expo') {
      return false;
    }
    return true;
  }

  // Request notification permissions with fallback
  static async requestPermissionsAsync(): Promise<{ status: string }> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported in Expo Go');
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
      'Push notifications are not supported in Expo Go. To use notifications, you need to create a development build.\n\nLearn more at: https://docs.expo.dev/develop/development-builds/introduction/',
      [
        { text: 'OK', style: 'default' },
        {
          text: 'Learn More',
          style: 'default',
          onPress: () => {
            // In a real app, you could open a web browser
            console.log('Open: https://docs.expo.dev/develop/development-builds/introduction/');
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
      console.warn('Notification handler not set in Expo Go');
      return;
    }

    try {
      Notifications.setNotificationHandler(handler);
    } catch (error) {
      console.warn('Failed to set notification handler:', error);
    }
  }
}

export default NotificationService;