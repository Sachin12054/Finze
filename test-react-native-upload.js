const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testReactNativeStyleUpload() {
    try {
        console.log('\n🧪 Testing React Native FormData style...');
        
        // Create test image file
        const imagePath = './assets/images/icon.png';
        if (!fs.existsSync(imagePath)) {
            console.log('Creating test image file...');
            fs.writeFileSync(imagePath, Buffer.from('test image data for receipt'));
        }
        
        const imageBuffer = fs.readFileSync(imagePath);
        console.log(`📷 Image size: ${imageBuffer.length} bytes`);
        
        // Create FormData similar to React Native style
        const form = new FormData();
        
        // Add image file similar to how React Native does it
        form.append('image', imageBuffer, {
            filename: 'receipt.jpg',
            contentType: 'image/jpeg',
        });
        
        form.append('user_id', 'test_user_react_native');
        
        console.log('\n📤 Uploading with React Native style FormData...');
        
        const response = await axios({
            method: 'POST',
            url: 'http://localhost:8001/api/upload-receipt',
            data: form,
            headers: {
                ...form.getHeaders(),
                'Accept': 'application/json'
            },
            timeout: 30000,
            maxContentLength: 50 * 1024 * 1024,
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
        } else if (error.request) {
            console.log('📡 No response received');
        } else {
            console.log('⚠️ Error message:', error.message);
        }
    }
}

testReactNativeStyleUpload();