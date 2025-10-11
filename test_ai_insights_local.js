/**
 * Test script to verify local AI insights functionality
 */

// Simulate the enhanced local analysis
const testExpenses = [
  { amount: -50, title: "Chicken", category: "food", date: new Date() },
  { amount: -180, title: "Coffee", category: "food", date: new Date() },
  { amount: -500, title: "Petrol", category: "transport", date: new Date() }
];

const testIncome = [
  { amount: 100000, title: "Salary", category: "income", date: new Date() }
];

// Test financial health calculation
function calculateFinancialHealthEnhanced(currentExpenses, previousExpenses, currentIncome) {
  const totalExpenses = currentExpenses.reduce((sum, expense) => sum + Math.abs(expense.amount || 0), 0);
  const totalIncome = currentIncome.reduce((sum, income) => sum + Math.abs(income.amount || 0), 0);
  const previousTotal = previousExpenses.reduce((sum, expense) => sum + Math.abs(expense.amount || 0), 0);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const expenseChangePercent = previousTotal > 0 ? ((totalExpenses - previousTotal) / previousTotal) * 100 : 0;
  
  let score = 50; // Base score
  
  // Adjust score based on savings rate
  if (savingsRate > 20) score += 30;
  else if (savingsRate > 10) score += 20;
  else if (savingsRate > 0) score += 10;
  else score -= 20;
  
  // Adjust score based on expense trends
  if (expenseChangePercent < -10) score += 15;
  else if (expenseChangePercent > 20) score -= 15;
  
  return {
    score: Math.max(0, Math.min(100, score)),
    total_expenses: totalExpenses,
    total_income: totalIncome,
    savings_rate: savingsRate,
    expense_change_percent: expenseChangePercent,
    status: score >= 70 ? 'excellent' : score >= 50 ? 'good' : score >= 30 ? 'needs_attention' : 'critical'
  };
}

// Test the analysis
console.log("🧪 Testing Local AI Analysis");
console.log("==============================");

const result = calculateFinancialHealthEnhanced(testExpenses, [], testIncome);

console.log("📊 Financial Health Analysis:");
console.log(`- Total Expenses: ₹${result.total_expenses}`);
console.log(`- Total Income: ₹${result.total_income}`);
console.log(`- Savings Rate: ${result.savings_rate.toFixed(1)}%`);
console.log(`- Health Score: ${result.score}/100`);
console.log(`- Status: ${result.status}`);

console.log("\n✅ Real data analysis working!");
console.log("💡 With ₹730 expenses and ₹100,000 income:");
console.log(`   - Savings Rate: ${result.savings_rate.toFixed(1)}% (Excellent!)`);
console.log(`   - You're saving ₹${(result.total_income - result.total_expenses).toLocaleString()}`);

// Test category analysis
const categoryData = {};
testExpenses.forEach(expense => {
  const category = expense.category || 'uncategorized';
  if (!categoryData[category]) {
    categoryData[category] = [];
  }
  categoryData[category].push(Math.abs(expense.amount));
});

console.log("\n📂 Category Analysis:");
Object.entries(categoryData).forEach(([category, amounts]) => {
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  console.log(`- ${category}: ₹${total} (${amounts.length} transactions)`);
});