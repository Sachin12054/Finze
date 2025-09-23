// Enhanced Firebase Service for complete app structure
import {
  addDoc,
  collection,
  deleteDoc,
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
  private static lastLogTime: number = 0;
  private static readonly LOG_DEBOUNCE_INTERVAL = 2000; // 2 seconds
  
  // Helper method to prevent log spam
  private static shouldLog(): boolean {
    const now = Date.now();
    if (now - this.lastLogTime > this.LOG_DEBOUNCE_INTERVAL) {
      this.lastLogTime = now;
      return true;
    }
    return false;
  }
  
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
      let allTransactions = [...manualTransactions, ...scannerTransactions];
      if (this.shouldLog()) {
        console.log('Total combined transactions before dedup:', allTransactions.length);
      }
      
      // Remove duplicates based on amount, date, and similar titles
      const uniqueTransactions: Transaction[] = [];
      
      for (const transaction of allTransactions) {
        // Check if this transaction is a duplicate of any already added
        const isDuplicate = uniqueTransactions.some(existing => {
          // Check for potential duplicates: same amount, same date, similar title
          const isSameAmount = Math.abs(existing.amount - transaction.amount) < 0.01;
          const isSameDate = new Date(existing.date).toDateString() === new Date(transaction.date).toDateString();
          
          if (!isSameAmount || !isSameDate) return false;
          
          // Clean titles for comparison
          const cleanTitle1 = transaction.title.toLowerCase()
            .replace(/receipt\s+from\s+/g, '')
            .replace(/extracted\s+text\s*/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          const cleanTitle2 = existing.title.toLowerCase()
            .replace(/receipt\s+from\s+/g, '')
            .replace(/extracted\s+text\s*/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Check if titles are similar (at least 70% match or contain each other)
          const isSimilarTitle = cleanTitle1 === cleanTitle2 || 
                                cleanTitle1.includes(cleanTitle2) || 
                                cleanTitle2.includes(cleanTitle1) ||
                                calculateSimilarity(cleanTitle1, cleanTitle2) > 0.7;
          
          return isSimilarTitle;
        });
        
        if (!isDuplicate) {
          uniqueTransactions.push(transaction);
        } else {
          if (this.shouldLog()) {
            console.log('Filtered out duplicate transaction:', transaction.title, transaction.amount);
          }
        }
      }
      

      
      // Helper function to calculate string similarity
      function calculateSimilarity(str1: string, str2: string): number {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
      }
      
      // Helper function to calculate Levenshtein distance
      function levenshteinDistance(str1: string, str2: string): number {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
          matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
          matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
          for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              );
            }
          }
        }
        
        return matrix[str2.length][str1.length];
      }
      
      // Sort by date descending (most recent first)
      uniqueTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      

      callback(uniqueTransactions);
    };
    
    // Listen to manual expenses
    const userExpensesRef = collection(db, `users/${auth.currentUser.uid}/expenses`);
    const manualQuery = query(userExpensesRef, orderBy('created_at', 'desc'));
    
    unsubscribeManual = onSnapshot(manualQuery, (snapshot) => {
      console.log('Manual expenses snapshot received:', snapshot.docs.length, 'documents');
      manualTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing manual expense:', doc.id, data);
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
      
      if (this.shouldLog()) {
        console.log('Total manual transactions:', manualTransactions.length);
      }
      combineAndCallback();
    });
    
    // Listen to scanner expenses and convert them to transactions
    const scannerExpensesRef = collection(db, `users/${auth.currentUser.uid}/scanner_expenses`);
    const scannerQuery = query(scannerExpensesRef, orderBy('createdAt', 'desc'));
    
    unsubscribeScanner = onSnapshot(scannerQuery, (snapshot) => {
      if (this.shouldLog()) {
        console.log('Scanner expenses snapshot received:', snapshot.docs.length, 'documents');
      }
      scannerTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        // Only log individual processing on first load or significant changes
        if (this.shouldLog()) {
          console.log('Processing scanner expense:', doc.id, data);
        }
        
        // Clean up the merchant name to remove redundant "Receipt from" prefix and extracted text
        let cleanTitle = data.merchantName || 'Receipt Transaction';
        
        // Remove common prefixes and clean up the title
        if (cleanTitle.toLowerCase().startsWith('receipt from ')) {
          cleanTitle = cleanTitle.substring(13); // Remove "Receipt from " prefix
        }
        
        // Remove any extracted text patterns and extra spaces
        cleanTitle = cleanTitle
          .replace(/extracted text:?/gi, '')
          .replace(/receipt:?/gi, '')
          .replace(/transaction:?/gi, '')
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim();
        
        // Ensure we have a valid title
        if (!cleanTitle || cleanTitle.length < 2) {
          cleanTitle = 'Receipt Transaction';
        }
        
        const transaction = {
          id: `scanner_${doc.id}`,
          userId: data.userId,
          title: cleanTitle,
          amount: data.totalAmount,
          category: data.category || 'General',
          type: 'expense' as 'expense',
          source: 'OCR' as 'OCR',
          description: `Scanned receipt transaction`,
          date: data.createdAt ? data.createdAt.split('T')[0] : new Date().toISOString().split('T')[0], // Use scan date for UI display
          paymentMethod: 'Unknown',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
        
        // Only log conversion details on first load
        if (this.shouldLog()) {
          console.log('Converted scanner expense to transaction:', transaction);
        }
        return transaction;
      }) as Transaction[];
      
      if (this.shouldLog()) {
        console.log('Total scanner transactions:', scannerTransactions.length);
      }
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
    
    return onSnapshot(budgetsRef, 
      (snapshot) => {
        const budgets: Budget[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data
          };
        }) as Budget[];
        callback(budgets);
      },
      (error) => {
        console.error('❌ Budget listener error:', error);
        // Return empty array on error instead of throwing
        callback([]);
      }
    );
  }

  // Delete budget
  static async deleteBudget(budgetId: string): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const budgetRef = doc(db, `users/${auth.currentUser.uid}/budget`, budgetId);
    await deleteDoc(budgetRef);
  }

  // Update budget
  static async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const budgetRef = doc(db, `users/${auth.currentUser.uid}/budget`, budgetId);
    await updateDoc(budgetRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
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
    
    return onSnapshot(q, 
      (snapshot) => {
        const goals: SavingsGoal[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data
          };
        }) as SavingsGoal[];
        callback(goals);
      },
      (error) => {
        console.error('❌ Savings goals listener error:', error);
        // Return empty array on error instead of throwing
        callback([]);
      }
    );
  }

  static async updateSavingsGoal(goalId: string, updates: Partial<Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const goalRef = doc(db, `users/${auth.currentUser.uid}/setgoal`, goalId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(goalRef, updateData);
    console.log('✅ Savings goal updated successfully:', goalId);
  }

  static async deleteSavingsGoal(goalId: string): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const goalRef = doc(db, `users/${auth.currentUser.uid}/setgoal`, goalId);
    await deleteDoc(goalRef);
    console.log('✅ Savings goal deleted successfully:', goalId);
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
    const q = query(recurrenceRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, 
      (snapshot) => {
        console.log('🔄 Recurrence listener: Received snapshot with', snapshot.docs.length, 'documents');
        const recurrences: Recurrence[] = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('🔄 Recurrence data:', data);
          return {
            id: doc.id,
            ...data
          };
        }) as Recurrence[];
        console.log('🔄 Processed recurrences:', recurrences);
        callback(recurrences);
      },
      (error) => {
        console.error('❌ Recurrence listener error:', error);
        console.error('❌ Full error details:', JSON.stringify(error, null, 2));
        // Return empty array on error instead of throwing
        callback([]);
      }
    );
  }

  static async updateRecurrence(id: string, updates: Partial<Omit<Recurrence, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const recurrenceRef = doc(db, `users/${auth.currentUser.uid}/recurrence`, id);
    await updateDoc(recurrenceRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  static async deleteRecurrence(id: string): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const recurrenceRef = doc(db, `users/${auth.currentUser.uid}/recurrence`, id);
    await deleteDoc(recurrenceRef);
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
    
    try {
      // Directly fetch fresh data instead of using listener
      const manualRef = collection(db, `users/${auth.currentUser.uid}/expenses`);
      const scannerRef = collection(db, `users/${auth.currentUser.uid}/scanner_expenses`);
      
      const [manualSnapshot, scannerSnapshot] = await Promise.all([
        getDocs(manualRef),
        getDocs(scannerRef)
      ]);

      // Process manual transactions (match listener format)
      const manualTransactions: Transaction[] = manualSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.user_id || auth.currentUser.uid,
          title: data.title || 'Transaction',
          amount: data.amount || 0,
          category: data.category || 'Other',
          type: data.type || 'expense',
          source: data.source || 'Manual',
          description: data.description || '',
          date: data.date || data.created_at || new Date().toISOString(),
          paymentMethod: data.payment_method || 'Unknown',
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString(),
        } as Transaction;
      });

      // Process scanner expenses
      const scannerTransactions: Transaction[] = scannerSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `scanner_${doc.id}`,
          title: data.merchantName || 'Scanned Receipt',
          description: 'Scanned receipt transaction',
          amount: data.totalAmount || 0,
          type: 'expense' as const,
          category: data.category || data.extractedCategory || 'Other',
          date: data.date || new Date().toISOString().split('T')[0],
          paymentMethod: 'Unknown',
          userId: auth.currentUser.uid,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          source: 'OCR'
        } as Transaction;
      });

      // Combine all transactions
      const allTransactions = [...manualTransactions, ...scannerTransactions];

      // Filter by date range
      const startDateOnly = startDate.split('T')[0];
      const endDateOnly = endDate.split('T')[0];
      
      const filteredTransactions = allTransactions.filter(transaction => {
        const transactionDateOnly = transaction.date.split('T')[0];
        return transactionDateOnly >= startDateOnly && transactionDateOnly <= endDateOnly;
      });

      // Only log if there's an issue (for debugging)
      if (manualTransactions.length === 0 && scannerTransactions.length > 0) {
        console.log('⚠️ Calendar: No manual transactions found, only scanner transactions');
      }

      return filteredTransactions;
    } catch (error: any) {
      console.error('Error in getTransactionsByDateRange:', error);
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
    
    const budgetsRef = collection(db, `users/${auth.currentUser.uid}/budget`);
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
          
          // Handle scanner date - use the same logic as in getTransactionsListener
          let transactionDate: Date;
          
          try {
            // For scanner transactions, use createdAt (when scanned) instead of receipt date
            // This matches the logic in getTransactionsListener
            if (scannerData.createdAt) {
              if (typeof scannerData.createdAt === 'string') {
                transactionDate = new Date(scannerData.createdAt);
              } else if (scannerData.createdAt.toDate) {
                // Firestore timestamp
                transactionDate = scannerData.createdAt.toDate();
              } else {
                transactionDate = new Date(scannerData.createdAt);
              }
            } else if (typeof scannerData.date === 'string') {
              transactionDate = new Date(scannerData.date);
            } else if (scannerData.date && typeof scannerData.date.toDate === 'function') {
              // Firestore Timestamp
              transactionDate = scannerData.date.toDate();
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
    
    // Log the scanner expense addition
    console.log('💳 Scanner expense added:', {
      id: docRef.id,
      merchantName: newScannerExpense.merchantName,
      amount: newScannerExpense.totalAmount,
      timestamp: newScannerExpense.createdAt
    });
    
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

  // Helper Methods to create sample data for testing
  static async createSampleBudget(): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const sampleBudget = {
      category: 'Food & Dining',
      amount: 5000,
      spent: 1200,
      period: 'monthly' as const,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      alertThreshold: 80,
      isActive: true,
      notifications: true
    };
    
    await this.addBudget(sampleBudget);
    console.log('✅ Sample budget created');
  }

  static async createSampleRecurrence(): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const sampleRecurrence = {
      title: 'Monthly Rent',
      amount: 15000,
      category: 'Rent',
      type: 'expense' as const,
      frequency: 'monthly' as const,
      nextDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true
    };
    
    await this.addRecurrence(sampleRecurrence);
    console.log('✅ Sample recurrence created');
  }

  static async createSampleSavingsGoal(): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    const sampleGoal = {
      name: 'Emergency Fund',
      targetAmount: 50000,
      currentAmount: 15000,
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Savings',
      priority: 'high' as const,
      description: 'Building emergency fund for unexpected expenses',
      isCompleted: false
    };
    
    await this.addSavingsGoal(sampleGoal);
    console.log('✅ Sample savings goal created');
  }

  // Force refresh financial summary (useful after adding scanner expenses)
  static async refreshFinancialSummary(): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    currentMonthIncome: number;
    currentMonthExpenses: number;
  }> {

    return await this.getUserFinancialSummary();
  }
}

export default EnhancedFirebaseService;