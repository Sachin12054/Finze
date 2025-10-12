import { logGeminiSetupInstructions, validateGeminiAPIKey } from '../utils/apiKeyHelper';
import { safeAsync, withTimeout } from '../utils/asyncErrorHandler';
import { getAllExpenses, TimePeriod } from './databaseService';

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

class EnhancedGeminiAIInsightsService {
  private readonly API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  private readonly GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  /**
   * Filter transactions to only include expenses (exclude income)
   */
  private filterExpensesOnly(transactions: any[]): any[] {
    return transactions.filter(transaction => 
      transaction.type !== 'income' && 
      transaction.type !== 'Income' &&
      (!transaction.category || transaction.category.toLowerCase() !== 'income')
    );
  }

  async generateAIInsights(userId: string, period: TimePeriod = 'month'): Promise<AIInsights> {
    try {
      console.log(`🔄 Generating comprehensive AI insights for user ${userId} (${period})`);
      
      // Get expenses filtered by time period directly from database
      const allExpenses = await getAllExpenses(userId, period);
      // Filter out income transactions to ensure only expenses are analyzed
      const filteredExpenses = this.filterExpensesOnly(allExpenses);
      console.log(`📊 Found ${allExpenses.length} total transactions, ${filteredExpenses.length} expenses for ${period} period`);
      
      if (filteredExpenses.length === 0) {
        return this.generateEmptyInsights();
      }

      // Get all expenses for comparison analysis
      const allExpensesUnfiltered = await getAllExpenses(userId);
      const allFilteredExpenses = this.filterExpensesOnly(allExpensesUnfiltered);
      console.log(`🌍 Total expenses (all time): ${allFilteredExpenses.length}`);

      // Calculate comprehensive financial metrics
      const metrics = this.calculateFinancialMetrics(filteredExpenses, allFilteredExpenses);
      
      // Generate time-based analysis
      const timeBasedAnalysis = this.generateTimeBasedAnalysis(allFilteredExpenses);
      
      // Generate spending insights
      const spendingInsights = this.generateSpendingInsights(filteredExpenses, allFilteredExpenses);

      console.log(`💰 Analytics: ₹${metrics.totalSpent.toFixed(2)} spent in ${metrics.totalTransactions} transactions (${period})`);
      console.log(`📋 Categories:`, Object.keys(metrics.categoryBreakdown).map(cat => `${cat}: ₹${metrics.categoryBreakdown[cat].toFixed(2)}`).join(', '));

      // Generate AI insights using Gemini with enhanced data
      const aiAnalysis = await this.callGeminiAPI(filteredExpenses, metrics, timeBasedAnalysis, spendingInsights, period);

      return {
        summary: aiAnalysis.summary || `You've spent ₹${metrics.totalSpent.toFixed(2)} across ${metrics.totalTransactions} transactions this ${period}. ${this.getSmartSummary(timeBasedAnalysis, spendingInsights, metrics)}`,
        totalSpent: metrics.totalSpent,
        totalTransactions: metrics.totalTransactions,
        avgTransactionAmount: metrics.avgTransactionAmount,
        recommendations: aiAnalysis.recommendations || this.generateDefaultRecommendations(metrics, spendingInsights),
        categoryBreakdown: metrics.categoryBreakdown,
        spendingTrends: aiAnalysis.spendingTrends || this.generateSpendingTrends(timeBasedAnalysis, spendingInsights, metrics),
        budgetSuggestions: aiAnalysis.budgetSuggestions || this.generateBudgetSuggestions(metrics.categoryBreakdown),
        timeBasedAnalysis,
        spendingInsights,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Error generating AI insights:', error);
      
      // Enhanced fallback with time-based analysis
      return this.generateEnhancedFallback(userId);
    }
  }

  private generateEmptyInsights(): AIInsights {
    return {
      summary: 'No expense data available yet. Start tracking your expenses to unlock powerful AI insights about your spending patterns!',
      totalSpent: 0,
      totalTransactions: 0,
      avgTransactionAmount: 0,
      recommendations: [
        '🎯 Add your first expense to start tracking',
        '📱 Try scanning receipts for quick entry',
        '💡 Set up categories for better organization',
        '📊 Track daily expenses to identify patterns'
      ],
      categoryBreakdown: {},
      spendingTrends: 'No data available yet',
      budgetSuggestions: [],
      timeBasedAnalysis: {
        daily: { amount: 0, transactions: 0, avgPerDay: 0 },
        weekly: { amount: 0, transactions: 0, avgPerWeek: 0 },
        monthly: { amount: 0, transactions: 0, avgPerMonth: 0 },
        yearly: { amount: 0, transactions: 0, avgPerYear: 0 }
      },
      spendingInsights: {
        topSpendingDay: 'No data',
        mostExpensiveTransaction: { title: 'None', amount: 0, date: '' },
        frequentCategory: 'No category data',
        spendingPattern: 'Start tracking to identify patterns',
        savingsOpportunity: 'Track expenses to find savings opportunities'
      },
      generatedAt: new Date()
    };
  }

  private filterExpensesByPeriod(expenses: any[], period: 'day' | 'week' | 'month' | 'quarter' | 'year'): any[] {
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
    }

    return expenses.filter(exp => {
      const expenseDate = new Date(exp.date);
      return expenseDate >= startDate && expenseDate <= now;
    });
  }

  private calculateFinancialMetrics(filteredExpenses: any[], allExpenses: any[]) {
    const totalSpent = filteredExpenses.reduce((sum, exp) => sum + (parseFloat(String(exp.amount)) || 0), 0);
    const totalTransactions = filteredExpenses.length;
    const avgTransactionAmount = totalTransactions > 0 ? totalSpent / totalTransactions : 0;

    // Category breakdown
    const categoryBreakdown: { [category: string]: number } = {};
    filteredExpenses.forEach(exp => {
      const category = exp.category || 'Other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (parseFloat(String(exp.amount)) || 0);
    });

    return {
      totalSpent,
      totalTransactions,
      avgTransactionAmount,
      categoryBreakdown
    };
  }

  private generateTimeBasedAnalysis(allExpenses: any[]) {
    const now = new Date();
    
    // Daily analysis (today)
    const today = allExpenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.toDateString() === now.toDateString();
    });
    const dailyAmount = today.reduce((sum, exp) => sum + (parseFloat(String(exp.amount)) || 0), 0);

    // Weekly analysis (last 7 days)
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekExpenses = allExpenses.filter(exp => new Date(exp.date) >= weekStart);
    const weeklyAmount = weekExpenses.reduce((sum, exp) => sum + (parseFloat(String(exp.amount)) || 0), 0);

    // Monthly analysis (last 30 days)
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthExpenses = allExpenses.filter(exp => new Date(exp.date) >= monthStart);
    const monthlyAmount = monthExpenses.reduce((sum, exp) => sum + (parseFloat(String(exp.amount)) || 0), 0);

    // Yearly analysis (all expenses, assuming within a year)
    const yearlyAmount = allExpenses.reduce((sum, exp) => sum + (parseFloat(String(exp.amount)) || 0), 0);

    return {
      daily: {
        amount: dailyAmount,
        transactions: today.length,
        avgPerDay: dailyAmount
      },
      weekly: {
        amount: weeklyAmount,
        transactions: weekExpenses.length,
        avgPerWeek: weeklyAmount / 7
      },
      monthly: {
        amount: monthlyAmount,
        transactions: monthExpenses.length,
        avgPerMonth: monthlyAmount / 30
      },
      yearly: {
        amount: yearlyAmount,
        transactions: allExpenses.length,
        avgPerYear: yearlyAmount / 365
      }
    };
  }

  private generateSpendingInsights(filteredExpenses: any[], allExpenses: any[]) {
    // Find most expensive transaction
    const mostExpensive = allExpenses.reduce((max, exp) => 
      (parseFloat(String(exp.amount)) || 0) > (parseFloat(String(max.amount)) || 0) ? exp : max, 
      allExpenses[0] || { title: 'None', amount: 0, date: '' }
    );

    // Find most frequent category
    const categoryCount: { [key: string]: number } = {};
    allExpenses.forEach(exp => {
      const category = exp.category || 'Other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    const frequentCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No category data';

    // Find top spending day of week
    const daySpending: { [key: string]: number } = {};
    allExpenses.forEach(exp => {
      const day = new Date(exp.date).toLocaleDateString('en-IN', { weekday: 'long' });
      daySpending[day] = (daySpending[day] || 0) + (parseFloat(String(exp.amount)) || 0);
    });
    const topSpendingDay = Object.entries(daySpending)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data';

    // Generate spending pattern analysis
    const avgTransaction = allExpenses.length > 0 
      ? allExpenses.reduce((sum, exp) => sum + (parseFloat(String(exp.amount)) || 0), 0) / allExpenses.length 
      : 0;
    
    let spendingPattern = 'Regular small transactions';
    if (avgTransaction > 5000) spendingPattern = 'High-value purchases';
    else if (avgTransaction > 1000) spendingPattern = 'Medium-value transactions';

    // Generate savings opportunity
    const foodSpending = allExpenses
      .filter(exp => (exp.category || '').toLowerCase().includes('food'))
      .reduce((sum, exp) => sum + (parseFloat(String(exp.amount)) || 0), 0);
    
    let savingsOpportunity = 'Track expenses for 30 days to identify savings opportunities';
    if (foodSpending > 5000) {
      savingsOpportunity = `Food expenses: ₹${foodSpending.toFixed(2)} - Consider meal planning to save 15-20%`;
    } else if (mostExpensive.amount > 10000) {
      savingsOpportunity = `Large purchase detected (₹${mostExpensive.amount}) - Consider comparing prices for big purchases`;
    }

    return {
      topSpendingDay,
      mostExpensiveTransaction: {
        title: mostExpensive.title || 'None',
        amount: parseFloat(String(mostExpensive.amount)) || 0,
        date: mostExpensive.date || ''
      },
      frequentCategory,
      spendingPattern,
      savingsOpportunity
    };
  }

  private getSmartSummary(timeBasedAnalysis: any, spendingInsights: any, metrics: any): string {
    const insights = [];
    
    if (timeBasedAnalysis.weekly.amount > timeBasedAnalysis.monthly.avgPerMonth * 4) {
      insights.push('This week you\'re spending above your monthly average');
    }
    
    if (spendingInsights.topSpendingDay !== 'No data') {
      insights.push(`${spendingInsights.topSpendingDay} is your highest spending day`);
    }
    
    if (metrics.avgTransactionAmount > 2000) {
      insights.push('You tend to make higher-value transactions');
    }
    
    return insights.length > 0 ? insights.join('. ') + '.' : '';
  }

  private generateSpendingTrends(timeBasedAnalysis: any, spendingInsights: any, metrics: any): string {
    const trends = [];
    
    // Weekly vs Monthly comparison
    const weeklyProjected = timeBasedAnalysis.weekly.amount * 4.33; // Average weeks per month
    const monthlyActual = timeBasedAnalysis.monthly.amount;
    
    if (weeklyProjected > monthlyActual * 1.1) {
      trends.push('Your spending is trending upward this week');
    } else if (weeklyProjected < monthlyActual * 0.9) {
      trends.push('Your spending is decreasing this week');
    } else {
      trends.push('Your spending is relatively consistent');
    }
    
    // Day-based patterns
    if (spendingInsights.topSpendingDay !== 'No data') {
      trends.push(`Peak spending occurs on ${spendingInsights.topSpendingDay}`);
    }
    
    // Transaction patterns
    if (metrics.avgTransactionAmount > 3000) {
      trends.push('You prefer fewer, higher-value transactions');
    } else if (metrics.avgTransactionAmount < 500) {
      trends.push('You make frequent small purchases');
    }
    
    return trends.join('. ') + '.';
  }

  private generateDefaultRecommendations(metrics: any, spendingInsights: any): string[] {
    const recommendations = [];
    
    if (metrics.avgTransactionAmount > 5000) {
      recommendations.push('💰 High average spending detected - review large purchases for necessity');
    }
    
    if (spendingInsights.frequentCategory.toLowerCase().includes('food')) {
      recommendations.push('🍽️ Food is your top category - consider meal planning to optimize costs');
    }
    
    if (metrics.totalTransactions < 5) {
      recommendations.push('📱 Track more expenses to get better insights and patterns');
    } else {
      recommendations.push('📊 Great tracking! Review weekly patterns to optimize spending');
    }
    
    recommendations.push(`🎯 Set a budget for ${spendingInsights.frequentCategory} category`);
    recommendations.push('💡 Use receipt scanning for faster expense tracking');
    
    // Time-based recommendations
    if (spendingInsights.topSpendingDay !== 'No data') {
      recommendations.push(`📅 Plan ahead for ${spendingInsights.topSpendingDay}s - your highest spending day`);
    }
    
    return recommendations;
  }

  private generateBudgetSuggestions(categoryBreakdown: { [key: string]: number }): string[] {
    const suggestions = [];
    const sortedCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a);
    
    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0];
      suggestions.push(`🎯 ${topCategory}: Set monthly budget of ₹${Math.ceil(topAmount * 1.1)}`);
    }
    
    if (sortedCategories.length > 1) {
      const [secondCategory, secondAmount] = sortedCategories[1];
      suggestions.push(`📊 ${secondCategory}: Budget ₹${Math.ceil(secondAmount * 1.2)} monthly`);
    }
    
    suggestions.push('📈 Review and adjust budgets monthly based on actual spending');
    suggestions.push('🔔 Set up alerts when approaching 80% of category budgets');
    
    return suggestions;
  }

  private async callGeminiAPI(expenses: any[], metrics: any, timeBasedAnalysis: any, spendingInsights: any, period: string) {
    try {
      // Validate API key
      const validation = validateGeminiAPIKey(this.API_KEY);
      
      if (!validation.isValid) {
        console.warn('⚠️ Gemini API key validation failed:', validation.message);
        if (validation.suggestions) {
          validation.suggestions.forEach(suggestion => console.warn('💡', suggestion));
        }
        logGeminiSetupInstructions();
        return this.generateFallbackAnalysis(metrics, spendingInsights);
      }

      console.log('✅ API key validation passed');
      console.log('🔑 API Key (first 10 chars):', this.API_KEY.substring(0, 10) + '...');
      console.log('🌐 Gemini URL:', this.GEMINI_URL);

      const prompt = this.buildEnhancedAnalysisPrompt(expenses, metrics, timeBasedAnalysis, spendingInsights, period);
      
      // Use withTimeout utility to wrap the API call
      const result = await safeAsync(
        () => withTimeout(
          () => fetch(this.GEMINI_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': this.API_KEY,
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
              },
              safetySettings: [
                {
                  category: "HARM_CATEGORY_HARASSMENT",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                  category: "HARM_CATEGORY_HATE_SPEECH",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
              ]
            })
          }),
          30000 // 30 second timeout
        )
      );

      if (!result.success || !result.data) {
        console.warn('❌ Gemini API call failed:', result.error?.message);
        return this.generateFallbackAnalysis(metrics, spendingInsights);
      }

      const response = result.data;

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`❌ Gemini API error (${response.status}):`, errorText.substring(0, 200));
        
        // Provide specific guidance for common errors
        if (response.status === 400 && errorText.includes('API key not valid')) {
          console.warn('💡 Your API key may be invalid or expired');
          logGeminiSetupInstructions();
        }
        
        return this.generateFallbackAnalysis(metrics, spendingInsights);
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!aiText) {
        console.warn('❌ Empty response from Gemini API');
        return this.generateFallbackAnalysis(metrics, spendingInsights);
      }

      console.log('✅ Successfully received Gemini AI response');
      return this.parseGeminiResponse(aiText);
    } catch (error) {
      console.warn('❌ Gemini API call failed. Using fallback analysis:', error instanceof Error ? error.message : 'Unknown error');
      return this.generateFallbackAnalysis(metrics, spendingInsights);
    }
  }

  private buildEnhancedAnalysisPrompt(expenses: any[], metrics: any, timeBasedAnalysis: any, spendingInsights: any, period: string): string {
    const categoryList = Object.entries(metrics.categoryBreakdown)
      .map(([cat, amount]) => `${cat}: ₹${(amount as number).toFixed(2)}`)
      .join(', ');

    const recentExpenses = expenses.slice(0, 5).map(exp => 
      `₹${exp.amount} on ${exp.title} (${exp.category || 'Uncategorized'})`
    ).join(', ');

    return `
You are an advanced AI financial advisor analyzing comprehensive spending data with time-based insights. Provide detailed insights in JSON format.

ENHANCED SPENDING DATA (${period} period):
- Total Spent: ₹${metrics.totalSpent.toFixed(2)}
- Total Transactions: ${metrics.totalTransactions}
- Average per transaction: ₹${metrics.avgTransactionAmount.toFixed(2)}
- Category Breakdown: ${categoryList}
- Recent Expenses: ${recentExpenses}

TIME-BASED ANALYSIS:
- Daily Average: ₹${timeBasedAnalysis.daily.avgPerDay.toFixed(2)} (${timeBasedAnalysis.daily.transactions} transactions)
- Weekly Total: ₹${timeBasedAnalysis.weekly.amount.toFixed(2)} (${timeBasedAnalysis.weekly.transactions} transactions)
- Monthly Total: ₹${timeBasedAnalysis.monthly.amount.toFixed(2)} (${timeBasedAnalysis.monthly.transactions} transactions)
- Yearly Projection: ₹${timeBasedAnalysis.yearly.amount.toFixed(2)}

SPENDING INSIGHTS:
- Top Spending Day: ${spendingInsights.topSpendingDay}
- Most Expensive Transaction: ${spendingInsights.mostExpensiveTransaction.title} (₹${spendingInsights.mostExpensiveTransaction.amount})
- Frequent Category: ${spendingInsights.frequentCategory}
- Spending Pattern: ${spendingInsights.spendingPattern}
- Savings Opportunity: ${spendingInsights.savingsOpportunity}

Provide a comprehensive JSON response with:
{
  "summary": "4-5 sentence overview highlighting key insights from time-based analysis, spending patterns, and actionable insights",
  "recommendations": ["5-6 specific, actionable recommendations based on time-based patterns and spending insights"],
  "spendingTrends": "Detailed analysis of spending trends, time-based patterns, and behavioral insights",
  "budgetSuggestions": ["4-5 budget recommendations based on category analysis, time patterns, and spending optimization"]
}

Focus on:
- Time-based spending patterns and optimization
- Category-specific insights and recommendations
- Behavioral patterns and habit formation
- Specific actionable advice for Indian context
- Smart budgeting strategies based on actual patterns
- Day/week/month spending optimization
`;
  }

  private parseGeminiResponse(aiText: string) {
    try {
      // Clean the text first
      const cleanText = aiText.trim();
      
      // Try to extract JSON from AI response
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Ensure all fields are strings and clean
        return {
          summary: typeof parsed.summary === 'string' ? parsed.summary.replace(/[\n\r]/g, ' ').trim() : 'AI analysis completed successfully.',
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.filter((r: any) => typeof r === 'string') : ['Review your spending patterns', 'Set category-wise budgets', 'Track expenses regularly'],
          spendingTrends: typeof parsed.spendingTrends === 'string' ? parsed.spendingTrends.replace(/[\n\r]/g, ' ').trim() : 'Advanced patterns identified in your transactions.',
          budgetSuggestions: Array.isArray(parsed.budgetSuggestions) ? parsed.budgetSuggestions.filter((s: any) => typeof s === 'string') : ['Consider budgeting based on your top categories', 'Set weekly spending limits']
        };
      }
    } catch (error) {
      console.warn('Failed to parse Gemini response:', error);
    }
    
    // Fallback parsing - clean any JSON artifacts from text
    const cleanSummary = aiText
      .replace(/[\{\}]/g, '') // Remove JSON brackets
      .replace(/["']/g, '') // Remove quotes
      .replace(/summary:|recommendations:|spendingTrends:|budgetSuggestions:/gi, '') // Remove JSON keys
      .replace(/[\n\r]/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .substring(0, 300);
    
    return {
      summary: cleanSummary || 'Comprehensive AI analysis completed successfully.',
      recommendations: ['Review your spending patterns', 'Set category-wise budgets', 'Track expenses regularly', 'Look for savings opportunities'],
      spendingTrends: 'Advanced patterns identified in your transactions across different time periods.',
      budgetSuggestions: ['Consider budgeting based on your top categories', 'Set weekly spending limits', 'Plan for large purchases']
    };
  }

  private generateFallbackAnalysis(metrics: any, spendingInsights: any) {
    const topCategory = Object.entries(metrics.categoryBreakdown)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];

    // Clean summary without JSON formatting
    const categorySummary = topCategory ? 
      `${topCategory[0] as string} is your primary spending category at ₹${(topCategory[1] as number).toFixed(2)}.` : 
      'Multiple categories are being tracked for detailed analysis.';
    
    const cleanSummary = `Your comprehensive spending analysis shows ₹${metrics.totalSpent.toFixed(2)} across ${metrics.totalTransactions} transactions. ${categorySummary} ${spendingInsights.spendingPattern} detected with highest activity on ${spendingInsights.topSpendingDay}.`;

    return {
      summary: cleanSummary,
      recommendations: [
        `💰 Average transaction: ₹${metrics.avgTransactionAmount.toFixed(2)} - evaluate if this aligns with your financial goals`,
        `📊 ${Object.keys(metrics.categoryBreakdown).length} categories tracked - excellent for detailed financial analysis`,
        topCategory ? `🎯 ${topCategory[0] as string} represents your highest spending - consider optimization strategies` : '🎯 Add more categorized expenses for enhanced insights',
        '📱 Continue consistent tracking for better trend analysis',
        `🔍 ${spendingInsights.savingsOpportunity}`,
        `📅 ${spendingInsights.topSpendingDay} is your peak spending day - plan accordingly`
      ],
      spendingTrends: `Your spending shows ${spendingInsights.spendingPattern} with peak activity on ${spendingInsights.topSpendingDay}. Most significant purchase was ${spendingInsights.mostExpensiveTransaction.title} for ₹${spendingInsights.mostExpensiveTransaction.amount}. ${topCategory ? `${topCategory[0] as string} dominates your spending at ${(((topCategory[1] as number) / metrics.totalSpent) * 100).toFixed(1)}% of total expenses.` : 'Categories are well distributed across your expenses.'} Time-based analysis reveals patterns for optimization.`,
      budgetSuggestions: Object.keys(metrics.categoryBreakdown).length > 0 ? [
        `💡 Suggested monthly budgets based on your spending patterns`,
        '⏰ Set weekly check-ins to monitor budget progress',
        '🚨 Configure alerts at 75% of category limits',
        '📈 Review and adjust budgets quarterly based on spending trends',
        `📅 Plan higher budgets for ${spendingInsights.topSpendingDay}s`
      ] : [
        '🎯 Start with category-based budgeting',
        '📊 Track for 30 days to establish baseline budgets',
        '💡 Use the 50/30/20 rule as a starting framework'
      ]
    };
  }

  private async generateEnhancedFallback(userId: string): Promise<AIInsights> {
    try {
      const allExpenses = await getAllExpenses(userId);
      const metrics = this.calculateFinancialMetrics(allExpenses, allExpenses);
      const timeBasedAnalysis = this.generateTimeBasedAnalysis(allExpenses);
      const spendingInsights = this.generateSpendingInsights(allExpenses, allExpenses);
      
      return {
        summary: `Enhanced analysis complete: ₹${metrics.totalSpent.toFixed(2)} spent across ${metrics.totalTransactions} transactions. ${this.getSmartSummary(timeBasedAnalysis, spendingInsights, metrics)} AI insights temporarily unavailable, showing comprehensive fallback analysis.`,
        totalSpent: metrics.totalSpent,
        totalTransactions: metrics.totalTransactions,
        avgTransactionAmount: metrics.avgTransactionAmount,
        recommendations: this.generateDefaultRecommendations(metrics, spendingInsights),
        categoryBreakdown: metrics.categoryBreakdown,
        spendingTrends: this.generateSpendingTrends(timeBasedAnalysis, spendingInsights, metrics),
        budgetSuggestions: this.generateBudgetSuggestions(metrics.categoryBreakdown),
        timeBasedAnalysis,
        spendingInsights,
        generatedAt: new Date()
      };
    } catch (error) {
      return this.generateEmptyInsights();
    }
  }
}

export const enhancedGeminiAIInsightsService = new EnhancedGeminiAIInsightsService();