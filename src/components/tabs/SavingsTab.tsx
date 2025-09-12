import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SavingsGoal } from '../../services/enhancedFirebaseService';

interface SavingsTabProps {
  savingsGoals: SavingsGoal[];
  isDarkTheme: boolean;
  onAddSavings: () => void;
}

export const SavingsTab: React.FC<SavingsTabProps> = ({
  savingsGoals,
  isDarkTheme,
  onAddSavings
}) => {
  const styles = getSavingsStyles(isDarkTheme);

  if (!Array.isArray(savingsGoals) || savingsGoals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="flag-outline" size={64} color={isDarkTheme ? '#64748B' : '#94A3B8'} />
        <Text style={styles.emptyTitle}>No Savings Goals</Text>
        <Text style={styles.emptySubtitle}>Set financial goals and track your progress</Text>
        <Pressable style={styles.emptyButton} onPress={onAddSavings}>
          <LinearGradient
            colors={['#667eea', '#764ba2'] as const}
            style={styles.emptyButtonGradient}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.emptyButtonText}>Add Savings Goal</Text>
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
      <View style={styles.savingsList}>
        {savingsGoals.map((goal, index) => {
          if (!goal || typeof goal.targetAmount !== 'number' || typeof goal.currentAmount !== 'number') {
            return null;
          }
          
          const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          
          return (
            <Animated.View
              key={goal.id || `savings-${index}`}
              entering={FadeInDown.delay(index * 100)}
              style={styles.savingsCard}
            >
              <LinearGradient
                colors={goal.isCompleted 
                  ? ['#4CAF50', '#388E3C'] as const
                  : ['#667eea', '#764ba2'] as const
                }
                style={styles.savingsGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.savingsHeader}>
                  <View style={styles.savingsGoalInfo}>
                    <View style={styles.savingsIconContainer}>
                      <Ionicons 
                        name={goal.isCompleted ? "checkmark-circle" : "flag-outline"} 
                        size={24} 
                        color="white" 
                      />
                    </View>
                    <View style={styles.savingsTextContainer}>
                      <Text style={styles.savingsGoalName}>{goal.name || 'Savings Goal'}</Text>
                      <Text style={styles.savingsTargetDate}>
                        Target: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'No date set'}
                      </Text>
                    </View>
                  </View>
                  {goal.isCompleted && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>Completed!</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.savingsAmountContainer}>
                  <Text style={styles.savingsAmount}>
                    ₹{goal.currentAmount.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.savingsRemaining}>
                    ₹{Math.max(0, goal.targetAmount - goal.currentAmount).toLocaleString('en-IN')} to go
                  </Text>
                </View>
                
                <View style={styles.savingsProgressContainer}>
                  <View style={styles.savingsProgressBar}>
                    <Animated.View 
                      style={[
                        styles.savingsProgressFill,
                        { width: `${Math.min(progress, 100)}%` }
                      ]}
                      entering={FadeInRight.delay(index * 100)}
                    />
                  </View>
                  <Text style={styles.savingsProgressText}>
                    {Math.round(progress)}%
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

const getSavingsStyles = (isDark: boolean) => StyleSheet.create({
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
  savingsList: {
    gap: 16,
  },
  savingsCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  savingsGradient: {
    padding: 20,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  savingsGoalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  savingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingsTextContainer: {
    flex: 1,
  },
  savingsGoalName: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  savingsTargetDate: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  completedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  savingsAmountContainer: {
    marginBottom: 16,
  },
  savingsAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  savingsRemaining: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  savingsProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savingsProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  savingsProgressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  savingsProgressText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    minWidth: 40,
  },
});
