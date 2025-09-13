/**
 * Test Scanner Backend Connection
 * Verifies that the ScannerDialog can properly connect to the backend
 */

const baseUrl = 'http://localhost:8001/api';

async function testScannerConnection() {
    console.log('📱 Testing Scanner Backend Connection...\n');
    
    try {
        // Test health check (same as ScannerDialog does)
        console.log('1. Testing Health Check (as ScannerDialog does)...');
        const response = await fetch(`${baseUrl}/health`);
        const healthData = await response.json();
        
        if (healthData.status === 'healthy') {
            console.log('✅ Health check passed');
            console.log(`   📷 Receipt Scanning Available: ${healthData.services.receipt_scanning ? '✅' : '❌'}`);
            console.log(`   🗄️  Firestore Available: ${healthData.services.firestore ? '✅' : '❌'}`);
            
            if (healthData.services.receipt_scanning && healthData.services.firestore) {
                console.log('\n✅ All services required by ScannerDialog are available!');
                console.log('\n🎯 Your ScannerDialog will now:');
                console.log('   1. Connect to the backend at http://localhost:8001');
                console.log('   2. Process receipts using Gemini AI');
                console.log('   3. Use INR currency for Indian context');
                console.log('   4. Save expenses to Firestore database');
                console.log('   5. Return structured data to your app');
                
                console.log('\n💡 If you still see sample data:');
                console.log('   - Make sure your backend is running (quick_start.bat)');
                console.log('   - Check that your app is pointing to http://localhost:8001');
                console.log('   - Verify your device/emulator can reach localhost');
                
            } else {
                console.log('\n⚠️ Some services are not available');
                console.log('   Scanner will use sample data as fallback');
            }
        } else {
            console.log('❌ Health check failed - Scanner will use sample data');
        }
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\n🔧 Backend connection failed. Scanner will use sample data.');
        console.log('   Make sure to run: quick_start.bat in the Backend folder');
    }
}

testScannerConnection();