import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

// Legacy interface for backwards compatibility - matches existing nested structure
export interface LegacyExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: "income" | "expense";
  source?: "Manual" | "OCR" | "Recurring" | "Import";
  description?: string;
  // New required fields for compatibility
  expense_id: string;
  user_id: string;
  payment_method: string;
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

// Legacy adapter service functions using existing Firebase structure
export const adaptedAddExpense = async (expense: Omit<LegacyExpense, 'id'>) => {
  try {
    if (!auth.currentUser) {
      throw new Error('No authenticated user found');
    }
    
    // Validate required fields
    if (!expense.title || !expense.amount || !expense.category) {
      throw new Error('Missing required expense fields');
    }
    
    // Extract only the fields needed for the existing Firebase structure
    const firebaseExpense = {
      title: expense.title.trim(),
      amount: Number(expense.amount),
      category: expense.category,
      date: expense.date || new Date().toISOString(),
      type: expense.type || 'expense',
      source: expense.source || 'Manual',
      description: expense.description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Adding expense to Firebase:', firebaseExpense);
    const expenseRef = collection(db, `users/${auth.currentUser.uid}/expenses`);
    const docRef = await addDoc(expenseRef, firebaseExpense);
    console.log('Expense added successfully with ID:', docRef.id);
    
    return docRef;
  } catch (error) {
    console.error('Error in adaptedAddExpense:', error);
    throw error;
  }
};

export const adaptedAddBudget = async (budget: Omit<LegacyBudget, 'id'>) => {
  try {
    if (!auth.currentUser) {
      throw new Error('No authenticated user found');
    }
    
    // Validate required fields
    if (!budget.categoryId || !budget.amount) {
      throw new Error('Missing required budget fields');
    }
    
    const firebaseBudget = {
      ...budget,
      amount: Number(budget.amount),
      spent: budget.spent || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Adding budget to Firebase:', firebaseBudget);
    const budgetRef = collection(db, `users/${auth.currentUser.uid}/budgets`);
    const docRef = await addDoc(budgetRef, firebaseBudget);
    console.log('Budget added successfully with ID:', docRef.id);
    
    return docRef;
  } catch (error) {
    console.error('Error in adaptedAddBudget:', error);
    throw error;
  }
};

export const adaptedGetExpenses = (userId: string, callback: (expenses: LegacyExpense[]) => void) => {
  try {
    if (!userId) {
      console.error('No userId provided to adaptedGetExpenses');
      callback([]);
      return () => {};
    }
    
    console.log('Setting up expenses listener for user:', userId);
    const expenseColRef = collection(db, `users/${userId}/expenses`);
    
    return onSnapshot(
      expenseColRef, 
      (snapshot) => {
        try {
          const data = snapshot.docs.map((doc) => {
            const docData = doc.data();
            return {
              id: doc.id,
              expense_id: doc.id,
              user_id: userId,
              payment_method: docData.payment_method || "Cash",
              source: docData.source || "Manual",
              title: docData.title || "Untitled Expense",
              amount: Number(docData.amount) || 0,
              category: docData.category || "Other",
              date: docData.date || new Date().toISOString(),
              type: docData.type || "expense",
              description: docData.description || "",
              ...docData,
            } as LegacyExpense;
          });
          
          // Sort by date (newest first)
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          console.log('Expenses loaded successfully:', data.length, 'items');
          callback(data);
        } catch (error) {
          console.error('Error processing expenses data:', error);
          callback([]);
        }
      }, 
      (error) => {
        console.error('Expenses listener error:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up expenses listener:', error);
    callback([]);
    return () => {};
  }
};

export const adaptedGetBudgets = (userId: string, callback: (budgets: LegacyBudget[]) => void) => {
  try {
    if (!userId) {
      console.error('No userId provided to adaptedGetBudgets');
      callback([]);
      return () => {};
    }
    
    console.log('Setting up budgets listener for user:', userId);
    const budgetColRef = collection(db, `users/${userId}/budgets`);
    
    return onSnapshot(
      budgetColRef, 
      (snapshot) => {
        try {
          const data = snapshot.docs.map((doc) => {
            const docData = doc.data();
            return {
              id: doc.id,
              categoryId: docData.categoryId || "Other",
              amount: Number(docData.amount) || 0,
              spent: Number(docData.spent) || 0,
              start_date: docData.start_date || new Date().toISOString(),
              end_date: docData.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              description: docData.description || "",
              ...docData,
            } as LegacyBudget;
          });
          
          // Sort by creation date (newest first)
          data.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
          
          console.log('Budgets loaded successfully:', data.length, 'items');
          callback(data);
        } catch (error) {
          console.error('Error processing budgets data:', error);
          callback([]);
        }
      }, 
      (error) => {
        console.error('Budgets listener error:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up budgets listener:', error);
    callback([]);
    return () => {};
  }
};

export const adaptedDeleteExpense = async (expenseId: string, expenseType: 'income' | 'expense') => {
  try {
    if (!auth.currentUser) {
      throw new Error('No authenticated user found');
    }
    
    if (!expenseId) {
      throw new Error('No expense ID provided');
    }
    
    console.log('Deleting expense:', expenseId, 'for user:', auth.currentUser.uid);
    await deleteDoc(doc(db, `users/${auth.currentUser.uid}/expenses`, expenseId));
    console.log('Expense deleted successfully');
  } catch (error) {
    console.error('Error in adaptedDeleteExpense:', error);
    throw error;
  }
};
