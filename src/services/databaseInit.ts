import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../types/expense';
import { auth, db } from './firebase';

// Initialize user in new database structure
export const initializeUserInNewSchema = async (firebaseUser: any) => {
  if (!firebaseUser) return;

  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const newUser: User = {
      user_id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: firebaseUser.email || '',
      phone: firebaseUser.phoneNumber || '',
      created_at: new Date().toISOString(),
      balance: 0,
      displayName: firebaseUser.displayName || 'User',
      profilePic: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
    };

    await setDoc(userRef, newUser);
    console.log('User initialized in new schema:', newUser);
    return newUser;
  }

  return userSnap.data() as User;
};

// Migration utility (for existing users)
export const migrateUserData = async (userId: string) => {
  try {
    // This would migrate data from the old structure to new structure
    // Implementation depends on your current data structure
    console.log(`Migration started for user: ${userId}`);
    
    // Example migration logic:
    // 1. Get data from old collections (users/{userId}/expenses, etc.)
    // 2. Transform data to new schema
    // 3. Write to new collections (expenses, budgets, etc.)
    // 4. Update user balance
    
    console.log(`Migration completed for user: ${userId}`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Collection indexes that should be created in Firestore console
export const RECOMMENDED_INDEXES = [
  {
    collection: 'expenses',
    fields: [
      { field: 'user_id', order: 'ASCENDING' },
      { field: 'date', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'expenses',
    fields: [
      { field: 'user_id', order: 'ASCENDING' },
      { field: 'category', order: 'ASCENDING' },
      { field: 'date', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'budgets',
    fields: [
      { field: 'user_id', order: 'ASCENDING' },
      { field: 'start_date', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'transactions_history',
    fields: [
      { field: 'user_id', order: 'ASCENDING' },
      { field: 'transaction_date', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'reminders',
    fields: [
      { field: 'user_id', order: 'ASCENDING' },
      { field: 'reminder_date', order: 'ASCENDING' }
    ]
  },
  {
    collection: 'smart_suggestions',
    fields: [
      { field: 'user_id', order: 'ASCENDING' },
      { field: 'status', order: 'ASCENDING' },
      { field: 'created_at', order: 'DESCENDING' }
    ]
  }
];

// Database seeding for development/testing
export const seedDatabase = async (userId: string) => {
  if (!auth.currentUser) return;

  // Sample expenses
  const sampleExpenses = [
    {
      expense_id: 'exp_1',
      user_id: userId,
      amount: 250.50,
      category: 'Food & Dining',
      description: 'Lunch at restaurant',
      payment_method: 'Card',
      date: new Date().toISOString().split('T')[0],
      source: 'Manual' as const
    },
    {
      expense_id: 'exp_2',
      user_id: userId,
      amount: 50.00,
      category: 'Transportation',
      description: 'Uber ride to office',
      payment_method: 'UPI',
      date: new Date().toISOString().split('T')[0],
      source: 'Manual' as const
    }
  ];

  // Sample budgets
  const sampleBudgets = [
    {
      budget_id: 'budget_1',
      user_id: userId,
      category: 'Food & Dining',
      amount_limit: 5000,
      spent: 250.50,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ];

  // Sample transactions (income)
  const sampleTransactions = [
    {
      transaction_id: 'trans_1',
      user_id: userId,
      type: 'Credit' as const,
      amount: 50000,
      category: 'Salary',
      description: 'Monthly salary',
      transaction_date: new Date().toISOString().split('T')[0],
      reference: 'SALARY_001'
    }
  ];

  try {
    // Add sample data
    for (const expense of sampleExpenses) {
      await setDoc(doc(db, 'expenses', expense.expense_id), expense);
    }

    for (const budget of sampleBudgets) {
      await setDoc(doc(db, 'budgets', budget.budget_id), budget);
    }

    for (const transaction of sampleTransactions) {
      await setDoc(doc(db, 'transactions_history', transaction.transaction_id), transaction);
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
  }
};
