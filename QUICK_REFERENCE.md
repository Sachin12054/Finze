# Quick Reference Guide - Finze Project Structure

## 🚀 Quick Start

```bash
# Development
npm start              # Start Expo development server
npm run android        # Run on Android
npm run ios            # Run on iOS

# Validation
npm run validate       # Validate database structure
npm run debug-firebase # Test Firebase connection

# Deployment
npm run deploy-firebase # Deploy Firebase rules
```

## 📂 Where to Find Things

| What You Need | Where It Is |
|--------------|-------------|
| 🔥 Firebase setup | `src/services/firebase/firebase.ts` |
| 🔐 Authentication | `src/services/auth/authService.ts` |
| 🤖 AI categorization | `src/services/ml/aiCategorizationService.ts` |
| 📸 Receipt scanning | `src/services/ml/receiptScannerService.ts` |
| 💾 Database operations | `src/services/databaseService.ts` |
| 🌐 API calls | `src/services/api/api.ts` |
| 📱 App screens | `app/` directory |
| 🧩 UI components | `src/components/` |
| ⚙️ Configuration | `src/config/` |
| 🔧 Validation tools | `tools/validation/` |
| 🐛 Debug tools | `tools/debug/` |
| 🚀 Deployment scripts | `tools/deployment/` |

## 📝 Common Import Patterns

### From App Directory
```typescript
// Firebase
import { auth } from '../src/services/firebase/firebase';
import { EnhancedFirebaseService } from '../src/services/firebase/enhancedFirebaseService';

// Auth
import AuthService from '../src/services/auth/authService';

// Database
import { databaseService } from '../src/services/databaseService';
```

### From Components Directory
```typescript
// Firebase
import { auth, db } from '../services/firebase/firebase';
import { EnhancedFirebaseService } from '../services/firebase/enhancedFirebaseService';

// ML Services
import { aiCategorizationService } from '../services/ml/aiCategorizationService';
import { receiptScannerService } from '../services/ml/receiptScannerService';
```

### Within Services
```typescript
// From auth service
import { auth } from '../firebase/firebase';
import { EnhancedFirebaseService } from '../firebase/enhancedFirebaseService';

// From ML service
import { auth } from '../firebase/firebase';
import { BACKEND_CONFIG } from '../../config/backendConfig';
```

## 🛠️ Adding New Features

### Adding a New Service

1. **Choose the right category:**
   - Firebase-related? → `src/services/firebase/`
   - Authentication? → `src/services/auth/`
   - ML/AI feature? → `src/services/ml/`
   - API integration? → `src/services/api/`
   - Other? → `src/services/`

2. **Create the service file:**
   ```typescript
   // Example: src/services/ml/newMLService.ts
   export class NewMLService {
     // Your service logic
   }
   ```

3. **Update imports in dependent files**

### Adding a New Screen

1. **Add to app directory:**
   ```typescript
   // app/new-screen.tsx
   export default function NewScreen() {
     return <View>...</View>;
   }
   ```

2. **Link in navigation (if needed)**

### Adding a New Component

1. **Add to components directory:**
   ```typescript
   // src/components/NewComponent.tsx
   export function NewComponent() {
     return <View>...</View>;
   }
   ```

2. **Import where needed:**
   ```typescript
   import { NewComponent } from '../components/NewComponent';
   ```

## 🔍 Troubleshooting

### Import Errors

**Problem:** `Cannot find module './firebase'`

**Solution:** Update import path:
```typescript
// Old (wrong)
import { auth } from './firebase';

// New (correct)
import { auth } from './firebase/firebase';
```

### Path Not Found

**Problem:** File not found after restructuring

**Solution:** Check new locations:
- Validation scripts → `tools/validation/`
- Debug scripts → `tools/debug/`
- Firebase services → `src/services/firebase/`
- Auth services → `src/services/auth/`
- ML services → `src/services/ml/`

### Build Errors

**Problem:** Config files not found

**Solution:** Config files are at root (required):
- `babel.config.js`
- `metro.config.js`
- `eslint.config.js`
- `firebase.json`
- `firestore.rules`

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `PROJECT_STRUCTURE.md` | Complete structure documentation |
| `RESTRUCTURING_SUMMARY.md` | Summary of changes made |
| `BEFORE_AFTER.md` | Visual comparison of old vs new |
| `QUICK_REFERENCE.md` | This file - quick lookups |

## 🧪 Testing

```bash
# Run validation
npm run validate

# Test Firebase connection
npm run debug-firebase

# Test calendar functionality
npm run debug-calendar

# Run all validations
npm run validate && npm run validate-calendar && npm run validate-final
```

## 🚀 Deployment Checklist

- [ ] Run all validation scripts
- [ ] Check for TypeScript errors
- [ ] Test authentication flow
- [ ] Test database operations
- [ ] Deploy Firebase rules: `npm run deploy-firebase`
- [ ] Build app: `eas build --platform all`
- [ ] Test on physical devices

## 📱 Environment Setup

1. **Copy environment template:**
   ```bash
   copy .env.example .env
   ```

2. **Fill in your credentials:**
   ```
   FIREBASE_API_KEY=your_key
   FIREBASE_AUTH_DOMAIN=your_domain
   FIREBASE_PROJECT_ID=your_project
   BACKEND_API_URL=your_backend_url
   ```

3. **Never commit `.env` to git!**

## 🎯 Best Practices

### DO ✅
- Import from organized service folders
- Keep related services together
- Use TypeScript types
- Document complex logic
- Run validation before committing

### DON'T ❌
- Import from old paths
- Mix service categories
- Hardcode configuration
- Skip validation tests
- Commit `.env` file

## 🆘 Need Help?

1. **Check documentation:** `PROJECT_STRUCTURE.md`
2. **Review changes:** `RESTRUCTURING_SUMMARY.md`
3. **Compare structure:** `BEFORE_AFTER.md`
4. **Run validation:** `npm run validate`
5. **Check errors:** Look at TypeScript errors in VS Code

## 📞 Quick Commands

```bash
# Start development
npm start

# Clean and reinstall
rm -rf node_modules && npm install

# Reset project
npm run reset-project

# Validate everything
npm run validate && npm run validate-calendar && npm run validate-final

# Deploy Firebase
npm run deploy-firebase

# Build for production
eas build --platform android
eas build --platform ios
eas build --platform all
```

---

**Last Updated:** October 2, 2025  
**Version:** 2.0 (Restructured)  
**Status:** ✅ Production Ready
