import { getAllExpenses } from './databaseService';

export interface AIInsights {
  summary: string;
  totalSpent: number;
  totalTransactions: number;
  avgTransactionAmount: number;
  recommendations: string[];
  categoryBreakdown: { [category: string]: number };
  spendingTrends: string;
  budgetSuggestions: string[];
  timeBasedAnalysis: {
    daily: { amount: number; transactions: number; avgPerDay: number };
    weekly: { amount: number; transactions: number; avgPerWeek: number };
    monthly: { amount: number; transactions: number; avgPerMonth: number };
    yearly: { amount: number; transactions: number; avgPerYear: number };
  };
  spendingInsights: {
    topSpendingDay: string;
    mostExpensiveTransaction: { title: string; amount: number; date: string };
    frequentCategory: string;
    spendingPattern: string;
    savingsOpportunity: string;
  };
  generatedAt: Date;
}

class GeminiAIInsightsService {
  private readonly API_KEY = 'AIzaSyDKQzJfaHZCH-HKUajkQ8PNa8A4yzl4YaE';
  private readonly GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  async generateAIInsights(userId: string, period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<AIInsights> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required for AI insights generation');
    }

    try {
      console.log(`🔄 Generating enhanced AI insights for user ${userId} (${period})`);

      // Get all expenses for the user
      const allExpenses = await getAllExpenses(userId);
      console.log(`📊 Found ${allExpenses.length} total expenses`);

      if (allExpenses.length === 0) {
        return this.generateEmptyInsights();
      }

      // Filter expenses based on the specified period
      const filteredExpenses = this.filterExpensesByPeriod(allExpenses, period);
      console.log(`📅 Found ${filteredExpenses.length} expenses for ${period} period`);

      if (filteredExpenses.length === 0) {
        return this.generateEmptyInsights();
      }

      // Calculate financial metrics
      const metrics = this.calculateFinancialMetrics(filteredExpenses);
      console.log(`💰 Analytics: ₹${metrics.totalSpent.toFixed(2)} spent in ${metrics.totalTransactions} transactions (${period})`);
      console.log(`📋 Categories:`, Object.keys(metrics.categoryBreakdown).map(cat => `${cat}: ₹${metrics.categoryBreakdown[cat].toFixed(2)}`).join(', '));

      // Generate AI-powered insights using Gemini
      const aiAnalysis = await this.generateGeminiAnalysis(filteredExpenses, metrics, period);

      return {
        summary: aiAnalysis.summary || `You've spent ₹${metrics.totalSpent.toFixed(2)} across ${metrics.totalTransactions} transactions this ${period}.`,
        totalSpent: metrics.totalSpent,
        totalTransactions: metrics.totalTransactions,
        avgTransactionAmount: metrics.avgTransactionAmount,
        recommendations: aiAnalysis.recommendations || this.generateBasicRecommendations(metrics),
        categoryBreakdown: metrics.categoryBreakdown,
        spendingTrends: aiAnalysis.spendingTrends || this.generateBasicTrends(metrics, period),
        budgetSuggestions: aiAnalysis.budgetSuggestions || this.generateBasicBudgetSuggestions(metrics),
        timeBasedAnalysis: this.calculateTimeBasedAnalysis(filteredExpenses, period),
        spendingInsights: this.generateSpendingInsights(filteredExpenses, metrics),
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Error generating AI insights:', error);
      return this.generateErrorInsights(error as Error);
    }
  }

  private filterExpensesByPeriod(expenses: any[], period: string): any[] {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= now;
    });
  }

  private calculateFinancialMetrics(expenses: any[]) {
    const totalSpent = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    const totalTransactions = expenses.length;
    const avgTransactionAmount = totalTransactions > 0 ? totalSpent / totalTransactions : 0;

    // Calculate category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    expenses.forEach(expense => {
      const category = expense.category || expense.type || 'Other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (parseFloat(expense.amount) || 0);
    });

    return {
      totalSpent,
      totalTransactions,
      avgTransactionAmount,
      categoryBreakdown
    };
  }

  private async generateGeminiAnalysis(expenses: any[], metrics: any, period: string) {
    try {
      const prompt = this.createAnalysisPrompt(expenses, metrics, period);
      
      const response = await fetch(`${this.GEMINI_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        return this.parseGeminiResponse(aiResponse);
      }

      throw new Error('Invalid response from Gemini API');
    } catch (error) {
      console.error('❌ Error calling Gemini API:', error);
      return {
        summary: null,
        recommendations: null,
        spendingTrends: null,
        budgetSuggestions: null
      };
    }
  }

  private createAnalysisPrompt(expenses: any[], metrics: any, period: string): string {
    const categoryData = Object.entries(metrics.categoryBreakdown)
      .map(([cat, amount]) => `${cat}: ₹${(amount as number).toFixed(2)}`)
      .join(', ');

    return `
Analyze the following financial data for ${period} period and provide insights in JSON format:

Financial Summary:
- Total Spent: ₹${metrics.totalSpent.toFixed(2)}
- Total Transactions: ${metrics.totalTransactions}
- Average Transaction: ₹${metrics.avgTransactionAmount.toFixed(2)}
- Categories: ${categoryData}

Recent Transactions (last 5):
${expenses.slice(0, 5).map(exp => 
  `- ${exp.title || exp.description || 'Transaction'}: ₹${exp.amount} (${exp.category || exp.type || 'Other'})`
).join('\n')}

Please provide analysis in this exact JSON format:
{
  "summary": "A brief 2-3 sentence summary of spending patterns",
  "recommendations": ["3-4 actionable recommendations for better financial management"],
  "spendingTrends": "Analysis of spending trends and patterns",
  "budgetSuggestions": ["3-4 specific budget suggestions based on the data"]
}

Focus on:
1. Spending patterns and trends
2. Category-wise analysis
3. Practical recommendations for saving money
4. Budget optimization suggestions
5. Areas of concern or opportunity

Respond only with valid JSON, no additional text.
`;
  }

  private parseGeminiResponse(response: string) {
    try {
      // Clean the response and extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        return {
          summary: parsed.summary || null,
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : null,
          spendingTrends: parsed.spendingTrends || null,
          budgetSuggestions: Array.isArray(parsed.budgetSuggestions) ? parsed.budgetSuggestions : null
        };
      }
      return { summary: null, recommendations: null, spendingTrends: null, budgetSuggestions: null };
    } catch (error) {
      console.error('❌ Error parsing Gemini response:', error);
      return { summary: null, recommendations: null, spendingTrends: null, budgetSuggestions: null };
    }
  }

  private generateBasicRecommendations(metrics: any): string[] {
    const recommendations = [];
    
    if (metrics.avgTransactionAmount > 500) {
      recommendations.push("Consider reviewing high-value transactions to identify potential savings");
    }
    
    const topCategory = Object.entries(metrics.categoryBreakdown)
      .reduce((a, b) => (a[1] as number) > (b[1] as number) ? a : b);
    
    if (topCategory && (topCategory[1] as number) > metrics.totalSpent * 0.4) {
      recommendations.push(`Your spending on ${topCategory[0]} is quite high. Consider setting a budget for this category.`);
    }
    
    recommendations.push("Track your expenses regularly to maintain better financial awareness");
    recommendations.push("Set monthly spending limits for each category to control expenses");
    
    return recommendations;
  }

  private generateBasicTrends(metrics: any, period: string): string {
    const topCategory = Object.entries(metrics.categoryBreakdown)
      .reduce((a, b) => (a[1] as number) > (b[1] as number) ? a : b);
    
    return `During this ${period}, your highest spending category was ${topCategory[0]} at ₹${(topCategory[1] as number).toFixed(2)}. Your average transaction amount was ₹${metrics.avgTransactionAmount.toFixed(2)}.`;
  }

  private generateBasicBudgetSuggestions(metrics: any): string[] {
    const suggestions = [];
    const totalSpent = metrics.totalSpent;
    
    suggestions.push(`Consider setting a monthly budget of ₹${(totalSpent * 1.1).toFixed(0)} to allow for some flexibility`);
    
    Object.entries(metrics.categoryBreakdown).forEach(([category, amount]) => {
      if ((amount as number) > totalSpent * 0.15) {
        suggestions.push(`Set a budget of ₹${(amount as number * 0.9).toFixed(0)} for ${category} to reduce spending`);
      }
    });
    
    if (suggestions.length === 1) {
      suggestions.push("Allocate 70% for needs, 20% for wants, and 10% for savings");
      suggestions.push("Review and adjust your budget monthly based on spending patterns");
    }
    
    return suggestions.slice(0, 4);
  }

  private calculateTimeBasedAnalysis(expenses: any[], period: string) {
    const totalAmount = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const totalTransactions = expenses.length;
    
    // Calculate different time-based averages
    const now = new Date();
    const daysInPeriod = this.getDaysInPeriod(period);
    
    return {
      daily: {
        amount: totalAmount,
        transactions: totalTransactions,
        avgPerDay: daysInPeriod > 0 ? totalAmount / daysInPeriod : totalAmount
      },
      weekly: {
        amount: totalAmount,
        transactions: totalTransactions,
        avgPerWeek: daysInPeriod > 0 ? (totalAmount / daysInPeriod) * 7 : totalAmount
      },
      monthly: {
        amount: totalAmount,
        transactions: totalTransactions,
        avgPerMonth: daysInPeriod > 0 ? (totalAmount / daysInPeriod) * 30 : totalAmount
      },
      yearly: {
        amount: totalAmount,
        transactions: totalTransactions,
        avgPerYear: daysInPeriod > 0 ? (totalAmount / daysInPeriod) * 365 : totalAmount
      }
    };
  }

  private getDaysInPeriod(period: string): number {
    switch (period) {
      case 'day': return 1;
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
      default: return 30;
    }
  }

  private generateSpendingInsights(expenses: any[], metrics: any) {
    // Find the most expensive transaction
    const mostExpensive = expenses.reduce((max, exp) => 
      (parseFloat(exp.amount) || 0) > (parseFloat(max.amount) || 0) ? exp : max
    , expenses[0] || {});

    // Find the most frequent category
    const categoryCount: { [key: string]: number } = {};
    expenses.forEach(exp => {
      const category = exp.category || exp.type || 'Other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    const frequentCategory = Object.entries(categoryCount)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    // Analyze spending by day of week
    const dailySpending: { [key: string]: number } = {};
    expenses.forEach(exp => {
      const day = new Date(exp.date).toLocaleDateString('en-US', { weekday: 'long' });
      dailySpending[day] = (dailySpending[day] || 0) + (parseFloat(exp.amount) || 0);
    });
    
    const topSpendingDay = Object.entries(dailySpending)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0] || 'Unknown';

    return {
      topSpendingDay,
      mostExpensiveTransaction: {
        title: mostExpensive.title || mostExpensive.description || 'Transaction',
        amount: parseFloat(mostExpensive.amount) || 0,
        date: mostExpensive.date || new Date().toISOString()
      },
      frequentCategory,
      spendingPattern: this.analyzeSpendingPattern(expenses),
      savingsOpportunity: this.identifySavingsOpportunity(metrics)
    };
  }

  private analyzeSpendingPattern(expenses: any[]): string {
    if (expenses.length < 5) {
      return "Not enough data to identify spending patterns";
    }

    const recentExpenses = expenses.slice(0, 10);
    const avgAmount = recentExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0) / recentExpenses.length;
    
    const highValueTransactions = recentExpenses.filter(exp => (parseFloat(exp.amount) || 0) > avgAmount * 1.5);
    
    if (highValueTransactions.length > recentExpenses.length * 0.3) {
      return "You tend to make several high-value transactions";
    } else if (avgAmount < 200) {
      return "You mostly make small, frequent purchases";
    } else {
      return "You have a balanced mix of transaction sizes";
    }
  }

  private identifySavingsOpportunity(metrics: any): string {
    const categories = Object.entries(metrics.categoryBreakdown) as [string, number][];
    const topCategory = categories.reduce((a, b) => a[1] > b[1] ? a : b);
    
    if (topCategory[1] > metrics.totalSpent * 0.4) {
      return `Consider reducing spending on ${topCategory[0]} by 10-15% to save ₹${(topCategory[1] * 0.1).toFixed(0)} per period`;
    }
    
    return `Try to reduce your average transaction amount by ₹50 to save approximately ₹${(metrics.totalTransactions * 50).toFixed(0)} per period`;
  }

  private generateEmptyInsights(): AIInsights {
    return {
      summary: "No expenses found for the selected period. Start tracking your expenses to get meaningful insights.",
      totalSpent: 0,
      totalTransactions: 0,
      avgTransactionAmount: 0,
      recommendations: [
        "Start by adding your daily expenses to the app",
        "Use the expense scanner feature to quickly add receipts",
        "Set up budget categories for better tracking",
        "Review your expenses weekly to build good financial habits"
      ],
      categoryBreakdown: {},
      spendingTrends: "No spending data available for analysis",
      budgetSuggestions: [
        "Create a monthly budget with categories like Food, Transport, Entertainment",
        "Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings",
        "Start with small, achievable budget goals"
      ],
      timeBasedAnalysis: {
        daily: { amount: 0, transactions: 0, avgPerDay: 0 },
        weekly: { amount: 0, transactions: 0, avgPerWeek: 0 },
        monthly: { amount: 0, transactions: 0, avgPerMonth: 0 },
        yearly: { amount: 0, transactions: 0, avgPerYear: 0 }
      },
      spendingInsights: {
        topSpendingDay: 'No data',
        mostExpensiveTransaction: { title: 'No transactions', amount: 0, date: new Date().toISOString() },
        frequentCategory: 'No data',
        spendingPattern: 'No spending pattern available',
        savingsOpportunity: 'Start tracking expenses to identify savings opportunities'
      },
      generatedAt: new Date()
    };
  }

  private generateErrorInsights(error: Error): AIInsights {
    return {
      summary: "Unable to generate insights due to an error. Please try again later.",
      totalSpent: 0,
      totalTransactions: 0,
      avgTransactionAmount: 0,
      recommendations: [
        "Check your internet connection and try again",
        "Ensure you have added some expenses to analyze",
        "Contact support if the issue persists"
      ],
      categoryBreakdown: {},
      spendingTrends: `Error occurred: ${error.message}`,
      budgetSuggestions: ["Please try generating insights again"],
      timeBasedAnalysis: {
        daily: { amount: 0, transactions: 0, avgPerDay: 0 },
        weekly: { amount: 0, transactions: 0, avgPerWeek: 0 },
        monthly: { amount: 0, transactions: 0, avgPerMonth: 0 },
        yearly: { amount: 0, transactions: 0, avgPerYear: 0 }
      },
      spendingInsights: {
        topSpendingDay: 'Error',
        mostExpensiveTransaction: { title: 'Error', amount: 0, date: new Date().toISOString() },
        frequentCategory: 'Error',
        spendingPattern: 'Unable to analyze pattern due to error',
        savingsOpportunity: 'Please try again to get savings suggestions'
      },
      generatedAt: new Date()
    };
  }
}

export const geminiAIInsightsService = new GeminiAIInsightsService();
export default geminiAIInsightsService;
