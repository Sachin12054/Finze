/**
 * Receipt Scanner Test
 * Test the receipt scanner API endpoint directly
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const BACKEND_URL = 'http://10.12.228.72:8001/api';

async function testReceiptScanner() {
    console.log('🧾 Testing Receipt Scanner API...');
    console.log(`🔗 Backend URL: ${BACKEND_URL}`);
    
    try {
        // Test 1: Health check
        console.log('\n📋 Step 1: Testing backend health...');
        const healthResponse = await fetch(`${BACKEND_URL}/health`);
        const healthData = await healthResponse.json();
        
        if (healthData.services && healthData.services.receipt_scanning) {
            console.log('✅ Receipt scanning service is available');
        } else {
            console.log('❌ Receipt scanning service is not available');
            return;
        }
        
        // Test 2: Create a simple test image (base64 encoded 1x1 pixel PNG)
        console.log('\n📷 Step 2: Creating test image...');
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFBIQMB7wAAAABJRU5ErkJggg==';
        const imageBuffer = Buffer.from(testImageBase64, 'base64');
        
        // Test 3: Upload test image with 'image' field
        console.log('\n🚀 Step 3: Testing receipt upload with "image" field...');
        const formData = new FormData();
        
        // Use a proper file-like object
        const imageBlob = {
            filename: 'test-receipt.png',
            contentType: 'image/png',
            knownLength: imageBuffer.length
        };
        
        formData.append('image', imageBuffer, imageBlob);
        formData.append('user_id', 'test-user-123');
        
        console.log('📋 FormData headers:', formData.getHeaders());
        
        const uploadResponse = await fetch(`${BACKEND_URL}/upload-receipt`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });
        
        console.log(`📥 Upload response status: ${uploadResponse.status}`);
        
        if (uploadResponse.ok) {
            const result = await uploadResponse.json();
            console.log('✅ Receipt upload with "image" field successful!');
            console.log('📋 Response:', JSON.stringify(result, null, 2));
            
            if (result.status === 'success') {
                console.log(`🏪 Merchant: ${result.data?.merchant_name || 'Unknown'}`);
                console.log(`💰 Amount: ₹${result.data?.total_amount || 0}`);
                console.log(`📂 Category: ${result.data?.category || 'Other'}`);
            }
        } else {
            const errorText = await uploadResponse.text();
            console.log('❌ Receipt upload with "image" field failed');
            console.log(`📋 Error response: ${errorText}`);
            
            try {
                const errorJson = JSON.parse(errorText);
                console.log(`❌ Error: ${errorJson.error}`);
            } catch (e) {
                console.log(`❌ Raw error: ${errorText}`);
            }
        }
        
        // Test 4: Test with different field name (for compatibility)
        console.log('\n🔄 Step 4: Testing with "file" field name...');
        const formData2 = new FormData();
        formData2.append('file', imageBuffer, {
            filename: 'test-receipt2.png',
            contentType: 'image/png'
        });
        formData2.append('user_id', 'test-user-456');
        
        const uploadResponse2 = await fetch(`${BACKEND_URL}/upload-receipt`, {
            method: 'POST',
            body: formData2,
            headers: formData2.getHeaders()
        });
        
        console.log(`📥 Second upload response status: ${uploadResponse2.status}`);
        
        if (uploadResponse2.ok) {
            console.log('✅ Receipt upload with "file" field successful!');
        } else {
            console.log('❌ Receipt upload with "file" field failed');
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

async function testAIInsights() {
    console.log('\n\n💡 Testing AI Insights API...');
    
    try {
        const testUserId = 'h30MlWtPyaT35EcKKpbGTtLrmg03'; // Real user ID from logs
        
        console.log(`👤 Testing insights for user: ${testUserId}`);
        
        const insightsResponse = await fetch(`${BACKEND_URL}/ai-insights/${testUserId}?period=month&limit=50`);
        console.log(`📥 Insights response status: ${insightsResponse.status}`);
        
        if (insightsResponse.ok) {
            const result = await insightsResponse.json();
            console.log('✅ AI Insights successful!');
            
            if (result.data) {
                const data = result.data;
                console.log(`📊 Expenses analyzed: ${result.expenses_analyzed || 0}`);
                console.log(`💰 Total spending: ₹${data.financial_health?.total_spending || 0}`);
                console.log(`📈 Health score: ${data.financial_health?.health_score || 0}/100`);
                console.log(`🔍 Insights count: ${data.spending_insights?.length || 0}`);
                console.log(`💡 Suggestions count: ${data.smart_suggestions?.length || 0}`);
                
                if (data.spending_insights && data.spending_insights.length > 0) {
                    console.log('\n📋 Sample insights:');
                    data.spending_insights.slice(0, 2).forEach((insight, index) => {
                        console.log(`   ${index + 1}. ${insight.title}: ${insight.description}`);
                    });
                }
            }
        } else {
            const errorText = await insightsResponse.text();
            console.log('❌ AI Insights failed');
            console.log(`📋 Error: ${errorText}`);
        }
        
    } catch (error) {
        console.error('💥 AI Insights test failed:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 FINZE BACKEND API TESTS');
    console.log('=' * 50);
    
    await testReceiptScanner();
    await testAIInsights();
    
    console.log('\n' + '=' * 50);
    console.log('📋 TESTS COMPLETED');
    console.log('✨ Check the results above for any issues');
    console.log('\n💡 Next steps:');
    console.log('   1. If receipt scanner works, test with actual images');
    console.log('   2. If AI insights work, test with real user data');
    console.log('   3. Deploy Firestore indexes for better performance');
}

runAllTests().catch(console.error);