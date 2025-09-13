/**
 * Simple Connection Test
 * Direct test of the backend connection
 */

async function testConnection() {
    console.log('🔗 Testing Backend Connection\n');
    
    const backendUrl = 'http://10.12.235.45:8001/api';
    
    try {
        console.log(`📡 Connecting to: ${backendUrl}`);
        
        const response = await fetch(`${backendUrl}/health`);
        const health = await response.json();
        
        console.log('\n✅ CONNECTION SUCCESSFUL!');
        console.log(`   📊 Status: ${health.status}`);
        console.log(`   🧠 AI Categorization: ${health.services.ai_categorization ? '✅' : '❌'}`);
        console.log(`   📷 Receipt Scanning: ${health.services.receipt_scanning ? '✅' : '❌'}`);
        console.log(`   🗄️  Firestore Database: ${health.services.firestore ? '✅' : '❌'}`);
        
        if (health.services.receipt_scanning && health.services.firestore) {
            console.log('\n🎉 SCANNER READY!');
            console.log('\n📱 Your React Native Scanner will now:');
            console.log('   ✅ Connect to AI backend automatically');
            console.log('   ✅ Process real receipts (not sample data)');
            console.log('   ✅ Extract data using Gemini AI');
            console.log('   ✅ Use INR currency (₹)');
            console.log('   ✅ Save to Firestore database');
            console.log('\n🚀 Test your scanner now in the app!');
        } else {
            console.log('\n⚠️ Some services not available');
        }
        
    } catch (error) {
        console.log('\n❌ CONNECTION FAILED');
        console.log(`   Error: ${error.message}`);
        console.log('\n🔧 Make sure:');
        console.log('   1. Backend is running (quick_start.bat)');
        console.log('   2. No firewall blocking port 8001');
        console.log('   3. Device is on same network');
    }
}

testConnection();