const axios = require('axios');

async function testHealth() {
    try {
        console.log('🔍 Testing backend health...');
        const response = await axios.get('http://localhost:8001/api/health');
        console.log('✅ Backend is healthy!');
        console.log('Response:', response.data);
    } catch (error) {
        console.log('❌ Backend health check failed');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testHealth();