# Firebase Firestore Index Creation Guide

## Missing Index Error Fix

If you see the error:
```
The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/finze-d5d1c/firestore/indexes?create_composite=...
```

### Quick Fix Steps:

1. **Visit Firebase Console**: https://console.firebase.google.com/project/finze-d5d1c/firestore/indexes

2. **Create Required Index**:
   - Collection Group: `expenses`
   - Fields to index:
     - `user_id` (Ascending)
     - `created_at` (Descending)
     - `__name__` (Descending)

3. **Alternative Method** - Click the direct link provided in the error message, it will auto-create the index.

### Manual Index Creation via Firebase CLI:

If you have Firebase CLI installed:

```bash
firebase deploy --only firestore:indexes
```

### Index Configuration (firestore.indexes.json):

```json
{
  "indexes": [
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "user_id",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "created_at",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

### Common Required Indexes:

1. **User Expenses Query**:
   - Collection: `expenses`
   - Fields: `user_id` (ASC), `created_at` (DESC)

2. **Category Expenses Query**:
   - Collection: `expenses` 
   - Fields: `user_id` (ASC), `category` (ASC), `created_at` (DESC)

3. **Date Range Queries**:
   - Collection: `expenses`
   - Fields: `user_id` (ASC), `date` (ASC), `created_at` (DESC)

### Note:
- Index creation can take a few minutes to complete
- The app will work normally once indexes are created
- Composite indexes are required for queries with multiple filters and ordering

### Current Status:
The backend query is trying to filter by `user_id` and order by `created_at`, which requires a composite index.