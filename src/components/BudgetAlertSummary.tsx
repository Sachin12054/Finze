import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Budget, Transaction } from '../services/firebase/enhancedFirebaseService';
import BudgetMonitoringService from '../services/budgetMonitoringService';

interface BudgetAlertSummaryProps {
  budgets: Budget[];
  transactions: Transaction[];
  isDarkTheme: boolean;
  onViewDetails?: () => void;
}

export const BudgetAlertSummary: React.FC<BudgetAlertSummaryProps> = ({
  budgets,
  transactions,
  isDarkTheme,
  onViewDetails
}) => {
  const [summary, setSummary] = useState({
    total: 0,
    onTrack: 0,
    warning: 0,
    critical: 0,
    exceeded: 0,
  });

  useEffect(() => {
    loadSummary();
  }, [budgets, transactions]);

  const loadSummary = async () => {
    try {
      const summaryData = await BudgetMonitoringService.getBudgetStatusSummary(
        budgets,
        transactions
      );
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading budget summary:', error);
    }
  };

  const styles = getStyles(isDarkTheme);

  // Don't show if no active budgets
  if (summary.total === 0) return null;

  const hasAlerts = summary.warning > 0 || summary.critical > 0 || summary.exceeded > 0;

  return (
    <Animated.View entering={FadeInDown} style={styles.container}>
      <LinearGradient
        colors={isDarkTheme ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
        style={styles.card}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons 
              name={hasAlerts ? 'alert-circle' : 'checkmark-circle'} 
              size={24} 
              color={hasAlerts ? '#F59E0B' : '#10B981'} 
            />
            <Text style={styles.title}>Budget Status</Text>
          </View>
          {onViewDetails && (
            <TouchableOpacity onPress={onViewDetails}>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={isDarkTheme ? '#9CA3AF' : '#6B7280'} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          {/* On Track */}
          {summary.onTrack > 0 && (
            <View style={styles.statItem}>
              <View style={[styles.statBadge, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="checkmark" size={16} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{summary.onTrack}</Text>
              <Text style={styles.statLabel}>On Track</Text>
            </View>
          )}

          {/* Warning */}
          {summary.warning > 0 && (
            <View style={styles.statItem}>
              <View style={[styles.statBadge, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="alert" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{summary.warning}</Text>
              <Text style={styles.statLabel}>Warning</Text>
            </View>
          )}

          {/* Critical */}
          {summary.critical > 0 && (
            <View style={styles.statItem}>
              <View style={[styles.statBadge, { backgroundColor: '#EF444420' }]}>
                <Ionicons name="warning" size={16} color="#EF4444" />
              </View>
              <Text style={styles.statValue}>{summary.critical}</Text>
              <Text style={styles.statLabel}>Critical</Text>
            </View>
          )}

          {/* Exceeded */}
          {summary.exceeded > 0 && (
            <View style={styles.statItem}>
              <View style={[styles.statBadge, { backgroundColor: '#DC262620' }]}>
                <Ionicons name="close-circle" size={16} color="#DC2626" />
              </View>
              <Text style={styles.statValue}>{summary.exceeded}</Text>
              <Text style={styles.statLabel}>Exceeded</Text>
            </View>
          )}
        </View>

        {/* Alert Message */}
        {hasAlerts && (
          <View style={styles.alertMessage}>
            <Ionicons name="information-circle" size={16} color="#F59E0B" />
            <Text style={styles.alertText}>
              {summary.exceeded > 0 
                ? `${summary.exceeded} budget${summary.exceeded > 1 ? 's' : ''} exceeded!`
                : summary.critical > 0
                ? `${summary.critical} budget${summary.critical > 1 ? 's' : ''} need attention`
                : `${summary.warning} budget${summary.warning > 1 ? 's' : ''} approaching limit`
              }
            </Text>
          </View>
        )}

        {/* No Alerts Message */}
        {!hasAlerts && summary.onTrack > 0 && (
          <View style={[styles.alertMessage, { backgroundColor: isDarkTheme ? '#05402A' : '#D1FAE5' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={[styles.alertText, { color: '#10B981' }]}>
              All budgets are on track! 🎉
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const getStyles = (isDarkTheme: boolean) => StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDarkTheme ? '#F9FAFB' : '#111827',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDarkTheme ? '#F9FAFB' : '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: isDarkTheme ? '#9CA3AF' : '#6B7280',
    marginTop: 2,
  },
  alertMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkTheme ? '#78350F' : '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  alertText: {
    fontSize: 13,
    color: isDarkTheme ? '#FCD34D' : '#92400E',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
});
