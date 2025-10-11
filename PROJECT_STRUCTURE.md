# Finze - Project Structure

## Overview
This document describes the organized structure of the Finze expense tracking application.

## Directory Structure

```
Finze/
├── app/                              # Expo Router app directory (routing)
│   ├── (tabs)/                       # Tab-based navigation screens
│   │   ├── index.tsx                 # Home/Dashboard tab
│   │   ├── explore.tsx               # Explore/Analytics tab
│   │   └── _layout.tsx               # Tabs layout configuration
│   ├── auth/                         # Authentication screens
│   │   ├── welcome.tsx               # Welcome screen
│   │   ├── login.tsx                 # Login screen
│   │   ├── signup.tsx                # Signup screen
│   │   ├── forgot-password.tsx       # Password recovery
│   │   ├── verification.tsx          # Email/phone verification
│   │   └── new-password.tsx          # New password setup
│   ├── index.tsx                     # App entry point
│   ├── Profile.tsx                   # User profile screen
│   ├── _layout.tsx                   # Root layout
│   └── +not-found.tsx                # 404 page
│
├── src/                              # Main source code
│   ├── components/                   # Reusable UI components
│   │   ├── tabs/                     # Tab-specific components
│   │   │   ├── BudgetTab.tsx
│   │   │   ├── RecurringTab.tsx
│   │   │   └── SavingsTab.tsx
│   │   ├── ui/                       # Generic UI components
│   │   ├── AddExpenseDialog.tsx
│   │   ├── AddBudgetDialog.tsx
│   │   ├── ScannerDialog.tsx
│   │   ├── ProfileDialog.tsx
│   │   └── ... (other dialogs/components)
│   │
│   ├── services/                     # Business logic services
│   │   ├── firebase/                 # Firebase-related services
│   │   │   ├── firebase.ts           # Firebase initialization & config
│   │   │   ├── enhancedFirebaseService.ts  # Main Firebase service
│   │   │   └── firebaseStatus.ts     # Firebase connection status
│   │   ├── auth/                     # Authentication services
│   │   │   ├── authService.ts        # Core auth logic
│   │   │   ├── socialAuthService.ts  # Social auth (Google, Facebook)
│   │   │   ├── expoGoSocialAuthService.ts  # Expo Go social auth
│   │   │   └── auth-config.ts        # Auth configuration
│   │   ├── api/                      # API services
│   │   │   └── api.ts                # API client
│   │   ├── ml/                       # Machine learning services
│   │   │   ├── aiCategorizationService.ts  # AI expense categorization
│   │   │   └── receiptScannerService.ts    # Receipt scanning OCR
│   │   ├── databaseService.ts        # Database operations
│   │   ├── calendarService.ts        # Calendar functionality
│   │   ├── notificationService.ts    # Push notifications
│   │   ├── imageUploadService.ts     # Image upload/storage
│   │   ├── legacyAdapterService.ts   # Legacy data adapter
│   │   └── debugStorage.ts           # Debug utilities
│   │
│   ├── config/                       # Configuration files
│   │   ├── firebase.ts               # Firebase config
│   │   ├── backendConfig.ts          # Backend API config
│   │   └── backendConfig.js          # Backend config (JS version)
│   │
│   ├── types/                        # TypeScript type definitions
│   │   ├── database.ts               # Database types
│   │   └── react-native-picker.d.ts  # Third-party type definitions
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useColorScheme.ts
│   │   ├── useColorScheme.web.ts
│   │   └── useThemeColor.ts
│   │
│   ├── contexts/                     # React contexts
│   │   └── ThemeContext.tsx          # Theme management
│   │
│   ├── screens/                      # Screen components (if any)
│   │
│   └── utils/                        # Utility functions
│
├── Backend/                          # Python backend
│   ├── services/                     # Backend services
│   │   ├── firestore_service.py      # Firestore operations
│   │   ├── receipt_extractor.py      # Receipt text extraction
│   │   └── old_firestore_service.py  # Legacy service
│   ├── ml_model/                     # Machine learning models
│   │   ├── perfect_categorizer.py
│   │   ├── transformer_categorizer.py
│   │   └── ultra_perfect_categorizer.py
│   ├── training_data/                # ML training datasets
│   ├── models/                       # Trained ML models
│   ├── app.py                        # Main Flask/FastAPI app
│   ├── receipt_scanner_api.py        # Receipt scanning API
│   ├── requirements.txt              # Python dependencies
│   ├── Procfile                      # Deployment config
│   ├── Start_Backend.bat             # Windows start script
│   └── Start_Backend_New.bat         # New backend start script
│
├── tools/                            # Development and validation tools
│   ├── validation/                   # Validation scripts
│   │   ├── validate_structure.js     # Database structure validator
│   │   ├── validate_calendar.js      # Calendar validation
│   │   ├── validate-final.js         # Final validation checks
│   │   └── validate.js               # General validation
│   ├── debug/                        # Debug scripts
│   │   ├── debug-firebase.js         # Firebase connection test
│   │   └── debug_calendar.js         # Calendar debug script
│   └── deployment/                   # Deployment scripts
│       └── deploy-firebase-rules.bat # Deploy Firestore rules
│
├── config/                           # Root-level configuration (organized)
│   ├── firebase/                     # Firebase configuration files
│   │   ├── firebase.json             # Firebase project config
│   │   ├── firestore.rules           # Firestore security rules
│   │   ├── storage.rules             # Storage security rules
│   │   └── .firebaserc               # Firebase project aliases
│   └── build/                        # Build configuration
│       ├── babel.config.js           # Babel transpiler config
│       ├── metro.config.js           # Metro bundler config
│       └── eslint.config.js          # ESLint linting config
│
├── assets/                           # Static assets
│   ├── images/                       # Image files
│   └── fonts/                        # Font files
│
├── scripts/                          # Build and utility scripts
│   └── reset-project.js              # Project reset script
│
├── android/                          # Android native code
├── constants/                        # App constants
├── components/                       # Global shared components
├── hooks/                            # Global shared hooks
├── types/                            # Global type definitions
│
├── package.json                      # NPM dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
├── app.json                          # Expo configuration
├── eas.json                          # EAS Build configuration
├── .gitignore                        # Git ignore rules
├── .env                              # Environment variables (local)
├── .env.example                      # Environment variables template
└── PROJECT_STRUCTURE.md              # This file

## Key Files

### Configuration Files (Root Level - Required by Tools)
- `babel.config.js` - Babel transpiler configuration (required at root)
- `metro.config.js` - Metro bundler configuration (required at root)
- `eslint.config.js` - ESLint linting configuration (required at root)
- `firebase.json` - Firebase CLI configuration (required at root)
- `firestore.rules` - Firestore security rules (required at root)
- `storage.rules` - Storage security rules (required at root)
- `.firebaserc` - Firebase project configuration (required at root)
- `tsconfig.json` - TypeScript compiler configuration
- `package.json` - NPM dependencies and scripts

**Note:** Build and Firebase config files are kept at root level as required by their respective tools, but organized copies are maintained in `config/` directory for reference.

### Main Application Files
- `app/index.tsx` - Application entry point
- `app/_layout.tsx` - Root layout with authentication check
- `src/services/firebase/firebase.ts` - Firebase initialization
- `src/services/firebase/enhancedFirebaseService.ts` - Main data service

## Import Path Examples

### Importing Firebase Services
```typescript
// From app directory
import { auth } from '../src/services/firebase/firebase';
import { EnhancedFirebaseService } from '../src/services/firebase/enhancedFirebaseService';

// From src/components directory
import { auth } from '../services/firebase/firebase';
import { EnhancedFirebaseService } from '../services/firebase/enhancedFirebaseService';
```

### Importing Auth Services
```typescript
// From app/auth directory
import AuthService from '../../src/services/auth/authService';
import SocialAuthService from '../../src/services/auth/socialAuthService';
```

### Importing ML Services
```typescript
// From src/components directory
import { aiCategorizationService } from '../services/ml/aiCategorizationService';
import { receiptScannerService } from '../services/ml/receiptScannerService';
```

## NPM Scripts

```bash
# Development
npm start                 # Start Expo development server
npm run android          # Run on Android device/emulator
npm run ios              # Run on iOS device/simulator
npm run web              # Run web version

# Code Quality
npm run lint             # Run ESLint

# Validation & Testing
npm run validate         # Validate database structure
npm run validate-calendar # Validate calendar functionality
npm run validate-final   # Run final validation checks

# Debugging
npm run debug-firebase   # Test Firebase connection
npm run debug-calendar   # Debug calendar functionality

# Deployment
npm run deploy-firebase  # Deploy Firebase rules
npm run reset-project    # Reset project to initial state
```

## Backend Services

The Python backend is located in the `Backend/` directory and provides:
- Receipt scanning and OCR
- AI-powered expense categorization
- Firestore data operations
- ML model training and inference

Start the backend:
```bash
# Windows
cd Backend
Start_Backend_New.bat

# Unix/Linux/Mac
cd Backend
python app.py
```

## Development Guidelines

1. **Service Organization**: Keep related services together in their respective directories
2. **Import Paths**: Use relative imports within the same service category
3. **Type Definitions**: Define types in `src/types/` for shared types
4. **Components**: Place reusable UI components in `src/components/`
5. **Screens**: Use `app/` directory for routing and screen components (Expo Router convention)
6. **Configuration**: Store configuration in `src/config/` for application config
7. **Tools**: Place development tools in `tools/` directory

## Testing

Before deployment, run all validation scripts:
```bash
npm run validate
npm run validate-calendar
npm run validate-final
npm run debug-firebase
```

## Deployment

1. Update Firebase rules: `npm run deploy-firebase`
2. Build for production: `eas build --platform all`
3. Deploy backend to your hosting service

## Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_project_id
BACKEND_API_URL=your_backend_url
```

## Notes

- This project uses Expo Router for navigation
- Firebase is the primary backend service
- Python backend handles ML operations and receipt scanning
- All sensitive configuration should be in `.env` file (not committed to git)
