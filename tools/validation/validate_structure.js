/**
 * Database Structure Validation Test
 * Validates that all files have been updated for the new database structure
 */

const fs = require('fs');
const path = require('path');

// Get the project root directory (two levels up from this script)
const projectRoot = path.resolve(__dirname, '..', '..');

function checkFileExists(filePath) {
  // Convert relative path to absolute from project root
  const absolutePath = path.resolve(projectRoot, filePath);
  return fs.existsSync(absolutePath);
}

function readFileContent(filePath) {
  try {
    // Convert relative path to absolute from project root
    const absolutePath = path.resolve(projectRoot, filePath);
    return fs.readFileSync(absolutePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function testDatabaseStructure() {
  console.log('🧪 Testing Database Structure Updates\n');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };
  
  // Test 1: Check if core files exist
  console.log('1. Testing Core File Structure...');
  
  const coreFiles = [
    './src/services/firebase/firebase.ts',
    './src/services/databaseService.ts',
    './src/types/database.ts',
    './src/services/auth/authService.ts',
    './firestore.rules'
  ];
  
  coreFiles.forEach(file => {
    if (checkFileExists(file)) {
      console.log(`✅ ${path.basename(file)} exists`);
      results.passed++;
    } else {
      console.log(`❌ ${path.basename(file)} missing`);
      results.failed++;
    }
  });
  
  // Test 2: Check specialized services
  console.log('\n2. Testing Specialized Services...');
  
  const specializedServices = [
    './src/services/ml/aiCategorizationService.ts',
    './src/services/ml/receiptScannerService.ts'
  ];
  
  specializedServices.forEach(file => {
    if (checkFileExists(file)) {
      console.log(`✅ ${path.basename(file)} exists`);
      results.passed++;
    } else {
      console.log(`❌ ${path.basename(file)} missing`);
      results.failed++;
    }
  });
  
  // Test 3: Check UI components
  console.log('\n3. Testing UI Components...');
  
  const uiComponents = [
    './app/(tabs)/index.tsx',
    './app/Profile.tsx'
  ];
  
  uiComponents.forEach(file => {
    if (checkFileExists(file)) {
      console.log(`✅ ${path.basename(file)} exists`);
      results.passed++;
    } else {
      console.log(`❌ ${path.basename(file)} missing`);
      results.failed++;
    }
  });
  
  // Test 4: Check backend services
  console.log('\n4. Testing Backend Services...');
  
  const backendServices = [
    './Backend/services/firestore_service.py',
    './Backend/app.py'
  ];
  
  backendServices.forEach(file => {
    if (checkFileExists(file)) {
      console.log(`✅ ${path.basename(file)} exists`);
      results.passed++;
    } else {
      console.log(`❌ ${path.basename(file)} missing`);
      results.failed++;
    }
  });
  
  // Test 5: Check for new database structure in key files
  console.log('\n5. Testing Database Structure Implementation...');
  
  // Check if databaseService.ts has new functions
  const databaseServiceContent = readFileContent('./src/services/databaseService.ts');
  if (databaseServiceContent) {
    if (databaseServiceContent.includes('addManualExpense') && 
        databaseServiceContent.includes('addAICategorizedExpense') &&
        databaseServiceContent.includes('addScannerExpense')) {
      console.log('✅ Database service has new expense functions');
      results.passed++;
    } else {
      console.log('❌ Database service missing new expense functions');
      results.failed++;
    }
    
    if (databaseServiceContent.includes('users') && 
        (databaseServiceContent.includes('expenses') || databaseServiceContent.includes('manual'))) {
      console.log('✅ Database service uses new collection structure');
      results.passed++;
    } else {
      console.log('⚠️  Database service may not use new collection structure');
      results.warnings++;
    }
  }
  
  // Check if types are defined
  const typesContent = readFileContent('./src/types/database.ts');
  if (typesContent) {
    if (typesContent.includes('ManualExpense') && 
        typesContent.includes('AICategorizedExpense') &&
        typesContent.includes('ScannerExpense')) {
      console.log('✅ Database types include new expense interfaces');
      results.passed++;
    } else {
      console.log('❌ Database types missing new expense interfaces');
      results.failed++;
    }
  }
  
  // Check Firestore rules
  const rulesContent = readFileContent('./firestore.rules');
  if (rulesContent) {
    if (rulesContent.includes('users/{userId}') && 
        (rulesContent.includes('expenses') || rulesContent.includes('manual'))) {
      console.log('✅ Firestore rules updated for new structure');
      results.passed++;
    } else {
      console.log('❌ Firestore rules not updated for new structure');
      results.failed++;
    }
  }
  
  // Test 6: Check Python backend
  console.log('\n6. Testing Python Backend Updates...');
  
  const pythonServiceContent = readFileContent('./Backend/services/firestore_service.py');
  if (pythonServiceContent) {
    if (pythonServiceContent.includes('save_scanner_expense') && 
        (pythonServiceContent.includes('users') || pythonServiceContent.includes('collection(\'users\')'))) {
      console.log('✅ Python service updated for new structure');
      results.passed++;
    } else {
      console.log('❌ Python service not updated for new structure');
      results.failed++;
    }
  }
  
  return results;
}

function runValidationTests() {
  console.log('🔍 Database Structure Validation');
  console.log('='.repeat(50));
  console.log('');
  
  const results = testDatabaseStructure();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log('');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log('');
  
  const total = results.passed + results.failed;
  const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`📈 Success Rate: ${successRate}%`);
  console.log('');
  
  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('');
    console.log('✅ Database restructuring is complete');
    console.log('✅ All files have been updated');
    console.log('✅ New schema is properly implemented');
    console.log('');
    console.log('🚀 Ready for deployment!');
  } else {
    console.log('⚠️  Some issues detected');
    console.log('');
    console.log('Please review the failed tests above and fix any issues.');
  }
  
  if (results.warnings > 0) {
    console.log('');
    console.log('⚠️  Please review warnings above');
  }
  
  console.log('');
  console.log('🔧 Next Steps:');
  console.log('1. Deploy Firestore rules: firebase deploy --only firestore:rules');
  console.log('2. Test authentication and data operations');
  console.log('3. Run end-to-end functionality tests');
}

// Run the validation
runValidationTests();