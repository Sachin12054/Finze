// src/services/mockMLService.ts - Mock ML Service for Development

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MLCategoryResponse {
  category: string;
  confidence: number;
  subcategory?: string;
  reasoning?: string;
}

export interface MLBatchResponse {
  results: Array<{
    description: string;
    category: string;
    confidence: number;
    subcategory?: string;
  }>;
  totalProcessed: number;
  avgConfidence: number;
}

export class MockMLService {
  private static readonly categoryMappings: Record<string, { category: string; confidence: number; subcategory?: string }> = {
    // Food & Dining
    'swiggy': { category: 'Food & Dining', confidence: 0.95, subcategory: 'Delivery' },
    'zomato': { category: 'Food & Dining', confidence: 0.95, subcategory: 'Delivery' },
    'dominos': { category: 'Food & Dining', confidence: 0.92, subcategory: 'Fast Food' },
    'mcdonalds': { category: 'Food & Dining', confidence: 0.93, subcategory: 'Fast Food' },
    'kfc': { category: 'Food & Dining', confidence: 0.93, subcategory: 'Fast Food' },
    'restaurant': { category: 'Food & Dining', confidence: 0.88, subcategory: 'Restaurants' },
    'cafe': { category: 'Food & Dining', confidence: 0.85, subcategory: 'Coffee' },
    'starbucks': { category: 'Food & Dining', confidence: 0.92, subcategory: 'Coffee' },
    'grocery': { category: 'Food & Dining', confidence: 0.90, subcategory: 'Groceries' },
    'bigbasket': { category: 'Food & Dining', confidence: 0.91, subcategory: 'Groceries' },
    'dmart': { category: 'Food & Dining', confidence: 0.89, subcategory: 'Groceries' },
    
    // Transportation
    'uber': { category: 'Transportation', confidence: 0.96, subcategory: 'Taxi/Uber' },
    'ola': { category: 'Transportation', confidence: 0.96, subcategory: 'Taxi/Uber' },
    'rapido': { category: 'Transportation', confidence: 0.94, subcategory: 'Taxi/Uber' },
    'metro': { category: 'Transportation', confidence: 0.92, subcategory: 'Public Transport' },
    'bus': { category: 'Transportation', confidence: 0.88, subcategory: 'Public Transport' },
    'petrol': { category: 'Transportation', confidence: 0.93, subcategory: 'Fuel' },
    'diesel': { category: 'Transportation', confidence: 0.93, subcategory: 'Fuel' },
    'fuel': { category: 'Transportation', confidence: 0.91, subcategory: 'Fuel' },
    'parking': { category: 'Transportation', confidence: 0.89, subcategory: 'Parking' },
    
    // Shopping
    'amazon': { category: 'Shopping', confidence: 0.85, subcategory: 'Electronics' },
    'flipkart': { category: 'Shopping', confidence: 0.85, subcategory: 'Electronics' },
    'myntra': { category: 'Shopping', confidence: 0.92, subcategory: 'Clothing' },
    'ajio': { category: 'Shopping', confidence: 0.91, subcategory: 'Clothing' },
    'reliance': { category: 'Shopping', confidence: 0.83, subcategory: 'Home Goods' },
    'nike': { category: 'Shopping', confidence: 0.90, subcategory: 'Clothing' },
    'adidas': { category: 'Shopping', confidence: 0.90, subcategory: 'Clothing' },
    
    // Entertainment
    'netflix': { category: 'Entertainment', confidence: 0.95, subcategory: 'Subscriptions' },
    'prime': { category: 'Entertainment', confidence: 0.93, subcategory: 'Subscriptions' },
    'spotify': { category: 'Entertainment', confidence: 0.94, subcategory: 'Subscriptions' },
    'movie': { category: 'Entertainment', confidence: 0.87, subcategory: 'Movies' },
    'cinema': { category: 'Entertainment', confidence: 0.89, subcategory: 'Movies' },
    'pvr': { category: 'Entertainment', confidence: 0.91, subcategory: 'Movies' },
    'inox': { category: 'Entertainment', confidence: 0.91, subcategory: 'Movies' },
    'game': { category: 'Entertainment', confidence: 0.82, subcategory: 'Gaming' },
    
    // Bills & Utilities
    'electricity': { category: 'Bills & Utilities', confidence: 0.94, subcategory: 'Electricity' },
    'water': { category: 'Bills & Utilities', confidence: 0.92, subcategory: 'Water' },
    'internet': { category: 'Bills & Utilities', confidence: 0.91, subcategory: 'Internet' },
    'wifi': { category: 'Bills & Utilities', confidence: 0.91, subcategory: 'Internet' },
    'jio': { category: 'Bills & Utilities', confidence: 0.88, subcategory: 'Phone' },
    'airtel': { category: 'Bills & Utilities', confidence: 0.88, subcategory: 'Phone' },
    'vi': { category: 'Bills & Utilities', confidence: 0.88, subcategory: 'Phone' },
    'insurance': { category: 'Bills & Utilities', confidence: 0.89, subcategory: 'Insurance' },
    
    // Healthcare
    'doctor': { category: 'Healthcare', confidence: 0.90, subcategory: 'Doctor Visits' },
    'hospital': { category: 'Healthcare', confidence: 0.92, subcategory: 'Doctor Visits' },
    'pharmacy': { category: 'Healthcare', confidence: 0.89, subcategory: 'Medicine' },
    'medicine': { category: 'Healthcare', confidence: 0.91, subcategory: 'Medicine' },
    'dental': { category: 'Healthcare', confidence: 0.88, subcategory: 'Dental' },
    'apollo': { category: 'Healthcare', confidence: 0.93, subcategory: 'Doctor Visits' },
    'fortis': { category: 'Healthcare', confidence: 0.93, subcategory: 'Doctor Visits' },
    
    // Income
    'salary': { category: 'Income', confidence: 0.96, subcategory: 'Salary' },
    'freelance': { category: 'Income', confidence: 0.92, subcategory: 'Freelance' },
    'dividend': { category: 'Income', confidence: 0.94, subcategory: 'Investment' },
    'interest': { category: 'Income', confidence: 0.93, subcategory: 'Investment' },
    'bonus': { category: 'Income', confidence: 0.91, subcategory: 'Salary' }
  };

  static async categorizeExpense(description: string, amount?: number): Promise<ApiResponse<MLCategoryResponse>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    try {
      const lowerDescription = description.toLowerCase();
      
      // Check for exact matches first
      for (const [keyword, mapping] of Object.entries(this.categoryMappings)) {
        if (lowerDescription.includes(keyword)) {
          return {
            success: true,
            data: {
              category: mapping.category,
              confidence: mapping.confidence + (Math.random() * 0.05 - 0.025), // Add slight variation
              subcategory: mapping.subcategory,
              reasoning: `Matched keyword "${keyword}" in description`
            }
          };
        }
      }

      // Amount-based categorization fallback
      if (amount) {
        if (amount > 50000) {
          return {
            success: true,
            data: {
              category: 'Other',
              confidence: 0.65,
              reasoning: 'High amount transaction - manual review recommended'
            }
          };
        } else if (amount < 100) {
          return {
            success: true,
            data: {
              category: 'Food & Dining',
              confidence: 0.72,
              subcategory: 'Fast Food',
              reasoning: 'Small amount typically indicates food/snacks'
            }
          };
        }
      }

      // Default categorization with pattern matching
      const patterns = [
        { pattern: /pay|upi|transfer/i, category: 'Other', confidence: 0.60 },
        { pattern: /food|eat|lunch|dinner|breakfast/i, category: 'Food & Dining', confidence: 0.78 },
        { pattern: /travel|trip|hotel|flight/i, category: 'Travel', confidence: 0.82 },
        { pattern: /cloth|dress|shirt|pant|shoe/i, category: 'Shopping', confidence: 0.80 },
        { pattern: /book|course|education|study/i, category: 'Education', confidence: 0.85 },
        { pattern: /gift|birthday|anniversary/i, category: 'Shopping', confidence: 0.75 }
      ];

      for (const { pattern, category, confidence } of patterns) {
        if (pattern.test(description)) {
          return {
            success: true,
            data: {
              category,
              confidence: confidence + (Math.random() * 0.1 - 0.05),
              reasoning: `Pattern matching based on description content`
            }
          };
        }
      }

      // Final fallback
      return {
        success: true,
        data: {
          category: 'Other',
          confidence: 0.55,
          reasoning: 'No specific pattern matched - defaulted to Other category'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to categorize expense: ${error}`
      };
    }
  }

  static async categorizeBatch(descriptions: Array<{ description: string; amount?: number }>): Promise<ApiResponse<MLBatchResponse>> {
    // Simulate batch processing delay
    await new Promise(resolve => setTimeout(resolve, 500 + descriptions.length * 50));

    try {
      const results: MLBatchResponse['results'] = [];
      let totalConfidence = 0;

      for (const { description, amount } of descriptions) {
        const result = await this.categorizeExpense(description, amount);
        if (result.success && result.data) {
          results.push({
            description,
            category: result.data.category,
            confidence: result.data.confidence,
            subcategory: result.data.subcategory
          });
          totalConfidence += result.data.confidence;
        }
      }

      const avgConfidence = results.length > 0 ? totalConfidence / results.length : 0;

      return {
        success: true,
        data: {
          results,
          totalProcessed: results.length,
          avgConfidence
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process batch categorization: ${error}`
      };
    }
  }

  static async getModelHealth(): Promise<ApiResponse<{
    status: string;
    accuracy: number;
    version: string;
    lastTrained: string;
    totalCategories: number;
  }>> {
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      data: {
        status: 'healthy',
        accuracy: 0.985,
        version: '1.0.0-mock',
        lastTrained: '2025-08-24T00:00:00Z',
        totalCategories: 10
      }
    };
  }

  static async getModelStatistics(): Promise<ApiResponse<{
    totalPredictions: number;
    dailyPredictions: number;
    topCategories: Array<{ category: string; count: number; accuracy: number }>;
    recentAccuracy: number;
  }>> {
    await new Promise(resolve => setTimeout(resolve, 150));

    return {
      success: true,
      data: {
        totalPredictions: 15847,
        dailyPredictions: 234,
        topCategories: [
          { category: 'Food & Dining', count: 4562, accuracy: 0.94 },
          { category: 'Transportation', count: 2341, accuracy: 0.96 },
          { category: 'Shopping', count: 2108, accuracy: 0.89 },
          { category: 'Entertainment', count: 1456, accuracy: 0.92 },
          { category: 'Bills & Utilities', count: 1234, accuracy: 0.97 }
        ],
        recentAccuracy: 0.983
      }
    };
  }

  // Mock training simulation
  static async retrainModel(newData: Array<{ description: string; category: string; amount?: number }>): Promise<ApiResponse<{
    success: boolean;
    newAccuracy: number;
    improvementScore: number;
    trainingTime: string;
  }>> {
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 2000 + newData.length * 10));

    const improvement = Math.random() * 0.05 + 0.01; // 1-6% improvement
    const newAccuracy = 0.985 + improvement;

    return {
      success: true,
      data: {
        success: true,
        newAccuracy,
        improvementScore: improvement,
        trainingTime: '45 seconds'
      }
    };
  }
}

// Export the service (will be replaced by real MLService when Python backend is ready)
export const MLService = MockMLService;
