import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  query,
  updateDoc
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddBudgetDialog from '../../src/components/AddBudgetDialog';
import { AddRecurringDialog } from '../../src/components/AddRecurringDialog';
import { AddSavingsGoalDialog } from '../../src/components/AddSavingsGoalDialog';
import { RecurringTab } from '../../src/components/tabs/RecurringTab';
import { SavingsTab } from '../../src/components/tabs/SavingsTab';
import { useTheme } from '../../src/contexts/ThemeContext';
import { auth, db } from '../../src/services/firebase';

// Import Enhanced BudgetTab component
import { BudgetTab } from '../../src/components/tabs/BudgetTab';

// Import Enhanced Firebase Service for consistent data handling like index.tsx
import {
  Budget,
  EnhancedFirebaseService,
  SavingsGoal as FirebaseSavingsGoal,
  Recurrence,
  Transaction
} from '../../src/services/enhancedFirebaseService';



// Local types for smart suggestions (not in enhanced service yet)
interface SavingsGoal {
  id?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  description?: string;
  isCompleted: boolean;
}

interface SmartSuggestion {
  id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  type: 'budget' | 'saving' | 'spending' | 'investment';
  actionRequired: boolean;
  isRead: boolean;
  createdAt: string;
}

export default function ExploreDashboard() {
  const { isDarkTheme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states - using Firebase types for consistency with index.tsx
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<Recurrence[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<FirebaseSavingsGoal[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  
  // Financial summary
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'overview' | 'budgets' | 'goals' | 'recurring' | 'insights' | 'scanner-history'>('overview');
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  
  // Modal states
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [editingRecurrence, setEditingRecurrence] = useState<Recurrence | null>(null);
  const [editingSavingsGoal, setEditingSavingsGoal] = useState<FirebaseSavingsGoal | null>(null);
  
  // Authentication and data loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (!currentUser) {
        // Handle not authenticated
        return;
      }
      
      setupRealtimeListeners(currentUser.uid);
    });

    return unsubscribe;
  }, []);

  const setupRealtimeListeners = (userId: string) => {
    let unsubscribeFunctions: (() => void)[] = [];

    try {
      // Set up real-time listeners using Enhanced Firebase Service (same as index.tsx)
      const unsubscribeTransactions = EnhancedFirebaseService.getTransactionsListener((transactionData) => {
        setTransactions(transactionData);
        
        // Calculate financial summary for current month
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyTransactions = transactionData.filter(transaction => 
          transaction.date && transaction.date.startsWith(currentMonth)
        );
        
        const totalIncome = monthlyTransactions
          .filter(transaction => transaction.type === 'income')
          .reduce((sum, transaction) => sum + transaction.amount, 0);
        
        const totalExpenses = monthlyTransactions
          .filter(transaction => transaction.type === 'expense')
          .reduce((sum, transaction) => sum + transaction.amount, 0);
        
        const balance = totalIncome - totalExpenses;
        
        setMonthlyIncome(totalIncome);
        setMonthlyExpenses(totalExpenses);
        setTotalBalance(balance);
      });
      unsubscribeFunctions.push(unsubscribeTransactions);

      const unsubscribeBudgets = EnhancedFirebaseService.getBudgetsListener((budgetData) => {
        setBudgets(budgetData);
      });
      unsubscribeFunctions.push(unsubscribeBudgets);

      const unsubscribeSavings = EnhancedFirebaseService.getSavingsGoalsListener((savingsData) => {
        setSavingsGoals(savingsData);
      });
      unsubscribeFunctions.push(unsubscribeSavings);

    } catch (error) {
      console.error('Error setting up listeners:', error);
    }

    // Recurring transactions listener (using EnhancedFirebaseService)
    const unsubRecurring = EnhancedFirebaseService.getRecurrenceListener((recurringData) => {
      console.log('🔄 Explore: Received recurring data:', recurringData);
      setRecurringTransactions(recurringData);
    });

    // Smart suggestions listener (simplified to avoid index requirement)
    const suggestionsRef = collection(db, `users/${userId}/smart_suggestions`);
    const suggestionsQuery = query(suggestionsRef, limit(10));
    
    const unsubSuggestions = onSnapshot(
      suggestionsQuery, 
      (snapshot) => {
        const suggestionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SmartSuggestion[];
        // Filter unread suggestions in memory instead of using Firestore query
        const unreadSuggestions = suggestionsData.filter(s => !s.isRead);
        setSmartSuggestions(unreadSuggestions);
      },
      (error) => {
        console.error('Error fetching smart suggestions:', error);
        setSmartSuggestions([]);
      }
    );

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      });
      unsubRecurring();
      unsubSuggestions();
    };
  };

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    Alert.alert(
      type === 'success' ? 'Success' : 'Error',
      message,
      [{ text: 'OK' }]
    );
  };

  // Delete functions
  const deleteBudget = async (budgetId: string) => {
    if (!user) return;
    
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await EnhancedFirebaseService.deleteBudget(budgetId);
              showToast('Budget deleted successfully');
            } catch (error) {
              console.error('Error deleting budget:', error);
              showToast('Failed to delete budget', 'error');
            }
          }
        }
      ]
    );
  };

  const deleteSavingsGoal = async (goalId: string) => {
    if (!user) return;
    
    Alert.alert(
      'Delete Savings Goal',
      'Are you sure you want to delete this savings goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, `users/${user.uid}/savings_goals`, goalId));
              showToast('Savings goal deleted successfully');
            } catch (error) {
              showToast('Failed to delete savings goal', 'error');
            }
          }
        }
      ]
    );
  };

  // Update savings goal progress
  const updateSavingsGoalProgress = async (goalId: string, additionalAmount: number) => {
    if (!user) return;
    
    try {
      const goalRef = doc(db, `users/${user.uid}/savings_goals`, goalId);
      const goal = savingsGoals.find(g => g.id === goalId);
      
      if (!goal) return;
      
      const newCurrentAmount = goal.currentAmount + additionalAmount;
      const isCompleted = newCurrentAmount >= goal.targetAmount;
      
      await updateDoc(goalRef, {
        currentAmount: newCurrentAmount,
        isCompleted
      });
      
      showToast(isCompleted ? 'Congratulations! Goal completed!' : 'Goal progress updated');
    } catch (error) {
      showToast('Failed to update goal progress', 'error');
    }
  };

  // Toggle recurring transaction status
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkTheme ? '#0f172a' : '#f8fafc' }]}>
        <Text style={[styles.loadingText, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkTheme ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Professional Header - Dashboard Style */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView>
            <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}</Text>
                  <Text style={styles.userName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {user?.displayName || user?.email?.split('@')[0] || "Dashboard"}
                  </Text>
                </View>
                <View style={styles.headerRight}>
                  <TouchableOpacity
                    style={styles.themeToggle}
                    onPress={toggleTheme}
                    accessibilityLabel="Toggle theme"
                  >
                    <Ionicons 
                      name={isDarkTheme ? "sunny" : "moon"} 
                      size={22} 
                      color="white" 
                    />
                  </TouchableOpacity>
                  
                </View>
              </View>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        {/* Tab Navigation */}
        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContainer}>
            {[
              { key: 'overview', label: 'Overview', icon: 'analytics-outline' },
              { key: 'budgets', label: 'Budgets', icon: 'wallet-outline' },
              { key: 'goals', label: 'Goals', icon: 'flag-outline' },
              { key: 'recurring', label: 'Recurring', icon: 'repeat-outline' },
              { key: 'insights', label: 'Insights', icon: 'bulb-outline' },
              { key: 'scanner-history', label: 'Scanner', icon: 'scan-outline' }
            ].map((tab, index) => (
              <Animated.View
                key={tab.key}
                entering={FadeInRight.delay(700 + index * 100).duration(600)}
              >
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    { backgroundColor: isDarkTheme ? '#374151' : '#e2e8f0' },
                    activeTab === tab.key && [styles.activeTabButton, { backgroundColor: '#6366f1' }]
                  ]}
                  onPress={() => setActiveTab(tab.key as any)}
                >
                  <Ionicons 
                    name={tab.icon as any}
                    size={20}
                    color={activeTab === tab.key ? '#ffffff' : (isDarkTheme ? '#9ca3af' : '#64748b')}
                  />
                  <Text style={[
                    styles.tabLabel,
                    { color: isDarkTheme ? '#9ca3af' : '#64748b' },
                    activeTab === tab.key && styles.activeTabLabel
                  ]}>
                    {tab.label}
                  </Text>
                  {activeTab === tab.key && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <Animated.View entering={FadeInUp.duration(500)} style={styles.tabContent}>
            {/* Professional Quick Actions */}
            <Animated.View 
              entering={FadeInRight.delay(300)} 
              style={styles.quickActionsContainer}
            >
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>Quick Actions</Text>
              </View>
              
              {/* Essential Actions Grid */}
              <View style={styles.essentialActionsGrid}>
                <TouchableOpacity
                  style={[styles.essentialActionCard, { backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff', borderColor: isDarkTheme ? '#374151' : '#F1F5F9' }]}
                  onPress={() => setShowAddBudget(true)}
                  accessibilityLabel="Create new budget"
                  activeOpacity={0.7}
                >
                  <View style={styles.essentialActionContent}>
                    <View style={[styles.essentialActionIcon, { backgroundColor: isDarkTheme ? '#1e40af' : '#E8F2FF' }]}>
                      <Ionicons name="wallet" size={26} color={isDarkTheme ? '#93c5fd' : '#2563EB'} />
                    </View>
                    <Text style={[styles.essentialActionTitle, { color: isDarkTheme ? '#ffffff' : '#1E293B' }]}>Create Budget</Text>
                    <Text style={[styles.essentialActionSubtitle, { color: isDarkTheme ? '#9ca3af' : '#64748B' }]}>Track spending</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.essentialActionCard, { backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff', borderColor: isDarkTheme ? '#374151' : '#F1F5F9' }]}
                  onPress={() => setShowAddRecurring(true)}
                  accessibilityLabel="Add recurring transaction"
                  activeOpacity={0.7}
                >
                  <View style={styles.essentialActionContent}>
                    <View style={[styles.essentialActionIcon, { backgroundColor: isDarkTheme ? '#7c3aed' : '#F3E8FF' }]}>
                      <Ionicons name="repeat" size={26} color={isDarkTheme ? '#c4b5fd' : '#9333EA'} />
                    </View>
                    <Text style={[styles.essentialActionTitle, { color: isDarkTheme ? '#ffffff' : '#1E293B' }]}>Add Recurring</Text>
                    <Text style={[styles.essentialActionSubtitle, { color: isDarkTheme ? '#9ca3af' : '#64748B' }]}>Automate bills</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.essentialActionCard, { backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff', borderColor: isDarkTheme ? '#374151' : '#F1F5F9' }]}
                  onPress={() => setShowAddGoal(true)}
                  accessibilityLabel="Set savings goal"
                  activeOpacity={0.7}
                >
                  <View style={styles.essentialActionContent}>
                    <View style={[styles.essentialActionIcon, { backgroundColor: isDarkTheme ? '#0891b2' : '#E0F7FA' }]}>
                      <Ionicons name="flag" size={26} color={isDarkTheme ? '#67e8f9' : '#0891B2'} />
                    </View>
                    <Text style={[styles.essentialActionTitle, { color: isDarkTheme ? '#ffffff' : '#1E293B' }]}>Set Goal</Text>
                    <Text style={[styles.essentialActionSubtitle, { color: isDarkTheme ? '#9ca3af' : '#64748B' }]}>Save money</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.essentialActionCard, { backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff', borderColor: isDarkTheme ? '#374151' : '#F1F5F9' }]}
                  onPress={() => setActiveTab('scanner-history')}
                  accessibilityLabel="View scanner history"
                  activeOpacity={0.7}
                >
                  <View style={styles.essentialActionContent}>
                    <View style={[styles.essentialActionIcon, { backgroundColor: isDarkTheme ? '#dc2626' : '#FEF2F2' }]}>
                      <Ionicons name="receipt-outline" size={26} color={isDarkTheme ? '#fca5a5' : '#DC2626'} />
                    </View>
                    <Text style={[styles.essentialActionTitle, { color: isDarkTheme ? '#ffffff' : '#1E293B' }]}>Scanner History</Text>
                    <Text style={[styles.essentialActionSubtitle, { color: isDarkTheme ? '#9ca3af' : '#64748B' }]}>Receipt scans</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Enhanced Budget Overview */}
            <Animated.View entering={FadeInUp.delay(400)} style={styles.budgetOverviewSection}>
              {/* Header with title and View All button */}
              <View style={styles.budgetOverviewHeader}>
                <View style={styles.budgetOverviewTitleContainer}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2'] as const}
                    style={styles.budgetOverviewIconContainer}
                  >
                    <Ionicons name="wallet-outline" size={24} color="white" />
                  </LinearGradient>
                  <View style={styles.budgetOverviewTitleInfo}>
                    <Text style={[styles.budgetOverviewTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>
                      Budget Overview
                    </Text>
                    <Text style={[styles.budgetOverviewSubtitle, { color: isDarkTheme ? '#9ca3af' : '#6b7280' }]}>
                      {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  onPress={() => setActiveTab('budgets')}
                  style={[styles.budgetOverviewViewAllButton, { 
                    backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                    borderWidth: 1,
                    borderColor: isDarkTheme ? '#6b7280' : '#d1d5db',
                  }]}
                >
                  <Text style={[styles.budgetOverviewViewAllText, { 
                    color: isDarkTheme ? '#e5e7eb' : '#1f2937' 
                  }]}>
                    View All
                  </Text>
                  <Ionicons 
                    name="chevron-forward" 
                    size={16} 
                    color={isDarkTheme ? '#e5e7eb' : '#1f2937'} 
                  />
                </TouchableOpacity>
              </View>

              {budgets.length > 0 ? (
                <>
                  {/* Display up to 4 budgets in a 2x2 grid layout */}
                  <View style={styles.budgetOverviewGrid}>
                    {budgets.slice(0, 4).map((budget, index) => {
                    const currentMonth = new Date().toISOString().slice(0, 7);
                    
                    const spent = transactions
                      .filter(exp => {
                        const expenseCategory = exp.category?.toLowerCase() || '';
                        const budgetCategory = budget.category?.toLowerCase() || '';
                        
                        const isMatch = expenseCategory === budgetCategory ||
                                      expenseCategory.includes(budgetCategory) ||
                                      budgetCategory.includes(expenseCategory);
                        
                        const isCurrentMonth = exp.date && exp.date.startsWith(currentMonth);
                        const isExpense = exp.type === 'expense';
                        
                        return isMatch && isCurrentMonth && isExpense;
                      })
                      .reduce((sum, exp) => sum + exp.amount, 0);
                    
                    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                    const isOverBudget = percentage > 100;
                    const isWarning = percentage > (budget.alertThreshold || 80);
                    
                    // Dynamic color based on progress
                    const progressColor = isOverBudget ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981';
                    const gradientColors = isOverBudget 
                      ? ['#FEE2E2', '#FECACA'] as const
                      : isWarning 
                        ? ['#FEF3C7', '#FDE68A'] as const
                        : ['#D1FAE5', '#A7F3D0'] as const;

                    return (
                      <Animated.View
                        key={budget.id}
                        entering={FadeInRight.delay(500 + index * 100)}
                        style={[
                          styles.budgetOverviewCard,
                          { backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff' }
                        ]}
                      >
                        <LinearGradient
                          colors={isDarkTheme 
                            ? ['#1f2937', '#374151'] as const
                            : gradientColors
                          }
                          style={styles.budgetOverviewCardGradient}
                        >
                          {/* Budget Category & Icon */}
                          <View style={styles.budgetOverviewCardHeader}>
                            <View style={[styles.budgetOverviewCategoryIcon, { backgroundColor: progressColor + '20' }]}>
                              <Ionicons name="receipt-outline" size={16} color={progressColor} />
                            </View>
                            <Text style={[
                              styles.budgetOverviewCardCategory, 
                              { color: isDarkTheme ? '#ffffff' : '#1f2937' }
                            ]} numberOfLines={1}>
                              {budget.category}
                            </Text>
                          </View>

                          {/* Progress Circle */}
                          <View style={styles.budgetOverviewProgressContainer}>
                            <View style={[styles.budgetOverviewProgressCircle, { borderColor: progressColor + '30' }]}>
                              <View style={[
                                styles.budgetOverviewProgressInnerCircle,
                                { backgroundColor: progressColor + '20' }
                              ]}>
                                <Text style={[styles.budgetOverviewProgressText, { color: progressColor }]}>
                                  {Math.round(percentage)}%
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Amount Details */}
                          <View style={styles.budgetOverviewAmountSection}>
                            <Text style={[
                              styles.budgetOverviewSpentAmount, 
                              { color: isDarkTheme ? '#e5e7eb' : '#374151' }
                            ]}>
                              ₹{spent.toLocaleString('en-IN')}
                            </Text>
                            <Text style={[
                              styles.budgetOverviewTotalAmount, 
                              { color: isDarkTheme ? '#9ca3af' : '#6b7280' }
                            ]}>
                              of ₹{budget.amount.toLocaleString('en-IN')}
                            </Text>
                          </View>

                          {/* Status Badge */}
                          {(isOverBudget || isWarning) && (
                            <View style={[
                              styles.budgetOverviewStatusBadge,
                              { backgroundColor: progressColor }
                            ]}>
                              <Ionicons 
                                name={isOverBudget ? "warning" : "alert-circle"} 
                                size={10} 
                                color="white" 
                              />
                              <Text style={styles.budgetOverviewStatusText}>
                                {isOverBudget ? 'Over' : 'Alert'}
                              </Text>
                            </View>
                          )}

                          {/* Progress Bar */}
                          <View style={[
                            styles.budgetOverviewProgressBar,
                            { backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb' }
                          ]}>
                            <Animated.View
                              style={[
                                styles.budgetOverviewProgressFill,
                                {
                                  width: `${Math.min(percentage, 100)}%`,
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
                </>
              ) : (
                <View style={styles.budgetOverviewEmptyState}>
                  <LinearGradient
                    colors={isDarkTheme ? ['#1f2937', '#374151'] : ['#f8fafc', '#f1f5f9']}
                    style={styles.budgetOverviewEmptyCard}
                  >
                    <Ionicons 
                      name="wallet-outline" 
                      size={48} 
                      color={isDarkTheme ? '#6b7280' : '#9ca3af'} 
                    />
                    <Text style={[
                      styles.budgetOverviewEmptyTitle, 
                      { color: isDarkTheme ? '#d1d5db' : '#374151' }
                    ]}>
                      No Budgets Yet
                    </Text>
                    <Text style={[
                      styles.budgetOverviewEmptySubtitle, 
                      { color: isDarkTheme ? '#9ca3af' : '#6b7280' }
                    ]}>
                      Create your first budget to start tracking spending
                    </Text>
                    <TouchableOpacity
                      onPress={() => setActiveTab('budgets')}
                      style={styles.budgetOverviewEmptyButton}
                    >
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.budgetOverviewEmptyButtonGradient}
                      >
                        <Ionicons name="add" size={16} color="white" />
                        <Text style={styles.budgetOverviewEmptyButtonText}>Create Budget</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              )}
            </Animated.View>
          </Animated.View>
        )}

        {activeTab === 'budgets' && (
          <BudgetTab
            budgets={budgets}
            transactions={transactions}
            isDarkTheme={isDarkTheme}
            onAddBudget={() => setShowAddBudget(true)}
          />
        )}

        {activeTab === 'goals' && (
          <SavingsTab
            savingsGoals={savingsGoals}
            isDarkTheme={isDarkTheme}
            onAddSavings={() => {
              setEditingSavingsGoal(null);
              setShowAddGoal(true);
            }}
            onDeleteGoal={deleteSavingsGoal}
            onUpdateProgress={updateSavingsGoalProgress}
            onEditGoal={(goal) => {
              setEditingSavingsGoal(goal);
              setShowAddGoal(true);
            }}
          />
        )}

        {activeTab === 'recurring' && (
          <RecurringTab
            recurrences={recurringTransactions}
            onAddRecurring={() => {
              setEditingRecurrence(null);
              setShowAddRecurring(true);
            }}
            onEditRecurring={(recurrence) => {
              setEditingRecurrence(recurrence);
              setShowAddRecurring(true);
            }}
            isDarkTheme={isDarkTheme}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsTab
            suggestions={smartSuggestions}
            transactions={transactions}
            budgets={budgets}
            isDarkTheme={isDarkTheme}
          />
        )}

        {activeTab === 'scanner-history' && (
          <ScannerHistoryTab
            isDarkTheme={isDarkTheme}
          />
        )}
      </ScrollView>

      {/* Add Recurring Transaction Dialog */}
      <AddRecurringDialog
        visible={showAddRecurring}
        onClose={() => {
          setShowAddRecurring(false);
          setEditingRecurrence(null);
        }}
        editingRecurrence={editingRecurrence}
        isDarkTheme={isDarkTheme}
      />

      {/* Add Budget Dialog */}
      <AddBudgetDialog
        visible={showAddBudget}
        onClose={() => setShowAddBudget(false)}
        isDarkTheme={isDarkTheme}
      />

      {/* Add Savings Goal Dialog */}
      <AddSavingsGoalDialog
        visible={showAddGoal}
        onClose={() => {
          setShowAddGoal(false);
          setEditingSavingsGoal(null);
        }}
        editingGoal={editingSavingsGoal}
        isDarkTheme={isDarkTheme}
      />
    </View>
  );
}

// Component: Quick Action Card
function QuickActionCard({ title, icon, color, onPress }: {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickActionCard, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Ionicons name={icon as any} size={24} color="white" />
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

// Component: Savings Goals Tab
// Component: Scanner History Tab
function ScannerHistoryTab({ isDarkTheme }: {
  isDarkTheme: boolean;
}) {
  const [scannerExpenses, setScannerExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadScannerHistory = async () => {
      try {
        const expenses = await EnhancedFirebaseService.getScannerExpenses();
        setScannerExpenses(expenses);
      } catch (error) {
        console.error('Error loading scanner history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScannerHistory();
  }, []);

  const toggleExpanded = (expenseId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(expenseId)) {
      newExpanded.delete(expenseId);
    } else {
      newExpanded.add(expenseId);
    }
    setExpandedItems(newExpanded);
  };

  const formatCurrency = (amount: number | undefined | null) => {
    // Handle undefined, null, NaN, or invalid numbers
    if (amount === undefined || amount === null || isNaN(amount) || typeof amount !== 'number') {
      return '₹0.00';
    }
    return `₹${amount.toFixed(2)}`;
  };

  const safeToFixed = (value: number | undefined | null, decimals: number = 2): string => {
    if (value === undefined || value === null || isNaN(value) || typeof value !== 'number') {
      if (decimals === 0) return '0';
      return '0.' + '0'.repeat(decimals);
    }
    return value.toFixed(decimals);
  };

  if (loading) {
    return (
      <Animated.View entering={FadeInUp.duration(500)} style={styles.tabContent}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="scan-outline" size={24} color={isDarkTheme ? '#ffffff' : '#1f2937'} />
          <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>Scanner History</Text>
        </View>
        <View style={styles.loadingState}>
          <Text style={[styles.loadingText, { color: isDarkTheme ? '#9ca3af' : '#64748b' }]}>Loading scanner history...</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.tabContent}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name="scan-outline" size={24} color={isDarkTheme ? '#ffffff' : '#1f2937'} />
        <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>Scanner History</Text>
      </View>
      
      {scannerExpenses.map((expense) => {
        const isExpanded = expandedItems.has(expense.id);
        const subtotal = parseFloat(expense.subtotalAmount) || 0;
        const gst = parseFloat(expense.gstAmount) || 0;
        const totalWithGST = subtotal + gst;
        
        return (
          <LinearGradient
            key={expense.id}
            colors={isDarkTheme ? ['#1f2937', '#374151'] : ['#ffffff', '#f8fafc']}
            style={[styles.scannerExpenseCard, { borderColor: isDarkTheme ? '#374151' : '#e2e8f0' }]}
          >
            <TouchableOpacity
              onPress={() => toggleExpanded(expense.id)}
              style={styles.scannerExpenseHeader}
            >
              <View style={styles.scannerExpenseMainInfo}>
                <View style={styles.scannerExpenseTitle}>
                  <Ionicons 
                    name="receipt" 
                    size={20} 
                    color={isDarkTheme ? '#10b981' : '#059669'} 
                    style={styles.scannerIcon}
                  />
                  <Text style={[styles.scannerMerchantName, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>
                    {expense.merchantName || 'Unknown Merchant'}
                  </Text>
                </View>
                
                <View style={styles.scannerExpenseAmountSection}>
                  <Text style={[styles.scannerTotalAmount, { color: isDarkTheme ? '#10b981' : '#059669' }]}>
                    {formatCurrency(totalWithGST)}
                  </Text>
                  <Text style={[styles.scannerDate, { color: isDarkTheme ? '#9ca3af' : '#64748b' }]}>
                    {new Date(expense.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.scannerExpenseSecondaryInfo}>
                <View style={styles.scannerCategoryBadge}>
                  <Text style={[styles.scannerCategoryText, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>
                    {expense.category || 'Other'}
                  </Text>
                </View>
                
                <Ionicons 
                  name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={isDarkTheme ? '#9ca3af' : '#64748b'} 
                />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.scannerExpenseDetails}>
                <View style={styles.scannerDetailsSection}>
                  <Text style={[styles.scannerDetailsSectionTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>
                    Transaction Details
                  </Text>
                  
                  <View style={styles.scannerDetailsGrid}>
                    <View style={styles.scannerDetailItem}>
                      <Text style={[styles.scannerDetailLabel, { color: isDarkTheme ? '#9ca3af' : '#64748b' }]}>Subtotal:</Text>
                      <Text style={[styles.scannerDetailValue, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>
                        {formatCurrency(expense.subtotalAmount)}
                      </Text>
                    </View>
                    
                    {gst > 0 && (
                      <View style={styles.scannerDetailItem}>
                        <Text style={[styles.scannerDetailLabel, { color: isDarkTheme ? '#9ca3af' : '#64748b' }]}>GST:</Text>
                        <Text style={[styles.scannerDetailValue, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>
                          {formatCurrency(gst)}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.scannerDetailItem}>
                      <Text style={[styles.scannerDetailLabel, { color: isDarkTheme ? '#9ca3af' : '#64748b' }]}>Total:</Text>
                      <Text style={[styles.scannerDetailValue, { color: isDarkTheme ? '#10b981' : '#059669', fontWeight: 'bold' }]}>
                        {formatCurrency(totalWithGST)}
                      </Text>
                    </View>
                  </View>
                </View>

                {expense.items && expense.items.length > 0 && (
                  <View style={styles.scannerDetailsSection}>
                    <Text style={[styles.scannerDetailsSectionTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>
                      Items ({expense.items.length})
                    </Text>
                    
                    {expense.items.slice(0, 5).map((item: any, index: number) => (
                      <View key={index} style={styles.scannerItemRow}>
                        <Text style={[styles.scannerItemName, { color: isDarkTheme ? '#e5e7eb' : '#374151' }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.scannerItemDetails}>
                          {item.quantity && (
                            <Text style={[styles.scannerItemQuantity, { color: isDarkTheme ? '#9ca3af' : '#64748b' }]}>
                              ×{item.quantity}
                            </Text>
                          )}
                          <Text style={[styles.scannerItemPrice, { color: isDarkTheme ? '#10b981' : '#059669' }]}>
                            {formatCurrency(item.price)}
                          </Text>
                        </View>
                      </View>
                    ))}
                    
                    {expense.items.length > 5 && (
                      <Text style={[styles.scannerItemsMore, { color: isDarkTheme ? '#9ca3af' : '#64748b' }]}>
                        +{expense.items.length - 5} more items
                      </Text>
                    )}
                  </View>
                )}

                {expense.notes && (
                  <View style={styles.scannerDetailsSection}>
                    <Text style={[styles.scannerDetailsSectionTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>
                      Notes
                    </Text>
                    <Text style={[styles.scannerNotesText, { color: isDarkTheme ? '#e5e7eb' : '#374151' }]}>
                      {expense.notes}
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}
          </LinearGradient>
        );
      })}
      
      {scannerExpenses.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="scan-outline" size={48} color={isDarkTheme ? '#4b5563' : '#9ca3af'} />
          <Text style={[styles.emptyStateText, { color: isDarkTheme ? '#9ca3af' : '#64748b' }]}>
            No receipt scans yet
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: isDarkTheme ? '#6b7280' : '#9ca3af' }]}>
            Use the scanner in the main app to scan receipts
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// Component: Insights Tab
function InsightsTab({ suggestions, transactions, budgets, isDarkTheme }: {
  suggestions: SmartSuggestion[];
  transactions: Transaction[];
  budgets: Budget[];
  isDarkTheme: boolean;
}) {
  const totalExpenses = transactions
    .filter((exp: Transaction) => exp.type === 'expense')
    .reduce((sum: number, exp: Transaction) => sum + exp.amount, 0);

  const totalIncome = transactions
    .filter((exp: Transaction) => exp.type === 'income')
    .reduce((sum: number, exp: Transaction) => sum + exp.amount, 0);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.tabContent}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name="bulb-outline" size={24} color={isDarkTheme ? '#ffffff' : '#1f2937'} />
        <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>Smart Insights</Text>
      </View>
      
      {/* Financial Overview */}
      <LinearGradient
        colors={['#1f2937', '#374151']}
        style={styles.insightCard}
      >
        <Text style={styles.insightTitle}>Financial Health Score</Text>
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>Savings Rate:</Text>
          <Text style={[
            styles.insightValue,
            { color: savingsRate > 20 ? '#10b981' : savingsRate > 10 ? '#f59e0b' : '#ef4444' }
          ]}>
            {savingsRate.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>Active Budgets:</Text>
          <Text style={styles.insightValue}>{budgets.length}</Text>
        </View>
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>This Month Transactions:</Text>
          <Text style={styles.insightValue}>{transactions.length}</Text>
        </View>
      </LinearGradient>

      {/* AI Suggestions */}
      {suggestions.map((suggestion) => (
        <LinearGradient
          key={suggestion.id}
          colors={['#1f2937', '#374151']}
          style={[
            styles.suggestionCard,
            { borderLeftWidth: 4, borderLeftColor: 
              suggestion.priority === 'high' ? '#ef4444' :
              suggestion.priority === 'medium' ? '#f59e0b' : '#10b981'
            }
          ]}
        >
          <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
          <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
          <View style={styles.suggestionFooter}>
            <Text style={[
              styles.priorityBadge,
              { backgroundColor:
                suggestion.priority === 'high' ? '#ef4444' :
                suggestion.priority === 'medium' ? '#f59e0b' : '#10b981'
              }
            ]}>
              {suggestion.priority.toUpperCase()}
            </Text>
            <Text style={styles.suggestionType}>{suggestion.type}</Text>
          </View>
        </LinearGradient>
      ))}
      
      {suggestions.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No insights available yet</Text>
          <Text style={styles.emptyStateSubtext}>Add more transactions to get AI-powered insights</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
    scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginTop: Platform.OS === 'android' ? -(StatusBar.currentHeight || 0) : 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 6,
  },
  userName: {
    fontSize: 26,
    color: 'white',
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
    flexWrap: 'wrap',
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  profileButton: {
    padding: 2,
  },
  profileIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 13,
    marginBottom: -1,
  },
  headerIcon: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 24,
  },
  welcomeText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
    marginTop: 1,
  },
  userText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  tabContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  tabScrollContainer: {
    paddingVertical: 10,
  },
  tabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#374151',
    minWidth: 80,
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: '#6366f1',
    elevation: 4,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeTabIcon: {
    transform: [{ scale: 1.1 }],
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -2,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  tabLabel: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#ffffff',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionCard: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  recentCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  overviewCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  budgetOverviewItem: {
    marginBottom: 16,
  },
  budgetOverviewInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetOverviewCategory: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  budgetOverviewAmount: {
    fontSize: 14,
    color: '#9ca3af',
  },
  budgetOverviewBar: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
  },
  budgetOverviewFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Enhanced Budget Overview Styles
  budgetOverviewSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  budgetOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  budgetOverviewTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetOverviewTitleInfo: {
    flex: 1,
  },
  budgetOverviewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetOverviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  budgetOverviewSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  budgetOverviewViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    minWidth: 90,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  budgetOverviewViewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  budgetOverviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 4,
  },
  budgetOverviewCard: {
    width: '47%', // Slightly less than 48% to ensure proper spacing
    minHeight: 160,
    maxHeight: 180,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  budgetOverviewCardGradient: {
    padding: 16,
    flex: 1, // Fill available card height
    justifyContent: 'space-between', // Distribute content evenly
  },
  budgetOverviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetOverviewCategoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  budgetOverviewCardCategory: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  budgetOverviewProgressContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetOverviewProgressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetOverviewProgressInnerCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetOverviewProgressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  budgetOverviewAmountSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetOverviewSpentAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  budgetOverviewTotalAmount: {
    fontSize: 11,
    fontWeight: '500',
  },
  budgetOverviewStatusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  budgetOverviewStatusText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'white',
  },
  budgetOverviewProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  budgetOverviewProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  budgetOverviewEmptyState: {
    alignItems: 'center',
  },
  budgetOverviewEmptyCard: {
    width: '100%',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  budgetOverviewEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  budgetOverviewEmptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  budgetOverviewEmptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  budgetOverviewEmptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  budgetOverviewEmptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  budgetCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetCategoryIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  budgetTitleText: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  budgetPeriod: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  budgetAmountSection: {
    marginBottom: 16,
  },
  budgetAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  budgetSpentLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  budgetSpentAmount: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  budgetTotalLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  budgetTotalAmount: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  budgetRemainingLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  budgetRemainingAmount: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  budgetProgressSection: {
    marginTop: 8,
  },
  budgetProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetPercentageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  budgetStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 16,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetAmount: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  goalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  goalPercentage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  goalAmount: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  goalDays: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  recurringCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recurringTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  recurringAmount: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    marginBottom: 4,
  },
  recurringCategory: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  recurringNext: {
    fontSize: 12,
    color: '#6b7280',
  },
  insightCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
    lineHeight: 20,
  },
  suggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#374151',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    color: '#ffffff',
    height: 50,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  goalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    gap: 8,
  },
  goalActionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  goalActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  goalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recurringActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  recurringActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  recurringActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  recurringActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  // Professional Header Styles
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  patternCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  patternCircle1: {
    width: 100,
    height: 100,
    top: -30,
    right: 20,
  },
  patternCircle2: {
    width: 60,
    height: 60,
    top: 40,
    right: -10,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 10,
  },
  logoGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  brandTextContainer: {
    flex: 1,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: -1,
  },
  brandSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  userWelcome: {
    marginLeft: 4,
  },
  welcomeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    marginBottom: 2,
  },
  
  // Professional User Info Styles
  userInfoContainer: {
    marginTop: 8,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userAvatarContainer: {
    marginRight: 8,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userInitial: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userGreeting: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    marginBottom: 1,
  },
  
  // Professional Quick Actions Styles
  quickActionsContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },
  essentialActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: -5,
  },
  essentialActionCard: {
    width: '48%',
    height: 140,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  essentialActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  essentialActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  essentialActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  essentialActionSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    opacity: 0.8,
  },
  
  // Professional Transactions Styles
  transactionsContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
  },
  seeAllText: {
    fontSize: 15,
    color: '#6366F1',
    fontWeight: '700',
    marginRight: 4,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
  },
  transactionsList: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  transactionContent: {
    flex: 1,
  },
  transactionAmountText: {
    fontSize: 18,
    fontWeight: '800',
  },
  
  // Scanner History Styles
  loadingState: {
    padding: 40,
    alignItems: 'center',
  },
  scannerExpenseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scannerExpenseHeader: {
    marginBottom: 12,
  },
  scannerExpenseMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  scannerExpenseTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  scannerIcon: {
    marginRight: 8,
  },
  scannerMerchantName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  scannerExpenseAmountSection: {
    alignItems: 'flex-end',
  },
  scannerTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  scannerDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  scannerExpenseSecondaryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scannerCategoryBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scannerCategoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scannerExpenseDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 0.3)',
    paddingTop: 16,
    marginTop: 8,
  },
  scannerDetailsSection: {
    marginBottom: 16,
  },
  scannerDetailsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  scannerDetailsGrid: {
    gap: 8,
  },
  scannerDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  scannerDetailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  scannerDetailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  scannerItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(156, 163, 175, 0.2)',
  },
  scannerItemName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  scannerItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scannerItemQuantity: {
    fontSize: 12,
    fontWeight: '500',
  },
  scannerItemPrice: {
    fontSize: 13,
    fontWeight: '600',
  },
  scannerItemsMore: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  scannerNotesText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});