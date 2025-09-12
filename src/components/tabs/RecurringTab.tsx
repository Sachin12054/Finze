import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Recurrence } from '../../services/enhancedFirebaseService';

interface RecurringTabProps {
  recurrences: Recurrence[];
  isDarkTheme: boolean;
  onAddRecurring: () => void;
}

export const RecurringTab: React.FC<RecurringTabProps> = ({
  recurrences,
  isDarkTheme,
  onAddRecurring
}) => {
  const styles = getRecurringStyles(isDarkTheme);

  if (!Array.isArray(recurrences) || recurrences.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="repeat-outline" size={64} color={isDarkTheme ? '#64748B' : '#94A3B8'} />
        <Text style={styles.emptyTitle}>No Recurring Transactions</Text>
        <Text style={styles.emptySubtitle}>Set up automatic payments and income</Text>
        <Pressable style={styles.emptyButton} onPress={onAddRecurring}>
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            style={styles.emptyButtonGradient}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.emptyButtonText}>Add Recurring</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 20 }}
    >
      <View style={styles.recurringList}>
        {recurrences.map((recurrence, index) => {
          if (!recurrence || !recurrence.category || typeof recurrence.amount !== 'number') {
            return null;
          }

          const isIncome = recurrence.type === 'income';
          const iconName = isIncome ? 'trending-up' : 'trending-down';
          const gradientColors = isIncome 
            ? ['#4CAF50', '#388E3C'] as const
            : ['#FF6B6B', '#FF5722'] as const;

          return (
            <Animated.View
              key={recurrence.id || `recurring-${index}`}
              entering={FadeInRight.delay(index * 100)}
              style={styles.recurringCard}
            >
              <LinearGradient
                colors={gradientColors}
                style={styles.recurringGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.recurringHeader}>
                  <View style={styles.recurringInfo}>
                    <View style={styles.recurringIconContainer}>
                      <Ionicons name={iconName as any} size={24} color="white" />
                    </View>
                    <View style={styles.recurringTextContainer}>
                      <Text style={styles.recurringCategory}>{recurrence.category}</Text>
                      <Text style={styles.recurringPeriod}>Every {(recurrence as any).period || 'month'}</Text>
                    </View>
                  </View>
                  <View style={styles.recurringAmountContainer}>
                    <Text style={styles.recurringType}>
                      {isIncome ? 'Income' : 'Expense'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recurringAmountSection}>
                  <Text style={styles.recurringAmount}>
                    {isIncome ? '+' : '-'}₹{recurrence.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.recurringNext}>
                    Next: {(recurrence as any).nextDate ? new Date((recurrence as any).nextDate).toLocaleDateString() : 'Not set'}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>
          );
        })}
      </View>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const getRecurringStyles = (isDark: boolean) => StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: isDark ? '#F1F5F9' : '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: isDark ? '#94A3B8' : '#64748B',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  recurringList: {
    gap: 16,
  },
  recurringCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  recurringGradient: {
    padding: 20,
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recurringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  recurringIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurringTextContainer: {
    flex: 1,
  },
  recurringCategory: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  recurringPeriod: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  recurringAmountContainer: {
    alignItems: 'flex-end',
  },
  recurringType: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recurringAmountSection: {
    alignItems: 'flex-start',
  },
  recurringAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  recurringNext: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
