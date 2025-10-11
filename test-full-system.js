const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testWithDifferentImages() {
    console.log('\n🧪 Testing different image types for receipt processing...');
    
    // Test 1: Create a mock receipt-like text image 
    console.log('\n📄 Test 1: Creating mock receipt data...');
    const mockReceiptText = `
RECEIPT
================
Date: 2025-10-11
Store: Test Grocery Store
Address: 123 Main St

Items:
Milk                 $4.99
Bread                $2.50
Eggs                 $3.25
Apples               $1.99

Subtotal:           $12.73
Tax:                 $1.27
Total:              $14.00

Thank you for shopping!
    `;
    
    // Create a simple text file that represents receipt content
    const receiptPath = './test-receipt.txt';
    fs.writeFileSync(receiptPath, mockReceiptText);
    
    // Test with the text file as if it were an image
    try {
        const form = new FormData();
        const receiptBuffer = fs.readFileSync(receiptPath);
        
        form.append('image', receiptBuffer, {
            filename: 'receipt.jpg',
            contentType: 'image/jpeg',
        });
        form.append('user_id', 'test_user_mock_receipt');
        
        console.log('📤 Uploading mock receipt...');
        
        const response = await axios({
            method: 'POST',
            url: 'http://localhost:8001/api/upload-receipt',
            data: form,
            headers: {
                ...form.getHeaders(),
                'Accept': 'application/json'
            },
            timeout: 30000
        });
        
        console.log('✅ Mock Receipt Upload Success!');
        console.log(`📊 Status: ${response.status}`);
        console.log('📋 Extracted Data:');
        const data = response.data.data;
        console.log(`   Merchant: ${data.merchant_name || 'Not detected'}`);
        console.log(`   Total: ${data.total_amount || 'Not detected'}`);
        console.log(`   Date: ${data.date || 'Not detected'}`);
        console.log(`   Items: ${data.items?.length || 0} items`);
        
    } catch (error) {
        console.log('❌ Mock receipt test failed:');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error: ${error.response.data.error}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }
    
    // Test 2: Check AI Insights to make sure they still work
    console.log('\n💡 Test 2: Checking AI Insights...');
    try {
        const response = await axios.get('http://localhost:8001/api/ai-insights/test_user_mock_receipt');
        console.log('✅ AI Insights Success!');
        console.log(`📊 Insights Status: ${response.data.status}`);
        console.log(`📋 Spending Insights: ${response.data.data?.spending_insights?.length || 0} insights`);
        console.log(`💡 Smart Suggestions: ${response.data.data?.smart_suggestions?.length || 0} suggestions`);
        
        if (response.data.data?.spending_insights?.length > 0) {
            const firstInsight = response.data.data.spending_insights[0];
            console.log(`   Example: "${firstInsight.title}" - ${firstInsight.priority} priority`);
        }
        
    } catch (error) {
        console.log('❌ AI Insights test failed:');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error: ${error.response.data.error}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }
    
    // Cleanup
    if (fs.existsSync(receiptPath)) {
        fs.unlinkSync(receiptPath);
    }
    
    console.log('\n🏁 All tests completed!');
}

testWithDifferentImages();