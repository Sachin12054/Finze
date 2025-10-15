import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../contexts/ThemeContext';
import { TimePeriod } from '../services/databaseService';
import {
    AIInsights,
    enhancedGeminiAIInsightsService
} from '../services/enhancedGeminiAIInsightsService';
import { auth } from '../services/firebase/firebase';

const { width: screenWidth } = Dimensions.get('window');

interface ProfessionalAIInsightsScreenProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ProfessionalAIInsightsScreen: React.FC<ProfessionalAIInsightsScreenProps> = ({
  isVisible,
  onClose
}) => {
  const { isDarkTheme } = useTheme();
  
  // State management
  const [insightsData, setInsightsData] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('day');

  // Professional color palette
  const colors = {
    // Background colors
    background: isDarkTheme ? '#0A0E1A' : '#F8FAFC',
    surface: isDarkTheme ? '#1A1F2E' : '#FFFFFF',
    surfaceElevated: isDarkTheme ? '#252A3A' : '#F1F5F9',
    surfaceHighlight: isDarkTheme ? '#2D3748' : '#E2E8F0',
    
    // Brand colors
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#1D4ED8',
    secondary: '#06B6D4',
    accent: '#8B5CF6',
    
    // Status colors
    success: '#059669',
    successLight: '#10B981',
    warning: '#D97706',
    warningLight: '#F59E0B',
    error: '#DC2626',
    errorLight: '#EF4444',
    
    // Text colors
    text: isDarkTheme ? '#F8FAFC' : '#0F172A',
    textSecondary: isDarkTheme ? '#CBD5E1' : '#475569',
    textMuted: isDarkTheme ? '#94A3B8' : '#64748B',
    textLight: isDarkTheme ? '#64748B' : '#94A3B8',
    
    // Border and shadow
    border: isDarkTheme ? '#374151' : '#E2E8F0',
    borderLight: isDarkTheme ? '#4B5563' : '#F1F5F9',
    shadow: isDarkTheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)',
    
    // Gradients
    gradientStart: isDarkTheme ? '#1E293B' : '#FFFFFF',
    gradientEnd: isDarkTheme ? '#0F172A' : '#F8FAFC',
  };

  // Load insights function
  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`🔍 Loading AI insights for period: ${selectedPeriod}`);
      
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Required', 'Please sign in to view your insights');
        return;
      }

      const data = await enhancedGeminiAIInsightsService.generateAIInsights(user.uid, selectedPeriod);
      
      if (data) {
        setInsightsData(data);
        console.log(`✅ Successfully loaded insights for ${selectedPeriod}`);
      } else {
        setInsightsData(null);
        console.log('ℹ️ No insights data available for selected period');
      }
    } catch (error) {
      console.error('❌ Error loading AI insights:', error);
      Alert.alert('Error', 'Failed to load insights. Please check your connection and try again.');
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

  // Enhanced period selector with icons and better design
  const renderPeriodSelector = () => {
    const periods: Array<{key: TimePeriod, label: string, icon: string, description: string}> = [
      { key: 'day', label: 'Today', icon: 'today', description: 'Last 24 hours' },
      { key: 'week', label: 'Week', icon: 'calendar', description: 'Last 7 days' },
      { key: 'month', label: 'Month', icon: 'calendar-outline', description: 'Last 30 days' },
      { key: 'year', label: 'Year', icon: 'time', description: 'Last 12 months' }
    ];

    return (
      <Animated.View 
        entering={FadeInDown.delay(100)}
        style={[styles.periodSelectorContainer, { backgroundColor: colors.surface }]}
      >
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.sectionHeaderText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Time Period</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Select analysis timeframe
            </Text>
          </View>
        </View>
        
        <View style={styles.periodGridContainer}>
          {/* First Row */}
          <View style={styles.periodGridRow}>
            {periods.slice(0, 2).map((period, index) => (
              <Animated.View
                key={period.key}
                entering={SlideInRight.delay(200 + index * 100)}
                style={styles.periodGridItem}
              >
                <TouchableOpacity
                  style={[
                    styles.periodCard,
                    {
                      backgroundColor: selectedPeriod === period.key ? colors.primary : colors.surface,
                      borderColor: selectedPeriod === period.key ? colors.primary : 'rgba(0,0,0,0.08)',
                      shadowColor: selectedPeriod === period.key ? colors.primary : '#000',
                      shadowOpacity: selectedPeriod === period.key ? 0.35 : 0.08,
                      shadowOffset: { width: 0, height: selectedPeriod === period.key ? 8 : 2 },
                      elevation: selectedPeriod === period.key ? 12 : 3,
                      transform: [{ scale: selectedPeriod === period.key ? 1.02 : 1 }],
                    }
                  ]}
                  onPress={() => setSelectedPeriod(period.key)}
                  activeOpacity={0.85}
                >
                  <View style={[
                    styles.periodIconContainer,
                    { backgroundColor: selectedPeriod === period.key ? 'rgba(255,255,255,0.3)' : colors.primary + '18' }
                  ]}>
                    <Ionicons 
                      name={period.icon as any} 
                      size={24} 
                      color={selectedPeriod === period.key ? '#ffffff' : colors.primary} 
                    />
                  </View>
                  <Text style={[
                    styles.periodLabel,
                    { color: selectedPeriod === period.key ? '#ffffff' : colors.text }
                  ]}>
                    {period.label}
                  </Text>
                  <Text style={[
                    styles.periodDescription,
                    { color: selectedPeriod === period.key ? 'rgba(255,255,255,0.85)' : colors.textMuted }
                  ]}>
                    {period.description}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          
          {/* Second Row */}
          <View style={styles.periodGridRow}>
            {periods.slice(2, 4).map((period, index) => (
              <Animated.View
                key={period.key}
                entering={SlideInRight.delay(400 + index * 100)}
                style={styles.periodGridItem}
              >
                <TouchableOpacity
                  style={[
                    styles.periodCard,
                    {
                      backgroundColor: selectedPeriod === period.key ? colors.primary : colors.surface,
                      borderColor: selectedPeriod === period.key ? colors.primary : 'rgba(0,0,0,0.08)',
                      shadowColor: selectedPeriod === period.key ? colors.primary : '#000',
                      shadowOpacity: selectedPeriod === period.key ? 0.35 : 0.08,
                      shadowOffset: { width: 0, height: selectedPeriod === period.key ? 8 : 2 },
                      elevation: selectedPeriod === period.key ? 12 : 3,
                      transform: [{ scale: selectedPeriod === period.key ? 1.02 : 1 }],
                    }
                  ]}
                  onPress={() => setSelectedPeriod(period.key)}
                  activeOpacity={0.85}
                >
                  <View style={[
                    styles.periodIconContainer,
                    { backgroundColor: selectedPeriod === period.key ? 'rgba(255,255,255,0.3)' : colors.primary + '18' }
                  ]}>
                    <Ionicons 
                      name={period.icon as any} 
                      size={24} 
                      color={selectedPeriod === period.key ? '#ffffff' : colors.primary} 
                    />
                  </View>
                  <Text style={[
                    styles.periodLabel,
                    { color: selectedPeriod === period.key ? '#ffffff' : colors.text }
                  ]}>
                    {period.label}
                  </Text>
                  <Text style={[
                    styles.periodDescription,
                    { color: selectedPeriod === period.key ? 'rgba(255,255,255,0.85)' : colors.textMuted }
                  ]}>
                    {period.description}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>
      </Animated.View>
    );
  };

  // Professional analytics dashboard
  const renderAnalyticsDashboard = () => {
    if (!insightsData) return null;

    const formatCurrency = (amount: number) => 
      `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    return (
      <Animated.View entering={FadeInUp.delay(300)} style={styles.dashboardContainer}>
        {/* Main metrics card */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryMetricsCard}
        >
          <View style={styles.primaryMetricsHeader}>
            <View style={styles.primaryIconContainer}>
              <Ionicons name="analytics" size={24} color="#ffffff" />
            </View>
            <View style={styles.primaryHeaderText}>
              <Text style={styles.primaryTitle}>Financial Overview</Text>
              <Text style={styles.primarySubtitle}>
                {selectedPeriod === 'day' ? "Today's Analysis" :
                 selectedPeriod === 'week' ? "Weekly Analysis" :
                 selectedPeriod === 'month' ? "Monthly Analysis" :
                 "Annual Analysis"}
              </Text>
            </View>
          </View>

          <View style={styles.primaryMetricsContent}>
            <View style={styles.mainMetricContainer}>
              <Text style={styles.mainMetricLabel}>Total Spending</Text>
              <Text style={styles.mainMetricValue}>
                {formatCurrency(insightsData.totalSpent)}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <View style={styles.metricIconWrapper}>
                  <Ionicons name="receipt" size={16} color="#ffffff" />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricValueText}>{insightsData.totalTransactions}</Text>
                  <Text style={styles.metricLabelText}>Transactions</Text>
                </View>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />

              <View style={styles.metricItem}>
                <View style={styles.metricIconWrapper}>
                  <Ionicons name="trending-up" size={16} color="#ffffff" />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricValueText}>
                    {formatCurrency(insightsData.avgTransactionAmount)}
                  </Text>
                  <Text style={styles.metricLabelText}>Average</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Secondary metrics grid */}
        <View style={styles.secondaryMetricsGrid}>
          <View style={[styles.secondaryMetricCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.secondaryMetricIcon, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="trending-up" size={20} color={colors.success} />
            </View>
            <Text style={[styles.secondaryMetricValue, { color: colors.text }]}>
              {insightsData.totalTransactions > 0 ? '↗️' : '→'}
            </Text>
            <Text style={[styles.secondaryMetricLabel, { color: colors.textMuted }]}>
              Activity Trend
            </Text>
          </View>

          <View style={[styles.secondaryMetricCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.secondaryMetricIcon, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="calendar" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.secondaryMetricValue, { color: colors.text }]}>
              {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
            </Text>
            <Text style={[styles.secondaryMetricLabel, { color: colors.textMuted }]}>
              Time Frame
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Enhanced AI summary card
  const renderAISummaryCard = () => {
    if (!insightsData) return null;

    return (
      <Animated.View 
        entering={FadeInUp.delay(500)}
        style={[styles.summaryCard, { backgroundColor: colors.surface }]}
      >
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={[colors.accent, colors.primaryLight]}
            style={styles.cardIconContainer}
          >
            <Ionicons name="sparkles" size={20} color="#ffffff" />
          </LinearGradient>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>AI Analysis</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              Intelligent insights from your data
            </Text>
          </View>
        </View>
        
        <View style={[styles.summaryContent, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
            {insightsData.summary}
          </Text>
        </View>
      </Animated.View>
    );
  };

  // Professional recommendations section
  const renderRecommendationsSection = () => {
    if (!insightsData || insightsData.recommendations.length === 0) return null;

    return (
      <Animated.View 
        entering={FadeInUp.delay(700)}
        style={[styles.recommendationsCard, { backgroundColor: colors.surface }]}
      >
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={[colors.success, colors.successLight]}
            style={styles.cardIconContainer}
          >
            <Ionicons name="bulb" size={20} color="#ffffff" />
          </LinearGradient>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Smart Recommendations</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              Personalized financial tips
            </Text>
          </View>
        </View>
        
        <View style={styles.recommendationsList}>
          {insightsData.recommendations.map((recommendation, index) => (
            <Animated.View 
              key={index}
              entering={SlideInRight.delay(800 + index * 100)}
              style={[styles.recommendationItem, { backgroundColor: colors.surfaceElevated }]}
            >
              <View style={[styles.recommendationIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
              </View>
              <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
                {recommendation}
              </Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    );
  };

  // Professional Loading State - Clean & Trustworthy
  const renderLoadingState = () => (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <StatusBar 
            barStyle={isDarkTheme ? "light-content" : "dark-content"} 
            backgroundColor={colors.background}
            translucent={false}
          />
          
          {/* Professional Header */}
          <Animated.View 
            entering={FadeInDown.delay(100)}
            style={[styles.professionalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
          >
            <TouchableOpacity onPress={onClose} style={[styles.professionalBackButton, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.professionalHeaderTitle, { color: colors.text }]}>AI Insights</Text>
            <View style={styles.headerPlaceholder} />
          </Animated.View>
          
          {/* Professional Loading Content */}
          <View style={styles.professionalLoadingContainer}>
            
            {/* Loading Icon with Subtle Animation */}
            <Animated.View 
              entering={FadeInUp.delay(300)}
              style={styles.professionalIconSection}
            >
              <View style={[styles.professionalLoadingIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="analytics-outline" size={32} color="#ffffff" />
              </View>
              <View style={styles.spinnerOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            </Animated.View>
            
            {/* Professional Loading Text */}
            <Animated.View 
              entering={FadeInUp.delay(500)}
              style={styles.professionalTextSection}
            >
              <Text style={[styles.professionalLoadingTitle, { color: colors.text }]}>
                Generating AI Insights
              </Text>
              <Text style={[styles.professionalLoadingSubtitle, { color: colors.textMuted }]}>
                Analyzing your financial data to provide personalized recommendations
              </Text>
            </Animated.View>

            {/* Professional Status Indicator */}
            <Animated.View 
              entering={FadeInUp.delay(700)}
              style={[styles.professionalStatusCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                  Processing your transaction data
                </Text>
              </View>
            </Animated.View>

            {/* Professional Footer Note */}
            <Animated.View 
              entering={FadeInUp.delay(900)}
              style={styles.professionalFooterNote}
            >
              <Text style={[styles.footerNoteText, { color: colors.textLight }]}>
                This may take a few moments depending on your data volume
              </Text>
            </Animated.View>

          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );

  // Empty state with professional design
  const renderEmptyState = () => (
    <Animated.View entering={FadeInUp.delay(300)} style={styles.emptyStateContainer}>
      <LinearGradient
        colors={[colors.surfaceElevated, colors.surface]}
        style={styles.emptyStateCard}
      >
        <View style={[styles.emptyStateIcon, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="analytics-outline" size={48} color={colors.primary} />
        </View>
        
        <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
          No Financial Data Available
        </Text>
        
        <Text style={[styles.emptyStateDescription, { color: colors.textMuted }]}>
          Start tracking your expenses and income to unlock powerful AI-driven insights about your financial patterns and spending habits.
        </Text>
        
        <TouchableOpacity 
          style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={20} color="#ffffff" />
          <Text style={styles.emptyStateButtonText}>Start Tracking</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  // Show loading state
  if (loading) {
    return renderLoadingState();
  }

  // Main component render
  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <StatusBar 
            barStyle={isDarkTheme ? "light-content" : "dark-content"} 
            backgroundColor="transparent"
            translucent={true}
          />
          
          {/* Professional Header */}
          <Animated.View 
            entering={FadeInDown.delay(100)}
            style={[styles.header, { borderBottomColor: colors.border }]}
          >
            <TouchableOpacity 
              onPress={onClose} 
              style={[styles.headerButton, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>AI Insights</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Financial Intelligence
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={loadInsights} 
              style={[styles.headerButton, { backgroundColor: colors.primary + '15' }]}
            >
              <Ionicons name="refresh" size={24} color={colors.primary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={loadInsights}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {renderPeriodSelector()}
            
            {insightsData ? (
              <>
                {renderAnalyticsDashboard()}
                {renderAISummaryCard()}
                {renderRecommendationsSection()}
                
                {/* Professional Footer */}
                <Animated.View 
                  entering={FadeInUp.delay(900)}
                  style={[styles.footer, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.footerContent}>
                    <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>
                      Generated on {insightsData?.generatedAt?.toLocaleString() || new Date().toLocaleString()}
                    </Text>
                  </View>
                  <Text style={[styles.footerSubtext, { color: colors.textLight }]}>
                    AI-powered financial analysis • Secure & Private
                  </Text>
                </Animated.View>
              </>
            ) : (
              renderEmptyState()
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 44,
    height: 44,
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 32,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  loadingIndicators: {
    gap: 16,
    width: '100%',
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 12,
    minHeight: 72,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  loadingStepText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Enhanced Loading Animation Styles
  aiIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 60,
  },
  pulseRing1: {
    width: 120,
    height: 120,
  },
  pulseRing2: {
    width: 140,
    height: 140,
  },
  loadingTextContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  stepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  loadingStepTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  stepStatus: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginLeft: 12,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginTop: 32,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    width: '65%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  
  // Content Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Period Selector Styles
  periodSelectorContainer: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  periodGridContainer: {
    gap: 20,
    paddingHorizontal: 4,
  },
  periodGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 20,
  },
  periodGridItem: {
    flex: 1,
    aspectRatio: 1.15,
  },
  periodCard: {
    flex: 1,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 140,
    backgroundColor: '#ffffff',
  },
  periodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  periodLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  periodDescription: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: -0.1,
    opacity: 0.9,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  
  // Analytics Dashboard Styles
  dashboardContainer: {
    gap: 16,
    marginBottom: 20,
  },
  primaryMetricsCard: {
    borderRadius: 24,
    padding: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  primaryMetricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  primaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryHeaderText: {
    flex: 1,
  },
  primaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  primarySubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  primaryMetricsContent: {
    gap: 20,
  },
  mainMetricContainer: {
    alignItems: 'center',
  },
  mainMetricLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  mainMetricValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricContent: {
    alignItems: 'flex-start',
  },
  metricValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  metricLabelText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 32,
  },
  
  // Secondary Metrics
  secondaryMetricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryMetricCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  secondaryMetricIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  secondaryMetricLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Card Styles
  summaryCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  summaryContent: {
    padding: 16,
    borderRadius: 12,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  
  // Recommendations Styles
  recommendationsCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  recommendationIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  
  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  emptyStateDescription: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.2,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderRadius: 24,
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    minHeight: 72,
    width: '85%',
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  
  // Footer Styles
  footer: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
  },

  // Ultra-Simple Loading Styles - No Fake Elements
  standardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  standardHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Professional Loading Styles
  professionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  professionalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  professionalHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  professionalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  professionalIconSection: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  professionalLoadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  spinnerOverlay: {
    position: 'absolute',
    top: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  professionalTextSection: {
    alignItems: 'center',
    marginBottom: 40,
    maxWidth: 320,
  },
  professionalLoadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  professionalLoadingSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  professionalStatusCard: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    minWidth: 280,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  professionalFooterNote: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerNoteText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 20,
  },
  
  // Minimal Loading Styles (Fallback)
  minimalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinnerSection: {
    marginBottom: 24,
  },
  messageSection: {
    alignItems: 'center',
  },
  loadingMessage: {
    fontSize: 16,
    fontWeight: '400',
  },
});
