/**
 * Enhanced AI Insights Service
 * Advanced AI-powered financial insights with Gemini integration
 */

import { getDefaultBackendUrl } from '../config/backendConfig';

export interface FinancialHealthScore {
  overall_score: number;
  category_scores: {
    spending_control: number;
    budget_adherence: number;
    savings_rate: number;
    financial_diversity: number;
    goal_progress: number;
  };
  explanation: string;
  improvement_roadmap: string[];
  grade: string;
  benchmark_comparison: string;
}

export interface SpendingAnalysis {
  total_spending: number;
  spending_velocity: 'increasing' | 'decreasing' | 'stable';
  spending_efficiency: number;
  top_category_concentration: number;
  unusual_patterns: Array<{
    pattern: string;
    description: string;
    recommendation: string;
    potential_savings: number;
  }>;
  merchant_loyalty: {
    most_frequent: string;
    frequency: number;
    total_spent: number;
    suggestion: string;
  };
}

export interface SmartInsight {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  category: string;
  potential_savings?: number;
  specific_actions?: string[];
  timeline?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  recommended_allocation?: Record<string, number>;
  current_vs_recommended?: string;
  recommended_investment_amount?: number;
  investment_options?: string[];
  risk_tolerance?: string;
}

export interface PersonalizedRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  implementation: string;
  expected_impact: string;
  effort_level: 'low' | 'medium' | 'high';
  time_to_implement: string;
}

export interface FinancialGoalSuggestion {
  goal_type: string;
  recommended_amount: number;
  current_progress?: number;
  monthly_target: number;
  completion_timeline: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface RiskAnalysis {
  financial_stability: 'stable' | 'concerning' | 'excellent';
  overspending_risk: 'low' | 'medium' | 'high';
  budget_variance: number;
  income_diversification: string;
  debt_concerns: string[];
  emergency_preparedness: string;
  recommendations: string[];
}

export interface BehavioralInsights {
  spending_personality: string;
  financial_strengths: string[];
  areas_for_growth: string[];
  motivation_tips: string[];
  psychological_triggers: {
    overspending_patterns: string;
    saving_motivators: string;
    recommended_strategies: string;
  };
}

export interface NextMonthPredictions {
  predicted_spending: number;
  confidence: number;
  category_forecasts: Record<string, number>;
  seasonal_adjustments: string;
  optimization_potential: number;
}

export interface AdvancedAnalytics {
  spending_entropy: number;
  category_diversification_index: number;
  financial_momentum: string;
  spending_consistency_score: number;
  price_sensitivity_analysis: string;
  lifestyle_inflation_rate: string;
}

export interface ComprehensiveInsights {
  financial_health_score: FinancialHealthScore;
  spending_analysis: SpendingAnalysis;
  smart_insights: SmartInsight[];
  personalized_recommendations: PersonalizedRecommendation[];
  financial_goals_suggestions: FinancialGoalSuggestion[];
  risk_analysis: RiskAnalysis;
  market_insights: {
    inflation_impact: string;
    investment_opportunities: string;
    seasonal_spending_advice: string;
    economic_tips: string[];
  };
  behavioral_insights: BehavioralInsights;
  next_month_predictions: NextMonthPredictions;
  advanced_analytics: AdvancedAnalytics;
  generated_at: string;
  ai_model: string;
  analysis_depth: string;
  data_points_analyzed: number;
  analysis_period: string;
  confidence_level: number;
  personalization_score: number;
}

export interface FinancialCoaching {
  weekly_goals: Array<{
    goal: string;
    target_amount: number;
    action_steps: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    impact: 'low' | 'medium' | 'high';
  }>;
  daily_tips: string[];
  motivation_message: string;
  challenge_of_the_week: {
    title: string;
    description: string;
    reward: string;
  };
  financial_education: Array<{
    topic: string;
    content: string;
    action: string;
  }>;
}

export interface SpendingPsychology {
  spending_personality: string;
  psychological_triggers: Array<{
    trigger: string;
    description: string;
    recommendation: string;
  }>;
  spending_patterns: {
    day_patterns: Record<string, number>;
    time_patterns: Record<string, number>;
    amount_distribution: Record<string, number>;
  };
  emotional_spending_events: Array<{
    amount: number;
    date: string;
    category: string;
    trigger: string;
  }>;
  recommendations: string[];
  insights: string[];
}

export interface InvestmentReadiness {
  readiness_score: number;
  factors: {
    expense_tracking: boolean;
    spending_stability: boolean;
    emergency_fund_ready: boolean;
    debt_managed: boolean;
  };
  recommended_investments: string[];
  risk_tolerance: string;
  investment_timeline: string;
  next_steps: string[];
  monthly_investment_capacity: number;
}

class EnhancedAIInsightsService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getDefaultBackendUrl();
    this.timeout = 30000; // 30 seconds for AI processing
  }

  /**
   * Get comprehensive AI insights
   */
  async getComprehensiveInsights(
    userId: string, 
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
    limit: number = 200
  ): Promise<ComprehensiveInsights> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/ai-insights/${userId}?period=${period}&limit=${limit}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get insights');
      }
    } catch (error) {
      console.error('Error getting comprehensive insights:', error);
      throw this._createFallbackInsights();
    }
  }

  /**
   * Get quick insights for immediate display
   */
  async getQuickInsights(userId: string): Promise<Partial<ComprehensiveInsights>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Shorter timeout for quick insights

      const response = await fetch(`${this.baseUrl}/api/ai-insights/${userId}/quick`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get quick insights');
      }
    } catch (error) {
      console.error('Error getting quick insights:', error);
      return this._createQuickFallbackInsights();
    }
  }

  /**
   * Get financial coaching advice
   */
  async getFinancialCoaching(userId: string): Promise<FinancialCoaching> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai-insights/${userId}/financial-coaching`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get coaching');
      }
    } catch (error) {
      console.error('Error getting financial coaching:', error);
      return this._createFallbackCoaching();
    }
  }

  /**
   * Get spending psychology analysis
   */
  async getSpendingPsychology(userId: string): Promise<SpendingPsychology> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai-insights/${userId}/spending-psychology`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get psychology analysis');
      }
    } catch (error) {
      console.error('Error getting spending psychology:', error);
      return this._createFallbackPsychology();
    }
  }

  /**
   * Get investment readiness assessment
   */
  async getInvestmentReadiness(userId: string): Promise<InvestmentReadiness> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai-insights/${userId}/investment-readiness`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get investment readiness');
      }
    } catch (error) {
      console.error('Error getting investment readiness:', error);
      return this._createFallbackInvestmentReadiness();
    }
  }

  /**
   * Get spending forecast
   */
  async getSpendingForecast(userId: string, months: number = 3): Promise<NextMonthPredictions> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai-insights/${userId}/forecast?months=${months}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get forecast');
      }
    } catch (error) {
      console.error('Error getting spending forecast:', error);
      return this._createFallbackForecast();
    }
  }

  /**
   * Check if enhanced insights service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return false;
      }
      
      const result = await response.json();
      return result.status === 'healthy' && 
             result.services?.enhanced_insights?.status === 'healthy';
    } catch (error) {
      console.log('Enhanced AI insights service not available:', error);
      return false;
    }
  }

  // Fallback methods
  private _createFallbackInsights(): ComprehensiveInsights {
    const now = new Date().toISOString();
    return {
      financial_health_score: {
        overall_score: 70,
        category_scores: {
          spending_control: 75,
          budget_adherence: 65,
          savings_rate: 60,
          financial_diversity: 80,
          goal_progress: 70
        },
        explanation: 'Basic assessment based on available data',
        improvement_roadmap: ['Start tracking all expenses', 'Set category budgets', 'Create emergency fund'],
        grade: 'B',
        benchmark_comparison: 'Average for similar users'
      },
      spending_analysis: {
        total_spending: 0,
        spending_velocity: 'stable',
        spending_efficiency: 75,
        top_category_concentration: 0,
        unusual_patterns: [],
        merchant_loyalty: {
          most_frequent: 'Unknown',
          frequency: 0,
          total_spent: 0,
          suggestion: 'Add more expenses for analysis'
        }
      },
      smart_insights: [
        {
          title: 'Start Your Financial Journey',
          description: 'Begin tracking expenses to get personalized insights',
          impact: 'high',
          actionable: true,
          category: 'getting_started',
          timeline: 'This week',
          difficulty: 'easy'
        }
      ],
      personalized_recommendations: [
        {
          title: 'Enable Expense Tracking',
          description: 'Start tracking your daily expenses for better insights',
          priority: 'high',
          implementation: 'Use the app to log every expense',
          expected_impact: 'Better financial awareness',
          effort_level: 'low',
          time_to_implement: '5 minutes daily'
        }
      ],
      financial_goals_suggestions: [
        {
          goal_type: 'Emergency Fund',
          recommended_amount: 30000,
          monthly_target: 3000,
          completion_timeline: '10 months',
          importance: 'critical',
          description: 'Build financial safety net'
        }
      ],
      risk_analysis: {
        financial_stability: 'stable',
        overspending_risk: 'medium',
        budget_variance: 0,
        income_diversification: 'unknown',
        debt_concerns: [],
        emergency_preparedness: 'needs_improvement',
        recommendations: ['Start emergency fund', 'Track expenses consistently']
      },
      market_insights: {
        inflation_impact: 'Plan for 6-7% annual inflation impact',
        investment_opportunities: 'Consider starting SIP investments',
        seasonal_spending_advice: 'Budget for upcoming festivals',
        economic_tips: ['Build emergency fund', 'Start regular investments']
      },
      behavioral_insights: {
        spending_personality: 'getting_started',
        financial_strengths: ['Tech-savvy', 'Ready to learn'],
        areas_for_growth: ['Consistent tracking', 'Budget planning'],
        motivation_tips: ['Set small achievable goals', 'Celebrate progress'],
        psychological_triggers: {
          overspending_patterns: 'Unknown - needs more data',
          saving_motivators: 'Visual progress tracking',
          recommended_strategies: 'Start with simple budgeting'
        }
      },
      next_month_predictions: {
        predicted_spending: 0,
        confidence: 0.3,
        category_forecasts: {},
        seasonal_adjustments: 'Consider upcoming expenses',
        optimization_potential: 0
      },
      advanced_analytics: {
        spending_entropy: 0.5,
        category_diversification_index: 0,
        financial_momentum: 'building',
        spending_consistency_score: 50,
        price_sensitivity_analysis: 'unknown',
        lifestyle_inflation_rate: 'unknown'
      },
      generated_at: now,
      ai_model: 'fallback_system',
      analysis_depth: 'basic',
      data_points_analyzed: 0,
      analysis_period: 'month',
      confidence_level: 0.3,
      personalization_score: 0.4
    };
  }

  private _createQuickFallbackInsights(): Partial<ComprehensiveInsights> {
    return {
      smart_insights: [
        {
          title: 'Getting Started',
          description: 'Add your first expense to begin your financial journey',
          impact: 'high',
          actionable: true,
          category: 'onboarding',
          difficulty: 'easy'
        }
      ],
      financial_health_score: {
        overall_score: 50,
        category_scores: {
          spending_control: 50,
          budget_adherence: 50,
          savings_rate: 50,
          financial_diversity: 50,
          goal_progress: 50
        },
        explanation: 'Start tracking to improve your score',
        improvement_roadmap: ['Add expenses', 'Set budgets', 'Track goals'],
        grade: 'C',
        benchmark_comparison: 'Ready to improve'
      }
    };
  }

  private _createFallbackCoaching(): FinancialCoaching {
    return {
      weekly_goals: [
        {
          goal: 'Track all expenses for 7 days',
          target_amount: 0,
          action_steps: ['Open app daily', 'Log every expense', 'Review at week end'],
          difficulty: 'easy',
          impact: 'high'
        }
      ],
      daily_tips: [
        'Review yesterday\'s expenses each morning',
        'Set a daily spending limit before going out',
        'Take photos of receipts immediately'
      ],
      motivation_message: 'Every expense tracked is a step toward financial freedom!',
      challenge_of_the_week: {
        title: 'Perfect Tracking Week',
        description: 'Track every single expense for 7 consecutive days',
        reward: 'Unlock detailed insights and personal coach'
      },
      financial_education: [
        {
          topic: 'Emergency Fund Basics',
          content: 'Start with saving ₹1000 for unexpected expenses',
          action: 'Set aside ₹100 this week'
        }
      ]
    };
  }

  private _createFallbackPsychology(): SpendingPsychology {
    return {
      spending_personality: 'getting_started',
      psychological_triggers: [],
      spending_patterns: {
        day_patterns: {},
        time_patterns: {},
        amount_distribution: { small: 0, medium: 0, large: 0 }
      },
      emotional_spending_events: [],
      recommendations: [
        'Start tracking to understand your spending patterns',
        'Pay attention to when and why you spend money',
        'Notice your emotions during purchases'
      ],
      insights: [
        'You\'re just starting your financial awareness journey',
        'Tracking will reveal your unique spending patterns',
        'Every person has different financial triggers'
      ]
    };
  }

  private _createFallbackInvestmentReadiness(): InvestmentReadiness {
    return {
      readiness_score: 20,
      factors: {
        expense_tracking: false,
        spending_stability: false,
        emergency_fund_ready: false,
        debt_managed: true
      },
      recommended_investments: [
        'High-yield Savings Account',
        'Start Emergency Fund',
        'Learn about mutual funds'
      ],
      risk_tolerance: 'conservative',
      investment_timeline: '12+ months',
      next_steps: [
        'Build consistent expense tracking habit',
        'Create and fund emergency savings',
        'Learn investment basics'
      ],
      monthly_investment_capacity: 1000
    };
  }

  private _createFallbackForecast(): NextMonthPredictions {
    return {
      predicted_spending: 0,
      confidence: 0.3,
      category_forecasts: {},
      seasonal_adjustments: 'Unable to predict without historical data',
      optimization_potential: 0
    };
  }
}

// Create singleton instance
export const enhancedAIInsightsService = new EnhancedAIInsightsService();

// Export the class for custom instances
export default EnhancedAIInsightsService;