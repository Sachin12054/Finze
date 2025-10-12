// Simple test to verify Gemini API key works and list available models
const API_KEY = 'AIzaSyAFBwFqVrPfi1o0Po4WRCfyEtlp67HmnEc';

async function listAvailableModels() {
  console.log('🔍 Listing available Gemini models...');
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + API_KEY);
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error listing models:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Available models:');
    
    if (data.models) {
      data.models.forEach(model => {
        console.log(`- ${model.name} (supported methods: ${model.supportedGenerationMethods?.join(', ') || 'unknown'})`);
      });
    }
    
    return data.models;
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

async function testGeminiAPI() {
  const models = await listAvailableModels();
  
  if (!models || models.length === 0) {
    console.log('❌ No models available or failed to fetch models');
    return;
  }
  
  // Find a model that supports generateContent, preferring flash models for better quota
  const compatibleModel = models.find(model => 
    model.name.includes('gemini-2.0-flash') && model.supportedGenerationMethods?.includes('generateContent')
  ) || models.find(model => 
    model.supportedGenerationMethods?.includes('generateContent')
  );
  
  if (!compatibleModel) {
    console.log('❌ No model found that supports generateContent');
    return;
  }
  
  console.log('');
  console.log('🧪 Testing with model:', compatibleModel.name);
  
  // Extract model name without the "models/" prefix for the URL
  const modelName = compatibleModel.name.replace('models/', '');
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  
  console.log('🌐 API URL:', GEMINI_URL);
  
  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello, this is a test. Please respond with "API is working!"'
          }]
        }]
      })
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Success! API Response structure:', Object.keys(data));
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      console.log('🤖 Gemini says:', data.candidates[0].content.parts[0].text);
    }

  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

testGeminiAPI();