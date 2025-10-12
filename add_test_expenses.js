// Quick test to add sample expenses directly through the app
// Paste this in React Native debugger console or run in your test environment

import { addManualExpense } from './src/services/databaseService';

// Sample expenses for testing AI insights
const testExpenses = [
  {
    title: 'Grocery Shopping',
    amount: 1250,
    category: 'Food & Dining',
    date: new Date().toISOString(),
    notes: 'Weekly groceries'
  },
  {
    title: 'Uber Ride to Office',
    amount: 180,
    category: 'Transportation',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Daily commute'
  },
  {
    title: 'Coffee Shop',
    amount: 150,
    category: 'Food & Dining',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Morning coffee'
  },
  {
    title: 'Movie Tickets',
    amount: 600,
    category: 'Entertainment',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Weekend entertainment'
  },
  {
    title: 'Electricity Bill',
    amount: 2500,
    category: 'Bills & Utilities',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Monthly bill'
  }
];

// Add the expenses
testExpenses.forEach(async (expense, index) => {
  try {
    setTimeout(async () => {
      const result = await addManualExpense(expense);
      console.log(`✅ Added: ${expense.title} - ₹${expense.amount}`);
    }, index * 500); // Stagger the additions
  } catch (error) {
    console.error(`❌ Failed to add ${expense.title}:`, error);
  }
});

console.log('🎯 Adding 5 sample expenses...');
console.log('Total amount: ₹4,680 across 4 categories');
console.log('📊 Refresh AI Insights after expenses are added!');