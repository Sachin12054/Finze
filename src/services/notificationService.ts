import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPermissionStatus {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain?: boolean;
  expires?: 'never' | number;
}

export interface PushNotificationToken {
  data: string;
  type: 'expo' | 'fcm' | 'apns';
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  trigger: {
    type: 'timeInterval' | 'daily' | 'weekly' | 'date';
    seconds?: number;
    hour?: number;
    minute?: number;
    weekday?: number;
    date?: Date;
  };
}

class NotificationServiceClass {
  private expoPushToken: string | null = null;

  /**
   * Request notification permissions
   */
  async requestPermissionsAsync(): Promise<NotificationPermissionStatus> {
    try {
      console.log('📱 Requesting notification permissions...');

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If permission not granted, ask for it
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      console.log(`✅ Notification permission status: ${finalStatus}`);

      // Get push token if permissions granted
      if (finalStatus === 'granted') {
        await this.setupPushToken();
      }

      return {
        status: finalStatus as 'granted' | 'denied' | 'undetermined',
        canAskAgain: finalStatus !== 'denied'
      };
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return {
        status: 'denied',
        canAskAgain: false
      };
    }
  }

  /**
   * Setup push notification token
   */
  private async setupPushToken(): Promise<void> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your actual project ID
      });

      this.expoPushToken = token.data;
      console.log('📧 Push token obtained:', token.data);
      
      // You can store this token in your backend/database
      // await this.storePushToken(token.data);
    } catch (error) {
      console.error('❌ Error getting push token:', error);
    }
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Check current notification permissions
   */
  async getPermissionsAsync(): Promise<NotificationPermissionStatus> {
    try {
      const { status, canAskAgain, expires } = await Notifications.getPermissionsAsync();
      
      return {
        status: status as 'granted' | 'denied' | 'undetermined',
        canAskAgain,
        expires
      };
    } catch (error) {
      console.error('❌ Error getting notification permissions:', error);
      return {
        status: 'denied',
        canAskAgain: false
      };
    }
  }

  /**
   * Send local notification immediately
   */
  async sendLocalNotification(title: string, body: string, data?: any): Promise<string> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Send immediately
      });

      console.log(`📩 Local notification sent with ID: ${id}`);
      return id;
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a notification for later
   */
  async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    try {
      let trigger: any = null;

      switch (notification.trigger.type) {
        case 'timeInterval':
          trigger = {
            seconds: notification.trigger.seconds || 60,
          };
          break;
        
        case 'daily':
          trigger = {
            hour: notification.trigger.hour || 9,
            minute: notification.trigger.minute || 0,
            repeats: true,
          };
          break;
        
        case 'weekly':
          trigger = {
            weekday: notification.trigger.weekday || 1, // Monday = 1
            hour: notification.trigger.hour || 9,
            minute: notification.trigger.minute || 0,
            repeats: true,
          };
          break;
        
        case 'date':
          trigger = {
            date: notification.trigger.date || new Date(Date.now() + 60000), // 1 minute from now
          };
          break;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: true,
        },
        trigger,
      });

      console.log(`⏰ Notification scheduled with ID: ${id}`);
      return id;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`🗑️ Notification ${notificationId} cancelled`);
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️ All notifications cancelled');
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📋 Found ${notifications.length} scheduled notifications`);
      return notifications;
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseReceivedListener(listener: (response: Notifications.NotificationResponse) => void): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Remove notification listener
   */
  removeNotificationSubscription(subscription: Notifications.Subscription): void {
    subscription.remove();
  }

  /**
   * Send expense reminder notifications
   */
  async scheduleExpenseReminder(title: string = "Don't forget to track your expenses!", time: { hour: number; minute: number } = { hour: 20, minute: 0 }): Promise<string> {
    return this.scheduleNotification({
      id: 'expense-reminder',
      title,
      body: "Take a moment to add today's expenses to stay on track with your budget.",
      data: { type: 'expense_reminder' },
      trigger: {
        type: 'daily',
        hour: time.hour,
        minute: time.minute,
      }
    });
  }

  /**
   * Send budget alert notification
   */
  async sendBudgetAlert(category: string, percentage: number): Promise<string> {
    const title = `Budget Alert: ${category}`;
    const body = `You've spent ${percentage}% of your ${category} budget this month.`;
    
    return this.sendLocalNotification(title, body, {
      type: 'budget_alert',
      category,
      percentage
    });
  }

  /**
   * Send spending goal achievement notification
   */
  async sendGoalAchievement(goalName: string, amount: number): Promise<string> {
    const title = "🎉 Goal Achieved!";
    const body = `Congratulations! You've reached your ${goalName} goal of ₹${amount.toLocaleString()}.`;
    
    return this.sendLocalNotification(title, body, {
      type: 'goal_achievement',
      goalName,
      amount
    });
  }

  /**
   * Send weekly spending summary
   */
  async scheduleWeeklySummary(): Promise<string> {
    return this.scheduleNotification({
      id: 'weekly-summary',
      title: '📊 Weekly Spending Summary',
      body: 'Check out your spending insights and AI recommendations for this week.',
      data: { type: 'weekly_summary' },
      trigger: {
        type: 'weekly',
        weekday: 1, // Monday
        hour: 10,
        minute: 0,
      }
    });
  }
}

const NotificationService = new NotificationServiceClass();
export default NotificationService;