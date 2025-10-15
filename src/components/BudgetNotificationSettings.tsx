import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BudgetMonitoringService from '../services/budgetMonitoringService';
import NotificationService from '../services/notificationService';

interface BudgetNotificationSettingsProps {
  isDarkTheme: boolean;
}

export const BudgetNotificationSettings: React.FC<BudgetNotificationSettingsProps> = ({
  isDarkTheme
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    try {
      const { status } = await NotificationService.getPermissionsAsync();
      setPermissionStatus(status);
      setNotificationsEnabled(status === 'granted');
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const toggleNotifications = async () => {
    if (permissionStatus !== 'granted') {
      const { status } = await NotificationService.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        setNotificationsEnabled(true);
        Alert.alert(
          '✅ Notifications Enabled',
          'You will now receive budget alerts when you approach or exceed your spending limits.'
        );
      } else {
        Alert.alert(
          '❌ Permissions Required',
          'Please enable notifications in your device settings to receive budget alerts.'
        );
      }
    } else {
      setNotificationsEnabled(!notificationsEnabled);
    }
  };

  const toggleDailyReminder = async (value: boolean) => {
    setDailyReminder(value);
    
    if (value) {
      try {
        await NotificationService.scheduleDailyBudgetCheck({ hour: 9, minute: 0 });
        Alert.alert(
          '✅ Daily Reminder Set',
          'You will receive a daily budget check reminder at 9:00 AM.'
        );
      } catch (error) {
        console.error('Error scheduling daily reminder:', error);
        Alert.alert('Error', 'Failed to schedule daily reminder');
      }
    } else {
      // Cancel daily reminder
      const notifications = await NotificationService.getAllScheduledNotifications();
      const dailyReminderNotif = notifications.find(n => 
        n.identifier === 'daily-budget-check'
      );
      
      if (dailyReminderNotif) {
        await NotificationService.cancelNotification('daily-budget-check');
        Alert.alert('Daily reminder cancelled');
      }
    }
  };

  const testNotification = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert('Please enable notifications first');
      return;
    }

    try {
      await NotificationService.sendBudgetAlert(
        'Test Category',
        85,
        4250,
        5000,
        'warning'
      );
      Alert.alert('✅ Test Notification Sent', 'Check your notification tray');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const styles = getStyles(isDarkTheme);

  return (
    <Animated.View entering={FadeInDown} style={styles.container}>
      <Text style={styles.title}>Budget Notifications</Text>
      
      {/* Permission Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Ionicons 
            name={permissionStatus === 'granted' ? 'checkmark-circle' : 'alert-circle'} 
            size={24} 
            color={permissionStatus === 'granted' ? '#10B981' : '#F59E0B'} 
          />
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>Notification Status</Text>
            <Text style={styles.statusSubtitle}>
              {permissionStatus === 'granted' ? 'Enabled' : 
               permissionStatus === 'denied' ? 'Denied - Check Settings' : 
               'Not Configured'}
            </Text>
          </View>
        </View>
      </View>

      {/* Budget Alerts Toggle */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Ionicons name="notifications" size={24} color={isDarkTheme ? '#9CA3AF' : '#6B7280'} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Budget Alerts</Text>
            <Text style={styles.settingSubtitle}>
              Get notified when approaching budget limits
            </Text>
          </View>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ false: '#D1D5DB', true: '#10B981' }}
          thumbColor={notificationsEnabled ? '#FFFFFF' : '#F3F4F6'}
        />
      </View>

      {/* Daily Reminder Toggle */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Ionicons name="calendar" size={24} color={isDarkTheme ? '#9CA3AF' : '#6B7280'} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Daily Budget Check</Text>
            <Text style={styles.settingSubtitle}>
              Daily reminder at 9:00 AM
            </Text>
          </View>
        </View>
        <Switch
          value={dailyReminder}
          onValueChange={toggleDailyReminder}
          disabled={!notificationsEnabled}
          trackColor={{ false: '#D1D5DB', true: '#10B981' }}
          thumbColor={dailyReminder ? '#FFFFFF' : '#F3F4F6'}
        />
      </View>

      {/* Test Notification Button */}
      <TouchableOpacity
        style={[
          styles.testButton,
          !notificationsEnabled && styles.testButtonDisabled
        ]}
        onPress={testNotification}
        disabled={!notificationsEnabled}
      >
        <Ionicons name="megaphone" size={20} color="#FFFFFF" />
        <Text style={styles.testButtonText}>Send Test Notification</Text>
      </TouchableOpacity>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          You'll receive alerts at 80% (warning), 90% (critical), and 100% (exceeded) of your budget.
        </Text>
      </View>
    </Animated.View>
  );
};

const getStyles = (isDarkTheme: boolean) => StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: isDarkTheme ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDarkTheme ? '#F9FAFB' : '#111827',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: isDarkTheme ? '#374151' : '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkTheme ? '#F9FAFB' : '#111827',
  },
  statusSubtitle: {
    fontSize: 14,
    color: isDarkTheme ? '#9CA3AF' : '#6B7280',
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDarkTheme ? '#374151' : '#E5E7EB',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkTheme ? '#F9FAFB' : '#111827',
  },
  settingSubtitle: {
    fontSize: 13,
    color: isDarkTheme ? '#9CA3AF' : '#6B7280',
    marginTop: 2,
  },
  testButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  testButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: isDarkTheme ? '#1E3A5F' : '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: isDarkTheme ? '#93C5FD' : '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
});
