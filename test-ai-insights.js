const axios = require('axios');

async function testAIInsights() {
    try {
        console.log('🧠 Testing AI Insights structure...');
        const response = await axios.get('http://localhost:8001/api/ai-insights/test_user_123');
        
        console.log('✅ AI Insights SUCCESS!');
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

testAIInsights();