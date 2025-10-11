import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import {
    AICategorizedExpense,
    AIInsight,
    Budget,
    COLLECTIONS,
    ExpenseWithType,
    getCollectionPath,
    ManualExpense,
    QueryOptions,
    Recurrence,
    ScannerExpense,
    SetGoal,
    TransactionHistory,
    UserDocument,
    UserProfile
} from '../types/database';
import { auth, db } from './firebase/firebase';

// Helper function to generate UUID
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper function to ensure user is authenticated
const ensureAuth = () => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }
  return auth.currentUser.uid;
};

// ===== USER OPERATIONS =====

export const createUser = async (userData: Omit<UserDocument, 'uid' | 'created_at' | 'updated_at'>): Promise<UserDocument> => {
  const uid = ensureAuth();
  
  const user: UserDocument = {
    uid,
    ...userData,
    profile: {
      currency: 'INR',
      preferences: {
        notifications: true,
        theme: 'auto',
        language: 'en',
        auto_categorize: true,
        budget_alerts: true
      },
      ...userData.profile
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  await setDoc(doc(db, COLLECTIONS.USERS, uid), user);
  return user;
};

export const getUserById = async (userId: string): Promise<UserDocument | null> => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    
    if (userDoc.exists()) {
      const data = userDoc.data() as UserDocument;
      return data;
    }
    return null;
  } catch (error: any) {
    console.error('getUserById: Firebase error details:', {
      code: error.code,
      message: error.message,
      userId: userId,
      collectionPath: COLLECTIONS.USERS,
      fullPath: `${COLLECTIONS.USERS}/${userId}`
    });
    
    // Handle specific permission error with helpful message
    if (error.code === 'permission-denied') {
      throw new Error(`Profile access denied. Please deploy Firestore rules: firebase deploy --only firestore:rules`);
    }
    
    throw new Error(`Error fetching profile: ${error.message}`);
  }
};

export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    profile: profileData,
    updated_at: new Date().toISOString()
  });
};

// ===== EXPENSE OPERATIONS =====

// Manual Expenses
export const addManualExpense = async (expenseData: Omit<ManualExpense, 'expenseId' | 'created_at' | 'updated_at'>): Promise<ManualExpense> => {
  const userId = ensureAuth();
  const expenseId = generateId();
  
  const expense: ManualExpense = {
    expenseId,
    ...expenseData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const collectionPath = getCollectionPath(userId, COLLECTIONS.EXPENSES.MANUAL);
  await setDoc(doc(db, collectionPath, expenseId), expense);
  
  // Add to transaction history
  await addTransactionHistory({
    source: 'manual',
    reference_id: expenseId,
    amount: expense.amount,
    date: expense.date,
    type: 'expense',
    category: expense.category,
    description: expense.title
  });
  
  return expense;
};

export const getManualExpenses = (userId: string, callback: (expenses: ManualExpense[]) => void) => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.EXPENSES.MANUAL);
  const q = query(collection(db, collectionPath), orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map(doc => doc.data() as ManualExpense);
    callback(expenses);
  });
};

export const updateManualExpense = async (userId: string, expenseId: string, updates: Partial<ManualExpense>): Promise<void> => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.EXPENSES.MANUAL);
  await updateDoc(doc(db, collectionPath, expenseId), {
    ...updates,
    updated_at: new Date().toISOString()
  });
};

export const deleteManualExpense = async (userId: string, expenseId: string): Promise<void> => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.EXPENSES.MANUAL);
  await deleteDoc(doc(db, collectionPath, expenseId));
};

// AI Categorized Expenses
export const addAICategorizedExpense = async (expenseData: Omit<AICategorizedExpense, 'expenseId' | 'created_at' | 'updated_at'>): Promise<AICategorizedExpense> => {
  const userId = ensureAuth();
  const expenseId = generateId();
  
  const expense: AICategorizedExpense = {
    expenseId,
    ...expenseData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const collectionPath = getCollectionPath(userId, COLLECTIONS.EXPENSES.AI_CATEGORISE);
  await setDoc(doc(db, collectionPath, expenseId), expense);
  
  // Add to transaction history
  await addTransactionHistory({
    source: 'ai_categorise',
    reference_id: expenseId,
    amount: expense.amount,
    date: expense.date,
    type: 'expense',
    category: expense.predicted_category,
    description: expense.raw_description
  });
  
  return expense;
};

export const getAICategorizedExpenses = (userId: string, callback: (expenses: AICategorizedExpense[]) => void) => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.EXPENSES.AI_CATEGORISE);
  const q = query(collection(db, collectionPath), orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map(doc => doc.data() as AICategorizedExpense);
    callback(expenses);
  });
};

// Scanner Expenses
export const addScannerExpense = async (expenseData: Omit<ScannerExpense, 'expenseId' | 'created_at' | 'updated_at'>): Promise<ScannerExpense> => {
  const userId = ensureAuth();
  const expenseId = generateId();
  
  const expense: ScannerExpense = {
    expenseId,
    ...expenseData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const collectionPath = getCollectionPath(userId, COLLECTIONS.EXPENSES.SCANNER);
  await setDoc(doc(db, collectionPath, expenseId), expense);
  
  // Add to transaction history
  await addTransactionHistory({
    source: 'scanner',
    reference_id: expenseId,
    amount: expense.amount,
    date: expense.date,
    type: 'expense',
    category: expense.category,
    description: expense.extracted_text.substring(0, 100) // First 100 chars as description
  });
  
  return expense;
};

export const getScannerExpenses = (userId: string, callback: (expenses: ScannerExpense[]) => void) => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.EXPENSES.SCANNER);
  const q = query(collection(db, collectionPath), orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map(doc => doc.data() as ScannerExpense);
    callback(expenses);
  });
};

// Get all expenses (combined from all sources)
export const getAllExpenses = async (userId: string, options: QueryOptions = {}): Promise<ExpenseWithType[]> => {
  const allExpenses: ExpenseWithType[] = [];
  
  try {
    // Fetch manual expenses
    try {
      const manualPath = getCollectionPath(userId, COLLECTIONS.EXPENSES.MANUAL);
      const manualSnapshot = await getDocs(collection(db, manualPath));
      manualSnapshot.docs.forEach(doc => {
        const data = doc.data() as ManualExpense;
        allExpenses.push({ ...data, type: 'manual' });
      });
    } catch (error) {
      console.warn('Error fetching manual expenses:', error);
    }
    
    // Fetch AI categorized expenses
    try {
      const aiPath = getCollectionPath(userId, COLLECTIONS.EXPENSES.AI_CATEGORISE);
      const aiSnapshot = await getDocs(collection(db, aiPath));
      aiSnapshot.docs.forEach(doc => {
        const data = doc.data() as AICategorizedExpense;
        allExpenses.push({ ...data, type: 'ai_categorise' });
      });
    } catch (error) {
      console.warn('Error fetching AI categorized expenses:', error);
    }
    
    // Fetch scanner expenses
    try {
      const scannerPath = getCollectionPath(userId, COLLECTIONS.EXPENSES.SCANNER);
      const scannerSnapshot = await getDocs(collection(db, scannerPath));
      scannerSnapshot.docs.forEach(doc => {
        const data = doc.data() as ScannerExpense;
        allExpenses.push({ ...data, type: 'scanner' });
      });
    } catch (error) {
      console.warn('Error fetching scanner expenses:', error);
    }
    
    // ENHANCED: Fetch from the main expenses collection (where real data is stored)
    try {
      console.log('🔍 Fetching from main expenses collection for user:', userId);
      
      // Use where query to filter by user_id efficiently
      const mainExpensesRef = collection(db, 'expenses');
      const userExpensesQuery = query(mainExpensesRef, 
        // Simple query without ordering to avoid index issues
        // We'll sort in JavaScript instead
      );
      
      // Get all documents and filter for this user
      const mainSnapshot = await getDocs(mainExpensesRef);
      let foundMainExpenses = 0;
      
      mainSnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Check if this expense belongs to the current user
        if (data.user_id === userId && data.amount !== undefined) {
          foundMainExpenses++;
          
          const expense: ExpenseWithType = { 
            expenseId: doc.id,
            amount: data.amount,
            date: data.created_at || data.date || new Date().toISOString(), // Use created_at if available
            category: data.category || 'Other',
            type: 'main', // Mark as main collection expense
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
            title: data.title || data.description || 'Expense',
            notes: data.notes || data.description || ''
          };
          
          allExpenses.push(expense);
          console.log(`✅ Added main collection expense: ${expense.title} - ₹${expense.amount}`);
        }
      });
      
      console.log(`📊 Found ${foundMainExpenses} expenses in main collection for user ${userId}`);
      
    } catch (error) {
      console.warn('Error fetching main expenses collection:', error);
      
      // Fallback: try with a direct user_id filter query
      try {
        console.log('🔄 Trying fallback query for main expenses...');
        const mainExpensesRef = collection(db, 'expenses');
        
        // Simple approach: get all docs and filter (not ideal but works)
        const allDocsSnapshot = await getDocs(mainExpensesRef);
        let fallbackCount = 0;
        
        allDocsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.user_id === userId) {
            fallbackCount++;
            const expense: ExpenseWithType = {
              expenseId: doc.id,
              amount: data.amount || 0,
              date: data.created_at || data.date || new Date().toISOString(),
              category: data.category || 'Other',
              type: 'main',
              created_at: data.created_at || new Date().toISOString(),
              updated_at: data.updated_at || new Date().toISOString(),
              title: data.title || data.description || 'Expense',
              notes: data.notes || data.description || ''
            };
            allExpenses.push(expense);
          }
        });
        
        console.log(`📊 Fallback found ${fallbackCount} expenses for user ${userId}`);
        
      } catch (fallbackError) {
        console.error('❌ Both main collection queries failed:', fallbackError);
      }
    }
    
    // Sort by date (newest first) and remove duplicates
    const uniqueExpenses = allExpenses.filter((expense, index, self) => 
      index === self.findIndex(e => 
        (e.expenseId === expense.expenseId || 
         (Math.abs(e.amount - expense.amount) < 0.01 && 
          e.date === expense.date && 
          e.category === expense.category))
      )
    );
    
    uniqueExpenses.sort((a, b) => {
      const dateA = new Date(a.date || a.created_at || 0).getTime();
      const dateB = new Date(b.date || b.created_at || 0).getTime();
      return dateB - dateA;
    });
    
    return uniqueExpenses;
  } catch (error) {
    console.error('Error fetching all expenses:', error);
    return [];
  }
};

// ===== BUDGET OPERATIONS =====

export const addBudget = async (budgetData: Omit<Budget, 'budgetId' | 'created_at' | 'updated_at'>): Promise<Budget> => {
  const userId = ensureAuth();
  const budgetId = generateId();
  
  const budget: Budget = {
    budgetId,
    ...budgetData,
    spent_amount: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const collectionPath = getCollectionPath(userId, COLLECTIONS.BUDGET);
  await setDoc(doc(db, collectionPath, budgetId), budget);
  
  return budget;
};

export const getBudgets = (userId: string, callback: (budgets: Budget[]) => void) => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.BUDGET);
  const q = query(collection(db, collectionPath), orderBy('start_date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const budgets = snapshot.docs.map(doc => doc.data() as Budget);
    callback(budgets);
  });
};

export const updateBudget = async (userId: string, budgetId: string, updates: Partial<Budget>): Promise<void> => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.BUDGET);
  await updateDoc(doc(db, collectionPath, budgetId), {
    ...updates,
    updated_at: new Date().toISOString()
  });
};

export const deleteBudget = async (userId: string, budgetId: string): Promise<void> => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.BUDGET);
  await deleteDoc(doc(db, collectionPath, budgetId));
};

// ===== RECURRENCE OPERATIONS =====

export const addRecurrence = async (recurrenceData: Omit<Recurrence, 'recurrenceId' | 'created_at' | 'updated_at'>): Promise<Recurrence> => {
  const userId = ensureAuth();
  const recurrenceId = generateId();
  
  const recurrence: Recurrence = {
    recurrenceId,
    ...recurrenceData,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const collectionPath = getCollectionPath(userId, COLLECTIONS.RECURRENCE);
  await setDoc(doc(db, collectionPath, recurrenceId), recurrence);
  
  return recurrence;
};

export const getRecurrences = (userId: string, callback: (recurrences: Recurrence[]) => void) => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.RECURRENCE);
  const q = query(collection(db, collectionPath), orderBy('next_due_date', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const recurrences = snapshot.docs.map(doc => doc.data() as Recurrence);
    callback(recurrences);
  });
};

export const updateRecurrence = async (userId: string, recurrenceId: string, updates: Partial<Recurrence>): Promise<void> => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.RECURRENCE);
  await updateDoc(doc(db, collectionPath, recurrenceId), {
    ...updates,
    updated_at: new Date().toISOString()
  });
};

// ===== GOAL OPERATIONS =====

export const addSetGoal = async (goalData: Omit<SetGoal, 'goalId' | 'created_at' | 'updated_at'>): Promise<SetGoal> => {
  const userId = ensureAuth();
  const goalId = generateId();
  
  const goal: SetGoal = {
    goalId,
    ...goalData,
    is_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const collectionPath = getCollectionPath(userId, COLLECTIONS.SETGOAL);
  await setDoc(doc(db, collectionPath, goalId), goal);
  
  return goal;
};

export const getSetGoals = (userId: string, callback: (goals: SetGoal[]) => void) => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.SETGOAL);
  const q = query(collection(db, collectionPath), orderBy('deadline', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(doc => doc.data() as SetGoal);
    callback(goals);
  });
};

export const updateSetGoal = async (userId: string, goalId: string, updates: Partial<SetGoal>): Promise<void> => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.SETGOAL);
  await updateDoc(doc(db, collectionPath, goalId), {
    ...updates,
    updated_at: new Date().toISOString()
  });
};

// ===== TRANSACTION HISTORY OPERATIONS =====

export const addTransactionHistory = async (transactionData: Omit<TransactionHistory, 'transactionId' | 'created_at'>): Promise<TransactionHistory> => {
  const userId = ensureAuth();
  const transactionId = generateId();
  
  const transaction: TransactionHistory = {
    transactionId,
    ...transactionData,
    created_at: new Date().toISOString()
  };
  
  const collectionPath = getCollectionPath(userId, COLLECTIONS.TRANSACTION_HISTORY);
  await setDoc(doc(db, collectionPath, transactionId), transaction);
  
  return transaction;
};

export const getTransactionHistory = (userId: string, callback: (transactions: TransactionHistory[]) => void) => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.TRANSACTION_HISTORY);
  const q = query(collection(db, collectionPath), orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => doc.data() as TransactionHistory);
    callback(transactions);
  });
};

// ===== AI INSIGHTS OPERATIONS =====

export const addAIInsight = async (insightData: Omit<AIInsight, 'insightId' | 'created_at'>): Promise<AIInsight> => {
  const userId = ensureAuth();
  const insightId = generateId();
  
  const insight: AIInsight = {
    insightId,
    ...insightData,
    is_read: false,
    created_at: new Date().toISOString()
  };
  
  const collectionPath = getCollectionPath(userId, COLLECTIONS.AI_INSIGHTS);
  await setDoc(doc(db, collectionPath, insightId), insight);
  
  return insight;
};

export const getAIInsights = (userId: string, callback: (insights: AIInsight[]) => void) => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.AI_INSIGHTS);
  const q = query(collection(db, collectionPath), orderBy('created_at', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const insights = snapshot.docs.map(doc => doc.data() as AIInsight);
    callback(insights);
  });
};

export const markInsightAsRead = async (userId: string, insightId: string): Promise<void> => {
  const collectionPath = getCollectionPath(userId, COLLECTIONS.AI_INSIGHTS);
  await updateDoc(doc(db, collectionPath, insightId), {
    is_read: true
  });
};

// ===== ANALYTICS AND HELPER FUNCTIONS =====

export const getUserAnalytics = async (userId: string, startDate: string, endDate: string) => {
  const allExpenses = await getAllExpenses(userId);
  
  // Filter by date range
  const filteredExpenses = allExpenses.filter(expense => 
    expense.date >= startDate && expense.date <= endDate
  );
  
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Category breakdown
  const categoryBreakdown = filteredExpenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  
  // Source breakdown (manual, AI, scanner)
  const sourceBreakdown = filteredExpenses.reduce((acc, expense) => {
    acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalExpenses,
    totalTransactions: filteredExpenses.length,
    averageTransaction: totalExpenses / filteredExpenses.length || 0,
    categoryBreakdown,
    sourceBreakdown,
    period: { startDate, endDate }
  };
};

// Helper function to calculate budget spending
export const calculateBudgetSpending = async (userId: string, budgetId: string): Promise<number> => {
  const budget = await getDoc(doc(db, getCollectionPath(userId, COLLECTIONS.BUDGET), budgetId));
  if (!budget.exists()) return 0;
  
  const budgetData = budget.data() as Budget;
  const allExpenses = await getAllExpenses(userId);
  
  // Filter expenses by category and date range
  const relevantExpenses = allExpenses.filter(expense => 
    expense.category === budgetData.category &&
    expense.date >= budgetData.start_date &&
    expense.date <= budgetData.end_date
  );
  
  return relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);
};

// Export current user ID helper
export const getCurrentUserId = (): string => {
  return ensureAuth();
};

// Export database service object for easier imports
export const databaseService = {
  // User management
  createUser,
  getUserById,
  updateUserProfile,

  // Manual expenses
  addManualExpense,
  updateManualExpense,
  deleteManualExpense,
  getManualExpenses,

  // AI categorized expenses
  addAICategorizedExpense,
  getAICategorizedExpenses,

  // Scanner expenses
  addScannerExpense,
  getScannerExpenses,

  // Combined expenses
  getAllExpenses,

  // Budget management
  addBudget,
  updateBudget,
  deleteBudget,
  getBudgets,

  // Recurrence management
  addRecurrence,
  updateRecurrence,
  getRecurrences,

  // Goals management
  addSetGoal,
  updateSetGoal,
  getSetGoals,

  // Transaction history
  addTransactionHistory,
  getTransactionHistory,

  // AI insights
  addAIInsight,
  getAIInsights,

  // Utility functions
  getCurrentUserId
};