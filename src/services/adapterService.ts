import {
  Budget as NewBudget,
  Expense as NewExpense,
  TransactionHistory
} from '../types/expense';
import {
  addBudget,
  addExpense,
  addTransaction,
  deleteExpense as deleteExpenseFromDB,
  getBudgetsByUser,
  getExpensesByUser,
  getTransactionsByUser,
  updateExpense as updateExpenseInDB
} from './databaseService';

// Legacy interface for backwards compatibility
export interface LegacyExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: "income" | "expense";
  source?: "Manual" | "OCR" | "Recurring" | "Import";
  description?: string;
}

export interface LegacyBudget {
  id: string;
  categoryId: string;
  amount: number;
  spent?: number;
  start_date: string;
  end_date: string;
  description?: string;
}

export interface LegacyUser {
  name: string;
  email: string;
  uid: string;
  displayName?: string;
  profilePic?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
}

// Conversion functions
const convertNewExpenseToLegacy = (expense: NewExpense & { firebaseId: string }): LegacyExpense => ({
  id: expense.firebaseId,
  title: expense.description.split(':')[0] || 'Expense', // Extract title from description
  amount: expense.amount,
  category: expense.category,
  date: expense.date,
  type: expense.amount > 0 ? "expense" : "income", // All expenses are expenses in new schema
  source: expense.source as "Manual" | "OCR" | "Recurring" | "Import",
  description: expense.description,
});

const convertLegacyExpenseToNew = (expense: Omit<LegacyExpense, 'id'>): Omit<NewExpense, 'expense_id' | 'user_id'> => ({
  amount: expense.amount,
  category: expense.category,
  description: expense.description || expense.title,
  payment_method: 'Unknown', // Default payment method
  date: expense.date,
  source: (expense.source === 'Recurring' || expense.source === 'Import') ? 'Manual' as const : ((expense.source as "Manual" | "OCR") || 'Manual'),
});

const convertNewBudgetToLegacy = (budget: NewBudget & { firebaseId: string }): LegacyBudget => ({
  id: budget.firebaseId,
  categoryId: budget.category,
  amount: budget.amount_limit,
  spent: budget.spent,
  start_date: budget.start_date,
  end_date: budget.end_date,
  description: '', // Not in new schema
});

const convertLegacyBudgetToNew = (budget: Omit<LegacyBudget, 'id'>): Omit<NewBudget, 'budget_id' | 'user_id' | 'spent'> => ({
  category: budget.categoryId,
  amount_limit: budget.amount,
  start_date: budget.start_date,
  end_date: budget.end_date,
});

// Adapter service functions
export const adaptedAddExpense = async (expense: Omit<LegacyExpense, 'id'>) => {
  const newExpenseData = convertLegacyExpenseToNew(expense);
  
  // For income, add as transaction instead
  if (expense.type === 'income') {
    return await addTransaction({
      type: 'Credit',
      amount: expense.amount,
      category: expense.category,
      description: expense.description || expense.title,
      transaction_date: expense.date,
      reference: expense.source,
    });
  } else {
    return await addExpense(newExpenseData);
  }
};

export const adaptedAddBudget = async (budget: Omit<LegacyBudget, 'id'>) => {
  const newBudgetData = convertLegacyBudgetToNew(budget);
  return await addBudget(newBudgetData);
};

export const adaptedGetExpenses = (userId: string, callback: (expenses: LegacyExpense[]) => void) => {
  // Get both expenses and income transactions
  const expensesUnsubscribe = getExpensesByUser(userId, (expenses) => {
    const legacyExpenses = expenses.map(convertNewExpenseToLegacy);
    
    // Also get transactions for income
    const transactionsUnsubscribe = getTransactionsByUser(userId, (transactions) => {
      const incomeTransactions: LegacyExpense[] = transactions
        .filter(t => t.type === 'Credit')
        .map(t => ({
          id: t.firebaseId,
          title: t.description.split(':')[0] || 'Income',
          amount: t.amount,
          category: t.category,
          date: t.transaction_date,
          type: 'income' as const,
          source: 'Manual' as const,
          description: t.description,
        }));
      
      // Combine and sort by date
      const allTransactions = [...legacyExpenses, ...incomeTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      callback(allTransactions);
    });
    
    return transactionsUnsubscribe;
  });
  
  return expensesUnsubscribe;
};

export const adaptedGetBudgets = (userId: string, callback: (budgets: LegacyBudget[]) => void) => {
  return getBudgetsByUser(userId, (budgets) => {
    const legacyBudgets = budgets.map(convertNewBudgetToLegacy);
    callback(legacyBudgets);
  });
};

export const adaptedDeleteExpense = async (expenseId: string, expenseType: 'income' | 'expense') => {
  if (expenseType === 'income') {
    // Delete from transactions_history
    const { deleteDoc, doc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    await deleteDoc(doc(db, 'transactions_history', expenseId));
  } else {
    // Delete from expenses
    await deleteExpenseFromDB(expenseId);
  }
};

export const adaptedUpdateExpense = async (
  expenseId: string, 
  updates: Partial<LegacyExpense>,
  expenseType: 'income' | 'expense'
) => {
  if (expenseType === 'income') {
    // Update in transactions_history
    const { updateDoc, doc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    const transactionUpdates: Partial<TransactionHistory> = {};
    
    if (updates.amount !== undefined) transactionUpdates.amount = updates.amount;
    if (updates.category !== undefined) transactionUpdates.category = updates.category;
    if (updates.description !== undefined) transactionUpdates.description = updates.description;
    if (updates.date !== undefined) transactionUpdates.transaction_date = updates.date;
    
    await updateDoc(doc(db, 'transactions_history', expenseId), transactionUpdates);
  } else {
    // Update in expenses
    const expenseUpdates: Partial<NewExpense> = {};
    
    if (updates.amount !== undefined) expenseUpdates.amount = updates.amount;
    if (updates.category !== undefined) expenseUpdates.category = updates.category;
    if (updates.description !== undefined) expenseUpdates.description = updates.description;
    if (updates.date !== undefined) expenseUpdates.date = updates.date;
    
    await updateExpenseInDB(expenseId, expenseUpdates);
  }
};
