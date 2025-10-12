import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../contexts/ThemeContext';
import { TimePeriod } from '../services/databaseService';
import {
    AIInsights,
    enhancedGeminiAIInsightsService
} from '../services/enhancedGeminiAIInsightsService';
import { auth } from '../services/firebase/firebase';

const { width: screenWidth } = Dimensions.get('window');

interface SimpleAIInsightsScreenProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SimpleAIInsightsScreen: React.FC<SimpleAIInsightsScreenProps> = ({
  isVisible,
  onClose
}) => {
  const { isDarkTheme } = useTheme();
  
  // State management
  const [insightsData, setInsightsData] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');

  // Theme colors - Enhanced professional palette
  const colors = {
    background: isDarkTheme ? '#0B0F1A' : '#FAFBFC',
    surface: isDarkTheme ? '#1A1F2E' : '#FFFFFF',
    surfaceElevated: isDarkTheme ? '#252A3A' : '#F8F9FA',
    primary: '#1DB584',
    primaryLight: '#34D399',
    primaryDark: '#047857',
    accent: '#3B82F6',
    accentLight: '#60A5FA',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    text: isDarkTheme ? '#F8FAFC' : '#1E293B',
    textSecondary: isDarkTheme ? '#94A3B8' : '#64748B',
    textMuted: isDarkTheme ? '#64748B' : '#9CA3AF',
    border: isDarkTheme ? '#2D3748' : '#E2E8F0',
    borderLight: isDarkTheme ? '#374151' : '#F1F5F9',
    shadow: isDarkTheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.08)',
    overlay: isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.95)'
  };

  // Load insights
  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`🔍 Loading AI insights for period: ${selectedPeriod}`);
      
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to view insights');
        return;
      }

      const data = await enhancedGeminiAIInsightsService.generateAIInsights(user.uid, selectedPeriod);
      
      if (data) {
        setInsightsData(data);
        console.log(`✅ Loaded insights: ₹${data.totalSpent} spent in ${data.totalTransactions} transactions`);
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

  // Load insights when screen becomes visible or period changes
  useEffect(() => {
    if (isVisible) {
      loadInsights();
    }
  }, [isVisible, loadInsights]);

  // Period selection buttons - Enhanced design
  const renderPeriodSelector = () => {
    const periods: Array<{key: TimePeriod, label: string, icon: string}> = [
      { key: 'day', label: 'Today', icon: 'today' },
      { key: 'week', label: 'Week', icon: 'calendar' },
      { key: 'month', label: 'Month', icon: 'calendar-outline' },
      { key: 'year', label: 'Year', icon: 'time' }
    ];

    return (
      <View style={[styles.periodSelectorContainer, { backgroundColor: colors.surfaceElevated }]}>
        <Text style={[styles.periodSelectorTitle, { color: colors.textSecondary }]}>
          Time Period
        </Text>
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                {
                  backgroundColor: selectedPeriod === period.key ? colors.primary : colors.surface,
                  borderColor: selectedPeriod === period.key ? colors.primary : colors.borderLight,
                  shadowColor: selectedPeriod === period.key ? colors.primary : colors.shadow,
                  shadowOpacity: selectedPeriod === period.key ? 0.3 : 0.1,
                  elevation: selectedPeriod === period.key ? 4 : 2,
                }
              ]}
              onPress={() => setSelectedPeriod(period.key)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={period.icon as any} 
                size={16} 
                color={selectedPeriod === period.key ? '#ffffff' : colors.textMuted} 
              />
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color: selectedPeriod === period.key ? '#ffffff' : colors.text,
                    fontWeight: selectedPeriod === period.key ? '600' : '500'
                  }
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Main analytics card - Complete Professional Redesign
  const renderAnalyticsCard = () => {
    if (!insightsData) return null;

    return (
      <Animated.View
        entering={FadeInUp.delay(200)}
        style={[styles.modernAnalyticsCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      >
        {/* Modern Header */}
        <View style={[styles.modernHeader, { backgroundColor: colors.surface }]}>
          <View style={styles.headerContent}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="analytics-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.modernHeaderTitle, { color: colors.text }]}>Financial Overview</Text>
              <Text style={[styles.modernHeaderSubtitle, { color: colors.textSecondary }]}>
                {selectedPeriod === 'day' ? "Today's Summary" :
                 selectedPeriod === 'week' ? "Weekly Summary" :
                 selectedPeriod === 'month' ? "Monthly Summary" :
                 "Yearly Summary"}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Stats Grid */}
        <View style={styles.modernStatsGrid}>
          {/* Total Spent - Large Card */}
          <View style={[styles.primaryMetricCard, { backgroundColor: colors.primary + '08' }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="wallet-outline" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Spent</Text>
            </View>
            <Text style={[styles.primaryMetricValue, { color: colors.text }]}>
              ₹{insightsData.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Text>
          </View>

          {/* Secondary Metrics Row */}
          <View style={styles.secondaryMetricsRow}>
            {/* Transactions */}
            <View style={[styles.secondaryMetricCard, { backgroundColor: colors.accent + '08' }]}>
              <View style={styles.smallMetricHeader}>
                <Ionicons name="receipt-outline" size={14} color={colors.accent} />
                <Text style={[styles.smallMetricLabel, { color: colors.textMuted }]}>Transactions</Text>
              </View>
              <Text style={[styles.secondaryMetricValue, { color: colors.text }]}>
                {insightsData.totalTransactions}
              </Text>
            </View>

            {/* Average */}
            <View style={[styles.secondaryMetricCard, { backgroundColor: colors.warning + '08' }]}>
              <View style={styles.smallMetricHeader}>
                <Ionicons name="trending-up-outline" size={14} color={colors.warning} />
                <Text style={[styles.smallMetricLabel, { color: colors.textMuted }]}>Average</Text>
              </View>
              <Text style={[styles.secondaryMetricValue, { color: colors.text }]}>
                ₹{insightsData.avgTransactionAmount.toFixed(0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Summary */}
        <View style={[styles.modernSummaryBar, { backgroundColor: colors.surfaceElevated }]}>
          <View style={styles.summaryItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.summaryItemText, { color: colors.textSecondary }]}>
              {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Period
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.summaryItemText, { color: colors.textSecondary }]}>
              Updated now
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Summary card
  const renderSummaryCard = () => {
    if (!insightsData) return null;

    return (
      <Animated.View
        entering={FadeInUp.delay(400)}
        style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="document-text" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>AI Summary</Text>
        </View>
        
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {insightsData.summary}
        </Text>
      </Animated.View>
    );
  };

  // Recommendations card
  const renderRecommendationsCard = () => {
    if (!insightsData || insightsData.recommendations.length === 0) return null;

    return (
      <Animated.View
        entering={FadeInUp.delay(600)}
        style={[styles.recommendationsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="bulb" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>AI Recommendations</Text>
        </View>
        
        {insightsData.recommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
              {recommendation}
            </Text>
          </View>
        ))}
      </Animated.View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <StatusBar 
            barStyle={isDarkTheme ? "light-content" : "dark-content"} 
            backgroundColor={colors.background}
            translucent={false}
          />
          
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>AI Insights</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Analyzing your financial data...
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Main render
  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar 
          barStyle={isDarkTheme ? "light-content" : "dark-content"} 
          backgroundColor={colors.background}
          translucent={false}
        />
        
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>AI Insights</Text>
          <TouchableOpacity onPress={loadInsights} style={[styles.refreshButton, { backgroundColor: colors.surface }]}>
            <Ionicons name="refresh" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadInsights}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderPeriodSelector()}
          
          {/* Show content or empty state */}
          {insightsData ? (
            <>
              {renderAnalyticsCard()}
              {renderSummaryCard()}
              {renderRecommendationsCard()}
              
              {/* Footer */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  Generated on {insightsData?.generatedAt?.toLocaleString()}
                </Text>
              </View>
            </>
          ) : (
            /* Empty State */
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                No Data Available
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Add some expenses to get AI-powered insights about your spending patterns and financial health.
              </Text>
              <TouchableOpacity 
                style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
                onPress={onClose}
              >
                <Ionicons name="add" size={20} color="#ffffff" />
                <Text style={styles.emptyStateButtonText}>Add Expenses</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  
  // Period Selector Styles - Modern Design
  periodSelectorContainer: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    marginVertical: 8,
  },
  periodSelectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 6,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  
  // Analytics Card Styles
  analyticsCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  analyticsGradient: {
    padding: 24,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  analyticsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsHeaderText: {
    flex: 1,
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  analyticsSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  analyticsContent: {
    padding: 24,
    gap: 20,
  },
  
  // Primary Stats
  primaryStatsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  primaryStatItem: {
    flex: 1,
    padding: 24,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  primaryStatValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  
  // Secondary Stats
  secondaryStatsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  secondaryStatContent: {
    flex: 1,
  },
  secondaryStatValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  secondaryStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  
  // Card Styles
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  
  // Recommendations
  recommendationsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '400',
    opacity: 0.7,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    minHeight: 400,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 36,
    letterSpacing: -0.2,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Modern Analytics Card Styles
  modernAnalyticsCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginVertical: 8,
  },
  modernHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  modernHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  modernHeaderSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  modernStatsGrid: {
    padding: 20,
    gap: 16,
  },
  primaryMetricCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metricIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
    textTransform: 'uppercase',
  },
  primaryMetricValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 36,
  },
  secondaryMetricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryMetricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  smallMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  smallMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
    textTransform: 'uppercase',
  },
  secondaryMetricValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  modernSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryItemText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  summaryDivider: {
    width: 1,
    height: 16,
  },
});