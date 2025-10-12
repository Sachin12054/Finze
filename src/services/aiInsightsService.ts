import { AIInsights, geminiAIInsightsService } from './geminiAIInsightsService';

// Interface expected by explore.tsx
export interface AIInsightsData {
  financial_health: {
    health_score: number;
    total_spending: number;
    average_transaction: number;
    transaction_count: number;
    spending_trend: 'increasing' | 'decreasing' | 'stable';
    spending_change_percent: number;
  };
  spending_insights: Array<{
    title: string;
    description: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
    category?: string;
    amount?: number;
    actionable?: boolean;
  }>;
  smart_suggestions: Array<{
    title: string;
    description: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    action?: string;
    actionable?: boolean;
    savings_potential?: number;
    suggested_amount?: number;
  }>;
  category_analysis: {
    [category: string]: {
      total: number;
      count: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
  summary: string;
}

class AIInsightsService {
  /**
   * Get AI insights in the format expected by explore.tsx
   */
  async getAIInsights(period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month', userId?: string): Promise<AIInsightsData> {
    if (!userId || userId.trim() === '') {
      console.error('❌ No valid user ID provided for AI insights');
      return this.getEmptyInsights();
    }

    try {
      // Get insights from the Gemini service
      const baseInsights = await geminiAIInsightsService.generateAIInsights(userId, period);
      
      // Convert to the expected format
      return this.adaptInsights(baseInsights);
    } catch (error) {
      console.error('❌ Error getting AI insights:', error);
      return this.getEmptyInsights();
    }
  }

  private adaptInsights(insights: AIInsights): AIInsightsData {
    // Calculate financial health score (0-100)
    const healthScore = this.calculateHealthScore(insights);
    
    // Determine spending trend
    const spendingTrend = this.determineSpendingTrend(insights);
    
    // Convert spending insights
    const spendingInsights = this.convertSpendingInsights(insights);
    
    // Convert recommendations to smart suggestions
    const smartSuggestions = this.convertRecommendations(insights);
    
    // Prepare category analysis
    const categoryAnalysis = this.prepareCategoryAnalysis(insights);

    return {
      financial_health: {
        health_score: healthScore,
        total_spending: insights.totalSpent,
        average_transaction: insights.avgTransactionAmount,
        transaction_count: insights.totalTransactions,
        spending_trend: spendingTrend,
        spending_change_percent: this.calculateSpendingChangePercent(insights)
      },
      spending_insights: spendingInsights,
      smart_suggestions: smartSuggestions,
      category_analysis: categoryAnalysis,
      summary: insights.summary
    };
  }

  private calculateHealthScore(insights: AIInsights): number {
    let score = 70; // Base score
    
    // Adjust based on spending patterns
    if (insights.totalTransactions > 20) {
      score += 10; // Active financial tracking
    }
    
    // Adjust based on category diversity
    const categoryCount = Object.keys(insights.categoryBreakdown).length;
    if (categoryCount > 3) {
      score += 10; // Good spending diversity
    }
    
    // Adjust based on average transaction amount
    if (insights.avgTransactionAmount < 1000) {
      score += 10; // Conservative spending
    } else if (insights.avgTransactionAmount > 3000) {
      score -= 10; // High spending pattern
    }
    
    return Math.min(Math.max(score, 0), 100);
  }

  private determineSpendingTrend(insights: AIInsights): 'increasing' | 'decreasing' | 'stable' {
    // This is a simplified logic - in a real app, you'd compare with previous periods
    if (insights.avgTransactionAmount > 1500) {
      return 'increasing';
    } else if (insights.avgTransactionAmount < 500) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  private calculateSpendingChangePercent(insights: AIInsights): number {
    // Simplified calculation - in real app, compare with previous period
    // For now, calculate based on spending patterns
    const trend = this.determineSpendingTrend(insights);
    switch (trend) {
      case 'increasing': return 12.5;
      case 'decreasing': return -8.3;
      default: return 2.1;
    }
  }

  private convertSpendingInsights(insights: AIInsights): Array<any> {
    const spendingInsights = [];
    
    // Convert spendingInsights object to array format
    const insightsObj = insights.spendingInsights;
    
    if (insightsObj.topSpendingDay !== 'No data') {
      spendingInsights.push({
        title: `Peak Spending Day: ${insightsObj.topSpendingDay}`,
        description: `You tend to spend the most on ${insightsObj.topSpendingDay}s. Consider planning your expenses better on this day.`,
        suggestion: `Plan your weekly budget to account for higher spending on ${insightsObj.topSpendingDay}s.`,
        priority: 'medium' as const,
        category: 'spending_pattern',
        actionable: true
      });
    }

    if (insightsObj.mostExpensiveTransaction.amount > 0) {
      spendingInsights.push({
        title: 'Highest Transaction Alert',
        description: `Your largest transaction was ₹${insightsObj.mostExpensiveTransaction.amount.toFixed(2)} for "${insightsObj.mostExpensiveTransaction.title}". Review large purchases regularly.`,
        suggestion: 'Set spending alerts for transactions above ₹2000 to maintain better control over large expenses.',
        priority: 'high' as const,
        category: 'large_purchase',
        amount: insightsObj.mostExpensiveTransaction.amount,
        actionable: true
      });
    }

    if (insightsObj.frequentCategory !== 'No data') {
      spendingInsights.push({
        title: `Frequent Category: ${insightsObj.frequentCategory}`,
        description: `Most of your transactions are in the ${insightsObj.frequentCategory} category. Consider setting a specific budget for this category.`,
        suggestion: `Set a monthly budget limit of ₹${Math.ceil(insights.totalSpent * 0.4)} for ${insightsObj.frequentCategory} expenses.`,
        priority: 'medium' as const,
        category: insightsObj.frequentCategory.toLowerCase(),
        actionable: true
      });
    }

    // Add spending pattern insight
    spendingInsights.push({
      title: 'Spending Pattern Analysis',
      description: insightsObj.spendingPattern,
      suggestion: 'Review your spending patterns weekly to identify opportunities for optimization.',
      priority: 'low' as const,
      category: 'pattern_analysis',
      actionable: false
    });

    // Add savings opportunity
    if (insightsObj.savingsOpportunity) {
      spendingInsights.push({
        title: 'Savings Opportunity',
        description: insightsObj.savingsOpportunity,
        suggestion: 'Implement these savings strategies gradually to see the best results.',
        priority: 'high' as const,
        category: 'savings',
        actionable: true
      });
    }

    return spendingInsights;
  }

  private convertRecommendations(insights: AIInsights): Array<{
    title: string;
    description: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    action: string;
    actionable?: boolean;
    savings_potential: number;
    suggested_amount?: number;
  }> {
    const suggestions: Array<{
      title: string;
      description: string;
      type: string;
      priority: 'high' | 'medium' | 'low';
      action: string;
      actionable?: boolean;
      savings_potential: number;
      suggested_amount?: number;
    }> = [];
    
    insights.recommendations.forEach((rec, index) => {
      const savingsPotential = this.estimateSavingsPotential(rec, insights);
      suggestions.push({
        title: `Recommendation ${index + 1}`,
        description: rec,
        type: 'financial_advice',
        priority: index < 2 ? 'high' as const : 'medium' as const,
        action: 'implement',
        actionable: true,
        savings_potential: savingsPotential,
        suggested_amount: savingsPotential
      });
    });

    // Add budget suggestions
    insights.budgetSuggestions.forEach((suggestion, index) => {
      const suggestedAmount = insights.totalSpent * 0.9; // Suggest 10% reduction
      suggestions.push({
        title: `Budget Suggestion ${index + 1}`,
        description: suggestion,
        type: 'budget_optimization',
        priority: 'medium' as const,
        action: 'plan',
        actionable: true,
        savings_potential: insights.totalSpent * 0.1, // Estimate 10% savings potential
        suggested_amount: suggestedAmount
      });
    });

    return suggestions.slice(0, 6); // Limit to 6 suggestions
  }

  private estimateSavingsPotential(recommendation: string, insights: AIInsights): number {
    // Simple heuristic to estimate savings potential based on recommendation content
    const lowerRec = recommendation.toLowerCase();
    
    if (lowerRec.includes('high') || lowerRec.includes('reduce')) {
      return insights.totalSpent * 0.15; // 15% potential savings
    } else if (lowerRec.includes('budget') || lowerRec.includes('limit')) {
      return insights.totalSpent * 0.1; // 10% potential savings
    } else {
      return insights.totalSpent * 0.05; // 5% potential savings
    }
  }

  private prepareCategoryAnalysis(insights: AIInsights): any {
    const analysis: any = {};
    const total = insights.totalSpent;
    
    Object.entries(insights.categoryBreakdown).forEach(([category, amount]) => {
      const percentage = total > 0 ? (amount / total) * 100 : 0;
      const transactionCount = Math.ceil(amount / (insights.avgTransactionAmount || 1));
      
      analysis[category] = {
        total: amount,
        count: transactionCount,
        percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
        trend: this.determineCategoryTrend(amount, total)
      };
    });
    
    return analysis;
  }

  private determineCategoryTrend(amount: number, total: number): 'up' | 'down' | 'stable' {
    const percentage = (amount / total) * 100;
    
    if (percentage > 40) {
      return 'up'; // High spending in this category
    } else if (percentage < 10) {
      return 'down'; // Low spending in this category
    } else {
      return 'stable'; // Moderate spending
    }
  }

  private getEmptyInsights(): AIInsightsData {
    return {
      financial_health: {
        health_score: 0,
        total_spending: 0,
        average_transaction: 0,
        transaction_count: 0,
        spending_trend: 'stable',
        spending_change_percent: 0
      },
      spending_insights: [],
      smart_suggestions: [
        {
          title: 'Start Tracking Expenses',
          description: 'Begin by adding your daily expenses to get personalized insights.',
          type: 'getting_started',
          priority: 'high',
          action: 'start_tracking',
          savings_potential: 0
        }
      ],
      category_analysis: {},
      summary: 'No expense data available. Start tracking your expenses to get AI-powered insights!'
    };
  }
}

export const aiInsightsService = new AIInsightsService();
export default aiInsightsService;