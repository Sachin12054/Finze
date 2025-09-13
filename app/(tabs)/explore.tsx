import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
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
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../src/contexts/ThemeContext';
import { auth, db } from '../../src/services/firebase';

// Import Enhanced Firebase Service for consistent data handling like index.tsx
import {
  Budget,
  EnhancedFirebaseService,
  SavingsGoal as FirebaseSavingsGoal,
  Transaction
} from '../../src/services/enhancedFirebaseService';



// Local types for recurring transactions and smart suggestions (not in enhanced service yet)
interface RecurringTransaction {
  id?: string;
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastApplied: string;
  nextDue: string;
  isActive: boolean;
}

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

const categories = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Bills & Utilities', 'Healthcare', 'Education', 'Travel',
  'Investment', 'Income', 'Other'
];

export default function ExploreDashboard() {
  const { isDarkTheme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states - using Firebase types for consistency with index.tsx
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<FirebaseSavingsGoal[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  
  // Financial summary
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'overview' | 'budgets' | 'goals' | 'recurring' | 'insights'>('overview');
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  
  // Modal states
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  
  // Form states
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: '',
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    alertThreshold: 80
  });
  
  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    category: 'Other',
    priority: 'medium' as 'low' | 'medium' | 'high',
    description: ''
  });
  
  const [recurringForm, setRecurringForm] = useState({
    title: '',
    amount: '',
    category: '',
    type: 'expense' as 'income' | 'expense',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly'
  });

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

    // Recurring transactions listener (using direct Firestore)
    const recurringRef = collection(db, `users/${userId}/recurring_expenses`);
    const unsubRecurring = onSnapshot(
      recurringRef, 
      (snapshot) => {
        const recurringData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RecurringTransaction[];
        setRecurringTransactions(recurringData);
      },
      (error) => {
        console.error('Error fetching recurring transactions:', error);
        setRecurringTransactions([]);
      }
    );

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

  // Add budget function
  const addBudget = async () => {
    if (!user) return;

    try {
      const amount = parseFloat(budgetForm.amount);
      if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid budget amount', 'error');
        return;
      }

      if (!budgetForm.category) {
        showToast('Please select a category', 'error');
        return;
      }

      const budget: Omit<Budget, 'id'> = {
        category: budgetForm.category,
        amount,
        spent: 0,
        period: budgetForm.period,
        alertThreshold: budgetForm.alertThreshold,
        isActive: true,
        userId: user.uid,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        notifications: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, `users/${user.uid}/budgets`), budget);
      
      showToast('Budget created successfully');

      setBudgetForm({
        category: '',
        amount: '',
        period: 'monthly',
        alertThreshold: 80
      });
      setShowAddBudget(false);
    } catch (error) {
      showToast('Failed to create budget', 'error');
    }
  };

  // Add savings goal function
  const addSavingsGoal = async () => {
    if (!user) return;

    try {
      const targetAmount = parseFloat(goalForm.targetAmount);
      if (isNaN(targetAmount) || targetAmount <= 0) {
        showToast('Please enter a valid target amount', 'error');
        return;
      }

      if (!goalForm.name.trim() || !goalForm.targetDate) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const goal: Omit<SavingsGoal, 'id'> = {
        ...goalForm,
        targetAmount,
        currentAmount: 0,
        isCompleted: false
      };

      await addDoc(collection(db, `users/${user.uid}/savings_goals`), goal);
      
      showToast('Savings goal created successfully');

      setGoalForm({
        name: '',
        targetAmount: '',
        targetDate: '',
        category: 'Other',
        priority: 'medium',
        description: ''
      });
      setShowAddGoal(false);
    } catch (error) {
      showToast('Failed to create savings goal', 'error');
    }
  };

  // Add recurring transaction function
  const addRecurringTransaction = async () => {
    if (!user) return;

    try {
      const amount = parseFloat(recurringForm.amount);
      if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
      }

      if (!recurringForm.title.trim() || !recurringForm.category) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const nextDue = new Date();
      // Calculate next due date based on frequency
      switch (recurringForm.frequency) {
        case 'daily':
          nextDue.setDate(nextDue.getDate() + 1);
          break;
        case 'weekly':
          nextDue.setDate(nextDue.getDate() + 7);
          break;
        case 'monthly':
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
        case 'yearly':
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          break;
      }

      const recurringTransaction: Omit<RecurringTransaction, 'id'> = {
        title: recurringForm.title,
        amount,
        category: recurringForm.category,
        type: recurringForm.type,
        frequency: recurringForm.frequency,
        lastApplied: new Date().toISOString(),
        nextDue: nextDue.toISOString(),
        isActive: true
      };

      await addDoc(collection(db, `users/${user.uid}/recurring_expenses`), recurringTransaction);
      
      showToast('Recurring transaction created successfully');

      setRecurringForm({
        title: '',
        amount: '',
        category: '',
        type: 'expense',
        frequency: 'monthly'
      });
      setShowAddRecurring(false);
    } catch (error) {
      showToast('Failed to create recurring transaction', 'error');
    }
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
              await deleteDoc(doc(db, `users/${user.uid}/budgets`, budgetId));
              showToast('Budget deleted successfully');
            } catch (error) {
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
  const toggleRecurringStatus = async (recurringId: string) => {
    if (!user) return;
    
    try {
      const recurringRef = doc(db, `users/${user.uid}/recurring_expenses`, recurringId);
      const recurring = recurringTransactions.find(r => r.id === recurringId);
      
      if (!recurring) return;
      
      await updateDoc(recurringRef, {
        isActive: !recurring.isActive
      });
      
      showToast(`Recurring transaction ${!recurring.isActive ? 'activated' : 'paused'}`);
    } catch (error) {
      showToast('Failed to update recurring transaction', 'error');
    }
  };

  // Delete recurring transaction
  const deleteRecurringTransaction = async (recurringId: string) => {
    if (!user) return;
    
    Alert.alert(
      'Delete Recurring Transaction',
      'Are you sure you want to delete this recurring transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, `users/${user.uid}/recurring_expenses`, recurringId));
              showToast('Recurring transaction deleted successfully');
            } catch (error) {
              showToast('Failed to delete recurring transaction', 'error');
            }
          }
        }
      ]
    );
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: isDarkTheme ? '#0f172a' : '#f8fafc' }]}>
        <Text style={[styles.loadingText, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>Loading Dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkTheme ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={isDarkTheme ? "#0f172a" : "#f8fafc"} />
      
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
                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={() => {}}
                  accessibilityLabel="Open profile"
                >
                  <View style={styles.profileIcon}>
                    <Ionicons name="person" size={26} color="white" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Tab Navigation */}
        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContainer}>
            {[
              { key: 'overview', label: 'Overview', icon: 'analytics-outline' },
              { key: 'budgets', label: 'Budgets', icon: 'wallet-outline' },
              { key: 'goals', label: 'Goals', icon: 'flag-outline' },
              { key: 'recurring', label: 'Recurring', icon: 'repeat-outline' },
              { key: 'insights', label: 'Insights', icon: 'bulb-outline' }
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
                <Text style={styles.sectionTitle}>Quick Actions</Text>
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
                    <View style={[styles.essentialActionIcon, { backgroundColor: '#E8F2FF' }]}>
                      <Ionicons name="wallet" size={26} color="#2563EB" />
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
                    <View style={[styles.essentialActionIcon, { backgroundColor: '#F3E8FF' }]}>
                      <Ionicons name="repeat" size={26} color="#9333EA" />
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
                    <View style={[styles.essentialActionIcon, { backgroundColor: '#E0F7FA' }]}>
                      <Ionicons name="flag" size={26} color="#0891B2" />
                    </View>
                    <Text style={[styles.essentialActionTitle, { color: isDarkTheme ? '#ffffff' : '#1E293B' }]}>Set Goal</Text>
                    <Text style={[styles.essentialActionSubtitle, { color: isDarkTheme ? '#9ca3af' : '#64748B' }]}>Save money</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.essentialActionCard, { backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff', borderColor: isDarkTheme ? '#374151' : '#F1F5F9' }]}
                  onPress={() => {}}
                  accessibilityLabel="Scan receipt"
                  activeOpacity={0.7}
                >
                  <View style={styles.essentialActionContent}>
                    <View style={[styles.essentialActionIcon, { backgroundColor: '#FEF2F2' }]}>
                      <Ionicons name="scan" size={26} color="#DC2626" />
                    </View>
                    <Text style={[styles.essentialActionTitle, { color: isDarkTheme ? '#ffffff' : '#1E293B' }]}>Smart Scan</Text>
                    <Text style={[styles.essentialActionSubtitle, { color: isDarkTheme ? '#9ca3af' : '#64748B' }]}>Receipt AI</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Budget Overview */}
            <View style={[styles.overviewCard, { backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff' }]}>
              <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>Budget Overview</Text>
              {budgets.slice(0, 3).map((budget) => {
                const currentMonth = new Date().toISOString().slice(0, 7);
                
                // More flexible category matching (using category for Dashboard type)
                const spent = transactions
                  .filter(exp => {
                    const expenseCategory = exp.category?.toLowerCase() || '';
                    const budgetCategory = budget.category?.toLowerCase() || '';
                    
                    // Exact match or partial match for categories like "Food & Dining" vs "Food"
                    const isMatch = expenseCategory === budgetCategory ||
                                  expenseCategory.includes(budgetCategory) ||
                                  budgetCategory.includes(expenseCategory);
                    
                    const isCurrentMonth = exp.date && exp.date.startsWith(currentMonth);
                    const isExpense = exp.type === 'expense';
                    
                    return isMatch && isCurrentMonth && isExpense;
                  })
                  .reduce((sum, exp) => sum + exp.amount, 0);
                
                const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

                return (
                  <View key={budget.id} style={styles.budgetOverviewItem}>
                    <View style={styles.budgetOverviewInfo}>
                      <Text style={styles.budgetOverviewCategory}>{budget.category}</Text>
                      <Text style={styles.budgetOverviewAmount}>
                        ₹{spent.toFixed(0)} / ₹{budget.amount.toFixed(0)}
                      </Text>
                    </View>
                    <View style={styles.budgetOverviewBar}>
                      <View
                        style={[
                          styles.budgetOverviewFill,
                          {
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: percentage > 80 ? '#ef4444' : '#10b981'
                          }
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
              {budgets.length === 0 && (
                <Text style={styles.emptyStateText}>No budgets created yet</Text>
              )}
            </View>
          </Animated.View>
        )}

        {activeTab === 'budgets' && (
          <BudgetsTab
            budgets={budgets}
            transactions={transactions}
            onDeleteBudget={deleteBudget}
            isDarkTheme={isDarkTheme}
          />
        )}

        {activeTab === 'goals' && (
          <SavingsGoalsTab
            goals={savingsGoals}
            onDeleteGoal={deleteSavingsGoal}
            onUpdateProgress={updateSavingsGoalProgress}
            isDarkTheme={isDarkTheme}
          />
        )}

        {activeTab === 'recurring' && (
          <RecurringTab
            recurring={recurringTransactions}
            onToggleStatus={toggleRecurringStatus}
            onDeleteRecurring={deleteRecurringTransaction}
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
      </ScrollView>

      {/* Add Recurring Transaction Modal */}
      <Modal visible={showAddRecurring} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>Add Recurring Transaction</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6', color: isDarkTheme ? '#ffffff' : '#1f2937' }]}
              placeholder="Title"
              placeholderTextColor={isDarkTheme ? "#9ca3af" : "#6b7280"}
              value={recurringForm.title}
              onChangeText={(text) => setRecurringForm({...recurringForm, title: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={recurringForm.amount}
              onChangeText={(text) => setRecurringForm({...recurringForm, amount: text})}
            />

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={recurringForm.category}
                style={styles.picker}
                onValueChange={(itemValue) => setRecurringForm({...recurringForm, category: itemValue})}
              >
                <Picker.Item label="Select Category" value="" />
                {categories.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={recurringForm.type}
                style={styles.picker}
                onValueChange={(itemValue) => setRecurringForm({...recurringForm, type: itemValue})}
              >
                <Picker.Item label="Expense" value="expense" />
                <Picker.Item label="Income" value="income" />
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={recurringForm.frequency}
                style={styles.picker}
                onValueChange={(itemValue) => setRecurringForm({...recurringForm, frequency: itemValue})}
              >
                <Picker.Item label="Daily" value="daily" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Monthly" value="monthly" />
                <Picker.Item label="Yearly" value="yearly" />
              </Picker>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddRecurring(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={addRecurringTransaction}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Budget Modal */}
      <Modal visible={showAddBudget} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Budget</Text>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={budgetForm.category}
                style={styles.picker}
                onValueChange={(itemValue) => setBudgetForm({...budgetForm, category: itemValue})}
              >
                <Picker.Item label="Select Category" value="" />
                {categories.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Budget Amount"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={budgetForm.amount}
              onChangeText={(text) => setBudgetForm({...budgetForm, amount: text})}
            />

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={budgetForm.period}
                style={styles.picker}
                onValueChange={(itemValue) => setBudgetForm({...budgetForm, period: itemValue})}
              >
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Monthly" value="monthly" />
                <Picker.Item label="Yearly" value="yearly" />
              </Picker>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddBudget(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={addBudget}
              >
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Goal Modal */}
      <Modal visible={showAddGoal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Savings Goal</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Goal Name"
              placeholderTextColor="#9ca3af"
              value={goalForm.name}
              onChangeText={(text) => setGoalForm({...goalForm, name: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Target Amount"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={goalForm.targetAmount}
              onChangeText={(text) => setGoalForm({...goalForm, targetAmount: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Target Date (YYYY-MM-DD)"
              placeholderTextColor="#9ca3af"
              value={goalForm.targetDate}
              onChangeText={(text) => setGoalForm({...goalForm, targetDate: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              placeholderTextColor="#9ca3af"
              value={goalForm.description}
              onChangeText={(text) => setGoalForm({...goalForm, description: text})}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddGoal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={addSavingsGoal}
              >
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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

// Component: Budgets Tab
function BudgetsTab({ budgets, transactions, onDeleteBudget, isDarkTheme }: {
  budgets: Budget[];
  transactions: Transaction[];
  onDeleteBudget: (id: string) => void;
  isDarkTheme: boolean;
}) {
  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.tabContent}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name="wallet-outline" size={24} color={isDarkTheme ? '#ffffff' : '#1f2937'} />
        <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>Budget Management</Text>
      </View>
      
      {budgets.map((budget) => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        // More flexible category matching
        const spent = transactions
          .filter((exp: Transaction) => {
            const expenseCategory = exp.category?.toLowerCase() || '';
            const budgetCategory = budget.category?.toLowerCase() || '';
            
            // Exact match or partial match for categories like "Food & Dining" vs "Food"
            const isMatch = expenseCategory === budgetCategory ||
                          expenseCategory.includes(budgetCategory) ||
                          budgetCategory.includes(expenseCategory);
            
            const isCurrentMonth = exp.date.startsWith(currentMonth);
            const isExpense = exp.type === 'expense';
            
            return isMatch && isCurrentMonth && isExpense;
          })
          .reduce((sum: number, exp: Transaction) => sum + exp.amount, 0);
        
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const isOverBudget = percentage > 100;
        const isWarning = percentage > (budget.alertThreshold || 80);

        return (
          <LinearGradient
            key={budget.id}
            colors={['#1f2937', '#374151']}
            style={styles.budgetCard}
          >
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetCategory}>{budget.category}</Text>
              <TouchableOpacity
                onPress={() => onDeleteBudget(budget.id!)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
            
            <Text style={[
              styles.budgetPercentageText,
              { color: isOverBudget ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981' }
            ]}>
              {percentage.toFixed(1)}% used
            </Text>
            
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: isOverBudget ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'
                  }
                ]}
              />
            </View>
            
            <Text style={styles.budgetAmount}>
              ₹{spent.toFixed(2)} / ₹{budget.amount.toFixed(2)}
            </Text>
            <Text style={styles.budgetPeriod}>Period: {budget.period}</Text>
          </LinearGradient>
        );
      })}
      
      {budgets.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No budgets created yet</Text>
          <Text style={styles.emptyStateSubtext}>Create your first budget to start tracking spending</Text>
        </View>
      )}
    </Animated.View>
  );
}

// Component: Savings Goals Tab
function SavingsGoalsTab({ goals, onDeleteGoal, onUpdateProgress, isDarkTheme }: {
  goals: SavingsGoal[];
  onDeleteGoal: (id: string) => void;
  onUpdateProgress: (goalId: string, additionalAmount: number) => void;
  isDarkTheme: boolean;
}) {
  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.tabContent}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name="flag-outline" size={24} color={isDarkTheme ? '#ffffff' : '#1f2937'} />
        <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>Savings Goals</Text>
      </View>
      
      {goals.map((goal) => {
        const percentage = (goal.currentAmount / goal.targetAmount) * 100;
        const isCompleted = percentage >= 100;
        const remainingDays = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        return (
          <LinearGradient
            key={goal.id}
            colors={['#1f2937', '#374151']}
            style={styles.goalCard}
          >
            <View style={styles.goalHeader}>
              <Text style={styles.goalName}>{goal.name}</Text>
              <TouchableOpacity
                onPress={() => onDeleteGoal(goal.id!)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
            
            <Text style={[
              styles.goalPercentage,
              { color: isCompleted ? '#10b981' : '#06b6d4' }
            ]}>
              {percentage.toFixed(1)}% complete
            </Text>
            
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: isCompleted ? '#10b981' : '#06b6d4'
                  }
                ]}
              />
            </View>
            
            <Text style={styles.goalAmount}>
              ₹{goal.currentAmount.toFixed(2)} / ₹{goal.targetAmount.toFixed(2)}
            </Text>

            {!isCompleted && (
              <View style={styles.goalActions}>
                <TouchableOpacity
                  style={[styles.goalActionButton, { backgroundColor: '#10b981' }]}
                  onPress={() => {
                    Alert.prompt(
                      'Add Money',
                      'Enter amount to add to this goal:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Add',
                          onPress: (amount) => {
                            const numAmount = parseFloat(amount || '0');
                            if (numAmount > 0) {
                              onUpdateProgress(goal.id!, numAmount);
                            }
                          }
                        }
                      ],
                      'plain-text',
                      '',
                      'numeric'
                    );
                  }}
                >
                  <View style={styles.goalActionRow}>
                    <Ionicons name="add-circle" size={16} color="#ffffff" />
                    <Text style={styles.goalActionText}>Add Money</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.goalActionButton, { backgroundColor: '#6366f1' }]}
                  onPress={() => {
                    Alert.alert(
                      'Complete Goal',
                      'Mark this goal as completed?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Complete',
                          onPress: () => {
                            const remainingAmount = goal.targetAmount - goal.currentAmount;
                            onUpdateProgress(goal.id!, remainingAmount);
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.goalActionText}>✅ Complete</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.goalDays}>
              {remainingDays > 0 ? `${remainingDays} days remaining` : 'Goal deadline passed'}
            </Text>
            
            {goal.description && (
              <Text style={styles.goalDescription}>{goal.description}</Text>
            )}

            <View style={styles.goalFooter}>
              <Text style={[
                styles.priorityBadge,
                { backgroundColor:
                  goal.priority === 'high' ? '#ef4444' :
                  goal.priority === 'medium' ? '#f59e0b' : '#10b981'
                }
              ]}>
                {goal.priority.toUpperCase()}
              </Text>
            </View>
          </LinearGradient>
        );
      })}
      
      {goals.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No savings goals created yet</Text>
          <Text style={styles.emptyStateSubtext}>Set your first goal to start saving</Text>
        </View>
      )}
    </Animated.View>
  );
}

// Component: Recurring Tab
function RecurringTab({ recurring, onToggleStatus, onDeleteRecurring, isDarkTheme }: {
  recurring: RecurringTransaction[];
  onToggleStatus: (recurringId: string) => void;
  onDeleteRecurring: (recurringId: string) => void;
  isDarkTheme: boolean;
}) {
  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.tabContent}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name="repeat-outline" size={24} color={isDarkTheme ? '#ffffff' : '#1f2937'} />
        <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>Recurring Transactions</Text>
      </View>
      
      {recurring.map((item) => (
        <LinearGradient
          key={item.id}
          colors={['#1f2937', '#374151']}
          style={styles.recurringCard}
        >
          <View style={styles.recurringHeader}>
            <Text style={styles.recurringTitle}>{item.title}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.isActive ? '#10b981' : '#ef4444' }
            ]}>
              <Text style={styles.statusText}>
                {item.isActive ? 'Active' : 'Paused'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.recurringAmount}>
            ₹{item.amount.toFixed(2)} • {item.frequency}
          </Text>
          <Text style={styles.recurringCategory}>{item.category}</Text>
          <Text style={styles.recurringNext}>
            Next due: {new Date(item.nextDue).toLocaleDateString()}
          </Text>

          <View style={styles.recurringActions}>
            <TouchableOpacity
              style={[
                styles.recurringActionButton,
                { backgroundColor: item.isActive ? '#f59e0b' : '#10b981' }
              ]}
              onPress={() => onToggleStatus(item.id!)}
            >
              <View style={styles.recurringActionRow}>
                <Ionicons 
                  name={item.isActive ? 'pause-outline' : 'play-outline'} 
                  size={14} 
                  color="white" 
                />
                <Text style={styles.recurringActionText}>
                  {item.isActive ? 'Pause' : 'Resume'}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.recurringActionButton, { backgroundColor: '#ef4444' }]}
              onPress={() => onDeleteRecurring(item.id!)}
            >
              <View style={styles.recurringActionRow}>
                <Ionicons name="trash-outline" size={14} color="white" />
                <Text style={styles.recurringActionText}>Delete</Text>
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      ))}
      
      {recurring.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No recurring transactions set up</Text>
          <Text style={styles.emptyStateSubtext}>Add recurring transactions to automate your finances</Text>
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
  header: {
    marginTop: 8,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    marginBottom: 16,
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
    marginBottom: 20,
  },
  essentialActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
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
});
