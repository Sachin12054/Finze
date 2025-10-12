/**
 * AI Insights Screen Component
 * Comprehensive financial insights powered by Google Gemini AI
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
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { TimePeriod } from '../services/databaseService';
import {
  AIInsights,
  enhancedGeminiAIInsightsService
} from '../services/enhancedGeminiAIInsightsService';
import { auth } from '../services/firebase/firebase';

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
  const [insightsData, setInsightsData] = useState<AIInsights | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'budgets' | 'goals' | 'recommendations'>('overview');
  
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

  // Load comprehensive insights
  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`🔍 Loading AI insights for period: ${selectedPeriod}`);
      
      // Get current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('❌ No authenticated user found');
        Alert.alert('Error', 'Please log in to view AI insights.');
        return;
      }
      
      const data = await enhancedGeminiAIInsightsService.generateAIInsights(currentUser.uid, selectedPeriod);
      
      if (data) {
        setInsightsData(data);
        console.log(`✅ Loaded insights with ₹${data.totalSpent} spent in ${data.totalTransactions} transactions`);
      } else {
        setInsightsData(null);
        console.log('ℹ️ No insights data available');
      }
    } catch (error) {
      console.error('❌ Error loading AI insights:', error);
      Alert.alert('Error', 'Failed to load AI insights. Please try again.');
      setInsightsData(null);
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

  // Get category icon
  const getCategoryIcon = (category: string): any => {
    const iconMap: { [key: string]: string } = {
      'Food & Dining': 'restaurant',
      'food': 'restaurant',
      'Transportation': 'car',
      'transport': 'car',
      'Shopping': 'bag',
      'Entertainment': 'game-controller',
      'Healthcare': 'medical',
      'Bills & Utilities': 'flash',
      'Education': 'school',
      'Travel': 'airplane',
      'income': 'wallet',
      'Income': 'wallet',
      'Other': 'ellipsis-horizontal'
    };
    return iconMap[category] || 'ellipsis-horizontal';
  };

  // Render period selector
  const renderPeriodSelector = () => {
    const periods = [
      { key: 'day', label: 'Today' },
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
            onPress={() => setSelectedPeriod(period.key as TimePeriod)}
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
      { key: 'overview', label: 'Overview', icon: 'analytics' },
      { key: 'categories', label: 'Categories', icon: 'pie-chart' },
      { key: 'budgets', label: 'Budgets', icon: 'wallet' },
      { key: 'goals', label: 'Goals', icon: 'flag' },
      { key: 'recommendations', label: 'AI Tips', icon: 'bulb' }
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={[styles.tabSelector, { backgroundColor: colors.surface }]}
        contentContainerStyle={styles.tabSelectorContent}
      >
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
              size={18}
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
      </ScrollView>
    );
  };

  // Render financial health overview
  const renderFinancialHealthOverview = () => {
    if (!insightsData) return null;

    // Calculate health score based on spending patterns
    const calculateHealthScore = () => {
      const avgDaily = insightsData.timeBasedAnalysis.daily.avgPerDay;
      const totalSpent = insightsData.totalSpent;
      const transactionCount = insightsData.totalTransactions;
      
      let score = 85; // Base score
      
      // Adjust based on spending patterns
      if (avgDaily > 2000) score -= 15;
      else if (avgDaily > 1000) score -= 10;
      else if (avgDaily > 500) score -= 5;
      
      if (transactionCount > 20) score += 5; // Good tracking habits
      if (Object.keys(insightsData.categoryBreakdown).length > 3) score += 5; // Good categorization
      
      return Math.max(Math.min(score, 100), 30); // Clamp between 30-100
    };

    const healthScore = calculateHealthScore();
    const getGrade = (score: number) => {
      if (score >= 90) return 'A+';
      if (score >= 80) return 'A';
      if (score >= 70) return 'B';
      if (score >= 60) return 'C';
      return 'D';
    };

    const healthColor = getHealthScoreColor(healthScore);

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
              <Text style={styles.healthScoreText}>{healthScore}</Text>
              <Text style={styles.healthGrade}>{getGrade(healthScore)}</Text>
            </View>
          </View>
          
          <View style={styles.healthMetrics}>
            <View style={styles.healthMetric}>
              <Text style={styles.healthMetricLabel}>Total Expenses</Text>
              <Text style={styles.healthMetricValue}>
                ₹{insightsData.totalSpent.toLocaleString()}
              </Text>
            </View>
            <View style={styles.healthMetric}>
              <Text style={styles.healthMetricLabel}>Transactions</Text>
              <Text style={styles.healthMetricValue}>
                {insightsData.totalTransactions}
              </Text>
            </View>
            <View style={styles.healthMetric}>
              <Text style={styles.healthMetricLabel}>Avg/Transaction</Text>
              <Text style={styles.healthMetricValue}>
                ₹{Math.round(insightsData.avgTransactionAmount)}
              </Text>
            </View>
          </View>

          <View style={styles.trendIndicator}>
            <Ionicons
              name={insightsData.spendingInsights.spendingPattern.includes('High') ? 'trending-up' : 
                   insightsData.spendingInsights.spendingPattern.includes('small') ? 'trending-down' : 'remove'}
              size={20}
              color="#ffffff"
            />
            <Text style={styles.trendText}>
              Pattern: {insightsData.spendingInsights.spendingPattern}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Render key insights summary
  const renderKeyInsights = () => {
    if (!insightsData || insightsData.recommendations.length === 0) return null;

    const topRecommendations = insightsData.recommendations.slice(0, 3);

    return (
      <Animated.View entering={FadeInUp.delay(300)}>
        <View style={[styles.categoryCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Key AI Insights</Text>
          {topRecommendations.map((recommendation: string, index: number) => (
            <View key={index} style={styles.insightSummaryItem}>
              <View style={[styles.priorityDot, { backgroundColor: index === 0 ? colors.error : index === 1 ? colors.warning : colors.success }]} />
              <View style={styles.insightSummaryContent}>
                <Text style={[styles.insightSummaryTitle, { color: colors.text }]} numberOfLines={1}>
                  AI Recommendation #{index + 1}
                </Text>
                <Text style={[styles.insightSummaryDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {recommendation}
                </Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: (index === 0 ? colors.error : index === 1 ? colors.warning : colors.success) + '20' }]}>
                <Text style={[styles.priorityBadgeText, { color: index === 0 ? colors.error : index === 1 ? colors.warning : colors.success }]}>
                  {index === 0 ? 'HIGH' : index === 1 ? 'MEDIUM' : 'LOW'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  // Render top spending categories
  const renderTopCategories = () => {
    if (!insightsData || Object.keys(insightsData.categoryBreakdown).length === 0) return null;

    const categoryEntries = Object.entries(insightsData.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4);

    return (
      <Animated.View entering={FadeInUp.delay(400)}>
        <View style={[styles.categoryCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Spending Categories</Text>
          <View style={styles.categoriesGrid}>
            {categoryEntries.map(([categoryName, amount], index: number) => {
              const percentage = (amount / insightsData.totalSpent) * 100;
              return (
                <View key={categoryName} style={[styles.categoryOverviewItem, { backgroundColor: colors.surfaceHover }]}>
                  <Ionicons
                    name={getCategoryIcon(categoryName)}
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
                    {categoryName}
                  </Text>
                  <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>
                    ₹{amount.toLocaleString()}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: colors.textMuted }]}>
                    {percentage.toFixed(1)}% of total
                  </Text>
                  <Text style={[styles.categoryTransactions, { color: colors.textMuted }]}>
                    {Math.round(percentage)}% share
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>
    );
  };

  // Render category analysis tab
  const renderCategoryAnalysis = () => {
    if (!insightsData || Object.keys(insightsData.categoryBreakdown).length === 0) return null;

    const categoryEntries = Object.entries(insightsData.categoryBreakdown)
      .sort(([,a], [,b]) => b - a);

    return (
      <View style={styles.tabContent}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Performance</Text>
        {categoryEntries.map(([categoryName, amount], index: number) => {
          const percentage = (amount / insightsData.totalSpent) * 100;
          return (
            <Animated.View key={categoryName} entering={FadeInUp.delay(100 + index * 50)}>
              <View style={[styles.categoryCard, { backgroundColor: colors.surface }]}>
                <View style={styles.categoryHeader}>
                  <Ionicons
                    name={getCategoryIcon(categoryName)}
                    size={24}
                    color={colors.primary}
                  />
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>{categoryName}</Text>
                    <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                      {percentage.toFixed(1)}% of total spending
                    </Text>
                  </View>
                  <View style={styles.categoryAmountContainer}>
                    <Text style={[styles.categoryAmount, { color: colors.text }]}>
                      ₹{amount.toLocaleString()}
                    </Text>
                    <Text style={[styles.categoryPercentage, { color: colors.textSecondary }]}>
                      {percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                
                <View style={styles.categoryProgress}>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { 
                          backgroundColor: percentage > 40 ? colors.error : percentage > 25 ? colors.warning : colors.primary, 
                          width: `${Math.min(percentage, 100)}%` 
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.trendIndicatorText, { color: colors.textMuted }]}>
                    Category share
                  </Text>
                </View>

                <View style={styles.categoryRecommendations}>
                  <Text style={[styles.recommendationsTitle, { color: colors.text }]}>AI Tips:</Text>
                  {insightsData.budgetSuggestions.slice(0, 2).map((suggestion: string, idx: number) => (
                    <Text key={idx} style={[styles.recommendationText, { color: colors.textSecondary }]}>
                      • {suggestion}
                    </Text>
                  ))}
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  // Render budget performance tab
  const renderBudgetPerformance = () => {
    // Budget performance data is not available in current AIInsights structure
    return (
      <View style={styles.emptyState}>
        <Ionicons name="wallet" size={48} color={colors.textMuted} />
        <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
          Budget Tracking Coming Soon
        </Text>
        <Text style={[styles.emptyStateSubtext, { color: colors.textMuted }]}>
          Budget performance analysis will be available in a future update. For now, use category insights to monitor your spending.
        </Text>
      </View>
    );
  };

  // Render goals progress tab
  const renderGoalsProgress = () => {
    // Goals progress data is not available in current AIInsights structure
    return (
      <View style={styles.emptyState}>
        <Ionicons name="flag" size={48} color={colors.textMuted} />
        <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
          Financial Goals Coming Soon
        </Text>
        <Text style={[styles.emptyStateSubtext, { color: colors.textMuted }]}>
          Goal tracking and progress analysis will be available in a future update. Continue tracking expenses to prepare for when this feature launches.
        </Text>
      </View>
    );
  };

  // Render AI recommendations tab
  const renderRecommendations = () => {
    if (!insightsData?.recommendations || insightsData.recommendations.length === 0) return null;

    // Divide recommendations into categories for better organization
    const allRecommendations = insightsData.recommendations;
    const immediate = allRecommendations.slice(0, Math.ceil(allRecommendations.length / 3));
    const shortTerm = allRecommendations.slice(Math.ceil(allRecommendations.length / 3), Math.ceil(allRecommendations.length * 2 / 3));
    const longTerm = allRecommendations.slice(Math.ceil(allRecommendations.length * 2 / 3));

    return (
      <View style={styles.tabContent}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Recommendations</Text>
        
        {/* Immediate Actions */}
        {immediate.length > 0 && (
          <Animated.View entering={FadeInUp.delay(100)}>
            <View style={[styles.recommendationSection, { backgroundColor: colors.surface }]}>
              <View style={styles.recommendationSectionHeader}>
                <Ionicons name="flash" size={20} color={colors.error} />
                <Text style={[styles.recommendationSectionTitle, { color: colors.text }]}>
                  Immediate Actions
                </Text>
              </View>
              {immediate.map((rec: string, index: number) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={[styles.priorityDot, { backgroundColor: colors.error }]} />
                  <Text style={[styles.recommendationItemText, { color: colors.textSecondary }]}>
                    {rec}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Short-term Goals */}
        {shortTerm.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200)}>
            <View style={[styles.recommendationSection, { backgroundColor: colors.surface }]}>
              <View style={styles.recommendationSectionHeader}>
                <Ionicons name="calendar" size={20} color={colors.warning} />
                <Text style={[styles.recommendationSectionTitle, { color: colors.text }]}>
                  Short-term (1-3 months)
                </Text>
              </View>
              {shortTerm.map((rec: string, index: number) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={[styles.priorityDot, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.recommendationItemText, { color: colors.textSecondary }]}>
                    {rec}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Long-term Goals */}
        {longTerm.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300)}>
            <View style={[styles.recommendationSection, { backgroundColor: colors.surface }]}>
              <View style={styles.recommendationSectionHeader}>
                <Ionicons name="trending-up" size={20} color={colors.success} />
                <Text style={[styles.recommendationSectionTitle, { color: colors.text }]}>
                  Long-term (6+ months)
                </Text>
              </View>
              {longTerm.map((rec: string, index: number) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={[styles.priorityDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.recommendationItemText, { color: colors.textSecondary }]}>
                    {rec}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Budget Suggestions */}
        {insightsData.budgetSuggestions.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400)}>
            <View style={[styles.recommendationSection, { backgroundColor: colors.surface }]}>
              <View style={styles.recommendationSectionHeader}>
                <Ionicons name="wallet" size={20} color={colors.primary} />
                <Text style={[styles.recommendationSectionTitle, { color: colors.text }]}>
                  Budget Suggestions
                </Text>
              </View>
              {insightsData.budgetSuggestions.map((suggestion: string, index: number) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={[styles.priorityDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.recommendationItemText, { color: colors.textSecondary }]}>
                    {suggestion}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </View>
    );
  };

  // Render content based on active tab
  const renderTabContent = () => {
    if (!insightsData) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.tabContent}>
            {renderKeyInsights()}
            {renderTopCategories()}
          </View>
        );
      case 'categories':
        return renderCategoryAnalysis();
      case 'budgets':
        return renderBudgetPerformance();
      case 'goals':
        return renderGoalsProgress();
      case 'recommendations':
        return renderRecommendations();
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
                  Analyzing your financial data with AI...
                </Text>
              </View>
            ) : insightsData === null ? (
              /* No Data Available */
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>
                  No Financial Data Found
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                  Add expenses, set budgets, and create goals to get personalized AI insights and recommendations.
                </Text>
                <TouchableOpacity 
                  style={[styles.addDataButton, { backgroundColor: colors.primary }]}
                  onPress={onClose}
                >
                  <Ionicons name="add" size={20} color="#ffffff" />
                  <Text style={styles.addDataButtonText}>Get Started</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Financial Health Overview */}
                {renderFinancialHealthOverview()}

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
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthScoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  healthGrade: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
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
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 6,
  },
  tabSelectorContent: {
    paddingHorizontal: 6,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 2,
    minWidth: 100,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabContent: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  categoryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  categoryAmountContainer: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryPercentage: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
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
  trendIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'right',
  },
  categoryRecommendations: {
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
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
    alignItems: 'center',
    gap: 6,
  },
  categoryTransactions: {
    fontSize: 11,
    fontWeight: '500',
  },
  insightSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  insightSummaryContent: {
    flex: 1,
  },
  insightSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  insightSummaryDescription: {
    fontSize: 12,
    lineHeight: 16,
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
  budgetCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  budgetTitleContainer: {
    flex: 1,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  budgetDaysRemaining: {
    fontSize: 12,
  },
  budgetStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  budgetStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  budgetAmountItem: {
    alignItems: 'center',
  },
  budgetAmountLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  budgetAmountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  budgetPercentageText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'right',
  },
  budgetRecommendations: {
    marginTop: 8,
  },
  goalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalTimeline: {
    fontSize: 12,
  },
  goalStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  goalStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalAmountItem: {
    alignItems: 'center',
  },
  goalAmountLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  goalAmountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  goalPercentageText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'right',
  },
  goalAdjustedTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  adjustedTimelineText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  goalRecommendations: {
    marginTop: 8,
  },
  recommendationSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recommendationSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recommendationSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
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
    paddingHorizontal: 32,
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