import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebase/firebase';

// Time period types
export type TimePeriod = 'day' | 'week' | 'month' | 'year';

// Date utility functions for time period filtering
export const getDateRange = (period: TimePeriod): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const dayOfWeek = now.getDay();
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      // Default to current month
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

// Helper function to check if a date is within the specified range
const isDateInRange = (date: any, dateRange: { start: Date; end: Date } | null): boolean => {
  if (!dateRange) return true; // No filter applied
  
  let expenseDate: Date;
  
  if (date instanceof Date) {
    expenseDate = date;
  } else if (date?.toDate && typeof date.toDate === 'function') {
    expenseDate = date.toDate(); // Firestore Timestamp
  } else if (typeof date === 'string') {
    expenseDate = new Date(date);
  } else {
    return true; // If we can't parse the date, include it
  }
  
  return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
};

// Helper function to get period display text
export const getPeriodDisplayText = (period: TimePeriod): string => {
  const now = new Date();
  const range = getDateRange(period);
  
  switch (period) {
    case 'day':
      return `Today (${now.toLocaleDateString()})`;
    case 'week':
      return `This Week (${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()})`;
    case 'month':
      return `This Month (${range.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`;
    case 'year':
      return `This Year (${range.start.getFullYear()})`;
    default:
      return period;
  }
};

// Helper function to get period emoji
export const getPeriodEmoji = (period: TimePeriod): string => {
  switch (period) {
    case 'day':
      return '📅';
    case 'week':
      return '📊';
    case 'month':
      return '📈';
    case 'year':
      return '🗓️';
    default:
      return '📊';
  }
};

export interface Expense {
  id: string;
  amount: number;
  description?: string;
  title?: string;
  category?: string;
  date: string | Date;
  userId: string;
  type?: string;
  created_at?: Date | Timestamp;
  updated_at?: Date | Timestamp;
}

export interface Transaction {
  id: string;
  amount: number;
  description?: string;
  title?: string;
  category?: string;
  date: string | Date;
  userId: string;
  type: 'income' | 'expense';
  created_at?: Date | Timestamp;
  updated_at?: Date | Timestamp;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  fullName?: string;
  avatar_url?: string;
  phone?: string;
  created_at: Date | Timestamp;
  updated_at: Date | Timestamp;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
    currency?: string;
    language?: string;
  };
}

/**
 * Get all expenses for a user from multiple collections
 * This function fetches from all expense-related collections to provide comprehensive data
 * @param userId - The user ID to fetch expenses for
 * @param timePeriod - Optional time period filter ('day', 'week', 'month', 'year')
 */
export async function getAllExpenses(userId: string, timePeriod?: TimePeriod): Promise<Expense[]> {
  try {
    console.log(`📊 Starting getAllExpenses for user: ${userId}${timePeriod ? ` (${timePeriod} period)` : ''}`);
    
    // Get date range if time period is specified
    const dateRange = timePeriod ? getDateRange(timePeriod) : null;
    if (dateRange) {
      console.log(`📅 Date filter: ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`);
    }
    
    const allExpenses: Expense[] = [];

    // 1. Fetch from manual expenses collection
    try {
      const manualExpensesRef = collection(db, `users/${userId}/expenses`);
      const manualQuery = query(manualExpensesRef, orderBy('created_at', 'desc'));
      const manualSnapshot = await getDocs(manualQuery);
      
      console.log(`📄 Manual expenses found: ${manualSnapshot.docs.length}`);
      
      manualSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`📝 Manual transaction: ${doc.id}, type: ${data.type}, amount: ${data.amount}`);
        // Include both expenses and income transactions
        const expenseDate = data.date || data.created_at;
        const isInDateRange = isDateInRange(expenseDate, dateRange);
        
        if (data.amount !== undefined && isInDateRange) {
          allExpenses.push({
            id: doc.id,
            ...data,
            amount: parseFloat(data.amount) || 0,
            type: data.type || 'expense', // Keep the original type (income/expense)
            date: data.date || data.created_at?.toDate?.() || new Date()
          } as Expense);
          console.log(`✅ Added transaction: ${doc.id} - ₹${data.amount} (${data.type || 'expense'})`);
        } else {
          console.log(`❌ Filtered out: ${doc.id} - amount: ${data.amount}`);
        }
      });
    } catch (error) {
      console.warn('⚠️ Error fetching manual expenses:', error);
    }

    // 2. Fetch from scanner expenses collection
    try {
      const scannerExpensesRef = collection(db, `users/${userId}/scanner_expenses`);
      const scannerQuery = query(scannerExpensesRef, orderBy('createdAt', 'desc'));
      const scannerSnapshot = await getDocs(scannerQuery);
      
      console.log(`📷 Scanner expenses found: ${scannerSnapshot.docs.length}`);
      
      scannerSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`📱 Scanner transaction: ${doc.id}, amount: ${data.totalAmount || data.amount}`);
        const expenseDate = data.date || data.createdAt;
        const isInDateRange = isDateInRange(expenseDate, dateRange);
        
        if ((data.totalAmount !== undefined || data.amount !== undefined) && isInDateRange) {
          allExpenses.push({
            id: doc.id,
            ...data,
            amount: parseFloat(data.totalAmount || data.amount) || 0,
            type: 'scanner',
            date: data.date || data.createdAt || new Date()
          } as Expense);
          console.log(`✅ Added scanner expense: ${doc.id} - ₹${data.totalAmount || data.amount}`);
        } else {
          console.log(`❌ Scanner transaction missing amount: ${doc.id}`);
        }
      });
    } catch (error) {
      console.warn('⚠️ Error fetching scanner expenses:', error);
    }

    // 3. Fetch from TransactionHistory collection (main source of transaction data)
    try {
      const transactionHistoryRef = collection(db, 'TransactionHistory');
      const transactionQuery = query(
        transactionHistoryRef,
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      const transactionSnapshot = await getDocs(transactionQuery);
      
      console.log(`💳 TransactionHistory found: ${transactionSnapshot.docs.length}`);
      
      transactionSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`💳 TransactionHistory item: ${doc.id}, type: ${data.type}, amount: ${data.amount}`);
        const expenseDate = data.date || data.created_at;
        const isInDateRange = isDateInRange(expenseDate, dateRange);
        
        // Only include expense transactions within date range
        if (data.type === 'expense' && data.amount !== undefined && isInDateRange) {
          allExpenses.push({
            id: doc.id,
            ...data,
            amount: parseFloat(data.amount) || 0,
            type: 'transaction_history',
            date: data.date || data.created_at?.toDate?.() || new Date()
          } as Expense);
          console.log(`✅ Added TransactionHistory expense: ${doc.id} - ₹${data.amount}`);
        } else {
          console.log(`❌ TransactionHistory filtered out: ${doc.id} - type: ${data.type}`);
        }
      });
    } catch (error) {
      console.warn('⚠️ Error fetching TransactionHistory:', error);
    }

    // 4. Fetch from global expenses collection (if it exists)
    try {
      const globalExpensesRef = collection(db, 'expenses');
      const globalQuery = query(
        globalExpensesRef,
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      const globalSnapshot = await getDocs(globalQuery);
      
      console.log(`🌐 Global expenses found: ${globalSnapshot.docs.length}`);
      
      globalSnapshot.forEach(doc => {
        const data = doc.data();
        const expenseDate = data.date || data.created_at;
        const isInDateRange = isDateInRange(expenseDate, dateRange);
        
        if (data.amount !== undefined && isInDateRange) {
          allExpenses.push({
            id: doc.id,
            ...data,
            amount: parseFloat(data.amount) || 0,
            type: 'global',
            date: data.date || data.created_at?.toDate?.() || new Date()
          } as Expense);
        }
      });
    } catch (error) {
      console.warn('⚠️ Error fetching global expenses (this is normal if collection doesn\'t exist):', error);
    }

    // Remove duplicates based on ID and amount+date combination
    console.log(`🔍 Before duplicate removal: ${allExpenses.length} transactions`);
    const uniqueExpenses = allExpenses.filter((expense, index, self) => 
      index === self.findIndex(e => 
        e.id === expense.id || 
        (e.amount === expense.amount && 
         new Date(e.date).getTime() === new Date(expense.date).getTime() &&
         (e.description === expense.description || e.title === expense.title))
      )
    );
    console.log(`🔍 After duplicate removal: ${uniqueExpenses.length} transactions`);

    // Sort by date (most recent first)
    uniqueExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalAmount = uniqueExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const periodText = timePeriod ? ` for ${getPeriodDisplayText(timePeriod)}` : '';
    
    console.log(`✅ Total unique expenses retrieved: ${uniqueExpenses.length}${periodText}`);
    console.log(`💰 Total amount: ₹${totalAmount.toFixed(2)}`);
    
    if (timePeriod && uniqueExpenses.length > 0) {
      const avgPerTransaction = totalAmount / uniqueExpenses.length;
      console.log(`📊 Average per transaction: ₹${avgPerTransaction.toFixed(2)}`);
      console.log(`🗓️ Date range: ${dateRange?.start.toLocaleDateString()} to ${dateRange?.end.toLocaleDateString()}`);
    }

    return uniqueExpenses;
  } catch (error) {
    console.error('❌ Error in getAllExpenses:', error);
    return [];
  }
}

/**
 * Add a new expense to the user's manual expenses collection
 */
export async function addExpense(userId: string, expenseData: Omit<Expense, 'id' | 'userId'>): Promise<string> {
  try {
    const userExpensesRef = collection(db, `users/${userId}/expenses`);
    const docRef = await addDoc(userExpensesRef, {
      ...expenseData,
      userId,
      type: 'expense',
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });
    
    console.log(`✅ Expense added with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding expense:', error);
    throw error;
  }
}

/**
 * Update an existing expense
 */
export async function updateExpense(userId: string, expenseId: string, updates: Partial<Expense>): Promise<void> {
  try {
    const expenseRef = doc(db, `users/${userId}/expenses`, expenseId);
    await updateDoc(expenseRef, {
      ...updates,
      updated_at: Timestamp.now()
    });
    
    console.log(`✅ Expense ${expenseId} updated`);
  } catch (error) {
    console.error('❌ Error updating expense:', error);
    throw error;
  }
}

/**
 * Delete an expense
 */
export async function deleteExpense(userId: string, expenseId: string): Promise<void> {
  try {
    const expenseRef = doc(db, `users/${userId}/expenses`, expenseId);
    await deleteDoc(expenseRef);
    
    console.log(`✅ Expense ${expenseId} deleted`);
  } catch (error) {
    console.error('❌ Error deleting expense:', error);
    throw error;
  }
}

/**
 * Get a specific expense by ID
 */
export async function getExpenseById(userId: string, expenseId: string): Promise<Expense | null> {
  try {
    const expenseRef = doc(db, `users/${userId}/expenses`, expenseId);
    const expenseDoc = await getDoc(expenseRef);
    
    if (expenseDoc.exists()) {
      return {
        id: expenseDoc.id,
        ...expenseDoc.data()
      } as Expense;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting expense by ID:', error);
    return null;
  }
}

/**
 * Get expenses by date range
 */
export async function getExpensesByDateRange(
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<Expense[]> {
  try {
    const allExpenses = await getAllExpenses(userId);
    
    return allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  } catch (error) {
    console.error('❌ Error getting expenses by date range:', error);
    return [];
  }
}

/**
 * Get expenses by category
 */
export async function getExpensesByCategory(userId: string, category: string): Promise<Expense[]> {
  try {
    const allExpenses = await getAllExpenses(userId);
    
    return allExpenses.filter(expense => 
      expense.category?.toLowerCase() === category.toLowerCase()
    );
  } catch (error) {
    console.error('❌ Error getting expenses by category:', error);
    return [];
  }
}

/**
 * Get user profile by ID
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      } as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting user by ID:', error);
    return null;
  }
}

/**
 * Create a new user profile
 */
export async function createUser(userData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  try {
    const userRef = doc(db, 'users', userData.email); // Use email as document ID or generate one
    await setDoc(userRef, {
      ...userData,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });
    
    console.log(`✅ User created with ID: ${userRef.id}`);
    return userRef.id;
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updated_at: Timestamp.now()
    });
    
    console.log(`✅ User profile ${userId} updated`);
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }
}

/**
 * Delete user profile
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    
    console.log(`✅ User ${userId} deleted`);
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    throw error;
  }
}

// Create a service object with all methods
const databaseServiceObj = {
  getAllExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseById,
  getExpensesByDateRange,
  getExpensesByCategory,
  getUserById,
  createUser,
  updateUserProfile,
  deleteUser
};

// Export both as named export and default export for compatibility
export const databaseService = databaseServiceObj;

export default {
  getAllExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseById,
  getExpensesByDateRange,
  getExpensesByCategory,
  getUserById,
  createUser,
  updateUserProfile,
  deleteUser
};