/**
 * AI Insights Service
 * Professional AI-powered financial insights and analytics
 */

import { findBestBackendUrl, getDefaultBackendUrl } from '../config/backendConfig';
import { getAllExpenses } from './databaseService';
import { auth } from './firebase/firebase';

export interface SpendingInsight {
  type: 'top_category' | 'spending_increase' | 'spending_decrease' | 'high_avg_transaction' | 'category_trend' | 'getting_started';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestion: string;
  data?: any;
}

export interface SmartSuggestion {
  type: 'subscription_review' | 'budget_recommendation' | 'savings_opportunity' | 'goal_setting' | 'expense_optimization';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggested_amount?: number;
  data?: any;
}

export interface FinancialHealth {
  total_spending: number;
  average_transaction: number;
  transaction_count: number;
  spending_change_percent: number;
  spending_trend: 'increasing' | 'decreasing' | 'stable';
  health_score: number;
}

export interface CategoryAnalysis {
  [category: string]: {
    total: number;
    average: number;
    count: number;
    percentage: number;
  };
}

export interface TrendAnalysis {
  [category: string]: {
    current: number;
    previous: number;
    change_percent: number;
    trend: 'up' | 'down';
  };
}

export interface AIInsightsData {
  spending_insights: SpendingInsight[];
  smart_suggestions: SmartSuggestion[];
  financial_health: FinancialHealth;
  category_analysis: CategoryAnalysis;
  trend_analysis: TrendAnalysis;
  generated_at: string;
  period: string;
}

class AIInsightsService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    // Start with default, but will dynamically find the best URL
    this.baseUrl = getDefaultBackendUrl();
    this.timeout = 15000; // 15 seconds for complex analytics
    
    // Immediately try to find the best working backend URL
    this.initializeBestBackendUrl();
    
    // Enhanced auth debugging
    auth.onAuthStateChanged((user: any) => {
      if (user) {
        console.log('🔓 User signed in:', {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName
        });
      } else {
        console.log('🔒 No user signed in');
      }
    });
  }

  /**
   * Initialize the best working backend URL
   */
  private async initializeBestBackendUrl() {
    try {
      console.log('🔍 Testing backend URLs for best connection...');
      const bestUrl = await findBestBackendUrl();
      if (bestUrl) {
        this.baseUrl = bestUrl;
        console.log(`✅ AI Insights Service connected to: ${this.baseUrl}`);
      } else {
        console.log('⚠️ No backend available, will use local analysis fallback with real data');
        // Keep the default URL for potential manual retry
      }
    } catch (error) {
      console.log('⚠️ Backend connection test failed, using default URL for fallback:', error);
    }
  }

  /**
   * Get comprehensive AI insights for the current user - REAL DATA ONLY
   */
  async getAIInsights(period: 'week' | 'month' | 'year' = 'month'): Promise<AIInsightsData | null> {
    try {
      const userId = auth.currentUser?.uid;
      const userEmail = auth.currentUser?.email;
      console.log(`🔍 Getting REAL AI insights for user: ${userId} (${userEmail}), period: ${period}`);

      if (!userId) {
        console.error('❌ No authenticated user - Cannot get real data');
        return null; // Return null instead of sample data
      }

      // Enhanced debugging - check authentication state
      console.log('👤 Auth state:', {
        isSignedIn: !!auth.currentUser,
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        isEmailVerified: auth.currentUser?.emailVerified
      });

      // Try backend first, but fall back to local analysis with real data
      try {
        const apiUrl = `${this.baseUrl}/api/ai-insights/${userId}?period=${period}&limit=200`;
        console.log(`📡 Trying backend API: ${apiUrl}`);
        
        // Create timeout controller with longer timeout for AI processing
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for AI processing
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId); // Clear timeout if request succeeds

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Backend response received:', result);
          
          if (result.status === 'success' && result.data) {
            console.log('✅ Processing REAL user data from backend');
            return this.processBackendInsights(result.data, period);
          } else if (result.success === false && result.message) {
            console.log('⚠️ Backend returned non-success response:', result.message);
            throw new Error(`Backend response: ${result.message}`);
          }
        } else {
          console.log(`⚠️ Backend returned status ${response.status}: ${response.statusText}`);
          throw new Error(`Backend not available: ${response.status} ${response.statusText}`);
        }
        
        throw new Error(`Backend not available: ${response.status}`);
      } catch (backendError) {
        if (backendError instanceof Error) {
          if (backendError.name === 'AbortError') {
            console.warn('⏰ Backend request timeout after 15 seconds, using LOCAL analysis with REAL data');
          } else if (backendError.message.includes('Network request failed')) {
            console.warn('🔌 Backend network failed (device/emulator restriction), using LOCAL analysis with REAL data');
          } else {
            console.warn('⚠️ Backend unavailable, using LOCAL analysis with REAL data:', backendError.message);
          }
        } else {
          console.warn('⚠️ Backend unavailable, using LOCAL analysis with REAL data:', backendError);
        }
        
        // Use local analysis with real Firestore data
        return await this.generateLocalInsights(userId, period);
      }
    } catch (error) {
      console.error('❌ Failed to get AI insights:', error);
      return null;
    }
  }

  /**
   * Process backend insights response - Enhanced for real Gemini AI data
   */
  private processBackendInsights(data: any, period: string): AIInsightsData {
    console.log('🤖 Processing backend insights with Gemini AI data:', data);
    
    const financial_health = data.financial_health || {};
    const gemini_insights = data.gemini_insights || {};
    
    // Use Gemini AI insights if available, otherwise use basic analysis
    const spending_insights = data.spending_insights || [];
    const smart_suggestions = data.smart_suggestions || [];
    
    // If we have Gemini insights, merge them
    if (gemini_insights.insights) {
      spending_insights.push(...gemini_insights.insights);
    }
    
    if (gemini_insights.suggestions) {
      smart_suggestions.push(...gemini_insights.suggestions);
    }
    
    console.log(`📊 Processed ${spending_insights.length} insights and ${smart_suggestions.length} suggestions`);
    
    return {
      spending_insights: spending_insights.map((insight: any) => ({
        type: insight.type || 'category_trend',
        title: insight.title || 'Financial Insight',
        description: insight.description || 'AI analysis of your spending patterns',
        priority: insight.priority || 'medium',
        actionable: insight.actionable !== undefined ? insight.actionable : true,
        suggestion: insight.suggestion || insight.recommendation || 'Continue monitoring your expenses',
        data: insight.data
      })),
      smart_suggestions: smart_suggestions.map((suggestion: any) => ({
        type: suggestion.type || 'expense_optimization',
        title: suggestion.title || 'Smart Suggestion',
        description: suggestion.description || 'AI-powered financial recommendation',
        priority: suggestion.priority || 'medium',
        actionable: suggestion.actionable !== undefined ? suggestion.actionable : true,
        suggested_amount: suggestion.suggested_amount || suggestion.amount,
        data: suggestion.data
      })),
      financial_health: {
        total_spending: financial_health.total_spending || 0,
        average_transaction: financial_health.average_transaction || 0,
        transaction_count: financial_health.transaction_count || 0,
        spending_change_percent: financial_health.spending_change_percent || 0,
        spending_trend: financial_health.spending_trend || 'stable',
        health_score: financial_health.health_score || 50
      },
      category_analysis: data.category_analysis || {},
      trend_analysis: data.trend_analysis || {},
      generated_at: new Date().toISOString(),
      period
    };
  }

  /**
   * This method is now DISABLED - we only show real data from database
   * Returns null to indicate no sample data should be shown
   */
  private generateSampleInsights(period: string): AIInsightsData | null {
    console.log('� Sample insights disabled - only showing real user data');
    return null;
  }

  /**
   * Generate insights locally as fallback - REAL DATA ONLY
   */
  private async generateLocalInsights(userId: string, period: string): Promise<AIInsightsData | null> {
    console.log('📊 Generating LOCAL AI insights with REAL user data:', userId);
    
    try {
      const expenses = await getAllExpenses(userId);
      console.log(`📈 Found ${expenses.length} real expenses for analysis`);
      
      if (expenses.length === 0) {
        console.log('❌ No expenses found - returning null (no sample data)');
        return null;
      }

      // Filter expenses by period
      const now = new Date();
      const periodMs = this.getPeriodInMs(period);
      const cutoffDate = new Date(now.getTime() - periodMs);
      
      const currentExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date || expense.created_at);
        // Expenses have NEGATIVE amounts in our database
        return expenseDate >= cutoffDate && expense.amount < 0;
      });

      const currentIncome = expenses.filter(expense => {
        const expenseDate = new Date(expense.date || expense.created_at);
        // Income has POSITIVE amounts in our database
        return expenseDate >= cutoffDate && expense.amount > 0;
      });

      const previousExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date || expense.created_at);
        return expenseDate >= new Date(cutoffDate.getTime() - periodMs) && 
               expenseDate < cutoffDate && 
               expense.amount < 0; // Previous expenses also have negative amounts
      });

      console.log(`📊 Analysis: ${currentExpenses.length} expenses, ${currentIncome.length} income, ${previousExpenses.length} previous expenses`);

      // Always analyze available data, even if current period is empty
      return this.analyzeExpensesLocally(currentExpenses, previousExpenses, currentIncome, period);
    } catch (error) {
      console.error('❌ Error generating local insights:', error);
      return null;
    }
  }

  /**
   * Local expense analysis with enhanced AI insights
   */
  private analyzeExpensesLocally(currentExpenses: any[], previousExpenses: any[], currentIncome: any[], period: string): AIInsightsData {
    console.log(`🧠 Analyzing ${currentExpenses.length} expenses and ${currentIncome.length} income entries`);
    
    const financial_health = this.calculateFinancialHealthEnhanced(currentExpenses, previousExpenses, currentIncome);
    const category_analysis = this.analyzeCategoriesLocally(currentExpenses);
    const trend_analysis = this.analyzeTrendsLocally(currentExpenses, previousExpenses);

    // Generate enhanced insights with income consideration
    const spending_insights = this.generateSpendingInsightsEnhanced(currentExpenses, previousExpenses, category_analysis, currentIncome);
    const smart_suggestions = this.generateSmartSuggestionsEnhanced(currentExpenses, category_analysis, financial_health, currentIncome);

    return {
      spending_insights,
      smart_suggestions,
      financial_health,
      category_analysis,
      trend_analysis,
      generated_at: new Date().toISOString(),
      period
    };
  }

  /**
   * Calculate financial health metrics
   */
  private calculateFinancialHealth(currentExpenses: any[], previousExpenses: any[]): FinancialHealth {
    const totalSpending = currentExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const previousTotal = previousExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const avgTransaction = currentExpenses.length > 0 ? totalSpending / currentExpenses.length : 0;
    
    const spendingChange = previousTotal > 0 ? ((totalSpending - previousTotal) / previousTotal) * 100 : 0;
    
    let spendingTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (spendingChange > 5) spendingTrend = 'increasing';
    else if (spendingChange < -5) spendingTrend = 'decreasing';

    return {
      total_spending: Math.round(totalSpending * 100) / 100,
      average_transaction: Math.round(avgTransaction * 100) / 100,
      transaction_count: currentExpenses.length,
      spending_change_percent: Math.round(spendingChange * 10) / 10,
      spending_trend: spendingTrend,
      health_score: this.calculateHealthScore(totalSpending, spendingChange, currentExpenses.length)
    };
  }

  /**
   * Calculate health score (0-100)
   */
  private calculateHealthScore(totalSpending: number, spendingChange: number, transactionCount: number): number {
    let score = 70; // Base score
    
    // Adjust based on spending trend
    if (spendingChange < -10) score += 15; // Good reduction
    else if (spendingChange > 20) score -= 20; // Bad increase
    
    // Adjust based on transaction frequency
    if (transactionCount > 50) score += 10;
    else if (transactionCount < 10) score -= 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Analyze categories locally
   */
  private analyzeCategoriesLocally(expenses: any[]): CategoryAnalysis {
    const categoryData: { [key: string]: number[] } = {};
    
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      const amount = expense.amount || 0;
      
      if (!categoryData[category]) {
        categoryData[category] = [];
      }
      categoryData[category].push(amount);
    });

    const totalSpending = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const analysis: CategoryAnalysis = {};

    Object.entries(categoryData).forEach(([category, amounts]) => {
      const total = amounts.reduce((sum, amount) => sum + amount, 0);
      analysis[category] = {
        total: Math.round(total * 100) / 100,
        average: Math.round((total / amounts.length) * 100) / 100,
        count: amounts.length,
        percentage: totalSpending > 0 ? Math.round((total / totalSpending) * 1000) / 10 : 0
      };
    });

    return analysis;
  }

  /**
   * Analyze trends locally
   */
  private analyzeTrendsLocally(currentExpenses: any[], previousExpenses: any[]): TrendAnalysis {
    const currentByCategory: { [key: string]: number } = {};
    const previousByCategory: { [key: string]: number } = {};

    currentExpenses.forEach(expense => {
      const category = expense.category || 'Other';
      currentByCategory[category] = (currentByCategory[category] || 0) + (expense.amount || 0);
    });

    previousExpenses.forEach(expense => {
      const category = expense.category || 'Other';
      previousByCategory[category] = (previousByCategory[category] || 0) + (expense.amount || 0);
    });

    const trends: TrendAnalysis = {};
    const allCategories = new Set([...Object.keys(currentByCategory), ...Object.keys(previousByCategory)]);

    allCategories.forEach(category => {
      const current = currentByCategory[category] || 0;
      const previous = previousByCategory[category] || 0;
      
      if (previous > 0 && Math.abs(((current - previous) / previous) * 100) > 10) {
        const changePercent = ((current - previous) / previous) * 100;
        trends[category] = {
          current: Math.round(current * 100) / 100,
          previous: Math.round(previous * 100) / 100,
          change_percent: Math.round(changePercent * 10) / 10,
          trend: changePercent > 0 ? 'up' : 'down'
        };
      }
    });

    return trends;
  }

  /**
   * Enhanced financial health calculation with income consideration
   */
  private calculateFinancialHealthEnhanced(currentExpenses: any[], previousExpenses: any[], currentIncome: any[]): any {
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

  /**
   * Enhanced spending insights with income analysis
   */
  private generateSpendingInsightsEnhanced(currentExpenses: any[], previousExpenses: any[], categoryAnalysis: any, currentIncome: any[]): SpendingInsight[] {
    const insights: SpendingInsight[] = [];
    const totalExpenses = currentExpenses.reduce((sum, expense) => sum + Math.abs(expense.amount || 0), 0);
    const totalIncome = currentIncome.reduce((sum, income) => sum + Math.abs(income.amount || 0), 0);
    
    // Income vs Expenses insight
    if (totalIncome > 0) {
      const spendingRatio = (totalExpenses / totalIncome) * 100;
      if (spendingRatio > 90) {
        insights.push({
          type: 'spending_increase',
          title: 'High Spending Alert',
          description: `You're spending ${spendingRatio.toFixed(1)}% of your income.`,
          priority: 'high',
          actionable: true,
          suggestion: 'Consider reducing expenses to improve your savings rate'
        });
      } else if (spendingRatio < 50) {
        insights.push({
          type: 'spending_decrease',
          title: 'Excellent Spending Control',
          description: `You're only spending ${spendingRatio.toFixed(1)}% of your income.`,
          priority: 'low',
          actionable: false,
          suggestion: 'Great job! Keep up this healthy spending pattern'
        });
      } else {
        insights.push({
          type: 'category_trend',
          title: 'Spending Analysis',
          description: `You're spending ${spendingRatio.toFixed(1)}% of your income.`,
          priority: 'medium',
          actionable: true,
          suggestion: 'Monitor your spending to maintain a good savings rate'
        });
      }
    }

    // Category insights
    if (categoryAnalysis.top_category) {
      const topSpending = categoryAnalysis.top_category;
      insights.push({
        type: 'top_category',
        title: 'Top Spending Category',
        description: `Your highest spending category is ${topSpending.category} (₹${topSpending.amount.toFixed(0)})`,
        priority: 'medium',
        actionable: true,
        suggestion: 'Review this category for potential savings opportunities',
        data: topSpending
      });
    }

    // Trend insights
    const previousTotal = previousExpenses.reduce((sum, expense) => sum + Math.abs(expense.amount || 0), 0);
    if (previousTotal > 0) {
      const changePercent = ((totalExpenses - previousTotal) / previousTotal) * 100;
      if (changePercent > 10) {
        insights.push({
          type: 'spending_increase',
          title: 'Spending Increase',
          description: `Your spending increased by ${changePercent.toFixed(1)}% compared to last period`,
          priority: 'high',
          actionable: true,
          suggestion: 'Review recent transactions to identify areas for optimization'
        });
      } else if (changePercent < -10) {
        insights.push({
          type: 'spending_decrease',
          title: 'Great Progress!',
          description: `Your spending decreased by ${Math.abs(changePercent).toFixed(1)}%`,
          priority: 'low',
          actionable: false,
          suggestion: 'Keep up the good work with your spending discipline!'
        });
      }
    }

    return insights.length > 0 ? insights : [{
      type: 'getting_started',
      title: 'Start Your Financial Journey',
      description: 'Track more expenses to get personalized insights!',
      priority: 'low',
      actionable: true,
      suggestion: 'Add more transactions to unlock AI-powered insights'
    }];
  }

  /**
   * Enhanced smart suggestions with income-based recommendations
   */
  private generateSmartSuggestionsEnhanced(currentExpenses: any[], categoryAnalysis: any, financialHealth: any, currentIncome: any[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const totalExpenses = currentExpenses.reduce((sum, expense) => sum + Math.abs(expense.amount || 0), 0);
    const totalIncome = currentIncome.reduce((sum, income) => sum + Math.abs(income.amount || 0), 0);

    // Income-based suggestions
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
      if (savingsRate < 10) {
        suggestions.push({
          type: 'savings_opportunity',
          title: 'Improve Savings Rate',
          description: 'Try to save at least 10-20% of your income for financial security',
          priority: 'high',
          actionable: true,
          suggested_amount: totalIncome * 0.15
        });
      } else if (savingsRate > 30) {
        suggestions.push({
          type: 'goal_setting',
          title: 'Investment Opportunity',
          description: 'Excellent savings rate! Consider investing your surplus for growth',
          priority: 'medium',
          actionable: true,
          suggested_amount: (totalIncome - totalExpenses) * 0.5
        });
      }
    }

    // Category-based suggestions
    if (categoryAnalysis.top_category) {
      const topCategory = categoryAnalysis.top_category.category.toLowerCase();
      if (topCategory.includes('food') || topCategory.includes('restaurant')) {
        suggestions.push({
          type: 'expense_optimization',
          title: 'Food Expense Optimization',
          description: 'Consider meal planning to reduce food expenses',
          priority: 'medium',
          actionable: true,
          suggested_amount: categoryAnalysis.top_category.amount * 0.2
        });
      } else if (topCategory.includes('transport') || topCategory.includes('petrol')) {
        suggestions.push({
          type: 'expense_optimization',
          title: 'Transportation Savings',
          description: 'Look into carpooling or public transport to save on transportation',
          priority: 'medium',
          actionable: true,
          suggested_amount: categoryAnalysis.top_category.amount * 0.15
        });
      } else if (topCategory.includes('entertainment')) {
        suggestions.push({
          type: 'expense_optimization',
          title: 'Entertainment Budget',
          description: 'Try free entertainment options like parks or library events',
          priority: 'low',
          actionable: true,
          suggested_amount: categoryAnalysis.top_category.amount * 0.3
        });
      }
    }

    // Financial health suggestions
    if (financialHealth.score < 50) {
      suggestions.push({
        type: 'budget_recommendation',
        title: 'Budget Planning',
        description: 'Create a monthly budget to better track your spending',
        priority: 'high',
        actionable: true
      });
      suggestions.push({
        type: 'subscription_review',
        title: 'Review Subscriptions',
        description: 'Review and reduce unnecessary subscriptions',
        priority: 'medium',
        actionable: true
      });
    } else if (financialHealth.score > 70) {
      suggestions.push({
        type: 'goal_setting',
        title: 'Emergency Fund',
        description: 'Great financial health! Consider setting up an emergency fund',
        priority: 'low',
        actionable: true,
        suggested_amount: totalExpenses * 6
      });
    }

    return suggestions.length > 0 ? suggestions : [
      {
        type: 'budget_recommendation',
        title: 'Get Started',
        description: 'Track more expenses to get personalized suggestions',
        priority: 'low',
        actionable: true
      },
      {
        type: 'goal_setting',
        title: 'Financial Awareness',
        description: 'Set up a monthly budget to improve financial awareness',
        priority: 'medium',
        actionable: true
      }
    ];
  }

  /**
   * Generate spending insights
   */
  private generateSpendingInsights(currentExpenses: any[], previousExpenses: any[], categoryAnalysis: CategoryAnalysis): SpendingInsight[] {
    const insights: SpendingInsight[] = [];

    // Top category insight
    const topCategory = Object.entries(categoryAnalysis).reduce((max, [category, data]) => 
      data.total > max.total ? { category, total: data.total } : max, 
      { category: '', total: 0 }
    );

    if (topCategory.category) {
      insights.push({
        type: 'top_category',
        title: `Highest Spending: ${topCategory.category}`,
        description: `You spent ₹${topCategory.total} on ${topCategory.category} this period`,
        priority: 'medium',
        actionable: true,
        suggestion: `Consider reviewing your ${topCategory.category} expenses for potential savings`
      });
    }

    // Spending change insight
    const totalCurrent = currentExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalPrevious = previousExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    if (totalPrevious > 0) {
      const changePercent = ((totalCurrent - totalPrevious) / totalPrevious) * 100;
      
      if (changePercent > 15) {
        insights.push({
          type: 'spending_increase',
          title: 'Spending Increase Alert',
          description: `Your spending increased by ${changePercent.toFixed(1)}% compared to last period`,
          priority: 'high',
          actionable: true,
          suggestion: 'Review recent transactions to identify areas for optimization'
        });
      } else if (changePercent < -10) {
        insights.push({
          type: 'spending_decrease',
          title: 'Great Progress!',
          description: `You reduced spending by ${Math.abs(changePercent).toFixed(1)}% this period`,
          priority: 'low',
          actionable: false,
          suggestion: 'Keep up the good work with your spending discipline!'
        });
      }
    }

    return insights;
  }

  /**
   * Generate smart suggestions
   */
  private generateSmartSuggestions(expenses: any[], categoryAnalysis: CategoryAnalysis, financialHealth: FinancialHealth): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Budget recommendation
    const topCategories = Object.entries(categoryAnalysis)
      .filter(([_, data]) => data.total > 500)
      .sort(([_, a], [__, b]) => b.total - a.total)
      .slice(0, 3);

    topCategories.forEach(([category, data]) => {
      suggestions.push({
        type: 'budget_recommendation',
        title: `Set ${category} Budget`,
        description: `Consider setting a budget for ${category} (current: ₹${data.total})`,
        priority: 'low',
        actionable: true,
        suggested_amount: Math.round(data.total * 1.1) // 10% buffer
      });
    });

    // Savings opportunity
    if (financialHealth.total_spending > 3000) {
      const potentialSavings = financialHealth.total_spending * 0.08; // 8% savings potential
      suggestions.push({
        type: 'savings_opportunity',
        title: 'Savings Potential',
        description: `You could potentially save ₹${potentialSavings.toFixed(2)} by optimizing spending`,
        priority: 'medium',
        actionable: true,
        suggested_amount: potentialSavings
      });
    }

    return suggestions;
  }

  /**
   * Get period in milliseconds
   */
  private getPeriodInMs(period: string): number {
    const day = 24 * 60 * 60 * 1000;
    switch (period) {
      case 'week': return 7 * day;
      case 'year': return 365 * day;
      default: return 30 * day; // month
    }
  }
}

// Export singleton instance
export const aiInsightsService = new AIInsightsService();
export default AIInsightsService;