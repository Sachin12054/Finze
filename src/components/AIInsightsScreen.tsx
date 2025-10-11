/**
 * AI Insights Screen Component
 * Professional AI-powered financial insights with scanner-like UI
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeInUp,
    SlideInRight,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { AIInsightsData, aiInsightsService, SmartSuggestion, SpendingInsight } from '../services/aiInsightsService';

const { width: screenWidth } = Dimensions.get('window');

interface AIInsightsScreenProps {
  isVisible: boolean;
  onClose: () => void;
}

export const AIInsightsScreen: React.FC<AIInsightsScreenProps> = ({
  isVisible,
  onClose
}) => {
  const { isDarkTheme } = useTheme();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insightsData, setInsightsData] = useState<AIInsightsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'insights' | 'suggestions'>('insights');
  
  // Animation values
  const slideValue = useSharedValue(0);
  const opacityValue = useSharedValue(0);

  // Colors based on theme
  const colors = {
    background: isDarkTheme ? '#0f172a' : '#ffffff',
    surface: isDarkTheme ? '#1e293b' : '#f8fafc',
    surfaceHover: isDarkTheme ? '#334155' : '#e2e8f0',
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    text: isDarkTheme ? '#f8fafc' : '#1e293b',
    textSecondary: isDarkTheme ? '#cbd5e1' : '#64748b',
    textMuted: isDarkTheme ? '#94a3b8' : '#9ca3af',
    border: isDarkTheme ? '#374151' : '#e5e7eb',
    shadow: isDarkTheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'
  };

  // Load insights data
  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      const data = await aiInsightsService.getAIInsights(selectedPeriod);
      setInsightsData(data);
    } catch (error) {
      console.error('Error loading AI insights:', error);
      Alert.alert('Error', 'Failed to load AI insights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  }, [loadInsights]);

  // Initialize
  useEffect(() => {
    if (isVisible) {
      loadInsights();
      slideValue.value = withSpring(1);
      opacityValue.value = withTiming(1, { duration: 300 });
    } else {
      slideValue.value = withSpring(0);
      opacityValue.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible, loadInsights, slideValue, opacityValue]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - slideValue.value) * 50 }],
    opacity: opacityValue.value,
  }));

  // Get health score color
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      default: return colors.success;
    }
  };

  // Render period selector
  const renderPeriodSelector = () => {
    const periods = [
      { key: 'week', label: 'Week' },
      { key: 'month', label: 'Month' },
      { key: 'year', label: 'Year' }
    ];

    return (
      <View style={[styles.periodSelector, { backgroundColor: colors.surface }]}>
        {periods.map(period => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4
              }
            ]}
            onPress={() => setSelectedPeriod(period.key as any)}
          >
            <Text style={[
              styles.periodButtonText,
              { color: selectedPeriod === period.key ? '#ffffff' : colors.textSecondary }
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render tab selector
  const renderTabSelector = () => {
    const tabs = [
      { key: 'insights', label: 'Smart Insights', icon: 'analytics' },
      { key: 'suggestions', label: 'Recommendations', icon: 'bulb' }
    ];

    return (
      <View style={[styles.tabSelector, { backgroundColor: colors.surface }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? colors.primary : colors.textSecondary}
            />
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === tab.key ? colors.primary : colors.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render financial health card
  const renderFinancialHealth = () => {
    if (!insightsData || !insightsData.financial_health) return null;

    const { financial_health } = insightsData;
    const healthColor = getHealthScoreColor(financial_health.health_score || 0);

    return (
      <Animated.View entering={FadeInUp.delay(200)}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={styles.healthCard}
        >
          <View style={styles.healthHeader}>
            <View style={styles.healthTitleRow}>
              <Ionicons name="fitness" size={24} color="#ffffff" />
              <Text style={styles.healthTitle}>Financial Health</Text>
            </View>
            <View style={[styles.healthScore, { borderColor: '#ffffff' }]}>
              <Text style={styles.healthScoreText}>{financial_health.health_score || 0}</Text>
            </View>
          </View>
          
          <View style={styles.healthMetrics}>
            <View style={styles.healthMetric}>
              <Text style={styles.healthMetricLabel}>Total Spending</Text>
              <Text style={styles.healthMetricValue}>
                ₹{(financial_health.total_spending || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.healthMetric}>
              <Text style={styles.healthMetricLabel}>Avg Transaction</Text>
              <Text style={styles.healthMetricValue}>
                ₹{(financial_health.average_transaction || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.healthMetric}>
              <Text style={styles.healthMetricLabel}>Transactions</Text>
              <Text style={styles.healthMetricValue}>
                {financial_health.transaction_count || 0}
              </Text>
            </View>
          </View>

          <View style={styles.trendIndicator}>
            <Ionicons
              name={financial_health.spending_trend === 'increasing' ? 'trending-up' : 
                   financial_health.spending_trend === 'decreasing' ? 'trending-down' : 'remove'}
              size={20}
              color="#ffffff"
            />
            <Text style={styles.trendText}>
              {(financial_health.spending_change_percent || 0) > 0 ? '+' : ''}{financial_health.spending_change_percent || 0}% from last period
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Render financial overview with top categories
  const renderFinancialOverview = () => {
    if (!insightsData?.category_analysis) return null;

    const categories = Object.entries(insightsData.category_analysis)
      .sort(([_, a], [__, b]) => b.total - a.total)
      .slice(0, 4);

    return (
      <Animated.View entering={FadeInUp.delay(300)}>
        <View style={[styles.categoryCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Spending Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map(([category, data], index) => (
              <View key={category} style={styles.categoryOverviewItem}>
                <Ionicons
                  name={getCategoryIcon(category)}
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
                  {category}
                </Text>
                <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>
                  ₹{data.total.toLocaleString()}
                </Text>
                <Text style={[styles.categoryPercentage, { color: colors.textMuted }]}>
                  {data.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    );
  };

  // Render spending insight card
  const renderInsightCard = (insight: SpendingInsight, index: number) => {
    // Safely handle priority with fallback
    const priority = insight.priority || 'medium';
    const priorityColor = getPriorityColor(priority);

    return (
      <Animated.View key={index} entering={FadeInUp.delay(300 + index * 100)}>
        <View style={[styles.insightCard, { backgroundColor: colors.surface }]}>
          <View style={styles.insightHeader}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={[styles.insightTitle, { color: colors.text }]}>{insight.title || 'Financial Insight'}</Text>
            {insight.actionable && (
              <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
            )}
          </View>
          <Text style={[styles.insightDescription, { color: colors.textSecondary }]}>
            {insight.description || 'No description available'}
          </Text>
          <View style={styles.insightFooter}>
            <Text style={[styles.insightSuggestion, { color: colors.textMuted }]}>
              {insight.suggestion || 'Continue monitoring your expenses'}
            </Text>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
              <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
                {priority.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Render suggestion card
  const renderSuggestionCard = (suggestion: SmartSuggestion, index: number) => {
    const priorityColor = getPriorityColor(suggestion.priority);

    return (
      <Animated.View key={index} entering={SlideInRight.delay(200 + index * 100)}>
        <TouchableOpacity
          style={[styles.suggestionCard, { backgroundColor: colors.surface }]}
          onPress={() => {
            if (suggestion.actionable) {
              Alert.alert(
                suggestion.title,
                suggestion.description + '\n\n' + 
                (suggestion.suggested_amount ? `Suggested Amount: ₹${suggestion.suggested_amount}` : ''),
                [
                  { text: 'Dismiss', style: 'cancel' },
                  { text: 'Take Action', onPress: () => {
                    // Handle action based on suggestion type
                    console.log('Taking action for:', suggestion.type);
                  }}
                ]
              );
            }
          }}
        >
          <View style={styles.suggestionHeader}>
            <Ionicons
              name={suggestion.type === 'budget_recommendation' ? 'wallet' :
                   suggestion.type === 'savings_opportunity' ? 'trending-up' :
                   suggestion.type === 'goal_setting' ? 'flag' : 'bulb'}
              size={24}
              color={priorityColor}
            />
            <View style={styles.suggestionTitleContainer}>
              <Text style={[styles.suggestionTitle, { color: colors.text }]}>
                {suggestion.title}
              </Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
                  {suggestion.priority}
                </Text>
              </View>
            </View>
          </View>
          <Text style={[styles.suggestionDescription, { color: colors.textSecondary }]}>
            {suggestion.description}
          </Text>
          {suggestion.suggested_amount && (
            <View style={styles.suggestionAmount}>
              <Text style={[styles.suggestionAmountText, { color: colors.primary }]}>
                Suggested: ₹{suggestion.suggested_amount.toLocaleString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render category analysis
  const renderCategoryAnalysis = () => {
    if (!insightsData?.category_analysis) return null;

    const categories = Object.entries(insightsData.category_analysis)
      .sort(([_, a], [__, b]) => b.total - a.total)
      .slice(0, 5);

    return (
      <View style={styles.analysisContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Categories</Text>
        {categories.map(([category, data], index) => (
          <Animated.View key={category} entering={FadeInUp.delay(100 + index * 50)}>
            <View style={[styles.categoryCard, { backgroundColor: colors.surface }]}>
              <View style={styles.categoryHeader}>
                <Ionicons
                  name={getCategoryIcon(category)}
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>{category}</Text>
                  <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                    {data.count} transactions
                  </Text>
                </View>
                <Text style={[styles.categoryAmount, { color: colors.text }]}>
                  ₹{data.total.toLocaleString()}
                </Text>
              </View>
              <View style={styles.categoryProgress}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: colors.primary, width: `${data.percentage}%` }
                    ]}
                  />
                </View>
                <Text style={[styles.categoryPercentage, { color: colors.textSecondary }]}>
                  {data.percentage}%
                </Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
    );
  };

  // Get category icon
  const getCategoryIcon = (category: string): any => {
    const iconMap: { [key: string]: string } = {
      'Food & Dining': 'restaurant',
      'Transportation': 'car',
      'Shopping': 'bag',
      'Entertainment': 'game-controller',
      'Healthcare': 'medical',
      'Bills & Utilities': 'flash',
      'Education': 'school',
      'Travel': 'airplane',
      'Other': 'ellipsis-horizontal'
    };
    return iconMap[category] || 'ellipsis-horizontal';
  };

  // Render content based on active tab
  const renderTabContent = () => {
    if (!insightsData) return null;

    switch (activeTab) {
      case 'insights':
        return (
          <View style={styles.tabContent}>
            {insightsData.spending_insights.map(renderInsightCard)}
            {insightsData.spending_insights.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="analytics" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
                  No insights available yet
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.textMuted }]}>
                  Add more transactions to get AI-powered insights
                </Text>
              </View>
            )}
          </View>
        );

      case 'suggestions':
        return (
          <View style={styles.tabContent}>
            {insightsData.smart_suggestions.map(renderSuggestionCard)}
            {insightsData.smart_suggestions.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="bulb" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
                  No suggestions available
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.textMuted }]}>
                  Your spending looks good!
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <BlurView intensity={20} style={StyleSheet.absoluteFill}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={['#1e40af', '#3b82f6']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="sparkles" size={28} color="#ffffff" />
              <Text style={styles.headerTitle}>AI Insights</Text>
            </View>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <Animated.View style={[styles.content, animatedStyle]}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Period Selector */}
            {renderPeriodSelector()}

            {/* Loading State */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Analyzing your financial data...
                </Text>
              </View>
            ) : insightsData === null ? (
              /* No Real Data Available */
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>
                  No Expense Data Found
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                  Add some expenses to your account to get personalized AI insights and financial analysis.
                </Text>
                <TouchableOpacity 
                  style={[styles.addDataButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    onClose();
                    // Navigate to add expense screen
                  }}
                >
                  <Ionicons name="add" size={20} color="#ffffff" />
                  <Text style={styles.addDataButtonText}>Add Expenses</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Financial Health Card */}
                {renderFinancialHealth()}

                {/* Quick Financial Overview */}
                {renderFinancialOverview()}

                {/* Tab Selector */}
                {renderTabSelector()}

                {/* Tab Content */}
                {renderTabContent()}
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 20,
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  healthCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  healthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  healthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  healthScore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthScoreText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  healthMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  healthMetric: {
    alignItems: 'center',
  },
  healthMetricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  healthMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  tabSelector: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    gap: 16,
  },
  insightCard: {
    borderRadius: 12,
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  insightTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  insightSuggestion: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  suggestionCard: {
    borderRadius: 12,
    padding: 16,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  suggestionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  suggestionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  suggestionAmount: {
    alignItems: 'flex-end',
  },
  suggestionAmountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  analysisContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  categoryCard: {
    borderRadius: 12,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOverviewItem: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    gap: 6,
  },
  addDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  addDataButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AIInsightsScreen;