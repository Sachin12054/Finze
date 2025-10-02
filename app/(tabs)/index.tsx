import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    RefreshControl,
    Animated as RNAnimated,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
    SlideInRight,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from "react-native-reanimated";
import Toast from 'react-native-toast-message';

import { useTheme } from '../../src/contexts/ThemeContext';
import { databaseService } from "../../src/services/databaseService";
import {
    Budget as EnhancedBudget,
    EnhancedFirebaseService,
    SavingsGoal as EnhancedSavingsGoal,
    Transaction as EnhancedTransaction
} from "../../src/services/enhancedFirebaseService";
import { auth } from "../../src/services/firebase";
import {
    AIInsight,
    UserProfile
} from "../../src/types/database";

// Import hooks
import { useToast } from '../../src/hooks/useToast';

// Import components
import AddExpenseDialog from '../../src/components/AddExpenseDialog';
import { CalendarComponent } from '../../src/components/CalendarComponent';
import { FirebaseStatusBanner } from '../../src/components/FirebaseStatusBanner';
import { ProfileDialog } from '../../src/components/ProfileDialog';
import ScannerDialog from '../../src/components/ScannerDialog';
import { SmartSuggestionsComponent } from '../../src/components/SmartSuggestionsComponent';
import TransactionHistory from '../../src/components/TransactionHistory';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Category icons mapping
const categoryIcons = {
  'Food & Dining': 'restaurant',
  'Food': 'fast-food',
  'Transportation': 'car',
  'Travel': 'airplane',
  'Shopping': 'bag',
  'Entertainment': 'film',
  'Healthcare': 'medical',
  'Utilities': 'flash',
  'Education': 'school',
  'Investment': 'trending-up',
  'Insurance': 'shield',
  'Rent': 'home',
  'Bills': 'card',
  'Other': 'grid',
} as const;

// Error logging debounce
let lastErrorLogTime = 0;
const ERROR_LOG_DEBOUNCE = 5000; // 5 seconds

export default function HomeScreen() {
  const { isDarkTheme, toggleTheme } = useTheme();
  const router = useRouter();
  const { toast } = useToast();
  
  // Animation values
  const balanceOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const themeToggleScale = useRef(new RNAnimated.Value(1)).current;
  const themeToggleRotate = useRef(new RNAnimated.Value(0)).current;
  
  // User and authentication state
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Financial data with new structure
  const [transactions, setTransactions] = useState<EnhancedTransaction[]>([]);
  const [budgets, setBudgets] = useState<EnhancedBudget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<EnhancedSavingsGoal[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [financialSummary, setFinancialSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    currentMonthIncome: 0,
    currentMonthExpenses: 0
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  
  // Debounced refresh function to prevent calendar flickering
  const debouncedRefresh = useCallback(() => {
    const now = Date.now();
    const REFRESH_DEBOUNCE = 3000; // 3 second debounce to prevent excessive refreshing
    
    if (now - lastRefreshTime > REFRESH_DEBOUNCE) {
      setLastRefreshTime(now);
      setRefreshKey(prev => prev + 1);
    }
  }, [lastRefreshTime]);
  
  // UI state
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  // Generate styles based on theme
  const styles = getStyles(isDarkTheme);

  // Animated styles
  const balanceCardStyle = useAnimatedStyle(() => {
    return {
      opacity: balanceOpacity.value,
      transform: [{ scale: cardScale.value }],
    };
  });

  // Calculate derived data using financial summary
  const balance = financialSummary.balance;
  const monthlyIncome = financialSummary.currentMonthIncome;
  const monthlyExpenses = financialSummary.currentMonthExpenses;
  
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });
  const currentMonthExpenseAmount = financialSummary.currentMonthExpenses;
  const totalBudgetAmount = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const budgetProgress = totalBudgetAmount > 0 ? (currentMonthExpenseAmount / totalBudgetAmount) * 100 : 0;





  // Theme toggle animation function
  const animateThemeToggle = () => {
    RNAnimated.parallel([
      RNAnimated.sequence([
        RNAnimated.timing(themeToggleScale, {
          toValue: 0.85,
          duration: 150,
          useNativeDriver: true,
        }),
        RNAnimated.timing(themeToggleScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      RNAnimated.timing(themeToggleRotate, {
        toValue: isDarkTheme ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    toggleTheme();
  };

  useEffect(() => {
    // Animate components on load
    balanceOpacity.value = withTiming(1, { duration: 800 });
    cardScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, []);

  useEffect(() => {
    let unsubscribeFunctions: (() => void)[] = [];

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          router.replace("/auth/login");
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // Load user profile
        try {
          const profile = await databaseService.getUserById(currentUser.uid);
          if (profile) {
            setUserProfile(profile.profile);
          } else {
            // Create default profile for new user
            await databaseService.createUser({
              email: currentUser.email || "",
              displayName: currentUser.displayName || "User",
              profile: {
                totalBalance: 0,
                monthlyIncome: 0,
                monthlyExpenses: 0,
                preferences: {}
              }
            });
            const newProfile = await databaseService.getUserById(currentUser.uid);
            setUserProfile(newProfile?.profile || {});
          }
        } catch (profileError: any) {
          // Continue without profile data - user can set it up later
          setUserProfile(null);
        }

        // Set up real-time listeners
        try {
          // Use Enhanced Firebase Service for all data
          const unsubscribeTransactions = EnhancedFirebaseService.getTransactionsListener(async (transactionData) => {
            setTransactions(transactionData);

            // Force refresh financial summary whenever transactions change
            try {
              // Add small delay to ensure Firebase operations complete
              await new Promise(resolve => setTimeout(resolve, 100));
              
              const summary = await EnhancedFirebaseService.getUserFinancialSummary();
              setFinancialSummary(summary);
              
              // Use debounced refresh to prevent calendar flickering
              debouncedRefresh();
              setRefreshing(false);
            } catch (error) {
              const now = Date.now();
              if (now - lastErrorLogTime > ERROR_LOG_DEBOUNCE) {
                lastErrorLogTime = now;
                console.error('❌ Error refreshing financial summary:', error);
              }
            }
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

          // Load financial summary
          const loadFinancialSummary = async () => {
            try {
              const summary = await EnhancedFirebaseService.getUserFinancialSummary();
              setFinancialSummary(summary);
              debouncedRefresh();
            } catch (error) {
              // Silent fail for summary load
            }
          };

          // Load initial financial summary
          loadFinancialSummary();
          // Note: Real-time updates are handled by transaction listeners above

        } catch (listenersError) {
          // Silent fail for listeners setup
        }

        setLoading(false);

      } catch (error) {
        toast({
          title: "Authentication Error",
          description: "Please try signing in again",
          variant: "destructive"
        });
        setLoading(false);
        router.replace("/auth/login");
      }
    });

    return () => {
      unsubscribe();
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }, []);

  const handleAddTransaction = async (transactionData: any) => {
    try {
      await EnhancedFirebaseService.addTransaction({
        amount: transactionData.amount,
        date: transactionData.date || new Date().toISOString(),
        type: transactionData.type || 'expense',
        category: transactionData.category,
        title: transactionData.title || transactionData.description,
        description: transactionData.description || transactionData.title,
        source: 'Manual',
        paymentMethod: 'Unknown'
      });

      setShowAddExpense(false);

      // Refresh financial summary after adding transaction
      try {
        const summary = await EnhancedFirebaseService.getUserFinancialSummary();
        setFinancialSummary(summary);
      } catch (summaryError) {
        // Silent fail for summary refresh
      }

      toast({
        title: "Success!",
        description: `${transactionData.type === 'income' ? 'Income' : 'Expense'} added successfully`,
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      
      // Clear local state
      setUser(null);
      setUserProfile(null);
      setTransactions([]);
      setBudgets([]);
      setSavingsGoals([]);
      setAIInsights([]);
      
      router.replace("/auth/login");
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh profile data and financial summary
      if (auth.currentUser) {
        const [updatedProfile, updatedSummary] = await Promise.all([
          databaseService.getUserById(auth.currentUser.uid),
          EnhancedFirebaseService.getUserFinancialSummary()
        ]);

        if (updatedProfile) {
          setUserProfile(updatedProfile.profile);
        }

        setFinancialSummary(updatedSummary);
        debouncedRefresh();
      }

      toast({
        title: "Refreshed",
        description: "Data updated successfully",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Please check your connection",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <ActivityIndicator size="large" color="white" />
        </LinearGradient>
        <Animated.Text entering={FadeInUp.delay(300)} style={styles.loadingText}>
          Setting up your dashboard...
        </Animated.Text>
        <Text style={{
          fontSize: 14,
          color: '#94A3B8',
          textAlign: 'center',
          marginTop: 8,
          paddingHorizontal: 40,
        }}>
          Please wait while we sync your financial data
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} key={`dashboard-${refreshKey}-${financialSummary.balance}-${transactions.length}`}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      
      {/* Firebase Status Banner */}
      <FirebaseStatusBanner />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
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
                  {userProfile?.displayName || user?.displayName || "User"}
                </Text>
              </View>
              <View style={styles.headerRight}>
                <RNAnimated.View style={{
                  transform: [
                    { scale: themeToggleScale },
                    { 
                      rotate: themeToggleRotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      })
                    }
                  ]
                }}>
                  <TouchableOpacity
                    style={styles.themeToggle}
                    onPress={animateThemeToggle}
                    accessibilityLabel="Toggle theme"
                  >
                    <Ionicons 
                      name={isDarkTheme ? "sunny" : "moon"} 
                      size={22} 
                      color="white" 
                    />
                  </TouchableOpacity>
                </RNAnimated.View>
                
                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={() => setShowProfileDialog(true)}
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

        {/* Enhanced Balance Card - Dashboard Style */}
        <Animated.View style={[styles.balanceCardContainer, balanceCardStyle]} key={`balance-${refreshKey}-${financialSummary.balance}-${financialSummary.currentMonthExpenses}`}>
          <LinearGradient
            colors={isDarkTheme ? ['#1e293b', '#334155', '#475569'] : ['#f8fafc', '#e2e8f0', '#cbd5e1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceHeader}>
              <View style={styles.balanceTitleContainer}>
                <Text style={styles.balanceIcon}>💳</Text>
                <Text style={[styles.balanceLabel, { color: isDarkTheme ? '#9ca3af' : '#64748b' }]}>Total Balance</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsBalanceVisible(!isBalanceVisible)}
                style={styles.visibilityButton}
              >
                <Text style={styles.visibilityIcon}>
                  <Ionicons 
                    name={isBalanceVisible ? 'eye-outline' : 'eye-off-outline'} 
                    size={20} 
                    color={isDarkTheme ? '#ffffff' : '#1f2937'} 
                  />
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.balanceAmount, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>
              {isBalanceVisible 
                ? `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
                : '••••••••'}
            </Text>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryItemHeader}>
                  <Ionicons name="arrow-up-circle" size={20} color="#10b981" />
                  <Text style={[styles.summaryLabel, { color: isDarkTheme ? '#9ca3af' : '#64748b' }]}>Monthly Income</Text>
                </View>
                <Text style={[styles.summaryAmount, styles.incomeText]}>
                  +₹{monthlyIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={styles.summaryItemHeader}>
                  <Ionicons name="arrow-down-circle" size={20} color="#ef4444" />
                  <Text style={[styles.summaryLabel, { color: isDarkTheme ? '#9ca3af' : '#64748b' }]}>Monthly Expenses</Text>
                </View>
                <Text style={[styles.summaryAmount, styles.expenseText]}>
                  -₹{currentMonthExpenseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Professional Quick Actions */}
        <Animated.View 
          entering={SlideInRight.delay(300)} 
          style={styles.quickActionsContainer}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          
          {/* Essential Actions Grid */}
          <View style={styles.essentialActionsGrid}>
            <TouchableOpacity
              style={styles.essentialActionCard}
              onPress={() => setShowAddExpense(true)}
              accessibilityLabel="Add new expense"
              activeOpacity={0.7}
            >
              <View style={styles.essentialActionContent}>
                <View style={[styles.essentialActionIcon, { backgroundColor: '#E8F2FF' }]}>
                  <Ionicons name="add-circle" size={26} color="#2563EB" />
                </View>
                <Text style={styles.essentialActionTitle}>Add Expenses</Text>
                <Text style={styles.essentialActionSubtitle}>Record Spendings</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.essentialActionCard}
              onPress={() => setShowScanner(true)}
              accessibilityLabel="Scan receipt"
              activeOpacity={0.7}
            >
              <View style={styles.essentialActionContent}>
                <View style={[styles.essentialActionIcon, { backgroundColor: '#FFF4E6' }]}>
                  <Ionicons name="scan" size={26} color="#EA580C" />
                </View>
                <Text style={styles.essentialActionTitle}>Smart Scan</Text>
                <Text style={styles.essentialActionSubtitle}>Receipt AI</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.essentialActionCard}
              onPress={() => setShowHistory(true)}
              accessibilityLabel="Transaction history"
              activeOpacity={0.7}
            >
              <View style={styles.essentialActionContent}>
                <View style={[styles.essentialActionIcon, { backgroundColor: '#E0F7FA' }]}>
                  <Ionicons name="time" size={26} color="#0891B2" />
                </View>
                <Text style={styles.essentialActionTitle}>History</Text>
                <Text style={styles.essentialActionSubtitle}>All transactions</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.essentialActionCard}
              onPress={() => setShowCalendar(true)}
              accessibilityLabel="Calendar view"
              activeOpacity={0.7}
            >
              <View style={styles.essentialActionContent}>
                <View style={[styles.essentialActionIcon, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="calendar" size={26} color="#DC2626" />
                </View>
                <Text style={styles.essentialActionTitle}>Calendar</Text>
                <Text style={styles.essentialActionSubtitle}>Monthly view</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.essentialActionCard}
              onPress={() => setShowSmartSuggestions(true)}
              accessibilityLabel="AI insights"
              activeOpacity={0.7}
            >
              <View style={styles.essentialActionContent}>
                <View style={[styles.essentialActionIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="bulb" size={26} color="#9333EA" />
                </View>
                <Text style={styles.essentialActionTitle}>AI Insights</Text>
                <Text style={styles.essentialActionSubtitle}>Smart tips</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.essentialActionCard}
              onPress={() => router.push('/Profile')}
              accessibilityLabel="Profile settings"
              activeOpacity={0.7}
            >
              <View style={styles.essentialActionContent}>
                <View style={[styles.essentialActionIcon, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="person" size={26} color="#475569" />
                </View>
                <Text style={styles.essentialActionTitle}>Profile</Text>
                <Text style={styles.essentialActionSubtitle}>Account settings</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Enhanced Recent Transactions */}
        <Animated.View 
          entering={FadeInUp.delay(500)} 
          style={styles.transactionsContainer}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {transactions.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowHistory(true)}
                style={styles.seeAllButton}
                accessibilityLabel="See all transactions"
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#6366F1" />
              </TouchableOpacity>
            )}
          </View>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyStateTitle}>No transactions yet</Text>
              <Text style={styles.emptyStateDescription}>
                Start tracking your expenses by adding your first transaction
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setShowAddExpense(true)}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.emptyStateButtonText}>Add Transaction</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.slice(0, 5).map((transaction, index) => (
                <Animated.View
                  key={transaction.id || index}
                  entering={FadeInUp.delay(600 + index * 100)}
                  style={styles.transactionItem}
                >
                  <View style={styles.transactionIcon}>
                    <Ionicons 
                      name={categoryIcons[transaction.category as keyof typeof categoryIcons] || 'grid'}
                      size={20} 
                      color={transaction.type === 'income' ? '#10B981' : '#6366F1'} 
                    />
                  </View>
                  
                  <View style={styles.transactionContent}>
                    <Text style={styles.transactionTitle} numberOfLines={1}>
                      {transaction.title || transaction.description || 'Transaction'}
                    </Text>
                    <Text style={styles.transactionCategory}>
                      {transaction.category}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {(() => {
                        const transactionDate = new Date(transaction.date);
                        const now = new Date();
                        const diffInHours = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);
                        
                        if (diffInHours < 24) {
                          // Show time for recent transactions
                          return transactionDate.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          });
                        } else {
                          // Show date for older transactions
                          return transactionDate.toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric'
                          });
                        }
                      })()}
                    </Text>
                  </View>
                  
                  <View style={styles.transactionAmount}>
                    <Text style={[
                      styles.transactionAmountText,
                      { color: transaction.type === 'income' ? '#10B981' : '#EF4444' }
                    ]}>
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Enhanced Modals */}
      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        onSave={handleAddTransaction}
      />

      <TransactionHistory
        open={showHistory}
        onOpenChange={setShowHistory}
        expenses={transactions.map(t => ({
          id: t.id || '',
          title: t.title || t.description || 'Transaction',
          amount: t.amount,
          category: t.category || '',
          date: t.date,
          description: t.description || t.title || '',
          source: t.source || 'manual',
          type: t.type,
          expense_id: t.id || '',
          user_id: 'current-user',
          payment_method: t.paymentMethod || 'Unknown'
        }))}
        onDeleteExpense={() => {}}
        onEditExpense={() => {}}
      />

      <ScannerDialog
        open={showScanner}
        onOpenChange={setShowScanner}
        onScanResult={(result: any) => {
          setShowScanner(false);
          toast({
            title: "Receipt scanned!",
            description: "Processing receipt data",
            variant: "success"
          });
        }}
      />

      <CalendarComponent
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        refreshTrigger={refreshKey}
      />

      <SmartSuggestionsComponent
        visible={showSmartSuggestions}
        onClose={() => setShowSmartSuggestions(false)}
      />

      {user && (
        <ProfileDialog
          visible={showProfileDialog}
          onClose={() => setShowProfileDialog(false)}
          user={user}
          isDarkTheme={isDarkTheme}
        />
      )}

      <Toast />
    </View>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    marginTop: 8,
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
  balanceCardContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: isDark ? '#000000' : '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.3 : 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : 'rgba(255, 255, 255, 0.8)',
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  balanceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
    marginLeft: 8,
  },
  visibilityButton: {
    padding: 8,
  },
  visibilityIcon: {
    fontSize: 20,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
    summaryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  incomeText: {
    color: '#10b981',
  },
  expenseText: {
    color: '#ef4444',
  },
  balanceInsights: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: isDark ? '#334155' : '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? '#475569' : '#E2E8F0',
  },
  insightIconContainer: {
    width: 13,
    height: 13,
    borderRadius: 18,
    backgroundColor: isDark ? '#374151' : '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 15,
    color: isDark ? '#94A3B8' : '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 17,
    color: isDark ? '#F1F5F9' : '#1E293B',
    fontWeight: '800',
  },
  quickActionsContainer: {
    marginHorizontal: 28,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: isDark ? '#F1F5F9' : '#1E293B',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    aspectRatio: 1.1,
    backgroundColor: isDark ? '#1E293B' : 'white',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: isDark ? '#000000' : '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#F1F5F9',
    marginBottom: 12,
  },
  primaryAction: {
    width: '48%',
    aspectRatio: 1.1,
  },
  actionGradient: {
    flex: 1,
    width: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E7FF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    marginTop: 12,
    textAlign: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#E2E8F0' : '#374151',
    textAlign: 'center',
    lineHeight: 16,
  },
  budgetOverviewContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  budgetCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  budgetProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetProgressLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  budgetProgressPercentage: {
    fontSize: 18,
    fontWeight: '800',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  budgetSpent: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  budgetTotal: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
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
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    backgroundColor: isDark ? '#1E293B' : 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: isDark ? '#000000' : '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#F1F5F9',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: isDark ? '#475569' : '#E2E8F0',
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
  transactionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: isDark ? '#F1F5F9' : '#1E293B',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: isDark ? '#94A3B8' : '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: isDark ? '#6B7280' : '#94A3B8',
    fontWeight: '500',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 18,
    fontWeight: '800',
  },
  // Essential Quick Actions Styles
  essentialActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 4,
  },
  essentialActionCard: {
    width: '48%',
    height: 140,
    backgroundColor: isDark ? '#1E293B' : 'white',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: isDark ? '#000000' : '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#F1F5F9',
    marginBottom: 16,
  },
  essentialActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  essentialActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  essentialActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: isDark ? '#F1F5F9' : '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  essentialActionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#94A3B8' : '#64748B',
    textAlign: 'center',
    opacity: 0.8,
  },
});