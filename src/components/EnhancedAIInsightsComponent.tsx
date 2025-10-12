import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { getCurrentUserId } from '../services/databaseService';
import { ComprehensiveInsights, enhancedAIInsightsService, FinancialCoaching, InvestmentReadiness, SpendingPsychology } from '../services/enhancedAIInsightsService';

const { width: screenWidth } = Dimensions.get('window');

interface EnhancedAIInsightsProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'insights' | 'coaching' | 'psychology' | 'investment';

export const EnhancedAIInsightsComponent: React.FC<EnhancedAIInsightsProps> = ({
  visible,
  onClose,
}) => {
  const { isDarkTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<ComprehensiveInsights | null>(null);
  const [coaching, setCoaching] = useState<FinancialCoaching | null>(null);
  const [psychology, setPsychology] = useState<SpendingPsychology | null>(null);
  const [investment, setInvestment] = useState<InvestmentReadiness | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      loadData();
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn('No user ID found');
        return;
      }

      // Load all data types based on active tab
      const [insightsData, coachingData, psychologyData, investmentData] = await Promise.allSettled([
        enhancedAIInsightsService.getComprehensiveInsights(userId),
        enhancedAIInsightsService.getFinancialCoaching(userId),
        enhancedAIInsightsService.getSpendingPsychology(userId),
        enhancedAIInsightsService.getInvestmentReadiness(userId)
      ]);

      if (insightsData.status === 'fulfilled') {
        setInsights(insightsData.value);
      }
      if (coachingData.status === 'fulfilled') {
        setCoaching(coachingData.value);
      }
      if (psychologyData.status === 'fulfilled') {
        setPsychology(psychologyData.value);
      }
      if (investmentData.status === 'fulfilled') {
        setInvestment(investmentData.value);
      }
    } catch (error) {
      console.error('Error loading enhanced insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#DC2626';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const renderHealthScore = () => {
    if (!insights?.financial_health_score) return null;

    const healthScore = insights.financial_health_score;
    const color = getHealthScoreColor(healthScore.overall_score);

    return (
      <LinearGradient
        colors={isDarkTheme ? ['#1F2937', '#374151'] : ['#FFFFFF', '#F8FAFC']}
        style={styles.healthScoreCard}
      >
        <View style={styles.healthScoreHeader}>
          <Text style={[styles.healthScoreTitle, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
            Financial Health Score
          </Text>
          <View style={[styles.healthScoreBadge, { backgroundColor: color }]}>
            <Text style={styles.healthScoreGrade}>{healthScore.grade}</Text>
          </View>
        </View>
        
        <View style={styles.healthScoreMain}>
          <Text style={[styles.healthScoreNumber, { color }]}>
            {healthScore.overall_score}
          </Text>
          <Text style={[styles.healthScoreMax, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>
            /100
          </Text>
        </View>

        <Text style={[styles.healthScoreExplanation, { color: isDarkTheme ? '#D1D5DB' : '#4B5563' }]}>
          {healthScore.explanation}
        </Text>

        <View style={styles.categoryScoresContainer}>
          {Object.entries(healthScore.category_scores).map(([category, score]) => (
            <View key={category} style={styles.categoryScore}>
              <Text style={[styles.categoryName, { color: isDarkTheme ? '#E5E7EB' : '#6B7280' }]}>
                {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <View style={styles.scoreBar}>
                <View 
                  style={[
                    styles.scoreBarFill, 
                    { 
                      width: `${score}%`,
                      backgroundColor: getHealthScoreColor(score)
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.categoryScoreText, { color: isDarkTheme ? '#F3F4F6' : '#1F2937' }]}>
                {score}
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    );
  };

  const renderSmartInsight = (insight: any, index: number) => (
    <Animated.View
      key={index}
      style={[
        styles.insightCard,
        { backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF' },
        {
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }]
        }
      ]}
    >
      <View style={styles.insightHeader}>
        <View style={[styles.insightIcon, { backgroundColor: getImpactColor(insight.impact) + '20' }]}>
          <Ionicons 
            name={insight.category === 'spending_optimization' ? 'trending-down' : 
                  insight.category === 'budget_optimization' ? 'pie-chart' :
                  insight.category === 'wealth_building' ? 'trending-up' : 'bulb'} 
            size={20} 
            color={getImpactColor(insight.impact)} 
          />
        </View>
        <View style={styles.insightContent}>
          <Text style={[styles.insightTitle, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
            {insight.title}
          </Text>
          <View style={styles.insightMeta}>
            <View style={[styles.impactBadge, { backgroundColor: getImpactColor(insight.impact) }]}>
              <Text style={styles.impactText}>{insight.impact.toUpperCase()}</Text>
            </View>
            {insight.potential_savings && (
              <Text style={[styles.savingsText, { color: '#10B981' }]}>
                Save ₹{insight.potential_savings}
              </Text>
            )}
          </View>
        </View>
      </View>
      
      <Text style={[styles.insightDescription, { color: isDarkTheme ? '#D1D5DB' : '#4B5563' }]}>
        {insight.description}
      </Text>

      {insight.specific_actions && insight.specific_actions.length > 0 && (
        <View style={styles.actionsContainer}>
          <Text style={[styles.actionsTitle, { color: isDarkTheme ? '#E5E7EB' : '#6B7280' }]}>
            Action Steps:
          </Text>
          {insight.specific_actions.map((action: string, actionIndex: number) => (
            <View key={actionIndex} style={styles.actionItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={[styles.actionText, { color: isDarkTheme ? '#D1D5DB' : '#4B5563' }]}>
                {action}
              </Text>
            </View>
          ))}
        </View>
      )}

      {insight.timeline && (
        <View style={styles.timelineContainer}>
          <Ionicons name="time" size={14} color="#6B7280" />
          <Text style={[styles.timelineText, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>
            {insight.timeline}
          </Text>
        </View>
      )}
    </Animated.View>
  );

  const renderRecommendation = (recommendation: any, index: number) => (
    <View 
      key={index}
      style={[
        styles.recommendationCard,
        { backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF' }
      ]}
    >
      <View style={styles.recommendationHeader}>
        <Text style={[styles.recommendationTitle, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
          {recommendation.title}
        </Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(recommendation.priority) }]}>
          <Text style={styles.priorityText}>{recommendation.priority.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={[styles.recommendationDescription, { color: isDarkTheme ? '#D1D5DB' : '#4B5563' }]}>
        {recommendation.description}
      </Text>

      <View style={styles.recommendationDetails}>
        <View style={styles.recommendationDetail}>
          <Ionicons name="settings" size={16} color="#6366F1" />
          <Text style={[styles.recommendationDetailText, { color: isDarkTheme ? '#E5E7EB' : '#6B7280' }]}>
            {recommendation.implementation}
          </Text>
        </View>
        
        <View style={styles.recommendationDetail}>
          <Ionicons name="trophy" size={16} color="#F59E0B" />
          <Text style={[styles.recommendationDetailText, { color: isDarkTheme ? '#E5E7EB' : '#6B7280' }]}>
            {recommendation.expected_impact}
          </Text>
        </View>

        <View style={styles.recommendationDetail}>
          <Ionicons name="time" size={16} color="#10B981" />
          <Text style={[styles.recommendationDetailText, { color: isDarkTheme ? '#E5E7EB' : '#6B7280' }]}>
            {recommendation.time_to_implement}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCoachingTab = () => {
    if (!coaching) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Motivation Message */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.motivationCard}
        >
          <Ionicons name="star" size={24} color="white" />
          <Text style={styles.motivationText}>{coaching.motivation_message}</Text>
        </LinearGradient>

        {/* Weekly Goals */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
            This Week's Goals
          </Text>
          {coaching.weekly_goals.map((goal, index) => (
            <View key={index} style={[styles.goalCard, { backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF' }]}>
              <View style={styles.goalHeader}>
                <Text style={[styles.goalTitle, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
                  {goal.goal}
                </Text>
                <View style={[styles.difficultyBadge, { backgroundColor: goal.difficulty === 'easy' ? '#10B981' : goal.difficulty === 'medium' ? '#F59E0B' : '#EF4444' }]}>
                  <Text style={styles.difficultyText}>{goal.difficulty.toUpperCase()}</Text>
                </View>
              </View>
              
              {goal.target_amount > 0 && (
                <Text style={[styles.goalTarget, { color: '#10B981' }]}>
                  Target: ₹{goal.target_amount}
                </Text>
              )}

              <View style={styles.actionStepsContainer}>
                {goal.action_steps.map((step, stepIndex) => (
                  <View key={stepIndex} style={styles.actionStep}>
                    <Ionicons name="arrow-forward" size={14} color="#6366F1" />
                    <Text style={[styles.actionStepText, { color: isDarkTheme ? '#D1D5DB' : '#4B5563' }]}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Challenge of the Week */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
            Challenge of the Week
          </Text>
          <LinearGradient
            colors={['#F59E0B', '#F97316']}
            style={styles.challengeCard}
          >
            <Ionicons name="trophy" size={32} color="white" />
            <Text style={styles.challengeTitle}>{coaching.challenge_of_the_week.title}</Text>
            <Text style={styles.challengeDescription}>{coaching.challenge_of_the_week.description}</Text>
            <View style={styles.rewardContainer}>
              <Ionicons name="gift" size={16} color="white" />
              <Text style={styles.rewardText}>{coaching.challenge_of_the_week.reward}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Daily Tips */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
            Daily Tips
          </Text>
          {coaching.daily_tips.map((tip, index) => (
            <View key={index} style={[styles.tipCard, { backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF' }]}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={[styles.tipText, { color: isDarkTheme ? '#D1D5DB' : '#4B5563' }]}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderOverviewTab = () => {
    if (!insights) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderHealthScore()}
        
        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <View style={[styles.quickStat, { backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF' }]}>
            <Ionicons name="trending-up" size={24} color="#10B981" />
            <Text style={[styles.quickStatNumber, { color: '#10B981' }]}>
              ₹{insights.spending_analysis.total_spending.toLocaleString()}
            </Text>
            <Text style={[styles.quickStatLabel, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>
              Total Spending
            </Text>
          </View>
          
          <View style={[styles.quickStat, { backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF' }]}>
            <Ionicons name="analytics" size={24} color="#6366F1" />
            <Text style={[styles.quickStatNumber, { color: '#6366F1' }]}>
              {insights.spending_analysis.spending_efficiency}%
            </Text>
            <Text style={[styles.quickStatLabel, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>
              Efficiency
            </Text>
          </View>
          
          <View style={[styles.quickStat, { backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF' }]}>
            <Ionicons name="flag" size={24} color="#F59E0B" />
            <Text style={[styles.quickStatNumber, { color: '#F59E0B' }]}>
              {insights.financial_goals_suggestions.length}
            </Text>
            <Text style={[styles.quickStatLabel, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>
              Goals
            </Text>
          </View>
        </View>

        {/* Time-Based Analysis */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
            📅 Time-Based Spending Analysis
          </Text>
          
          {/* Time Period Stats */}
          <View style={styles.timeAnalysisGrid}>
            <View style={[styles.timeAnalysisCard, { backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF' }]}>
              <Text style={[styles.timeAnalysisLabel, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>
                Today
              </Text>
              <Text style={[styles.timeAnalysisAmount, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
                ₹{insights.time_based_analysis.daily.amount.toLocaleString()}
              </Text>
              <Text style={[styles.timeAnalysisSubtext, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>
                {insights.time_based_analysis.daily.transactions} transactions
              </Text>
            </View>
            
            <View style={[styles.timeAnalysisCard, { backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF' }]}>
              <Text style={[styles.timeAnalysisLabel, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>
                This Week
              </Text>
              <Text style={[styles.timeAnalysisAmount, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
                ₹{insights.time_based_analysis.weekly.amount.toLocaleString()}
              </Text>
              <Text style={[styles.timeAnalysisSubtext, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>
                {insights.time_based_analysis.weekly.transactions} transactions
              </Text>
            </View>
            
            <View style={[styles.timeAnalysisCard, { backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF' }]}>
              <Text style={[styles.timeAnalysisLabel, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>
                This Month
              </Text>
              <Text style={[styles.timeAnalysisAmount, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
                ₹{insights.time_based_analysis.monthly.amount.toLocaleString()}
              </Text>
              <Text style={[styles.timeAnalysisSubtext, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>
                {insights.time_based_analysis.monthly.transactions} transactions
              </Text>
            </View>
            
            <View style={[styles.timeAnalysisCard, { backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF' }]}>
              <Text style={[styles.timeAnalysisLabel, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>
                This Year
              </Text>
              <Text style={[styles.timeAnalysisAmount, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
                ₹{insights.time_based_analysis.yearly.amount.toLocaleString()}
              </Text>
              <Text style={[styles.timeAnalysisSubtext, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>
                {insights.time_based_analysis.yearly.transactions} transactions
              </Text>
            </View>
          </View>
          
          {/* Spending Patterns */}
          <View style={[styles.insightCard, { backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF' }]}>
            <View style={styles.insightHeader}>
              <Ionicons name="analytics-outline" size={20} color="#6366F1" />
              <Text style={[styles.insightTitle, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
                Spending Patterns
              </Text>
            </View>
            <Text style={[styles.insightDescription, { color: isDarkTheme ? '#D1D5DB' : '#4B5563' }]}>
              Top spending day: {insights.spending_insights.topSpendingDay}
            </Text>
            <Text style={[styles.insightDescription, { color: isDarkTheme ? '#D1D5DB' : '#4B5563' }]}>
              Most expensive: {insights.spending_insights.mostExpensiveTransaction.title} (₹{insights.spending_insights.mostExpensiveTransaction.amount})
            </Text>
            <Text style={[styles.insightDescription, { color: isDarkTheme ? '#D1D5DB' : '#4B5563' }]}>
              Frequent category: {insights.spending_insights.frequentCategory}
            </Text>
            <Text style={[styles.insightDescription, { color: isDarkTheme ? '#D1D5DB' : '#4B5563' }]}>
              Pattern: {insights.spending_insights.spendingPattern.replace(/_/g, ' ')}
            </Text>
          </View>
          
          {/* Savings Opportunity */}
          {insights.spending_insights.savingsOpportunity.potential > 0 && (
            <View style={[styles.insightCard, { backgroundColor: isDarkTheme ? '#374151' : '#FFFFFF' }]}>
              <View style={styles.insightHeader}>
                <Ionicons name="leaf-outline" size={20} color="#10B981" />
                <Text style={[styles.insightTitle, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
                  Savings Opportunity
                </Text>
              </View>
              <Text style={[styles.insightDescription, { color: isDarkTheme ? '#D1D5DB' : '#4B5563' }]}>
                Category: {insights.spending_insights.savingsOpportunity.category}
              </Text>
              <Text style={[styles.insightDescription, { color: isDarkTheme ? '#D1D5DB' : '#4B5563' }]}>
                Potential: ₹{insights.spending_insights.savingsOpportunity.potential.toLocaleString()}
              </Text>
              <Text style={[styles.insightDescription, { color: isDarkTheme ? '#D1D5DB' : '#4B5563' }]}>
                Strategy: {insights.spending_insights.savingsOpportunity.strategy}
              </Text>
              <Text style={[styles.insightDescription, { color: '#10B981' }]}>
                Difficulty: {insights.spending_insights.savingsOpportunity.difficulty}
              </Text>
            </View>
          )}
        </View>

        {/* Top Insights */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
            Top Insights
          </Text>
          {insights.smart_insights.slice(0, 3).map(renderSmartInsight)}
        </View>
      </ScrollView>
    );
  };

  const renderInsightsTab = () => {
    if (!insights) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
            Smart Insights
          </Text>
          {insights.smart_insights.map(renderSmartInsight)}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkTheme ? '#FFFFFF' : '#1F2937' }]}>
            Personalized Recommendations
          </Text>
          {insights.personalized_recommendations.map(renderRecommendation)}
        </View>
      </ScrollView>
    );
  };

  const renderTabs = () => {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: 'home' },
      { id: 'insights', label: 'Insights', icon: 'analytics' },
      { id: 'coaching', label: 'Coaching', icon: 'fitness' },
      { id: 'psychology', label: 'Psychology', icon: 'brain' },
      { id: 'investment', label: 'Investment', icon: 'trending-up' },
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollContainer}
        contentContainerStyle={styles.tabContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
              { backgroundColor: activeTab === tab.id ? '#6366F1' : (isDarkTheme ? '#374151' : '#F3F4F6') }
            ]}
            onPress={() => setActiveTab(tab.id as TabType)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={18} 
              color={activeTab === tab.id ? 'white' : (isDarkTheme ? '#D1D5DB' : '#6B7280')} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.id ? 'white' : (isDarkTheme ? '#D1D5DB' : '#6B7280') }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'insights':
        return renderInsightsTab();
      case 'coaching':
        return renderCoachingTab();
      case 'psychology':
        // TODO: Implement psychology tab
        return <View><Text>Psychology analysis coming soon...</Text></View>;
      case 'investment':
        // TODO: Implement investment tab
        return <View><Text>Investment readiness coming soon...</Text></View>;
      default:
        return renderOverviewTab();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: isDarkTheme ? '#1F2937' : '#F8FAFC' }]}>
        {/* Header */}
        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>AI Financial Insights</Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={[styles.loadingText, { color: isDarkTheme ? '#D1D5DB' : '#6B7280' }]}>
                Analyzing your financial data with AI...
              </Text>
            </View>
          ) : (
            renderContent()
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  tabScrollContainer: {
    maxHeight: 60,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  activeTab: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  healthScoreCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  healthScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthScoreTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  healthScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  healthScoreGrade: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  healthScoreMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  healthScoreNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  healthScoreMax: {
    fontSize: 24,
    fontWeight: '400',
    marginLeft: 4,
  },
  healthScoreExplanation: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  categoryScoresContainer: {
    gap: 12,
  },
  categoryScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    width: 80,
  },
  scoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryScoreText: {
    fontSize: 12,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickStat: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  insightCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  insightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  impactText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  actionText: {
    fontSize: 12,
    flex: 1,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  timelineText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  recommendationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  recommendationDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationDetails: {
    gap: 8,
  },
  recommendationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendationDetailText: {
    fontSize: 12,
    flex: 1,
  },
  motivationCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  motivationText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  goalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  goalTarget: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionStepsContainer: {
    gap: 6,
  },
  actionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionStepText: {
    fontSize: 12,
    flex: 1,
  },
  challengeCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 16,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  timeAnalysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  timeAnalysisCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 8,
  },
  timeAnalysisLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  timeAnalysisAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  timeAnalysisSubtext: {
    fontSize: 10,
    textAlign: 'center',
  },
});

export default EnhancedAIInsightsComponent;