
<h1 align="center">💸 Finze – AI-Powered Personal Finance App</h1>

<p align="center" style="font-size:1.1rem;">
   <b>Finze</b> is your intelligent, AI-powered personal finance companion.<br>
   Effortlessly track expenses, scan receipts, and gain actionable insights—all in a seamless, modern experience.
</p>

---

## 🚀 Key Features

|  |  |
|---|---|
| 🧾 <b>Expense Tracking</b> | Log and categorize expenses in real time |
| 📸 <b>Receipt Scanning</b> | Extract expense data from receipts using AI |
| 🤖 <b>AI Categorization</b> | Automatically categorize transactions using machine learning |
| 📊 <b>Budget Management</b> | Set monthly budgets and monitor your progress |
| 🎯 <b>Savings Goals</b> | Create and track personalized savings goals |
| 🔁 <b>Recurring Transactions</b> | Manage subscriptions and recurring expenses |
| 💡 <b>Smart Suggestions</b> | Receive AI-driven tips to optimize your spending |
| 📈 <b>Analytics Dashboard</b> | Visualize spending patterns and trends |
| 🌓 <b>Theme Toggle</b> | Switch between light and dark modes for optimal comfort |
| 🔒 <b>Privacy First</b> | Your data stays secure on your device or your own cloud |

---

## ️ Getting Started

### Frontend (React Native/Expo)
```bash
# 1️⃣ Install dependencies
npm install

# 2️⃣ Start the development server
npx expo start
```

📱 **Open on your device or emulator:**
- Scan the QR code with Expo Go (iOS/Android)
- Or run on an emulator/simulator from the Expo CLI

### Backend (Python Flask)
```bash
# 1️⃣ Navigate to Backend directory
cd Backend

# 2️⃣ Run the backend server
.\Start_Backend.bat
```

🚀 **Backend will be available at:**
- Main Server: `http://localhost:8001`
- Health Check: `http://localhost:8001/api/health`

---

## 📂 Project Structure

```bash
Finze/
│
├── app/                    # Main screens & navigation
├── assets/                 # Images & fonts
├── components/             # Reusable UI components
├── constants/              # App-wide constants
├── hooks/                  # Custom React hooks
├── Backend/                # Backend server
│   ├── app.py             # Main backend server
│   ├── services/          # AI & database services
│   ├── ml_model/          # AI categorization models
│   ├── models/            # Trained model files
│   ├── requirements.txt   # Python dependencies
│   └── Start_Backend.bat  # Backend startup script
├── scripts/               # Utility scripts
└── src/                   # Core business logic
```

---

## 🎨 Technology Stack

### Frontend
<p><img src="https://skillicons.dev/icons?i=react,js,ts,expo" /></p>

- **React Native** with Expo
- **TypeScript** for type safety
- **Expo Router** for navigation

### Backend
<p><img src="https://skillicons.dev/icons?i=python,flask,firebase,tensorflow" /></p>

- **Python Flask** for API server
- **Firebase Firestore** for database
- **Google Gemini AI** for receipt scanning
- **PyTorch & Transformers** for AI categorization

---

## 🧠 AI-Powered Features

### Receipt Scanning
- Extract text from receipt images using Google Gemini AI
- Parse merchant, items, amounts, and dates automatically
- Support for multiple image formats (PNG, JPG, HEIC, etc.)

### Smart Categorization
- Ultra-perfect AI categorizer with 98%+ accuracy
- 11 expense categories with confidence scoring
- Active learning from user corrections
- Batch processing for multiple expenses

### Available Categories
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Technology
- Bills & Utilities
- Healthcare
- Travel
- Education
- Business
- Other

---

## 🔧 API Endpoints

### Health & Status
- `GET /api/health` - Complete system health check

### AI Categorization
- `GET /api/categories` - Get available categories
- `POST /api/categorize` - Categorize single expense
- `POST /api/categorize-batch` - Batch categorization
- `POST /api/correction` - Submit categorization corrections

### Receipt Scanning
- `POST /api/upload-receipt` - Upload and process receipt
- `POST /api/save-expense` - Save expense to database
- `GET /api/expenses/<user_id>` - Get user expenses
- `GET /api/expense/<expense_id>` - Get specific expense
- `PUT /api/expense/<expense_id>` - Update expense
- `DELETE /api/expense/<expense_id>` - Delete expense
- `GET /api/user-summary/<user_id>` - Get user analytics

---

## 🚀 Quick Start Guide

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sachin12054/Finze.git
   cd Finze
   ```

2. **Setup Frontend**
   ```bash
   npm install
   npx expo start
   ```

3. **Setup Backend**
   ```bash
   cd Backend
   .\Start_Backend.bat
   ```
---


<p align="center">Made with ❤️ by the Finze Team</p>

