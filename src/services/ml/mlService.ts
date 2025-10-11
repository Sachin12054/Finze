// src/services/mlService.ts - Real ML Service for Production

import { getDefaultBackendUrl } from '../../config/backendConfig';

export interface MLPrediction {
  category: string;
  confidence: number;
  subcategory?: string;
  suggestedTags?: string[];
}

export interface MLModelInfo {
  version: string;
  accuracy: number;
  lastTrained: string;
  totalTrainingData: number;
}

export interface OCRResult {
  merchant_name: string;
  merchant_address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  gst_number?: string;
  date: string;
  time?: string;
  total_amount: number;
  tax_amount?: number;
  currency: string;
  receipt_number?: string;
  payment_method?: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    category: string;
  }>;
  category: string;
  confidence_score: number;
  raw_text: string;
  ml_prediction?: MLPrediction;
}

const ML_API_BASE_URL = getDefaultBackendUrl();
// OCR Service Configuration
const OCR_BASE_URL = getDefaultBackendUrl();

export class MLService {
  static async categorizeExpense(description: string, amount: number): Promise<MLPrediction> {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/categorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          amount
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('ML Service error:', error);
      // Fallback to simple categorization
      return this.fallbackCategorization(description);
    }
  }

  static async getModelInfo(): Promise<MLModelInfo> {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/model-info`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching model info:', error);
      return {
        version: '1.0.0',
        accuracy: 85.0,
        lastTrained: new Date().toISOString(),
        totalTrainingData: 1000
      };
    }
  }

  static async trainModel(expenses: Array<{description: string, category: string}>): Promise<boolean> {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expenses }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error training model:', error);
      return false;
    }
  }

  private static fallbackCategorization(description: string): MLPrediction {
    const keywords = {
      'Food & Dining': ['restaurant', 'cafe', 'lunch', 'dinner', 'food', 'meal', 'pizza', 'burger', 'starbucks', 'mcdonalds'],
      'Transportation': ['uber', 'taxi', 'bus', 'train', 'gas', 'fuel', 'parking', 'metro', 'subway'],
      'Shopping': ['amazon', 'store', 'mall', 'shop', 'buy', 'purchase', 'walmart', 'target'],
      'Entertainment': ['movie', 'cinema', 'game', 'music', 'concert', 'theater', 'netflix', 'spotify'],
      'Bills & Utilities': ['electricity', 'water', 'internet', 'phone', 'cable', 'bill', 'utility'],
      'Healthcare': ['doctor', 'hospital', 'pharmacy', 'medicine', 'clinic', 'medical'],
      'Education': ['school', 'university', 'course', 'book', 'tuition'],
      'Travel': ['hotel', 'flight', 'vacation', 'trip', 'airbnb'],
      'Other': []
    };

    const desc = description.toLowerCase();
    
    for (const [category, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (desc.includes(word)) {
          return {
            category,
            confidence: 0.7,
            subcategory: word,
            suggestedTags: [word]
          };
        }
      }
    }

    return {
      category: 'Other',
      confidence: 0.5,
      suggestedTags: []
    };
  }

  // Helper method for dashboard service
  static async getSuggestedCategory(
    description: string,
    amount: number = 0
  ): Promise<{ category: string; confidence: number } | null> {
    const prediction = await this.categorizeExpense(description, amount);

    if (prediction && prediction.confidence > 0.3) {
      return {
        category: prediction.category,
        confidence: prediction.confidence,
      };
    }

    return null;
  }

  // Health check for ML service
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('ML service health check failed:', error);
      return false;
    }
  }

  // OCR Methods
  static async scanReceipt(imageFile: File): Promise<OCRResult> {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch(`${OCR_BASE_URL}/scan-receipt`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCR request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'OCR processing failed');
      }

      return data.receipt;
    } catch (error) {
      console.error('OCR Service error:', error);
      throw error;
    }
  }

  static async scanReceiptFromBase64(base64Image: string): Promise<OCRResult> {
    try {
      // Convert base64 to blob, then to File
      const response = await fetch(base64Image);
      const blob = await response.blob();
      const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
      
      return await this.scanReceipt(file);
    } catch (error) {
      console.error('Error converting base64 to file:', error);
      throw error;
    }
  }

  static async testOCR(): Promise<any> {
    try {
      const response = await fetch(`${OCR_BASE_URL}/test-ocr`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`OCR test failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OCR test failed:', error);
      throw error;
    }
  }

  static async checkOCRHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${OCR_BASE_URL}/health`);
      const data = await response.json();
      return data.success && data.tesseract_available;
    } catch (error) {
      console.error('OCR health check failed:', error);
      return false;
    }
  }
}
