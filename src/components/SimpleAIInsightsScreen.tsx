import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

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

  // Theme colors
  const colors = {
    background: isDarkTheme ? '#0f172a' : '#ffffff',
    surface: isDarkTheme ? '#1e293b' : '#f8fafc',
    primary: '#10b981',
    text: isDarkTheme ? '#f1f5f9' : '#1e293b',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b',
    border: isDarkTheme ? '#374151' : '#e5e7eb',
    shadow: isDarkTheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'
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

  // Period selection buttons
  const renderPeriodSelector = () => {
    const periods: Array<{key: TimePeriod, label: string}> = [
      { key: 'day', label: 'Today' },
      { key: 'week', label: 'Week' },
      { key: 'month', label: 'Month' },
      { key: 'year', label: 'Year' }
    ];

    return (
      <View style={[styles.periodSelector, { backgroundColor: colors.surface }]}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === period.key ? colors.primary : 'transparent',
                borderColor: colors.border
              }
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text
              style={[
                styles.periodButtonText,
                {
                  color: selectedPeriod === period.key ? '#ffffff' : colors.text
                }
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Main analytics card
  const renderAnalyticsCard = () => {
    if (!insightsData) return null;

    return (
      <Animated.View
        entering={FadeInUp.delay(200)}
        style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <LinearGradient
          colors={[colors.primary, '#059669']}
          style={styles.analyticsGradient}
        >
          <View style={styles.analyticsHeader}>
            <Ionicons name="analytics" size={28} color="#ffffff" />
            <Text style={styles.analyticsTitle}>Financial Overview</Text>
          </View>
        </LinearGradient>

        <View style={styles.analyticsContent}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                ₹{insightsData.totalSpent.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Spent
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {insightsData.totalTransactions}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Transactions
              </Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                ₹{insightsData.avgTransactionAmount.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Avg. Transaction
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {selectedPeriod.toUpperCase()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Period
              </Text>
            </View>
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
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
      </View>
    );
  }

  // Main render
  if (!isVisible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AI Insights</Text>
        <TouchableOpacity onPress={loadInsights} style={styles.refreshButton}>
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
      >
        {renderPeriodSelector()}
        {renderAnalyticsCard()}
        {renderSummaryCard()}
        {renderRecommendationsCard()}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Generated on {insightsData?.generatedAt?.toLocaleString()}
          </Text>
        </View>
      </ScrollView>
    </View>
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  refreshButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  analyticsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  analyticsGradient: {
    padding: 20,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  analyticsContent: {
    padding: 20,
    gap: 16,
  },
  statRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  recommendationsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});