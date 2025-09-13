/**
 * Test Network IP Connection
 * Tests if the app can connect to the backend using the network IP address
 */

const baseUrl = 'http://10.12.70.202:8001/api';

async function testNetworkConnection() {
    console.log('🌐 Testing Network IP Connection...\n');
    
    try {
        console.log(`📡 Connecting to: ${baseUrl}`);
        console.log('⏰ Testing connection (timeout: 10s)...\n');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${baseUrl}/health`, {
            method: 'GET',
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const healthData = await response.json();
            console.log('✅ SUCCESS! Network connection working!');
            console.log(`   🎯 Backend Status: ${healthData.status}`);
            console.log(`   📱 Your React Native app can now connect!`);
            console.log(`   🔗 Connected to: http://10.195.3.108:8001`);
            console.log('\n🚀 Services Available:');
            console.log(`   🧠 AI Categorization: ${healthData.services.ai_categorization ? '✅' : '❌'}`);
            console.log(`   📷 Receipt Scanning: ${healthData.services.receipt_scanning ? '✅' : '❌'}`);
            console.log(`   🗄️  Firestore Database: ${healthData.services.firestore ? '✅' : '❌'}`);
            
            if (healthData.services.receipt_scanning && healthData.services.firestore) {
                console.log('\n🎉 Perfect! Your scanner will now use REAL AI processing instead of sample data!');
            }
        } else {
            console.log(`❌ Connection failed with status: ${response.status}`);
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('❌ Connection timed out');
            console.log('   📱 If you\'re using an emulator, try:');
            console.log('   - Android Emulator: Use 10.0.2.2:8001');
            console.log('   - iOS Simulator: Use localhost:8001');
            console.log('   - Physical Device: Use network IP (current: 10.195.3.108:8001)');
        } else {
            console.log('❌ Connection error:', error.message);
            console.log('\n🔧 Troubleshooting:');
            console.log('   1. Make sure backend is running (quick_start.bat)');
            console.log('   2. Check if firewall is blocking port 8001');
            console.log('   3. Verify your device is on the same network');
            console.log('   4. Try accessing http://10.195.3.108:8001/api/health in browser');
        }
    }
}

testNetworkConnection();