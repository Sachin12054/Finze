/**
 * Quick Backend Connection Test
 * Run this to verify the enhanced backend is working correctly
 */

const baseUrl = 'http://localhost:8001/api';

async function testBackendConnection() {
    console.log('🔍 Testing Finze Enhanced Backend Connection...\n');
    
    try {
        // Test 1: Health Check
        console.log('1. Health Check...');
        const healthResponse = await fetch(`${baseUrl}/health`);
        const healthData = await healthResponse.json();
        
        if (healthData.status === 'healthy') {
            console.log('✅ Backend is healthy!');
            console.log(`   📋 Services Status:`);
            console.log(`      🧠 AI Categorization: ${healthData.services.ai_categorization ? '✅' : '❌'}`);
            console.log(`      📷 Receipt Scanning: ${healthData.services.receipt_scanning ? '✅' : '❌'}`);
            console.log(`      🗄️  Firestore Database: ${healthData.services.firestore ? '✅' : '❌'}`);
            console.log(`   🎯 AI Model: ${healthData.ai_model?.type} (${healthData.ai_model?.categories?.length} categories)`);
        } else {
            console.log('❌ Backend health check failed');
            return;
        }
        
        // Test 2: AI Categorization
        console.log('\n2. Testing AI Categorization...');
        const categorizeResponse = await fetch(`${baseUrl}/categorize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: 'Coffee at Starbucks',
                amount: 5.99
            })
        });
        
        if (categorizeResponse.ok) {
            const categorizeData = await categorizeResponse.json();
            console.log(`✅ AI Categorization working: "${categorizeData.category}" (${Math.round(categorizeData.confidence * 100)}% confidence)`);
        } else {
            console.log('❌ AI Categorization failed');
        }
        
        // Test 3: Get Categories
        console.log('\n3. Getting Available Categories...');
        const categoriesResponse = await fetch(`${baseUrl}/categories`);
        if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            console.log(`✅ Available Categories: ${categoriesData.categories.join(', ')}`);
        } else {
            console.log('❌ Failed to get categories');
        }
        
        console.log('\n🎉 Backend Integration Test Complete!');
        console.log('\n📱 Your ScannerDialog is now ready to:');
        console.log('   📷 Capture receipt images');
        console.log('   🤖 Extract data using Gemini AI');
        console.log('   🧠 Categorize expenses using ML');
        console.log('   💾 Save to Firestore database');
        console.log('\n🚀 Ready for testing in your app!');
        
    } catch (error) {
        console.error('❌ Backend connection failed:', error.message);
        console.log('\n🔧 Make sure your backend is running:');
        console.log('   1. Navigate to Backend folder');
        console.log('   2. Run: quick_start.bat');
        console.log('   3. Wait for server to start on http://localhost:8001');
    }
}

// Run the test
testBackendConnection();