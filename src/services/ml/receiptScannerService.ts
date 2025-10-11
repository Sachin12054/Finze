/**
 * Receipt Scanner API Service
 * Handles communication with the enhanced backend for receipt scanning and expense management
 */

import { BACKEND_CONFIG, findBestBackendUrl, getDefaultBackendUrl } from '../../config/backendConfig';

export interface ExtractedDetails {
  total_amount: number;
  merchant_name: string;
  date: string;
  category?: string;
  extracted_text: string;
  image_url?: string;
  items?: any[];
  extraction_confidence?: number;
  processing_time?: string;
  currency?: string;
  merchant_address?: string;
  time?: string;
  subcategory?: string;
  payment_method?: string;
  receipt_number?: string;
  tax_amount?: number;
  discount_amount?: number;
  [key: string]: any; // Allow additional properties
}

export interface ReceiptScanResponse {
  status: 'success' | 'error';
  data?: ExtractedDetails;
  message?: string;
  error?: string;
}

export interface SaveExpenseResponse {
  status: 'success' | 'error';
  data?: any;
  message?: string;
  error?: string;
}

export interface UserExpensesResponse {
  status: 'success' | 'error';
  data?: any[];
  count?: number;
  message?: string;
  error?: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  services: {
    ai_categorization: boolean;
    receipt_scanning: boolean;
    firestore: boolean;
  };
  ai_model?: {
    loaded: boolean;
    type: string;
    categories: string[];
  };
  receipt_scanning?: {
    available: boolean;
    supported_formats: string[];
  };
}

class ReceiptScannerService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getDefaultBackendUrl();
    this.timeout = BACKEND_CONFIG.TIMEOUT;
  }

  /**
   * Initialize service with the best available backend URL
   */
  async initialize(): Promise<void> {
    const bestUrl = await findBestBackendUrl();
    if (bestUrl) {
      this.baseUrl = bestUrl;
      console.log(`🔗 Scanner service initialized with: ${this.baseUrl}`);
    }
  }

  /**
   * Check if the backend services are available
   */
  async checkHealth(): Promise<HealthCheckResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_CONFIG.HEALTH_CHECK_TIMEOUT);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error('Health check failed:', response.status);
        return null;
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Backend service not available:', error);
      return null;
    }
  }

  /**
   * Upload and process receipt image
   */
  async uploadReceipt(imageUri: string, userId: string = 'anonymous'): Promise<ReceiptScanResponse> {
    try {
      console.log(`📤 Starting receipt upload for user: ${userId}`);
      console.log(`🔗 Using backend URL: ${this.baseUrl}`);
      
      // First try to initialize with the best backend URL
      await this.initialize();
      
      // Check if the service is available first
      console.log('🔍 Checking backend health...');
      const health = await this.checkHealth();
      if (!health || !health.services.receipt_scanning) {
        console.error('❌ Receipt scanning service unavailable');
        return {
          status: 'error',
          error: 'Receipt scanning service is not available. Please check your internet connection and try again.',
        };
      }
      console.log('✅ Backend services are healthy');

      // Create FormData for file upload
      const formData = new FormData();
      
      // Handle different image sources (file picker vs camera)
      if (imageUri.startsWith('data:')) {
        // Data URL (base64 encoded image) - convert to blob for web compatibility
        console.log('📷 Processing base64 image...');
        try {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          formData.append('image', blob, 'receipt.jpg');
          console.log(`📊 Base64 image converted to blob: ${blob.size} bytes`);
        } catch (blobError) {
          console.log('� Base64 blob conversion failed, using direct data URL');
          // Extract base64 data and create blob manually
          const base64Data = imageUri.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'image/jpeg' });
          formData.append('image', blob, 'receipt.jpg');
          console.log(`📊 Manual blob created: ${blob.size} bytes`);
        }
      } else {
        // File URI - React Native specific handling
        console.log('� Processing file URI for React Native...');
        console.log(`📍 Image URI: ${imageUri}`);
        
        // React Native file upload - use the URI directly with proper metadata
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'receipt.jpg',
        } as any);
        
        console.log('📊 React Native file object appended to FormData');
      }
      
      formData.append('user_id', userId);
      console.log(`👤 User ID added to FormData: ${userId}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏱️ Upload timeout reached');
        controller.abort();
      }, this.timeout);

      console.log('🚀 Uploading receipt to backend...');
      console.log(`📍 Upload URL: ${this.baseUrl}/upload-receipt`);
      
      // Debug FormData contents
      console.log('🔍 FormData contents:');
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'object' && value.constructor.name === 'File') {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else if (typeof value === 'object' && 'uri' in value) {
          console.log(`  ${key}: ReactNativeFile(${value.name}, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      const response = await fetch(`${this.baseUrl}/upload-receipt`, {
        method: 'POST',
        body: formData,
        headers: {
          // Let browser/React Native set Content-Type with boundary for FormData
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Upload failed: ${response.status}`, errorText);
        return {
          status: 'error',
          error: `Upload failed: ${response.status} ${response.statusText}. Please check your internet connection.`,
        };
      }

      const result = await response.json();
      console.log('📋 Response received:', { status: result.status, hasData: !!result.data });

      if (result.status === 'success' && result.data) {
        console.log('✅ Receipt processed successfully:', result.data.merchant_name || 'Unknown merchant');
        return {
          status: 'success',
          data: this.formatExtractedData(result.data),
          message: result.message,
        };
      } else {
        console.error('❌ Backend processing failed:', result.error);
        return {
          status: 'error',
          error: result.error || 'Failed to process receipt',
        };
      }
    } catch (error) {
      console.error('💥 Error uploading receipt:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          status: 'error',
          error: 'Upload timed out. Please check your internet connection and try again.',
        };
      }
      
      if (error instanceof Error && error.message.includes('Network request failed')) {
        return {
          status: 'error',
          error: 'Network connection failed. Please check your internet connection and backend server status.',
        };
      }
      
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred during upload',
      };
    }
  }

  /**
   * Save extracted expense to database
   */
  async saveExpense(userId: string, expenseData: ExtractedDetails): Promise<SaveExpenseResponse> {
    try {
      const health = await this.checkHealth();
      if (!health || !health.services.firestore) {
        return {
          status: 'error',
          error: 'Database service is not available. Please check your backend configuration.',
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      console.log('Saving expense to database...');

      const response = await fetch(`${this.baseUrl}/save-expense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          expense_data: expenseData,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        console.error('Save expense failed:', response.status, result);
        return {
          status: 'error',
          error: result.error || `Save failed with status ${response.status}`,
        };
      }

      if (result.status === 'success') {
        console.log('Expense saved successfully with ID:', result.data?.id);
        return {
          status: 'success',
          data: result.data,
          message: result.message,
        };
      } else {
        return {
          status: 'error',
          error: result.error || 'Failed to save expense',
        };
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          status: 'error',
          error: 'Request timed out. Please try again.',
        };
      }
      
      return {
        status: 'error',
        error: (error instanceof Error ? error.message : String(error)) || 'Network error. Please check your connection and try again.',
      };
    }
  }

  /**
   * Get user's expenses from the backend
   */
  async getUserExpenses(
    userId: string, 
    options?: {
      limit?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<UserExpensesResponse> {
    try {
      const health = await this.checkHealth();
      if (!health || !health.services.firestore) {
        return {
          status: 'error',
          error: 'Database service is not available.',
        };
      }

      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.startDate) params.append('start_date', options.startDate);
      if (options?.endDate) params.append('end_date', options.endDate);

      const url = `${this.baseUrl}/expenses/${userId}${params.toString() ? '?' + params.toString() : ''}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        return {
          status: 'error',
          error: result.error || `Failed to fetch expenses: ${response.status}`,
        };
      }

      return {
        status: 'success',
        data: result.data || [],
        count: result.count || 0,
      };
    } catch (error) {
      console.error('Error fetching user expenses:', error);
      return {
        status: 'error',
        error: (error instanceof Error ? error.message : String(error)) || 'Network error.',
      };
    }
  }

  /**
   * Get user's expense summary and analytics
   */
  async getUserSummary(userId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const health = await this.checkHealth();
      if (!health || !health.services.firestore) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/user-summary/${userId}?period=${period}`, {
        method: 'GET',
      });

      if (!response.ok) {
        console.error('Failed to fetch user summary:', response.status);
        return null;
      }

      const result = await response.json();
      return result.status === 'success' ? result.data : null;
    } catch (error) {
      console.error('Error fetching user summary:', error);
      return null;
    }
  }

  /**
   * Use AI categorization service for expense categorization
   */
  async categorizeExpense(description: string, amount: number, merchantName?: string): Promise<{
    category: string;
    confidence: number;
  } | null> {
    try {
      const health = await this.checkHealth();
      if (!health || !health.services.ai_categorization) {
        // Fallback to simple rule-based categorization
        return {
          category: this.getRuleBasedCategory(description, merchantName),
          confidence: 0.5,
        };
      }

      const response = await fetch(`${this.baseUrl}/categorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          amount,
          merchant_name: merchantName,
        }),
      });

      if (!response.ok) {
        return {
          category: this.getRuleBasedCategory(description, merchantName),
          confidence: 0.5,
        };
      }

      const result = await response.json();
      return {
        category: result.category || 'Other',
        confidence: result.confidence || 0.5,
      };
    } catch (error) {
      console.error('Error categorizing expense:', error);
      return {
        category: this.getRuleBasedCategory(description, merchantName),
        confidence: 0.5,
      };
    }
  }

  /**
   * Format extracted data from backend to match ExtractedDetails interface
   */
  private formatExtractedData(data: any): ExtractedDetails {
    return {
      total_amount: data.total_amount || 0,
      merchant_name: data.merchant_name || 'Unknown Merchant',
      category: data.category || 'Other',
      date: data.date || new Date().toISOString(),
      extracted_text: data.extracted_text || data.raw_text || 'Text extraction failed',
      items: data.items || [],
      extraction_confidence: data.confidence_score || 0.8,
      processing_time: data.processed_at || new Date().toISOString(),
      // Additional fields from backend with INR as default currency for Indian context
      currency: data.currency || 'INR',
      merchant_address: data.merchant_address,
      time: data.time,
      subcategory: data.subcategory,
      payment_method: data.payment_method,
      tax_details: data.tax_details,
      discounts: data.discounts,
      additional_charges: data.additional_charges,
      receipt_number: data.receipt_number,
      notes: data.notes,
    };
  }

  /**
   * Simple rule-based categorization fallback
   */
  private getRuleBasedCategory(description: string, merchantName?: string): string {
    const text = ((merchantName || '') + ' ' + description).toLowerCase();
    
    const rules = [
      { keywords: ['restaurant', 'cafe', 'coffee', 'food', 'dining', 'pizza', 'burger'], category: 'Food & Dining' },
      { keywords: ['gas', 'fuel', 'petrol', 'shell', 'exxon', 'chevron'], category: 'Transportation' },
      { keywords: ['grocery', 'supermarket', 'walmart', 'target', 'store'], category: 'Groceries' },
      { keywords: ['amazon', 'shopping', 'retail', 'mall'], category: 'Shopping' },
      { keywords: ['netflix', 'spotify', 'movie', 'entertainment', 'game'], category: 'Entertainment' },
      { keywords: ['hospital', 'pharmacy', 'doctor', 'medical', 'health'], category: 'Healthcare' },
      { keywords: ['uber', 'taxi', 'transport', 'bus', 'train', 'parking'], category: 'Transportation' },
      { keywords: ['rent', 'utility', 'electric', 'water', 'internet', 'phone'], category: 'Bills & Utilities' },
      { keywords: ['hotel', 'airline', 'flight', 'travel', 'booking'], category: 'Travel' },
    ];

    for (const rule of rules) {
      if (rule.keywords.some(keyword => text.includes(keyword))) {
        return rule.category;
      }
    }

    return 'Other';
  }

  /**
   * Get available categories from the backend
   */
  async getAvailableCategories(): Promise<string[]> {
    try {
      const health = await this.checkHealth();
      if (!health || !health.ai_model?.categories) {
        return this.getDefaultCategories();
      }

      return health.ai_model.categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      return this.getDefaultCategories();
    }
  }

  /**
   * Default categories fallback
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
      'Other'
    ];
  }

  /**
   * Update the base URL for the service
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Test the connection to the backend
   */
  async testConnection(): Promise<{
    connected: boolean;
    services: any;
    latency?: number;
  }> {
    const startTime = Date.now();
    
    try {
      const health = await this.checkHealth();
      const latency = Date.now() - startTime;
      
      if (health) {
        return {
          connected: true,
          services: health.services,
          latency,
        };
      } else {
        return {
          connected: false,
          services: {},
        };
      }
    } catch (error) {
      return {
        connected: false,
        services: {},
      };
    }
  }
}

// Create singleton instance
export const receiptScannerService = new ReceiptScannerService();

// Export the class for custom instances
export default ReceiptScannerService;