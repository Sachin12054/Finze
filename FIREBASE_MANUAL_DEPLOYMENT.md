# 🔥 URGENT: Fix Profile Permissions - Manual Firebase Rules Deployment

## Problem
You're getting: `ERROR  Error fetching profile: [FirebaseError: Missing or insufficient permissions.]`

## Quick Fix - Manual Deployment

Since Firebase CLI is having issues, deploy the rules manually through Firebase Console:

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project: `finze-d5d1c`

### Step 2: Deploy Rules
1. In the left sidebar, click **Firestore Database**
2. Click on the **Rules** tab
3. **Replace ALL the content** with the rules from your `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // General expenses subcollection (main expenses collection)
      match /expenses/{expenseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Transactions subcollection (main collection for all transactions)
      match /transactions/{transactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Budget subcollection
      match /budget/{budgetId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Budgets subcollection (alternative naming)
      match /budgets/{budgetId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Recurrence subcollection
      match /recurrence/{recurrenceId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Set goal subcollection
      match /setgoal/{goalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Smart suggestions subcollection
      match /smart_suggestions/{suggestionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Transaction history subcollection
      match /transaction_history/{transactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // AI insights subcollection
      match /ai_insights/{insightId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Manual expenses subcollection
      match /expenses/manual/{expenseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // AI categorized expenses subcollection
      match /expenses/ai_categorise/{expenseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Scanner expenses subcollection
      match /expenses/scanner/{expenseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Scanner expenses subcollection (direct path)
      match /scanner_expenses/{expenseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Legacy collections for backwards compatibility
    match /expenses/{document} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.user_id == request.auth.uid);
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    match /budgets/{document} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.user_id == request.auth.uid);
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    match /transactions_history/{document} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.user_id == request.auth.uid);
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    match /smart_suggestions/{document} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.user_id == request.auth.uid);
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    match /user_summaries/{document} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.user_id == request.auth.uid);
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
    }
  }
}
```

4. Click **Publish** button
5. Confirm the deployment

### Step 3: Test
1. Restart your Expo app
2. The profile error should be resolved

## What This Fixes
- ✅ Profile fetching permissions
- ✅ User data access
- ✅ Scanner expenses access
- ✅ All subcollection permissions

## If It Still Doesn't Work
Try logging out and logging back into your app to refresh the authentication token.