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
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const newTransaction: Omit<Transaction, 'id'> = {
      ...transaction,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const transactionsRef = collection(db, `users/${auth.currentUser.uid}/transactions`);
    const docRef = await addDoc(transactionsRef, newTransaction);
    
    // Update user profile balance
    await this.updateUserBalance();
    
    return docRef.id;
  }

  static getTransactionsListener(callback: (transactions: Transaction[]) => void): () => void {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const transactionsRef = collection(db, `users/${auth.currentUser.uid}/transactions`);
    const q = query(transactionsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const transactions: Transaction[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      callback(transactions);
    });
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
    
    const budgetsRef = collection(db, `users/${auth.currentUser.uid}/budgets`);
    const docRef = await addDoc(budgetsRef, newBudget);
    return docRef.id;
  }

  static getBudgetsListener(callback: (budgets: Budget[]) => void): () => void {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const budgetsRef = collection(db, `users/${auth.currentUser.uid}/budgets`);
    const q = query(budgetsRef, where('isActive', '==', true));
    
    return onSnapshot(q, (snapshot) => {
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
    
    const goalsRef = collection(db, `users/${auth.currentUser.uid}/savingsGoals`);
    const docRef = await addDoc(goalsRef, newGoal);
    return docRef.id;
  }

  static getSavingsGoalsListener(callback: (goals: SavingsGoal[]) => void): () => void {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const goalsRef = collection(db, `users/${auth.currentUser.uid}/savingsGoals`);
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
    
    const recurrenceRef = collection(db, `users/${auth.currentUser.uid}/recurrences`);
    const docRef = await addDoc(recurrenceRef, newRecurrence);
    return docRef.id;
  }

  static getRecurrenceListener(callback: (recurrences: Recurrence[]) => void): () => void {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const recurrenceRef = collection(db, `users/${auth.currentUser.uid}/recurrences`);
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
    
    const transactionsRef = collection(db, `users/${auth.currentUser.uid}/transactions`);
    const q = query(
      transactionsRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];
  }

  // Get recurring transactions
  static async getRecurringTransactions(): Promise<Recurrence[]> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const recurrenceRef = collection(db, `users/${auth.currentUser.uid}/recurrences`);
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
    
    const goalsRef = collection(db, `users/${auth.currentUser.uid}/savingsGoals`);
    const snapshot = await getDocs(goalsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SavingsGoal[];
  }
}
