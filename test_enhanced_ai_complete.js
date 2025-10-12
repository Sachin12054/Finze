/**
 * Test Enhanced AI Insights with Time-Based Analysis
 * This script tests the enhanced AI insights service with the correct user ID
 */

import { getAllExpenses } from '../src/services/databaseService';
import { enhancedAIInsightsService } from '../src/services/enhancedAIInsightsService';

async function testEnhancedAIInsights() {
  console.log('🔄 Testing Enhanced AI Insights with Time-Based Analysis...\n');
  
  const correctUserId = 'h30MlWtPyaT35EcKKpbGTtLrmg03'; // Your verified correct user ID
  
  try {
    // First, let's verify we have expense data
    console.log('📊 Checking expense data...');
    const expenses = await getAllExpenses(correctUserId);
    console.log(`✅ Found ${expenses.length} expenses totaling ₹${expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2)}\n`);
    
    if (expenses.length === 0) {
      console.log('❌ No expenses found. Cannot test AI insights.');
      return;
    }

    // Test the enhanced AI insights service
    console.log('🤖 Getting Enhanced AI Insights...');
    
    try {
      const insights = await enhancedAIInsightsService.getComprehensiveInsights(correctUserId, 'month');
      console.log('✅ Enhanced AI Insights Retrieved Successfully!\n');
      
      // Display comprehensive results
      console.log('📈 FINANCIAL HEALTH SCORE:');
      console.log(`   Overall Score: ${insights.financial_health_score.overall_score}/100 (${insights.financial_health_score.grade})`);
      console.log(`   Spending Control: ${insights.financial_health_score.category_scores.spending_control}%`);
      console.log(`   Budget Adherence: ${insights.financial_health_score.category_scores.budget_adherence}%`);
      console.log(`   Savings Rate: ${insights.financial_health_score.category_scores.savings_rate}%\n`);
      
      console.log('💰 SPENDING ANALYSIS:');
      console.log(`   Total Spending: ₹${insights.spending_analysis.total_spending.toLocaleString()}`);
      console.log(`   Spending Velocity: ${insights.spending_analysis.spending_velocity}`);
      console.log(`   Spending Efficiency: ${insights.spending_analysis.spending_efficiency}%`);
      console.log(`   Top Category Concentration: ${insights.spending_analysis.top_category_concentration}%\n`);
      
      // NEW: Time-Based Analysis
      console.log('📅 TIME-BASED ANALYSIS:');
      console.log('   Daily:');
      console.log(`     Amount: ₹${insights.time_based_analysis.daily.amount.toLocaleString()}`);
      console.log(`     Transactions: ${insights.time_based_analysis.daily.transactions}`);
      console.log(`     Average per day: ₹${insights.time_based_analysis.daily.avgPerDay.toFixed(2)}`);
      console.log(`     Trend: ${insights.time_based_analysis.daily.trend}`);
      
      console.log('   Weekly:');
      console.log(`     Amount: ₹${insights.time_based_analysis.weekly.amount.toLocaleString()}`);
      console.log(`     Transactions: ${insights.time_based_analysis.weekly.transactions}`);
      console.log(`     Average per week: ₹${insights.time_based_analysis.weekly.avgPerWeek.toFixed(2)}`);
      console.log(`     Top spending day: ${insights.time_based_analysis.weekly.topSpendingDay}`);
      
      console.log('   Monthly:');
      console.log(`     Amount: ₹${insights.time_based_analysis.monthly.amount.toLocaleString()}`);
      console.log(`     Transactions: ${insights.time_based_analysis.monthly.transactions}`);
      console.log(`     Average per month: ₹${insights.time_based_analysis.monthly.avgPerMonth.toFixed(2)}`);
      console.log(`     Monthly pattern: ${insights.time_based_analysis.monthly.monthlyPattern}`);
      
      console.log('   Yearly:');
      console.log(`     Amount: ₹${insights.time_based_analysis.yearly.amount.toLocaleString()}`);
      console.log(`     Transactions: ${insights.time_based_analysis.yearly.transactions}`);
      console.log(`     Projected annual: ₹${insights.time_based_analysis.yearly.projectedAnnual.toLocaleString()}\n`);
      
      // NEW: Spending Insights
      console.log('🎯 SPENDING INSIGHTS:');
      console.log(`   Top spending day: ${insights.spending_insights.topSpendingDay}`);
      console.log(`   Most expensive transaction: ${insights.spending_insights.mostExpensiveTransaction.title} (₹${insights.spending_insights.mostExpensiveTransaction.amount})`);
      console.log(`   Frequent category: ${insights.spending_insights.frequentCategory}`);
      console.log(`   Spending pattern: ${insights.spending_insights.spendingPattern}`);
      console.log(`   Savings opportunity: ${insights.spending_insights.savingsOpportunity.strategy}`);
      console.log(`   Potential savings: ₹${insights.spending_insights.savingsOpportunity.potential.toLocaleString()}\n`);
      
      console.log('💡 SMART INSIGHTS:');
      insights.smart_insights.slice(0, 3).forEach((insight, index) => {
        console.log(`   ${index + 1}. ${insight.title} (${insight.impact} impact)`);
        console.log(`      ${insight.description}`);
        if (insight.potential_savings) {
          console.log(`      Potential savings: ₹${insight.potential_savings.toLocaleString()}`);
        }
        if (insight.timeline) {
          console.log(`      Timeline: ${insight.timeline}`);
        }
        console.log('');
      });
      
      console.log('🎯 PERSONALIZED RECOMMENDATIONS:');
      insights.personalized_recommendations.slice(0, 2).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.title} (${rec.priority} priority)`);
        console.log(`      ${rec.description}`);
        console.log(`      Implementation: ${rec.implementation}`);
        console.log(`      Expected impact: ${rec.expected_impact}`);
        console.log(`      Effort level: ${rec.effort_level}`);
        console.log('');
      });
      
      console.log('🏆 FINANCIAL GOALS SUGGESTIONS:');
      insights.financial_goals_suggestions.slice(0, 2).forEach((goal, index) => {
        console.log(`   ${index + 1}. ${goal.goal_type} (${goal.importance} importance)`);
        console.log(`      Target: ₹${goal.recommended_amount.toLocaleString()}`);
        console.log(`      Monthly target: ₹${goal.monthly_target.toLocaleString()}`);
        console.log(`      Timeline: ${goal.completion_timeline}`);
        console.log(`      Description: ${goal.description}`);
        console.log('');
      });
      
      console.log('⚠️ RISK ANALYSIS:');
      console.log(`   Financial stability: ${insights.risk_analysis.financial_stability}`);
      console.log(`   Overspending risk: ${insights.risk_analysis.overspending_risk}`);
      console.log(`   Emergency preparedness: ${insights.risk_analysis.emergency_preparedness}`);
      if (insights.risk_analysis.recommendations.length > 0) {
        console.log(`   Key recommendations: ${insights.risk_analysis.recommendations.slice(0, 2).join(', ')}`);
      }
      console.log('');
      
      console.log('📊 METADATA:');
      console.log(`   AI Model: ${insights.ai_model}`);
      console.log(`   Analysis Depth: ${insights.analysis_depth}`);
      console.log(`   Data Points Analyzed: ${insights.data_points_analyzed}`);
      console.log(`   Confidence Level: ${insights.confidence_level * 100}%`);
      console.log(`   Personalization Score: ${insights.personalization_score * 100}%`);
      console.log(`   Generated: ${insights.generated_at}`);
      
    } catch (insightsError) {
      console.log('⚠️ Enhanced AI Service not available, testing fallback...');
      console.log('Error:', insightsError.message);
      
      // Test that we get fallback insights with our new properties
      console.log('\n🔄 Testing fallback insights structure...');
      try {
        // Force an error to trigger fallback
        const fallbackInsights = await enhancedAIInsightsService.getComprehensiveInsights('invalid_user_id', 'month');
      } catch (fallbackError) {
        if (fallbackError.time_based_analysis && fallbackError.spending_insights) {
          console.log('✅ Fallback includes time-based analysis and spending insights!');
          console.log(`   Time-based analysis structure: ✓`);
          console.log(`   Spending insights structure: ✓`);
        } else {
          console.log('❌ Fallback missing new properties');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error testing enhanced AI insights:', error);
  }
}

// Run the test
testEnhancedAIInsights().catch(console.error);