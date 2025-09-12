# Finze Database Schema Documentation

## Overview
This document describes the Firebase Firestore database structure for the Finze expense tracking application.

## Database Collections

### 1. `users` Collection
Stores user profile and account information.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `user_id` | String (UUID) | Unique identifier for each user (matches Firebase Auth UID) | ✅ |
| `name` | String | Full name of the user | ✅ |
| `email` | String | User's email address (unique) | ✅ |
| `phone` | String | Contact number | ❌ |
| `created_at` | String (ISO) | Account creation timestamp | ✅ |
| `balance` | Number | Current account balance | ✅ |
| `displayName` | String | Display name for UI | ❌ |
| `profilePic` | String | Profile picture URL | ❌ |
| `bio` | String | User biography | ❌ |
| `location` | String | User location | ❌ |
| `website` | String | User website | ❌ |

**Example Document:**
```json
{
  "user_id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "created_at": "2025-01-01T00:00:00.000Z",
  "balance": 5000.50,
  "displayName": "John",
  "profilePic": "https://example.com/avatar.jpg"
}
```

### 2. `expenses` Collection
Stores all expense records.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `expense_id` | String (UUID) | Unique expense record identifier | ✅ |
| `user_id` | String | Foreign key to users collection | ✅ |
| `amount` | Number | Expense amount | ✅ |
| `category` | String | Expense category | ✅ |
| `description` | String | Details about the expense | ✅ |
| `payment_method` | String | Payment method (Cash, Card, UPI, etc.) | ✅ |
| `date` | String (ISO) | Date of expense | ✅ |
| `source` | String | "Manual" or "OCR" | ✅ |

**Categories:** Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Other

**Example Document:**
```json
{
  "expense_id": "exp_456",
  "user_id": "user_123",
  "amount": 25.50,
  "category": "Food & Dining",
  "description": "Lunch at cafe",
  "payment_method": "Card",
  "date": "2025-01-15",
  "source": "Manual"
}
```

### 3. `budgets` Collection
Stores budget information for different categories.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `budget_id` | String (UUID) | Unique budget identifier | ✅ |
| `user_id` | String | Foreign key to users collection | ✅ |
| `category` | String | Budget category | ✅ |
| `amount_limit` | Number | Maximum allowed amount | ✅ |
| `spent` | Number | Current spent amount | ✅ |
| `start_date` | String (ISO) | Budget start date | ✅ |
| `end_date` | String (ISO) | Budget end date | ✅ |

**Example Document:**
```json
{
  "budget_id": "budget_789",
  "user_id": "user_123",
  "category": "Food & Dining",
  "amount_limit": 1000.00,
  "spent": 350.75,
  "start_date": "2025-01-01",
  "end_date": "2025-01-31"
}
```

### 4. `reminders` Collection
Stores user reminders and notifications.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `reminder_id` | String (UUID) | Unique reminder identifier | ✅ |
| `user_id` | String | Foreign key to users collection | ✅ |
| `title` | String | Reminder title | ✅ |
| `message` | String | Reminder message/note | ✅ |
| `reminder_date` | String (ISO) | Date and time of reminder | ✅ |
| `status` | String | "Pending" or "Completed" | ✅ |

**Example Document:**
```json
{
  "reminder_id": "rem_101",
  "user_id": "user_123",
  "title": "Pay electricity bill",
  "message": "Don't forget to pay the monthly electricity bill",
  "reminder_date": "2025-01-20T10:00:00.000Z",
  "status": "Pending"
}
```

### 5. `transactions_history` Collection
Stores all financial transactions (including income).

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `transaction_id` | String (UUID) | Unique transaction identifier | ✅ |
| `user_id` | String | Foreign key to users collection | ✅ |
| `type` | String | "Credit" or "Debit" | ✅ |
| `amount` | Number | Transaction amount | ✅ |
| `category` | String | Transaction category | ✅ |
| `description` | String | Transaction details | ✅ |
| `transaction_date` | String (ISO) | Date of transaction | ✅ |
| `reference` | String | Transaction reference (UPI ID, Bank ID, etc.) | ❌ |

**Example Document:**
```json
{
  "transaction_id": "trans_202",
  "user_id": "user_123",
  "type": "Credit",
  "amount": 5000.00,
  "category": "Salary",
  "description": "Monthly salary deposit",
  "transaction_date": "2025-01-01",
  "reference": "SAL_JAN_2025"
}
```

### 6. `smart_suggestions` Collection
Stores AI-generated suggestions and insights.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `suggestion_id` | String (UUID) | Unique suggestion identifier | ✅ |
| `user_id` | String | Foreign key to users collection | ✅ |
| `suggestion_type` | String | Type of suggestion | ✅ |
| `message` | String | AI-generated suggestion message | ✅ |
| `created_at` | String (ISO) | Suggestion creation time | ✅ |
| `status` | String | "New", "Viewed", or "Implemented" | ✅ |

**Suggestion Types:** "Save More", "Budget Adjustment", "AI Insight"

**Example Document:**
```json
{
  "suggestion_id": "sug_303",
  "user_id": "user_123",
  "suggestion_type": "Budget Adjustment",
  "message": "You've spent 85% of your food budget. Consider reducing dining out this week.",
  "created_at": "2025-01-15T14:30:00.000Z",
  "status": "New"
}
```

## Firestore Security Rules

The database uses the following security rules to ensure data privacy:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /{collection}/{document} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
    }
  }
}
```

## Recommended Indexes

Create these composite indexes in the Firebase Console for optimal query performance:

1. **expenses**: `user_id` (Ascending) + `date` (Descending)
2. **expenses**: `user_id` (Ascending) + `category` (Ascending) + `date` (Descending)
3. **budgets**: `user_id` (Ascending) + `start_date` (Descending)
4. **transactions_history**: `user_id` (Ascending) + `transaction_date` (Descending)
5. **reminders**: `user_id` (Ascending) + `reminder_date` (Ascending)
6. **smart_suggestions**: `user_id` (Ascending) + `status` (Ascending) + `created_at` (Descending)

## Migration Guide

If migrating from the previous structure, use the migration utilities provided in `databaseInit.ts`.

## API Usage Examples

### Adding an Expense
```typescript
import { addExpense } from './services/databaseService';

const expense = await addExpense({
  amount: 50.00,
  category: 'Transportation',
  description: 'Bus fare to downtown',
  payment_method: 'Cash',
  date: '2025-01-15',
  source: 'Manual'
});
```

### Getting User Expenses
```typescript
import { getExpensesByUser } from './services/databaseService';

const unsubscribe = getExpensesByUser(userId, (expenses) => {
  console.log('User expenses:', expenses);
});
```

### Creating a Budget
```typescript
import { addBudget } from './services/databaseService';

const budget = await addBudget({
  category: 'Food & Dining',
  amount_limit: 1000,
  start_date: '2025-01-01',
  end_date: '2025-01-31'
});
```

## Data Relationships

- All collections reference `users` via `user_id`
- `budgets.category` should match categories used in `expenses`
- `transactions_history` tracks both income (Credit) and expenses (Debit)
- `smart_suggestions` are generated based on spending patterns from other collections

## Backup and Recovery

- Enable automatic backups in Firebase Console
- Export data regularly using Firebase Admin SDK
- Implement data validation rules to prevent corruption
