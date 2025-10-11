/**
 * Category Service - AI Categorization API
 * Handles communication with the backend AI categorization service
 */

import { getDefaultBackendUrl } from '../../config/backendConfig';

export interface CategoryResponse {
  category: string;
  confidence: number;
  processing_time?: number;
}

export interface BatchCategoryResponse {
  results: CategoryResponse[];
}

class CategoryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getDefaultBackendUrl();
  }

  /**
   * Test connection to the categorization service
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('CategoryService connection test failed:', error);
      return false;
    }
  }

  /**
   * Categorize a single expense description
   */
  async categorizeExpense(description: string, amount?: number): Promise<CategoryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/categorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
          amount: amount || null
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('CategoryService categorizeExpense error:', error);
      throw new Error('AI service unavailable');
    }
  }

  /**
   * Categorize multiple expenses in batch
   */
  async categorizeBatch(items: Array<{description: string, amount?: number}>): Promise<BatchCategoryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/categorize-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('CategoryService categorizeBatch error:', error);
      throw new Error('AI service unavailable');
    }
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.categories || [];
    } catch (error) {
      console.error('CategoryService getCategories error:', error);
      throw new Error('AI service unavailable');
    }
  }

  /**
   * Submit user correction for learning
   */
  async submitCorrection(description: string, correctCategory: string, amount?: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/correction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
          correct_category: correctCategory,
          amount: amount || null
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('CategoryService submitCorrection error:', error);
      throw new Error('Failed to submit correction');
    }
  }
}

// Create singleton instance
export const categoryService = new CategoryService();
export default CategoryService;