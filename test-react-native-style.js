const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testReactNativeStyle() {
    try {
        console.log('\n🧪 Testing React Native style upload...');
        
        // Read image file  
        const imagePath = './assets/images/icon.png';
        
        if (!fs.existsSync(imagePath)) {
            console.log('❌ Icon file not found, creating test file...');
            // Create a minimal test file
            fs.writeFileSync(imagePath, Buffer.from('test image data'));
        }
        
        const imageBuffer = fs.readFileSync(imagePath);
        console.log(`📷 Image size: ${imageBuffer.length} bytes`);
        
        // Create FormData exactly like React Native does
        const form = new FormData();
        
        // React Native style: add image with specific options
        form.append('image', imageBuffer, {
            filename: 'receipt.png',
            contentType: 'image/png',
            knownLength: imageBuffer.length
        });
        
        form.append('user_id', 'test_user_123');
        
        console.log('\n📤 Making request to backend...');
        console.log('🔍 Form fields:', Object.keys(form.getHeaders()));
        
        const response = await axios({
            method: 'POST',
            url: 'http://localhost:8001/api/upload-receipt',
            data: form,
            headers: {
                ...form.getHeaders(),
                'Accept': 'application/json'
            },
            timeout: 30000,
            maxContentLength: 50 * 1024 * 1024, // 50MB
            maxBodyLength: 50 * 1024 * 1024
        });
        
        console.log('\n✅ SUCCESS!');
        console.log(`📊 Status: ${response.status}`);
        console.log('📋 Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('\n❌ ERROR occurred:');
        
        if (error.response) {
            console.log(`📊 Status: ${error.response.status}`);
            console.log('📋 Response:', JSON.stringify(error.response.data, null, 2));
            console.log('🔍 Headers:', error.response.headers);
        } else if (error.request) {
            console.log('📡 No response received');
            console.log('🔍 Request:', error.request);
        } else {
            console.log('⚠️ Error message:', error.message);
        }
    }
}

// Also test AI insights to verify structure fix
async function testAIInsights() {
    try {
        console.log('\n🧠 Testing AI Insights...');
        
        const response = await axios({
            method: 'GET',
            url: 'http://localhost:8001/api/ai-insights/test_user_123',
            timeout: 30000
        });
        
        console.log('\n✅ AI Insights SUCCESS!');
        console.log(`📊 Status: ${response.status}`);
        
        const data = response.data.data;
        if (data && data.spending_insights) {
            console.log('\n📋 Spending Insights Structure:');
            data.spending_insights.forEach((insight, i) => {
                console.log(`${i + 1}. Title: "${insight.title || 'UNDEFINED'}"`);
                console.log(`   Description: "${insight.description || 'UNDEFINED'}"`);
                console.log(`   Priority: "${insight.priority || 'UNDEFINED'}"`);
                console.log('');
            });
        }
        
        if (data && data.smart_suggestions) {
            console.log('💡 Smart Suggestions Structure:');
            data.smart_suggestions.forEach((suggestion, i) => {
                console.log(`${i + 1}. Title: "${suggestion.title || 'UNDEFINED'}"`);
                console.log(`   Description: "${suggestion.description || 'UNDEFINED'}"`);
                console.log(`   Priority: "${suggestion.priority || 'UNDEFINED'}"`);
                console.log('');
            });
        }
        
    } catch (error) {
        console.log('\n❌ AI Insights ERROR:');
        if (error.response) {
            console.log(`📊 Status: ${error.response.status}`);
            console.log('📋 Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('⚠️ Error:', error.message);
        }
    }
}

async function runTests() {
    console.log('🚀 Starting comprehensive tests...');
    await testReactNativeStyle();
    await testAIInsights();
    console.log('\n🏁 Tests completed!');
}

runTests();