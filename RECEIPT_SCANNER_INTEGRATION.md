# Receipt Scanner Integration - Complete Guide

This documentation covers the complete integration of the Receipt Scanner system in the Finze app, which combines Google Gemini AI, Firebase Firestore, and React Native for automated expense extraction from receipt images.

## 🚀 Features

### Backend Capabilities
- **Google Gemini AI Integration**: Advanced receipt text and data extraction from images
- **Firebase Firestore**: Secure expense storage with user analytics
- **AI Categorization**: ML-powered expense categorization using pre-trained models
- **Image Processing**: Automatic image optimization for better AI recognition
- **Error Handling**: Comprehensive fallback mechanisms and error recovery
- **Analytics**: User spending patterns and category breakdowns

### Frontend Features
- **Camera & Gallery Integration**: Take photos or select from gallery
- **Real-time Processing**: Live processing status with progress indicators
- **Expense Preview**: Detailed review before saving with all extracted data
- **Theme Support**: Full dark/light theme integration
- **Offline Mode**: Fallback to sample data when backend is unavailable
- **User Feedback**: Toast notifications and error handling

## 📱 User Flow

1. **Open Scanner**: User taps scan button in the app
2. **Take/Select Photo**: Camera capture or gallery selection
3. **AI Processing**: Receipt sent to backend for Gemini AI analysis
4. **Data Extraction**: Merchant, amount, items, category automatically extracted
5. **Review Screen**: User reviews extracted data with confidence scores
6. **Save Expense**: Confirmed data saved to Firebase and local state
7. **Integration**: Expense appears in transaction history and analytics

## 🔧 Technical Architecture

### Backend Services

#### 1. Receipt Extractor Service (`Backend/services/receipt_extractor.py`)
```python
class GeminiReceiptExtractor:
    - extract_receipt_data(image_path, user_id)
    - optimize_image_for_ai(image_path)
    - parse_gemini_response(response_text)
```

**Features:**
- Google Gemini AI integration with structured prompts
- Image optimization (resizing, format conversion)
- Structured JSON response parsing
- Confidence scoring
- Error handling with detailed logging

#### 2. Firestore Service (`Backend/services/firestore_service.py`)
```python
class FirestoreService:
    - save_expense(user_id, expense_data)
    - get_user_expenses(user_id, limit=50)
    - get_user_summary(user_id, period='month')
    - get_category_analytics(user_id)
```

**Features:**
- Secure user-based data storage
- Expense analytics and summaries
- Category spending breakdowns
- Date-based filtering and pagination

#### 3. Combined Server (`Backend/app_enhanced.py`)
```python
Flask Application with endpoints:
- POST /api/upload-receipt
- POST /api/save-expense  
- GET /api/expenses/{user_id}
- GET /api/user-summary/{user_id}
- GET /api/health
- POST /api/categorize (AI categorization)
```

### Frontend Components

#### 1. Receipt Scanner Service (`src/services/receiptScannerService.ts`)
```typescript
class ReceiptScannerService:
    - uploadReceipt(imageUri, userId)
    - saveExpense(userId, expenseData)
    - getUserExpenses(userId, options)
    - getUserSummary(userId, period)
    - testConnection()
```

**Features:**
- Backend health checking
- File upload handling
- Error recovery with fallbacks
- TypeScript type safety
- Connection testing

#### 2. Scanner Dialog (`src/components/ScannerDialog.tsx`)
```typescript
Component Features:
- Camera/Gallery permissions
- Image picker integration
- Processing animations
- Progress tracking
- Error handling
- Theme integration
```

#### 3. Expense Preview Dialog (`src/components/ExpensePreviewDialog.tsx`)
```typescript
Component Features:
- Detailed expense review
- Item breakdown display
- Confidence indicators
- Edit capabilities
- Save to Firebase
- Theme support
```

## 📋 Setup Instructions

### Backend Setup

1. **Install Dependencies**
```bash
cd Backend
pip install -r requirements.txt
```

2. **Environment Configuration**
```bash
# Create .env file
GOOGLE_API_KEY=your_gemini_api_key
FIREBASE_CREDENTIALS_PATH=path_to_firebase_credentials.json
PORT=8001
```

3. **Firebase Setup**
```bash
# Download Firebase service account key
# Place in Backend/firebase-credentials.json
# Update FIREBASE_CREDENTIALS_PATH in .env
```

4. **Start Server**
```bash
# Development
python app_enhanced.py

# Production
gunicorn app_enhanced:app
```

### Frontend Setup

1. **Install Dependencies**
```bash
npm install expo-image-picker
# Dependencies already included in package.json
```

2. **Configure Permissions**
```typescript
// app.json - Add camera permissions
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Finze to access your photos to scan receipts.",
          "cameraPermission": "Allow Finze to access your camera to scan receipts."
        }
      ]
    ]
  }
}
```

3. **Update Backend URL**
```typescript
// src/services/receiptScannerService.ts
// Update baseUrl to match your backend deployment
const baseUrl = 'http://your-backend-url.com/api';
```

## 🔌 Integration with Main App

The Receipt Scanner is fully integrated into the main app at `app/(tabs)/index.tsx`:

### State Management
```typescript
const [showScanner, setShowScanner] = useState(false);
const [showExpensePreview, setShowExpensePreview] = useState(false);
const [extractedExpenseData, setExtractedExpenseData] = useState<ExtractedDetails | null>(null);
```

### Component Integration
```typescript
<ScannerDialog
  open={showScanner}
  onOpenChange={setShowScanner}
  onScanResult={(result) => {
    setExtractedExpenseData(result);
    setShowExpensePreview(true);
  }}
/>

<ExpensePreviewDialog
  open={showExpensePreview}
  extractedData={extractedExpenseData}
  onSave={async (data) => {
    // Save to Firebase via EnhancedFirebaseService
    await EnhancedFirebaseService.addTransaction(transactionData);
  }}
/>
```

## 📊 Data Structure

### ExtractedDetails Interface
```typescript
interface ExtractedDetails {
  total_amount?: number;
  merchant_name?: string;
  category?: string;
  date?: string;
  items?: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  extraction_confidence?: number;
  processing_time?: string;
  currency?: string;
  merchant_address?: string;
  payment_method?: string;
  tax_details?: {
    amount: number;
    rate: number;
  };
  discounts?: Array<{
    description: string;
    amount: number;
  }>;
  receipt_number?: string;
  notes?: string;
}
```

### Firebase Transaction Structure
```typescript
interface Transaction {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  type: 'expense';
  source: 'OCR';
  description: string;
  date: string;
  paymentMethod: string;
  location?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
```

## 🚨 Error Handling

### Backend Error Handling
- **API Rate Limits**: Exponential backoff for Gemini API
- **Image Processing**: Fallback for unsupported formats
- **Firebase Errors**: Retry mechanisms with circuit breaker
- **Validation**: Comprehensive input validation

### Frontend Error Handling
- **Network Errors**: Automatic retry with timeout
- **Permission Denied**: User-friendly permission requests
- **Backend Unavailable**: Fallback to offline mode with sample data
- **Processing Failures**: Option to use sample data or retry

## 📱 Testing

### Backend Testing
```bash
# Test health endpoint
curl http://localhost:8001/api/health

# Test receipt upload
curl -X POST -F "image=@test_receipt.jpg" -F "user_id=test_user" \
  http://localhost:8001/api/upload-receipt
```

### Frontend Testing
1. **Camera Permission**: Test on physical device
2. **Image Upload**: Test with various receipt formats
3. **Error Scenarios**: Test with backend offline
4. **Theme Integration**: Test in both light and dark modes

## 📈 Analytics & Monitoring

### Backend Monitoring
- Request/response logging
- Error tracking with stack traces
- Performance metrics (processing time)
- User activity analytics

### Frontend Monitoring
- Success/failure rates
- User interaction tracking
- Performance measurements
- Error reporting

## 🔐 Security Considerations

### Backend Security
- Input validation and sanitization
- Rate limiting on AI API calls
- Secure Firebase authentication
- Image file type validation

### Frontend Security
- Secure API communication (HTTPS)
- User data validation
- Permission handling
- Sensitive data protection

## 🚀 Deployment

### Backend Deployment
```bash
# Using Docker
docker build -t finze-backend .
docker run -p 8001:8001 finze-backend

# Using Heroku
git add .
git commit -m "Deploy receipt scanner"
git push heroku main
```

### Frontend Deployment
```bash
# Build for production
expo build:android
expo build:ios

# Update backend URL for production
# Test thoroughly before release
```

## 📞 Support & Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Check backend URL in receiptScannerService.ts
   - Verify backend server is running
   - Check network connectivity

2. **Image Processing Failed**
   - Ensure image is clear and well-lit
   - Check file size (should be < 5MB)
   - Verify receipt contains text

3. **Permissions Denied**
   - Check app permissions in device settings
   - Ensure expo-image-picker is properly configured
   - Test on physical device (not simulator)

### Performance Tips

1. **Image Optimization**
   - Use lower quality settings for faster upload
   - Implement image compression
   - Consider image caching

2. **Backend Performance**
   - Implement request caching
   - Use connection pooling
   - Monitor API rate limits

## 🎯 Future Enhancements

### Planned Features
1. **Batch Processing**: Multiple receipts at once
2. **OCR Corrections**: Manual editing of extracted data
3. **Receipt Templates**: Smart templates for recurring merchants
4. **Integration**: Connect with banking APIs
5. **Advanced Analytics**: Spending predictions and insights

### Technical Improvements
1. **Caching**: Implement Redis for better performance
2. **Queue System**: Background processing for large images
3. **ML Models**: Custom receipt processing models
4. **Real-time Sync**: Live updates across devices

---

## 📝 Conclusion

The Receipt Scanner system provides a complete, production-ready solution for automated expense extraction from receipt images. With comprehensive error handling, theme integration, and robust backend services, it seamlessly integrates into the Finze expense management application.

For additional support or feature requests, please refer to the project documentation or contact the development team.