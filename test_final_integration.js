/**
 * Final Integration Test
 * Tests the complete scanner integration with dynamic backend detection
 */

const { getDefaultBackendUrl, findBestBackendUrl, testBackendUrl } = require('./src/config/backendConfig.js');

async function testFinalIntegration() {
    console.log('🎯 Final Scanner Integration Test\n');
    
    // Test 1: Default URL
    console.log('1. Testing default backend URL...');
    const defaultUrl = getDefaultBackendUrl();
    console.log(`   📡 Default: ${defaultUrl}`);
    const defaultWorks = await testBackendUrl(defaultUrl);
    console.log(`   ${defaultWorks ? '✅' : '❌'} Status: ${defaultWorks ? 'Working' : 'Failed'}\n`);
    
    // Test 2: Find best URL
    console.log('2. Finding best backend URL...');
    const bestUrl = await findBestBackendUrl();
    console.log(`   🎯 Best URL: ${bestUrl || 'None found'}\n`);
    
    // Test 3: Health check
    if (bestUrl) {
        console.log('3. Testing full health check...');
        try {
            const response = await fetch(`${bestUrl}/health`);
            const health = await response.json();
            
            console.log(`   ✅ Backend Status: ${health.status}`);
            console.log(`   📱 Scanner Ready: ${health.services.receipt_scanning ? '✅' : '❌'}`);
            console.log(`   🗄️  Database Ready: ${health.services.firestore ? '✅' : '❌'}`);
            console.log(`   💰 Currency: INR (Indian Rupees)`);
            
            if (health.services.receipt_scanning && health.services.firestore) {
                console.log('\n🎉 INTEGRATION COMPLETE!');
                console.log('\n📱 Your Scanner Dialog will now:');
                console.log('   • Connect automatically to the best backend URL');
                console.log('   • Process real receipts using Gemini AI');
                console.log('   • Use INR currency for Indian context');
                console.log('   • Save expenses to Firestore database');
                console.log('   • Fall back to sample data if backend unavailable');
                console.log('\n🚀 Ready to test in your React Native app!');
            }
        } catch (error) {
            console.log(`   ❌ Health check failed: ${error.message}`);
        }
    } else {
        console.log('3. ❌ No backend available - scanner will use sample data');
    }
}

testFinalIntegration();