import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Budget, Transaction } from '../../services/enhancedFirebaseService';

interface BudgetTabProps {
  budgets: Budget[];
  transactions: Transaction[];
  isDarkTheme: boolean;
  onAddBudget: () => void;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({
  budgets,
  transactions,
  isDarkTheme,
  onAddBudget
}) => {
  const styles = getBudgetStyles(isDarkTheme);

  if (!Array.isArray(budgets) || budgets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="wallet-outline" size={64} color={isDarkTheme ? '#64748B' : '#94A3B8'} />
        <Text style={styles.emptyTitle}>No Budgets Yet</Text>
        <Text style={styles.emptySubtitle}>Create your first budget to track spending</Text>
        <Pressable style={styles.emptyButton} onPress={onAddBudget}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.emptyButtonGradient}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.emptyButtonText}>Add Budget</Text>
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
      <View style={styles.budgetList}>
        {budgets.map((budget, index) => {
          if (!budget || typeof budget.amount !== 'number' || !budget.category) {
            return null;
          }
          
          const spent = transactions
            .filter(t => t && t.type === 'expense' && t.category === budget.category && typeof t.amount === 'number')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
          const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
          const progressColor = progress > 90 ? '#FF5722' : progress > 70 ? '#FF9800' : '#4CAF50';
          
          return (
            <Animated.View
              key={budget.id || `budget-${index}`}
              entering={FadeInRight.delay(index * 100)}
              style={styles.budgetCard}
            >
              <LinearGradient
                colors={isDarkTheme ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
                style={styles.budgetCardGradient}
              >
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetCategoryContainer}>
                    <View style={[styles.budgetCategoryIcon, { backgroundColor: progressColor + '20' }]}>
                      <Ionicons 
                        name="wallet-outline" 
                        size={20} 
                        color={progressColor} 
                      />
                    </View>
                    <View>
                      <Text style={styles.budgetCategory}>{budget.category}</Text>
                      <Text style={styles.budgetPeriod}>{budget.period || 'Monthly'}</Text>
                    </View>
                  </View>
                  <View style={styles.budgetPercentageContainer}>
                    <Text style={[styles.budgetPercentage, { color: progressColor }]}>
                      {Math.round(progress)}%
                    </Text>
                  </View>
                </View>
                
                <View style={styles.budgetAmountContainer}>
                  <Text style={styles.budgetAmount}>
                    ₹{spent.toLocaleString('en-IN')} / ₹{budget.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.budgetRemaining}>
                    ₹{Math.max(0, budget.amount - spent).toLocaleString('en-IN')} remaining
                  </Text>
                </View>
                
                <View style={styles.budgetProgressBar}>
                  <View 
                    style={[
                      styles.budgetProgressFill,
                      {
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: progressColor
                      }
                    ]} 
                  />
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

const getBudgetStyles = (isDark: boolean) => StyleSheet.create({
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
  budgetList: {
    gap: 16,
  },
  budgetCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  budgetCardGradient: {
    padding: 20,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  budgetCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: isDark ? '#F1F5F9' : '#1E293B',
  },
  budgetPeriod: {
    fontSize: 12,
    fontWeight: '500',
    color: isDark ? '#94A3B8' : '#64748B',
    marginTop: 2,
  },
  budgetPercentageContainer: {
    alignItems: 'flex-end',
  },
  budgetPercentage: {
    fontSize: 18,
    fontWeight: '800',
  },
  budgetAmountContainer: {
    marginBottom: 16,
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#E2E8F0' : '#475569',
    marginBottom: 4,
  },
  budgetRemaining: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#94A3B8' : '#64748B',
  },
  budgetProgressBar: {
    height: 8,
    backgroundColor: isDark ? '#374151' : '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
