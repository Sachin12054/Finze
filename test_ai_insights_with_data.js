/**
 * Test script to add sample expense data and test AI insights
 * Run this in the React Native debugger console or as a standalone script
 */

import { addManualExpense } from './src/services/databaseService';
import { auth } from './src/services/firebase/firebase';

// Sample expense data for testing
const sampleExpenses = [
  {
    title: 'Grocery Shopping',
    amount: 1250,
    category: 'Food & Dining',
    date: new Date().toISOString(),
    notes: 'Weekly groceries at supermarket'
  },
  {
    title: 'Uber Ride',
    amount: 180,
    category: 'Transportation',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    notes: 'Ride to office'
  },
  {
    title: 'Coffee',
    amount: 150,
    category: 'Food & Dining',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    notes: 'Morning coffee at cafe'
  },
  {
    title: 'Movie Tickets',
    amount: 600,
    category: 'Entertainment',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    notes: 'Weekend movie with friends'
  },
  {
    title: 'Electricity Bill',
    amount: 2500,
    category: 'Bills & Utilities',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    notes: 'Monthly electricity bill'
  }
];

// Function to add sample data
export const addSampleExpenseData = async () => {
  try {
    console.log('🎯 Adding sample expense data for testing...');
    
    if (!auth.currentUser) {
      console.error('❌ User not authenticated');
      return;
    }

    for (const expense of sampleExpenses) {
      try {
        await addManualExpense(expense);
        console.log(`✅ Added expense: ${expense.title} - ₹${expense.amount}`);
      } catch (error) {
        console.error(`❌ Failed to add expense ${expense.title}:`, error);
      }
    }

    console.log('🎉 Sample data added successfully!');
    console.log('📊 Now test the AI insights to see real analysis');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
};

// Function to clear test data (optional)
export const clearTestData = async () => {
  console.log('🧹 To clear test data, delete the expenses manually from the app');
  console.log('Or implement a bulk delete function if needed');
};

// Instructions for testing
console.log(`
🧪 AI Insights Testing Instructions:

1. Make sure you're logged in to the app
2. Run: addSampleExpenseData()
3. Go to AI Insights tab in the app
4. You should see:
   - Real expense analysis instead of onboarding
   - Category breakdowns
   - Spending insights
   - Financial health score

Sample Data Being Added:
- ₹1,250 - Grocery Shopping (Food & Dining)
- ₹180 - Uber Ride (Transportation)  
- ₹150 - Coffee (Food & Dining)
- ₹600 - Movie Tickets (Entertainment)
- ₹2,500 - Electricity Bill (Bills & Utilities)

Total: ₹4,680 across 5 categories
`);