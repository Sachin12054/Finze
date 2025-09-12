import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import {
    Budget,
    Expense,
    Reminder,
    SmartSuggestion,
    TransactionHistory,
    User
} from '../types/expense';
import { auth, db } from './firebase';

// Helper function to generate UUID
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Users Collection Operations
export const createUser = async (userData: Omit<User, 'user_id' | 'created_at' | 'balance'>) => {
  const user: User = {
    user_id: generateId(),
    ...userData,
    created_at: new Date().toISOString(),
    balance: 0,
  };
  
  await addDoc(collection(db, 'users'), user);
  return user;
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const q = query(collection(db, 'users'), where('user_id', '==', userId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  return snapshot.docs[0].data() as User;
};

export const updateUserBalance = async (userId: string, newBalance: number) => {
  const q = query(collection(db, 'users'), where('user_id', '==', userId));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const userDoc = snapshot.docs[0];
    await updateDoc(userDoc.ref, { balance: newBalance });
  }
};

// Expenses Collection Operations
export const addExpense = async (expenseData: Omit<Expense, 'expense_id' | 'user_id'>) => {
  if (!auth.currentUser) throw new Error('No authenticated user');
  
  const expense: Expense = {
    expense_id: generateId(),
    user_id: auth.currentUser.uid,
    ...expenseData,
  };
  
  await addDoc(collection(db, 'expenses'), expense);
  
  // Update user balance
  const currentUser = await getUserById(auth.currentUser.uid);
  if (currentUser) {
    const newBalance = currentUser.balance - expense.amount;
    await updateUserBalance(auth.currentUser.uid, newBalance);
  }
  
  return expense;
};

export const getExpensesByUser = (userId: string, callback: (expenses: (Expense & { firebaseId: string })[]) => void) => {
  const q = query(
    collection(db, 'expenses'), 
    where('user_id', '==', userId),
    orderBy('date', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map(doc => ({
      ...(doc.data() as Expense),
      firebaseId: doc.id // Keep Firebase doc ID for updates/deletes
    }));
    callback(expenses);
  });
};

export const updateExpense = async (firebaseId: string, updates: Partial<Expense>) => {
  const expenseRef = doc(db, 'expenses', firebaseId);
  await updateDoc(expenseRef, updates);
};

export const deleteExpense = async (firebaseId: string) => {
  const expenseRef = doc(db, 'expenses', firebaseId);
  await deleteDoc(expenseRef);
};

// Budgets Collection Operations
export const addBudget = async (budgetData: Omit<Budget, 'budget_id' | 'user_id' | 'spent'>) => {
  if (!auth.currentUser) throw new Error('No authenticated user');
  
  const budget: Budget = {
    budget_id: generateId(),
    user_id: auth.currentUser.uid,
    spent: 0,
    ...budgetData,
  };
  
  await addDoc(collection(db, 'budgets'), budget);
  return budget;
};

export const getBudgetsByUser = (userId: string, callback: (budgets: (Budget & { firebaseId: string })[]) => void) => {
  const q = query(
    collection(db, 'budgets'), 
    where('user_id', '==', userId),
    orderBy('start_date', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const budgets = snapshot.docs.map(doc => ({
      ...(doc.data() as Budget),
      firebaseId: doc.id
    }));
    callback(budgets);
  });
};

export const updateBudgetSpent = async (firebaseId: string, spentAmount: number) => {
  const budgetRef = doc(db, 'budgets', firebaseId);
  await updateDoc(budgetRef, { spent: spentAmount });
};

// Reminders Collection Operations
export const addReminder = async (reminderData: Omit<Reminder, 'reminder_id' | 'user_id'>) => {
  if (!auth.currentUser) throw new Error('No authenticated user');
  
  const reminder: Reminder = {
    reminder_id: generateId(),
    user_id: auth.currentUser.uid,
    ...reminderData,
  };
  
  await addDoc(collection(db, 'reminders'), reminder);
  return reminder;
};

export const getRemindersByUser = (userId: string, callback: (reminders: (Reminder & { firebaseId: string })[]) => void) => {
  const q = query(
    collection(db, 'reminders'), 
    where('user_id', '==', userId),
    orderBy('reminder_date', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const reminders = snapshot.docs.map(doc => ({
      ...(doc.data() as Reminder),
      firebaseId: doc.id
    }));
    callback(reminders);
  });
};

export const updateReminderStatus = async (firebaseId: string, status: 'Pending' | 'Completed') => {
  const reminderRef = doc(db, 'reminders', firebaseId);
  await updateDoc(reminderRef, { status });
};

// Transaction History Collection Operations
export const addTransaction = async (transactionData: Omit<TransactionHistory, 'transaction_id' | 'user_id'>) => {
  if (!auth.currentUser) throw new Error('No authenticated user');
  
  const transaction: TransactionHistory = {
    transaction_id: generateId(),
    user_id: auth.currentUser.uid,
    ...transactionData,
  };
  
  await addDoc(collection(db, 'transactions_history'), transaction);
  
  // Update user balance
  const currentUser = await getUserById(auth.currentUser.uid);
  if (currentUser) {
    const balanceChange = transaction.type === 'Credit' ? transaction.amount : -transaction.amount;
    const newBalance = currentUser.balance + balanceChange;
    await updateUserBalance(auth.currentUser.uid, newBalance);
  }
  
  return transaction;
};

export const getTransactionsByUser = (userId: string, callback: (transactions: (TransactionHistory & { firebaseId: string })[]) => void) => {
  const q = query(
    collection(db, 'transactions_history'), 
    where('user_id', '==', userId),
    orderBy('transaction_date', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      ...(doc.data() as TransactionHistory),
      firebaseId: doc.id
    }));
    callback(transactions);
  });
};

// Smart Suggestions Collection Operations
export const addSmartSuggestion = async (suggestionData: Omit<SmartSuggestion, 'suggestion_id' | 'user_id' | 'created_at' | 'status'>) => {
  if (!auth.currentUser) throw new Error('No authenticated user');
  
  const suggestion: SmartSuggestion = {
    suggestion_id: generateId(),
    user_id: auth.currentUser.uid,
    created_at: new Date().toISOString(),
    status: 'New',
    ...suggestionData,
  };
  
  await addDoc(collection(db, 'smart_suggestions'), suggestion);
  return suggestion;
};

export const getSmartSuggestionsByUser = (userId: string, callback: (suggestions: (SmartSuggestion & { firebaseId: string })[]) => void) => {
  const q = query(
    collection(db, 'smart_suggestions'), 
    where('user_id', '==', userId),
    orderBy('created_at', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const suggestions = snapshot.docs.map(doc => ({
      ...(doc.data() as SmartSuggestion),
      firebaseId: doc.id
    }));
    callback(suggestions);
  });
};

export const updateSuggestionStatus = async (firebaseId: string, status: 'New' | 'Viewed' | 'Implemented') => {
  const suggestionRef = doc(db, 'smart_suggestions', firebaseId);
  await updateDoc(suggestionRef, { status });
};

// Analytics and Helper Functions
export const getUserExpenseSummary = async (userId: string, startDate: string, endDate: string) => {
  const q = query(
    collection(db, 'expenses'),
    where('user_id', '==', userId),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  
  const snapshot = await getDocs(q);
  const expenses = snapshot.docs.map(doc => doc.data() as Expense);
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryBreakdown = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalExpenses,
    categoryBreakdown,
    transactionCount: expenses.length,
  };
};

export const getBudgetProgress = async (userId: string) => {
  const q = query(collection(db, 'budgets'), where('user_id', '==', userId));
  const snapshot = await getDocs(q);
  const budgets = snapshot.docs.map(doc => doc.data() as Budget);
  
  return budgets.map(budget => ({
    ...budget,
    progress: (budget.spent / budget.amount_limit) * 100,
    remaining: budget.amount_limit - budget.spent,
    isOverBudget: budget.spent > budget.amount_limit,
  }));
};
