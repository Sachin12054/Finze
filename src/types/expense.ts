export interface User {
  user_id: string;
  name: string;
  email: string;
  password_hash?: string; // Not needed if using Firebase Auth
  phone?: string;
  created_at: string; // ISO string
  balance: number;
  // Additional profile fields
  displayName?: string;
  profilePic?: string;
  bio?: string;
  location?: string;
  website?: string;
}

// Expense categories type
export type ExpenseCategory = 
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Entertainment'
  | 'Bills & Utilities'
  | 'Healthcare'
  | 'Travel'
  | 'Education'
  | 'Business'
  | 'Other';

export interface Expense {
  expense_id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  payment_method: string; // Cash, Card, UPI, etc.
  date: string; // ISO string
  source: "Manual" | "OCR" | "Recurring" | "Import"; // Document AI
  // Legacy compatibility fields
  id?: string;
  title?: string;
  type?: "income" | "expense";
}

export interface Budget {
  budget_id: string;
  user_id: string;
  category: string;
  amount_limit: number;
  spent: number;
  start_date: string; // ISO string
  end_date: string; // ISO string
}

export interface Reminder {
  reminder_id: string;
  user_id: string;
  title: string;
  message: string;
  reminder_date: string; // ISO string
  status: "Pending" | "Completed";
}

export interface TransactionHistory {
  transaction_id: string;
  user_id: string;
  type: "Credit" | "Debit";
  amount: number;
  category: string;
  description: string;
  transaction_date: string; // ISO string
  reference?: string; // UPI ID / Bank ID
}

export interface SmartSuggestion {
  suggestion_id: string;
  user_id: string;
  suggestion_type: "Save More" | "Budget Adjustment" | "AI Insight";
  message: string;
  created_at: string; // ISO string
  status: "New" | "Viewed" | "Implemented";
}

// Legacy interfaces for backwards compatibility
export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  next_date: string;
  description?: string;
}

export interface ExtractedDetails {
  total_amount?: number;
  merchant_name?: string;
  category?: string;
  date?: string;
  items?: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  // Additional fields from enhanced backend
  extraction_confidence?: number;
  processing_time?: string;
  currency?: string;
  merchant_address?: string;
  time?: string;
  subcategory?: string;
  payment_method?: string;
  tax_details?: {
    amount: number;
    rate: number;
  };
  discounts?: Array<{
    description: string;
    amount: number;
  }>;
  additional_charges?: Array<{
    description: string;
    amount: number;
  }>;
  receipt_number?: string;
  notes?: string;
  // Database integration fields
  id?: string;
  saved_to_database?: boolean;
  save_error?: string;
}
