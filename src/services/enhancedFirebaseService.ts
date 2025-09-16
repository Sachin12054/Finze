// Enhanced Firebase Service for complete app structure
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db } from './firebase';

// Enhanced interfaces for the complete app structure
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  bio?: string;
  dateOfBirth?: string;
  location?: string;
  role?: string; // Add role field
  createdAt: string;
  updatedAt: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export interface Transaction {
  id?: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  source: 'Manual' | 'OCR' | 'Recurring' | 'Import';
  description?: string;
  date: string;
  paymentMethod: string;
  location?: string;
  receipt?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id?: string;
  userId: string;
  category: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  alertThreshold: number;
  isActive: boolean;
  notifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id?: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  description?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Recurrence {
  id?: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScannerExpense {
  id?: string;
  userId: string;
  transactionId?: string; // Link to main transaction
  merchantName: string;
  totalAmount: number;
  category: string;
  extractedCategory: string; // Original extracted category
  date: string;
  currency: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  extractionConfidence: number;
  processingTime: string;
  gstAmount?: number;
  subtotalAmount?: number;
  receiptImage?: string;
  extractedText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIInsight {
  id?: string;
  userId: string;
  type: 'spending_pattern' | 'budget_alert' | 'savings_tip' | 'category_insight';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  actionRequired: boolean;
  isRead: boolean;
  data?: any;
  createdAt: string;
  expiresAt?: string;
}

export class EnhancedFirebaseService {
  
  // User Profile Management
  static async createUserProfile(profile: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const userProfile: UserProfile = {
      ...profile,
      uid: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const profileRef = doc(db, `users/${auth.currentUser.uid}/profile/main`);
    await setDoc(profileRef, userProfile);
  }

  static async getUserProfile(): Promise<UserProfile | null> {
    if (!auth.currentUser) return null;
    
    const profileRef = doc(db, `users/${auth.currentUser.uid}/profile/main`);
    const profileDoc = await getDoc(profileRef);
    
    if (profileDoc.exists()) {
      return profileDoc.data() as UserProfile;
    }
    return null;
  }

  static async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const profileRef = doc(db, `users/${auth.currentUser.uid}/profile/main`);
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  // Transaction Management
  static async addTransaction(transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }
    
    // Get fresh auth token to ensure it's valid
    try {
      const token = await auth.currentUser.getIdToken(true);
    } catch (tokenError) {
      throw new Error('Authentication token invalid');
    }
    
    const newTransaction: Omit<Transaction, 'id'> = {
      ...transaction,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Always use legacy collection for now until rules propagation is confirmed
    
    const expenseData = {
      user_id: auth.currentUser.uid,
      title: newTransaction.title,
      amount: newTransaction.amount,
      category: newTransaction.category,
      description: newTransaction.description || '',
      date: newTransaction.date,
      source: newTransaction.source,
      type: newTransaction.type,
      payment_method: newTransaction.paymentMethod,
      created_at: newTransaction.createdAt,
      updated_at: newTransaction.updatedAt,
    };
    
    const userExpensesRef = collection(db, `users/${auth.currentUser.uid}/expenses`);
    const docRef = await addDoc(userExpensesRef, expenseData);
    
    // Skip balance update for now to avoid additional permission issues
    // await this.updateUserBalance();
    
    return docRef.id;
  }

  static getTransactionsListener(callback: (transactions: Transaction[]) => void): () => void {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    let manualTransactions: Transaction[] = [];
    let scannerTransactions: Transaction[] = [];
    let unsubscribeManual: (() => void) | null = null;
    let unsubscribeScanner: (() => void) | null = null;
    
    const combineAndCallback = () => {
      // Combine both manual and scanner transactions
      const allTransactions = [...manualTransactions, ...scannerTransactions];
      // Sort by date descending
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log(`🔄 Transactions Listener: Manual=${manualTransactions.length}, Scanner=${scannerTransactions.length}, Total=${allTransactions.length}`);
      
      callback(allTransactions);
    };
    
    // Listen to manual expenses
    const userExpensesRef = collection(db, `users/${auth.currentUser.uid}/expenses`);
    const manualQuery = query(userExpensesRef, orderBy('created_at', 'desc'));
    
    unsubscribeManual = onSnapshot(manualQuery, (snapshot) => {
      manualTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.user_id,
          title: data.title,
          amount: data.amount,
          category: data.category,
          type: data.type,
          source: data.source || 'Manual',
          description: data.description,
          date: data.date,
          paymentMethod: data.payment_method,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }) as Transaction[];
      
      console.log(`📝 Manual transactions updated: ${manualTransactions.length} items`);
      combineAndCallback();
    });
    
    // Listen to scanner expenses and convert them to transactions
    const scannerExpensesRef = collection(db, `users/${auth.currentUser.uid}/scanner_expenses`);
    const scannerQuery = query(scannerExpensesRef, orderBy('createdAt', 'desc'));
    
    unsubscribeScanner = onSnapshot(scannerQuery, (snapshot) => {
      scannerTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `scanner_${doc.id}`,
          userId: data.userId,
          title: data.merchantName || 'Receipt Transaction',
          amount: data.totalAmount,
          category: data.category,
          type: 'expense' as 'expense',
          source: 'OCR' as 'OCR',
          description: `Scanner transaction from ${data.merchantName}`,
          date: data.date,
          paymentMethod: 'Unknown',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }) as Transaction[];
      
      console.log(`📷 Scanner transactions updated: ${scannerTransactions.length} items`);
      combineAndCallback();
    });
    
    // Return unsubscribe function that unsubscribes from both listeners
    return () => {
      if (unsubscribeManual) unsubscribeManual();
      if (unsubscribeScanner) unsubscribeScanner();
    };
  }

  // Budget Management
  static async addBudget(budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const newBudget: Omit<Budget, 'id'> = {
      ...budget,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const budgetsRef = collection(db, `users/${auth.currentUser.uid}/budget`);
    const docRef = await addDoc(budgetsRef, newBudget);
    return docRef.id;
  }

  static getBudgetsListener(callback: (budgets: Budget[]) => void): () => void {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const budgetsRef = collection(db, `users/${auth.currentUser.uid}/budget`);
    
    return onSnapshot(budgetsRef, (snapshot) => {
      const budgets: Budget[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Budget[];
      callback(budgets);
    });
  }

  // Savings Goal Management
  static async addSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const newGoal: Omit<SavingsGoal, 'id'> = {
      ...goal,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const goalsRef = collection(db, `users/${auth.currentUser.uid}/setgoal`);
    const docRef = await addDoc(goalsRef, newGoal);
    return docRef.id;
  }

  static getSavingsGoalsListener(callback: (goals: SavingsGoal[]) => void): () => void {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const goalsRef = collection(db, `users/${auth.currentUser.uid}/setgoal`);
    const q = query(goalsRef, where('isCompleted', '==', false));
    
    return onSnapshot(q, (snapshot) => {
      const goals: SavingsGoal[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavingsGoal[];
      callback(goals);
    });
  }

  // Recurrence Management
  static async addRecurrence(recurrence: Omit<Recurrence, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const newRecurrence: Omit<Recurrence, 'id'> = {
      ...recurrence,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const recurrenceRef = collection(db, `users/${auth.currentUser.uid}/recurrence`);
    const docRef = await addDoc(recurrenceRef, newRecurrence);
    return docRef.id;
  }

  static getRecurrenceListener(callback: (recurrences: Recurrence[]) => void): () => void {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const recurrenceRef = collection(db, `users/${auth.currentUser.uid}/recurrence`);
    const q = query(recurrenceRef, where('isActive', '==', true));
    
    return onSnapshot(q, (snapshot) => {
      const recurrences: Recurrence[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recurrence[];
      callback(recurrences);
    });
  }

  // AI Insights Management
  static async addAIInsight(insight: Omit<AIInsight, 'id' | 'userId' | 'createdAt'>): Promise<string> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const newInsight: Omit<AIInsight, 'id'> = {
      ...insight,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
    };
    
    const insightsRef = collection(db, `users/${auth.currentUser.uid}/aiInsights`);
    const docRef = await addDoc(insightsRef, newInsight);
    return docRef.id;
  }

  static getAIInsightsListener(callback: (insights: AIInsight[]) => void): () => void {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const insightsRef = collection(db, `users/${auth.currentUser.uid}/aiInsights`);
    const q = query(insightsRef, orderBy('createdAt', 'desc'), limit(10));
    
    return onSnapshot(q, (snapshot) => {
      const insights: AIInsight[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AIInsight[];
      callback(insights);
    });
  }

  // Helper Methods
  static async updateUserBalance(): Promise<void> {
    if (!auth.currentUser) return;
    
    const transactionsRef = collection(db, `users/${auth.currentUser.uid}/transactions`);
    const snapshot = await getDocs(transactionsRef);
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    snapshot.docs.forEach(doc => {
      const transaction = doc.data() as Transaction;
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpenses += transaction.amount;
      }
    });
    
    const totalBalance = totalIncome - totalExpenses;
    
    const profileRef = doc(db, `users/${auth.currentUser.uid}/profile/main`);
    await updateDoc(profileRef, {
      totalBalance,
      monthlyIncome: totalIncome,
      monthlyExpenses: totalExpenses,
      updatedAt: new Date().toISOString(),
    });
  }

  // Calendar Integration - Get daily expenses
  static async getDailyExpenses(date: string): Promise<Transaction[]> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const transactionsRef = collection(db, `users/${auth.currentUser.uid}/transactions`);
    const q = query(
      transactionsRef,
      where('date', '>=', startDate.toISOString()),
      where('date', '<=', endDate.toISOString()),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];
  }

  // Analytics Helper
  static async getMonthlyAnalytics(year: number, month: number) {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    const transactionsRef = collection(db, `users/${auth.currentUser.uid}/transactions`);
    const q = query(
      transactionsRef,
      where('date', '>=', startDate.toISOString()),
      where('date', '<=', endDate.toISOString())
    );
    
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];
    
    // Process analytics data
    const categoryData: { [key: string]: number } = {};
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpenses += transaction.amount;
        categoryData[transaction.category] = (categoryData[transaction.category] || 0) + transaction.amount;
      }
    });
    
    return {
      transactions,
      categoryBreakdown: categoryData,
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
    };
  }

  // Get transactions by date range
  static async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    console.log('EnhancedFirebaseService: getTransactionsByDateRange called with:', startDate, endDate);
    console.log('EnhancedFirebaseService: User ID:', auth.currentUser.uid);
    
    try {
      // Convert dates to just date part for consistent comparison
      const startDateOnly = startDate.split('T')[0];
      const endDateOnly = endDate.split('T')[0];
      
      console.log('EnhancedFirebaseService: Using date range:', startDateOnly, 'to', endDateOnly);
      
      // Get manual transactions from expenses collection
      const expensesRef = collection(db, `users/${auth.currentUser.uid}/expenses`);
      const manualQuery = query(
        expensesRef,
        orderBy('date', 'desc')
      );
      
      // Get scanner transactions
      const scannerRef = collection(db, `users/${auth.currentUser.uid}/scanner_expenses`);
      const scannerQuery = query(
        scannerRef,
        orderBy('date', 'desc')
      );
      
      console.log('EnhancedFirebaseService: Executing queries...');
      
      // Execute both queries
      const [expensesSnapshot, scannerSnapshot] = await Promise.all([
        getDocs(manualQuery),
        getDocs(scannerQuery)
      ]);
      
      console.log('EnhancedFirebaseService: Manual expenses found:', expensesSnapshot.docs.length);
      console.log('EnhancedFirebaseService: Scanner transactions found:', scannerSnapshot.docs.length);
      
      // Combine and normalize the results, then filter by date client-side
      const manualTransactions = expensesSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            source: 'Manual',
            ...data
          } as Transaction;
        })
        .filter(transaction => {
          const transactionDate = transaction.date.split('T')[0];
          return transactionDate >= startDateOnly && transactionDate <= endDateOnly;
        });
      
      const scannerTransactions = scannerSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            source: 'OCR',
            ...data
          } as Transaction;
        })
        .filter(transaction => {
          const transactionDate = transaction.date.split('T')[0];
          return transactionDate >= startDateOnly && transactionDate <= endDateOnly;
        });
      
      console.log('EnhancedFirebaseService: Date range filtering complete');
      console.log('EnhancedFirebaseService: Filtered manual transactions:', manualTransactions.length);
      console.log('EnhancedFirebaseService: Filtered scanner transactions:', scannerTransactions.length);
      
      // Log sample data for debugging
      if (manualTransactions.length > 0) {
        console.log('EnhancedFirebaseService: Sample manual transaction:', JSON.stringify(manualTransactions[0], null, 2));
      }
      if (scannerTransactions.length > 0) {
        console.log('EnhancedFirebaseService: Sample scanner transaction:', JSON.stringify(scannerTransactions[0], null, 2));
      }
      
      console.log('EnhancedFirebaseService: Manual transactions data:', manualTransactions);
      console.log('EnhancedFirebaseService: Scanner transactions data:', scannerTransactions);
      
      // Combine and sort by date
      const allTransactions = [...manualTransactions, ...scannerTransactions];
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log('EnhancedFirebaseService: Total combined transactions:', allTransactions.length);
      
      return allTransactions;
    } catch (error) {
      console.error('Error fetching transactions by date range:', error);
      throw error;
    }
  }

  // Get recurring transactions
  static async getRecurringTransactions(): Promise<Recurrence[]> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const recurrenceRef = collection(db, `users/${auth.currentUser.uid}/recurrence`);
    const q = query(recurrenceRef, where('isActive', '==', true));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Recurrence[];
  }

  // Search transactions
  static async searchTransactions(searchTerm: string): Promise<Transaction[]> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const transactionsRef = collection(db, `users/${auth.currentUser.uid}/transactions`);
    
    // Note: Firestore doesn't support full-text search, so we'll get all transactions
    // and filter client-side for now. For production, consider Algolia or similar.
    const snapshot = await getDocs(query(transactionsRef, orderBy('date', 'desc')));
    const allTransactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];
    
    const searchLower = searchTerm.toLowerCase();
    return allTransactions.filter(transaction =>
      transaction.title.toLowerCase().includes(searchLower) ||
      transaction.description?.toLowerCase().includes(searchLower) ||
      transaction.category.toLowerCase().includes(searchLower) ||
      transaction.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  // Get all budgets
  static async getAllBudgets(): Promise<Budget[]> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const budgetsRef = collection(db, `users/${auth.currentUser.uid}/budgets`);
    const snapshot = await getDocs(budgetsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Budget[];
  }

  // Get all savings goals
  static async getAllSavingsGoals(): Promise<SavingsGoal[]> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const goalsRef = collection(db, `users/${auth.currentUser.uid}/setgoal`);
    const snapshot = await getDocs(goalsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SavingsGoal[];
  }

  // Get user financial summary (Fixed version for date handling)
  static async getUserFinancialSummary(): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    currentMonthIncome: number;
    currentMonthExpenses: number;
  }> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    try {
      // Get both manual expenses and scanner expenses
      const [expensesSnapshot, scannerSnapshot] = await Promise.all([
        getDocs(collection(db, `users/${auth.currentUser.uid}/expenses`)),
        getDocs(collection(db, `users/${auth.currentUser.uid}/scanner_expenses`))
      ]);
      
      let totalIncome = 0;
      let totalExpenses = 0;
      let currentMonthIncome = 0;
      let currentMonthExpenses = 0;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      console.log(`🧮 Financial Summary Debug: Current Month=${currentMonth}, Year=${currentYear}`);
      console.log(`📊 Manual expenses count: ${expensesSnapshot.docs.length}`);
      console.log(`📷 Scanner expenses count: ${scannerSnapshot.docs.length}`);
      
      // Process manual expenses
      expensesSnapshot.docs.forEach((doc, index) => {
        try {
          const transaction = doc.data();
          
          const amount = Number(transaction.amount) || 0;
          
          // Enhanced date handling with error protection
          let transactionDate: Date;
          
          try {
            if (transaction.date && transaction.date.toDate && typeof transaction.date.toDate === 'function') {
              // Firestore Timestamp
              transactionDate = transaction.date.toDate();
            } else if (typeof transaction.date === 'string') {
              // ISO string
              transactionDate = new Date(transaction.date);
            } else if (transaction.date instanceof Date) {
              // Already a Date object
              transactionDate = transaction.date;
            } else {
              // Fallback to current date
              transactionDate = new Date();
            }
          } catch (dateError) {
            transactionDate = new Date();
          }
          
          if (transaction.type === 'income') {
            totalIncome += amount;
            if (transactionDate.getMonth() === currentMonth && 
                transactionDate.getFullYear() === currentYear) {
              currentMonthIncome += amount;
            }
          } else {
            totalExpenses += amount;
            if (transactionDate.getMonth() === currentMonth && 
                transactionDate.getFullYear() === currentYear) {
              currentMonthExpenses += amount;
              console.log(`💰 Manual expense added to current month: ₹${amount} on ${transactionDate.toISOString()}`);
            }
          }
        } catch (transactionError) {
          // Skip transactions with errors
        }
      });
      
      // Process scanner expenses (all are expenses)
      scannerSnapshot.docs.forEach((doc) => {
        try {
          const scannerData = doc.data();
          
          const amount = Number(scannerData.totalAmount) || 0;
          
          // Handle scanner date
          let transactionDate: Date;
          
          try {
            if (typeof scannerData.date === 'string') {
              transactionDate = new Date(scannerData.date);
            } else if (scannerData.createdAt) {
              transactionDate = new Date(scannerData.createdAt);
            } else {
              transactionDate = new Date();
            }
          } catch (dateError) {
            transactionDate = new Date();
          }
          
          // Scanner expenses are always expenses
          totalExpenses += amount;
          if (transactionDate.getMonth() === currentMonth && 
              transactionDate.getFullYear() === currentYear) {
            currentMonthExpenses += amount;
            console.log(`📷 Scanner expense added to current month: ₹${amount} on ${transactionDate.toISOString()}`);
          }
        } catch (scannerError) {
          // Skip scanner transactions with errors
        }
      });
      
      const summary = {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        currentMonthIncome,
        currentMonthExpenses
      };
      
      console.log(`💵 Final Financial Summary:`, summary);
      
      return summary;
    } catch (error) {
      console.error('Error calculating financial summary:', error);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        currentMonthIncome: 0,
        currentMonthExpenses: 0
      };
    }
  }

  // Scanner Expense Management
  static async addScannerExpense(scannerData: Omit<ScannerExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const newScannerExpense: Omit<ScannerExpense, 'id'> = {
      ...scannerData,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const scannerRef = collection(db, `users/${auth.currentUser.uid}/scanner_expenses`);
    const docRef = await addDoc(scannerRef, newScannerExpense);
    return docRef.id;
  }

  static getScannerExpensesListener(callback: (expenses: ScannerExpense[]) => void): () => void {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const scannerRef = collection(db, `users/${auth.currentUser.uid}/scanner_expenses`);
    const q = query(scannerRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const expenses: ScannerExpense[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScannerExpense[];
      callback(expenses);
    });
  }

  static async getScannerExpenses(): Promise<ScannerExpense[]> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const scannerRef = collection(db, `users/${auth.currentUser.uid}/scanner_expenses`);
    const q = query(scannerRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ScannerExpense[];
  }

  static async updateScannerExpense(expenseId: string, updateData: Partial<ScannerExpense>): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const expenseRef = doc(db, `users/${auth.currentUser.uid}/scanner_expenses`, expenseId);
    await updateDoc(expenseRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
  }
}

export default EnhancedFirebaseService;