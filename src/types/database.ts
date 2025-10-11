// Enhanced type definitions for the new Finze database structure

export interface UserProfile {
  displayName?: string;
  avatar_url?: string;
  phone?: string;
  currency?: string;
  totalBalance?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  preferences?: {
    notifications?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    auto_categorize?: boolean;
    budget_alerts?: boolean;
    [key: string]: any;
  };
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  profile?: UserProfile;
  created_at: string;
  updated_at: string;
}

// Manual Expenses
export interface ManualExpense {
  expenseId: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// AI Categorized Expenses
export interface AICategorizedExpense {
  expenseId: string;
  raw_description: string;
  predicted_category: string;
  amount: number;
  confidence: number;
  date: string;
  created_at: string;
  updated_at: string;
}

// Scanner Expenses
export interface ScannerExpense {
  expenseId: string;
  image_url: string;
  extracted_text: string;
  amount: number;
  date: string;
  category?: string;
  merchant_name?: string;
  created_at: string;
  updated_at: string;
}

// Budget
export interface Budget {
  budgetId: string;
  category: string;
  budget_amount: number;
  amount: number; // alias for budget_amount for compatibility
  spent_amount?: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

// Recurrence
export interface Recurrence {
  recurrenceId: string;
  title: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_due_date: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Set Goal
export interface SetGoal {
  goalId: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  category?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Transaction History
export interface TransactionHistory {
  transactionId: string;
  source: 'manual' | 'ai_categorise' | 'scanner' | 'budget' | 'recurrence' | 'setgoal';
  reference_id: string; // links to expense document ID
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category?: string;
  description?: string;
  created_at: string;
}

// AI Insights
export interface AIInsight {
  insightId: string;
  insight_type: 'spending_pattern' | 'budget_warning' | 'saving_suggestion' | 'category_analysis' | 'recurring_detection';
  message: string;
  generated_from: string[]; // array of transactionId references
  severity: 'low' | 'medium' | 'high';
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

// User data structure as it appears in Firestore
export interface UserDocument {
  uid: string;
  email: string;
  displayName?: string;
  profile: UserProfile;
  created_at: string;
  updated_at: string;
}

// Collection paths and references
export const COLLECTIONS = {
  USERS: 'users',
  EXPENSES: {
    MANUAL: 'manual',
    AI_CATEGORISE: 'ai_categorise',
    SCANNER: 'scanner'
  },
  BUDGET: 'budget',
  RECURRENCE: 'recurrence',
  SETGOAL: 'setgoal',
  TRANSACTION_HISTORY: 'transaction_history',
  AI_INSIGHTS: 'ai_insights'
} as const;

// Helper function to get collection paths
export const getCollectionPath = (userId: string, collection: string, subcollection?: string): string => {
  if (subcollection) {
    return `${COLLECTIONS.USERS}/${userId}/expenses/${collection}`;
  }
  return `${COLLECTIONS.USERS}/${userId}/${collection}`;
};

// Expense categories
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Business',
  'Personal Care',
  'Gifts & Donations',
  'Insurance',
  'Taxes',
  'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// Budget periods
export const BUDGET_PERIODS = [
  'weekly',
  'monthly', 
  'quarterly',
  'yearly'
] as const;

export type BudgetPeriod = typeof BUDGET_PERIODS[number];

// Common interfaces for unified handling
export interface BaseExpense {
  expenseId: string;
  amount: number;
  date: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithType extends BaseExpense {
  type: 'manual' | 'ai_categorise' | 'scanner' | 'main';
  title?: string; // for manual
  raw_description?: string; // for AI
  predicted_category?: string; // for AI
  confidence?: number; // for AI
  image_url?: string; // for scanner
  extracted_text?: string; // for scanner
  notes?: string; // for manual
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Firebase query options
export interface QueryOptions {
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  startAfter?: any;
  where?: Array<{
    field: string;
    operator: any;
    value: any;
  }>;
}

// All types are already exported above with their declarations

// Type aliases for compatibility with existing code
export type SavingsGoal = SetGoal;
export type Transaction = TransactionHistory;