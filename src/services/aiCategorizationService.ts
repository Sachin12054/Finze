/**
 * Enhanced AI Categorization Service
 * Advanced ML-powered expense categorization and financial insights
 */

import { EnhancedFirebaseService } from './enhancedFirebaseService';

export interface CategorySuggestion {
  category: string;
  confidence: number;
  reasoning: string;
}

export interface SmartSuggestion {
  type: 'budget_alert' | 'saving_opportunity' | 'spending_pattern' | 'goal_recommendation';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  data?: any;
}

export interface SpendingInsight {
  insight: string;
  category: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  impact: 'positive' | 'negative' | 'neutral';
  suggestion: string;
}

export interface ExpenseForCategorization {
  merchant_name?: string;
  description?: string;
  title?: string;
  note?: string;
  amount: number;
}

export interface CategoryPrediction {
  category: string;
  confidence: number;
  suggested_categories: string[];
  all_probabilities?: Record<string, number>;
}

export interface BatchResult {
  index: number;
  category?: string;
  confidence?: number;
  success: boolean;
  error?: string;
}

export interface CategoryCorrection {
  merchant_name: string;
  description: string;
  amount: number;
  predicted_category: string;
  correct_category: string;
}

class AICategorization {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://127.0.0.1:8000/api') {
    this.baseUrl = baseUrl;
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Check if the AI service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return false;
      }
      
      const result = await response.json();
      return result.success && result.status === 'healthy';
    } catch (error) {
      console.log('AI service not available:', error);
      return false;
    }
  }

  /**
   * Categorize a single expense
   */
  async categorizeExpense(expense: ExpenseForCategorization): Promise<CategoryPrediction | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/categorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_name: expense.merchant_name || expense.title || '',
          description: expense.description || expense.note || '',
          amount: expense.amount,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('AI categorization failed:', response.status);
        return null;
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          category: result.category,
          confidence: result.confidence,
          suggested_categories: result.suggested_categories,
          all_probabilities: result.all_probabilities,
        };
      } else {
        console.error('AI categorization error:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error calling AI categorization service:', error);
      return null;
    }
  }

  /**
   * Categorize multiple expenses in batch
   */
  async categorizeExpensesBatch(expenses: ExpenseForCategorization[]): Promise<BatchResult[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout * 2); // Longer timeout for batch

      const response = await fetch(`${this.baseUrl}/categorize-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expenses: expenses.map(expense => ({
            merchant_name: expense.merchant_name || expense.title || '',
            description: expense.description || expense.note || '',
            amount: expense.amount,
          })),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Batch categorization failed:', response.status);
        return expenses.map((_, index) => ({
          index,
          success: false,
          error: 'Service unavailable',
        }));
      }

      const result = await response.json();
      
      if (result.success) {
        return result.results;
      } else {
        console.error('Batch categorization error:', result.error);
        return expenses.map((_, index) => ({
          index,
          success: false,
          error: result.error,
        }));
      }
    } catch (error) {
      console.error('Error calling batch categorization service:', error);
      return expenses.map((_, index) => ({
        index,
        success: false,
        error: 'Network error',
      }));
    }
  }

  /**
   * Get all available categories
   */
  async getAvailableCategories(): Promise<string[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/categories`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Failed to get categories:', response.status);
        return this.getDefaultCategories();
      }

      const result = await response.json();
      
      if (result.success) {
        return result.categories;
      } else {
        console.error('Get categories error:', result.error);
        return this.getDefaultCategories();
      }
    } catch (error) {
      console.error('Error getting categories:', error);
      return this.getDefaultCategories();
    }
  }

  /**
   * Submit corrections to improve the model
   */
  async submitCorrections(corrections: CategoryCorrection[]): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/improve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          corrections,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Failed to submit corrections:', response.status);
        return false;
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error submitting corrections:', error);
      return false;
    }
  }

  /**
   * Get model statistics
   */
  async getModelStats(): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.success ? result.model_info : null;
    } catch (error) {
      console.error('Error getting model stats:', error);
      return null;
    }
  }

  /**
   * Get smart category suggestions based on context
   */
  async getSmartSuggestions(
    merchant_name: string, 
    description: string, 
    amount: number
  ): Promise<string[]> {
    const prediction = await this.categorizeExpense({
      merchant_name,
      description,
      amount,
    });

    if (prediction) {
      return prediction.suggested_categories;
    }

    // Fallback to rule-based suggestions
    return this.getRuleBasedSuggestions(merchant_name, description, amount);
  }

  /**
   * Categorize with fallback to rule-based system
   */
  async categorizeWithFallback(expense: ExpenseForCategorization): Promise<string> {
    // Try AI categorization first
    const aiPrediction = await this.categorizeExpense(expense);
    
    if (aiPrediction && aiPrediction.confidence > 0.6) {
      return aiPrediction.category;
    }

    // Fallback to rule-based categorization
    return this.getRuleBasedCategory(
      expense.merchant_name || expense.title || '',
      expense.description || expense.note || '',
      expense.amount
    );
  }

  /**
   * Rule-based category suggestions (fallback)
   */
  private getRuleBasedSuggestions(merchant: string, description: string, amount: number): string[] {
    const text = (merchant + ' ' + description).toLowerCase();
    
    const rules = [
      { keywords: ['mcdonalds', 'kfc', 'pizza', 'restaurant', 'cafe', 'food'], category: 'Food & Dining' },
      { keywords: ['gas', 'fuel', 'shell', 'exxon', 'chevron'], category: 'Transportation' },
      { keywords: ['grocery', 'walmart', 'target', 'supermarket'], category: 'Groceries' },
      { keywords: ['amazon', 'shopping', 'store', 'mall'], category: 'Shopping' },
      { keywords: ['netflix', 'spotify', 'movie', 'entertainment'], category: 'Entertainment' },
      { keywords: ['hospital', 'pharmacy', 'doctor', 'medical'], category: 'Healthcare' },
      { keywords: ['uber', 'taxi', 'transport', 'bus', 'train'], category: 'Transportation' },
      { keywords: ['rent', 'utility', 'electric', 'water', 'internet'], category: 'Bills & Utilities' },
    ];

    const suggestions = [];
    for (const rule of rules) {
      if (rule.keywords.some(keyword => text.includes(keyword))) {
        suggestions.push(rule.category);
      }
    }

    return suggestions.length > 0 ? suggestions : ['Other'];
  }

  /**
   * Rule-based category (fallback)
   */
  private getRuleBasedCategory(merchant: string, description: string, amount: number): string {
    const suggestions = this.getRuleBasedSuggestions(merchant, description, amount);
    return suggestions[0] || 'Other';
  }

  /**
   * Default categories (fallback)
   */
  private getDefaultCategories(): string[] {
    return [
      'Food & Dining',
      'Transportation', 
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Education',
      'Travel',
      'Groceries',
      'Gas Station',
      'Investment',
      'Income',
      'Other'
    ];
  }

  /**
   * Generate smart financial suggestions
   */
  static async generateSmartSuggestions(): Promise<SmartSuggestion[]> {
    try {
      const suggestions: SmartSuggestion[] = [];
      
      // Get recent transactions and budgets
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      
      const transactions = await EnhancedFirebaseService.getTransactionsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      const budgets = await EnhancedFirebaseService.getAllBudgets();

      // Budget alerts
      for (const budget of budgets) {
        const categorySpending = transactions
          .filter(t => t.category === budget.category && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const percentageUsed = (categorySpending / budget.amount) * 100;
        
        if (percentageUsed > 80) {
          suggestions.push({
            type: 'budget_alert',
            title: `Budget Alert: ${budget.category}`,
            description: `You've spent ${percentageUsed.toFixed(0)}% of your ${budget.category} budget this month.`,
            actionable: true,
            priority: percentageUsed > 100 ? 'high' : 'medium',
            data: { budget, percentageUsed, categorySpending }
          });
        }
      }

      // Spending pattern analysis
      const categorySpending: { [key: string]: number[] } = {};
      
      // Group transactions by category
      transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
          if (!categorySpending[transaction.category]) {
            categorySpending[transaction.category] = [];
          }
          categorySpending[transaction.category].push(transaction.amount);
        }
      });

      // Find categories with high spending
      for (const [category, amounts] of Object.entries(categorySpending)) {
        if (amounts.length >= 3) {
          const total = amounts.reduce((a, b) => a + b, 0);
          const average = total / amounts.length;
          
          if (total > 500 && average > 50) { // Significant spending
            suggestions.push({
              type: 'spending_pattern',
              title: `High ${category} Spending`,
              description: `You've spent ₹${total.toFixed(2)} on ${category} this month.`,
              actionable: true,
              priority: 'medium',
              data: { category, total, average }
            });
          }
        }
      }

      // Saving opportunities
      const totalMonthlyExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      if (totalMonthlyExpenses > 0) {
        const subscriptionExpenses = transactions
          .filter(t => 
            t.category === 'Bills & Utilities' || 
            (t.description && t.description.toLowerCase().includes('subscription'))
          )
          .reduce((sum, t) => sum + t.amount, 0);
        
        if (subscriptionExpenses > totalMonthlyExpenses * 0.15) {
          suggestions.push({
            type: 'saving_opportunity',
            title: 'Review Subscriptions',
            description: `You're spending ₹${subscriptionExpenses.toFixed(2)} on subscriptions. Consider reviewing unused ones.`,
            actionable: true,
            priority: 'low',
            data: { amount: subscriptionExpenses }
          });
        }
      }

      // Goal recommendations
      const goals = await EnhancedFirebaseService.getAllSavingsGoals();
      const hasEmergencyGoal = goals.some(goal => 
        goal.name.toLowerCase().includes('emergency') || 
        goal.name.toLowerCase().includes('fund')
      );
      
      if (!hasEmergencyGoal && totalMonthlyExpenses > 0) {
        suggestions.push({
          type: 'goal_recommendation',
          title: 'Create Emergency Fund',
          description: 'Consider setting up an emergency fund goal for 3-6 months of expenses.',
          actionable: true,
          priority: 'high',
          data: { suggestedAmount: totalMonthlyExpenses * 3 }
        });
      }

      return suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Error generating smart suggestions:', error);
      return [];
    }
  }

  /**
   * Generate spending insights
   */
  static async generateSpendingInsights(): Promise<SpendingInsight[]> {
    try {
      const insights: SpendingInsight[] = [];
      
      // Get last 3 months of data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      
      const transactions = await EnhancedFirebaseService.getTransactionsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Group by month and category
      const monthlyData: { [month: string]: { [category: string]: number } } = {};
      
      transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
          const month = transaction.date.substring(0, 7); // YYYY-MM
          if (!monthlyData[month]) monthlyData[month] = {};
          if (!monthlyData[month][transaction.category]) {
            monthlyData[month][transaction.category] = 0;
          }
          monthlyData[month][transaction.category] += transaction.amount;
        }
      });

      // Analyze trends for each category
      const months = Object.keys(monthlyData).sort();
      if (months.length >= 2) {
        const categories = new Set<string>();
        Object.values(monthlyData).forEach(monthData => {
          Object.keys(monthData).forEach(cat => categories.add(cat));
        });

        categories.forEach(category => {
          const categoryAmounts = months.map(month => monthlyData[month][category] || 0);
          const trend = this.calculateTrend(categoryAmounts);
          
          if (trend.direction !== 'stable') {
            const totalSpent = categoryAmounts.reduce((sum, amount) => sum + amount, 0);
            if (totalSpent > 100) { // Only analyze significant categories
              insights.push({
                insight: `Your ${category} spending is ${trend.direction}`,
                category,
                trend: trend.direction,
                impact: trend.direction === 'increasing' ? 'negative' : 'positive',
                suggestion: trend.direction === 'increasing' 
                  ? `Consider reviewing your ${category} expenses to identify areas for reduction.`
                  : `Great job reducing your ${category} spending! Keep it up.`
              });
            }
          }
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating spending insights:', error);
      return [];
    }
  }

  /**
   * Calculate spending trend
   */
  private static calculateTrend(amounts: number[]): { direction: 'increasing' | 'decreasing' | 'stable'; change: number } {
    if (amounts.length < 2) return { direction: 'stable', change: 0 };
    
    const first = amounts[0];
    const last = amounts[amounts.length - 1];
    const change = last - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;
    
    if (Math.abs(changePercent) < 10) return { direction: 'stable', change: changePercent };
    return { 
      direction: changePercent > 0 ? 'increasing' : 'decreasing', 
      change: changePercent 
    };
  }
}

// Create singleton instance
export const aiCategorizationService = new AICategorization();

// Export the class for custom instances
export default AICategorization;
