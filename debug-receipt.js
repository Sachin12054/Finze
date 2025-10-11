/**
 * Simple Receipt Upload Debug Test
 */

const FormData = require('form-data');
const fetch = require('node-fetch');

async function debugReceiptUpload() {
    const BACKEND_URL = 'http://10.12.228.72:8001/api';
    
    console.log('🔍 Debugging Receipt Upload Issue...');
    
    // Create test image
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFBIQMB7wAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    
    console.log(`📊 Image buffer size: ${imageBuffer.length} bytes`);
    
    // Test with 'image' field - Method 1
    console.log('\n🧪 Test 1: Using "image" field with basic options...');
    const formData1 = new FormData();
    formData1.append('image', imageBuffer, {
        filename: 'test.png',
        contentType: 'image/png'
    });
    formData1.append('user_id', 'debug-test');
    
    try {
        const response1 = await fetch(`${BACKEND_URL}/upload-receipt`, {
            method: 'POST',
            body: formData1,
            headers: formData1.getHeaders()
        });
        
        const result1 = await response1.text();
        console.log(`📥 Status: ${response1.status}`);
        console.log(`📋 Response: ${result1}`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
    
    // Test with 'file' field - Method 2
    console.log('\n🧪 Test 2: Using "file" field...');
    const formData2 = new FormData();
    formData2.append('file', imageBuffer, {
        filename: 'test.png',
        contentType: 'image/png'
    });
    formData2.append('user_id', 'debug-test');
    
    try {
        const response2 = await fetch(`${BACKEND_URL}/upload-receipt`, {
            method: 'POST',
            body: formData2,
            headers: formData2.getHeaders()
        });
        
        const result2 = await response2.text();
        console.log(`📥 Status: ${response2.status}`);
        console.log(`📋 Response: ${result2}`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
    
    // Test direct AI insights
    console.log('\n💡 Testing AI Insights structure...');
    try {
        const insightsResponse = await fetch(`${BACKEND_URL}/ai-insights/test-user?period=month`);
        const insightsResult = await insightsResponse.json();
        
        console.log(`📥 Insights Status: ${insightsResponse.status}`);
        console.log('📋 Raw Insights Response:', JSON.stringify(insightsResult, null, 2));
        
        if (insightsResult.data && insightsResult.data.spending_insights) {
            console.log('\n📊 Spending Insights Structure:');
            insightsResult.data.spending_insights.forEach((insight, i) => {
                console.log(`   ${i + 1}. Title: "${insight.title || 'UNDEFINED'}"`);
                console.log(`      Description: "${insight.description || 'UNDEFINED'}"`);
                console.log(`      Priority: "${insight.priority || 'UNDEFINED'}"`);
            });
        }
    } catch (error) {
        console.log(`❌ Insights Error: ${error.message}`);
    }
}

debugReceiptUpload().catch(console.error);