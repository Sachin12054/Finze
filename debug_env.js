// Debug API Key Loading
require('dotenv').config();

console.log('=== Environment Debug ===');
console.log('API Key from process.env:', process.env.EXPO_PUBLIC_GEMINI_API_KEY);
console.log('API Key length:', process.env.EXPO_PUBLIC_GEMINI_API_KEY?.length);
console.log('API Key first 10 chars:', process.env.EXPO_PUBLIC_GEMINI_API_KEY?.substring(0, 10));

// Test if the key works
async function testAPIKey() {
  const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`;
  
  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Say hello"
          }]
        }]
      })
    });

    console.log('API Response Status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.log('API Error:', errorText);
    } else {
      console.log('✅ API Key is working!');
    }
  } catch (error) {
    console.error('❌ API Test Error:', error);
  }
}

testAPIKey();