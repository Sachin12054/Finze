import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SmartSuggestionsProps {
  visible: boolean;
  onClose: () => void;
  expenseData?: {
    totalSpending: number;
    transactionCount: number;
    monthlyChange: number;
    topCategories: Array<{
      name: string;
      amount: number;
      percentage: number;
      icon: keyof typeof Ionicons.glyphMap;
      color: string;
    }>;
  };
}

interface InsightCard {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value?: string;
}

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const SmartSuggestionsComponent: React.FC<SmartSuggestionsProps> = ({
  visible,
  onClose,
  expenseData,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'trends' | 'recommendations'>('insights');
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(height);

  // Default data when no expense data is provided
  const defaultData = {
    totalSpending: 2450,
    transactionCount: 87,
    monthlyChange: -12,
    topCategories: [
      { name: 'Food & Dining', amount: 856, percentage: 35, icon: 'restaurant' as const, color: '#FF6B6B' },
      { name: 'Transportation', amount: 612, percentage: 25, icon: 'car' as const, color: '#4ECDC4' },
      { name: 'Entertainment', amount: 490, percentage: 20, icon: 'game-controller' as const, color: '#45B7D1' },
      { name: 'Shopping', amount: 392, percentage: 16, icon: 'bag' as const, color: '#F39C12' },
    ]
  };

  const data = expenseData || defaultData;
  
  // Calculate financial health score (0-100)
  const calculateFinancialHealth = () => {
    if (data.totalSpending === 0) return 0;
    
    let score = 70; // Base score
    
    // Adjust based on spending trend
    if (data.monthlyChange < -20) score += 15; // Great reduction
    else if (data.monthlyChange < -10) score += 10; // Good reduction
    else if (data.monthlyChange < 0) score += 5; // Some reduction
    else if (data.monthlyChange > 20) score -= 15; // High increase
    else if (data.monthlyChange > 10) score -= 10; // Moderate increase
    else if (data.monthlyChange > 0) score -= 5; // Small increase
    
    // Adjust based on transaction frequency (more transactions might indicate better tracking)
    if (data.transactionCount > 50) score += 5;
    else if (data.transactionCount < 10) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const financialHealth = calculateFinancialHealth();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const mockInsights: InsightCard[] = [
    {
      id: '1',
      title: 'Spending Pattern',
      description: 'Your food expenses increased by 15% this month',
      icon: 'restaurant',
      color: '#FF6B6B',
      value: '+15%'
    },
    {
      id: '2',
      title: 'Budget Optimization',
      description: 'You could save $120 by reducing entertainment costs',
      icon: 'bulb',
      color: '#4ECDC4',
      value: '$120'
    },
    {
      id: '3',
      title: 'Category Analysis',
      description: 'Transportation is your highest expense category',
      icon: 'car',
      color: '#45B7D1',
      value: '32%'
    },
    {
      id: '4',
      title: 'Trend Forecast',
      description: 'Based on current trends, monthly expenses will increase',
      icon: 'trending-up',
      color: '#F39C12',
      value: '+8%'
    }
  ];

  const renderCategoryCard = (category: CategoryData, index: number) => (
    <View key={category.name} style={[styles.categoryCard, index % 2 === 0 ? styles.categoryCardLeft : styles.categoryCardRight]}>
      <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}>
        <Ionicons name={category.icon} size={24} color={category.color} />
      </View>
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.categoryAmount}>${category.amount.toLocaleString()}</Text>
      <Text style={styles.categoryPercentage}>{category.percentage}% of total</Text>
    </View>
  );

  const renderFinancialHealthCard = () => {
    const getHealthColor = (score: number) => {
      if (score >= 80) return '#10B981'; // Green
      if (score >= 60) return '#F59E0B'; // Yellow
      if (score >= 40) return '#F97316'; // Orange
      return '#EF4444'; // Red
    };

    const getHealthLabel = (score: number) => {
      if (score >= 80) return 'Excellent';
      if (score >= 60) return 'Good';
      if (score >= 40) return 'Fair';
      return 'Needs Attention';
    };

    const healthColor = getHealthColor(financialHealth);
    const healthLabel = getHealthLabel(financialHealth);

    return (
      <View style={styles.healthCard}>
        <View style={styles.healthHeader}>
          <Text style={styles.healthTitle}>Financial Health</Text>
          <View style={[styles.healthBadge, { backgroundColor: healthColor }]}>
            <Text style={styles.healthBadgeText}>{healthLabel}</Text>
          </View>
        </View>
        <View style={styles.healthScoreContainer}>
          <View style={styles.healthScoreCircle}>
            <Text style={[styles.healthScore, { color: healthColor }]}>{financialHealth}</Text>
            <Text style={styles.healthScoreLabel}>Score</Text>
          </View>
          <View style={styles.healthMetrics}>
            <View style={styles.healthMetric}>
              <Text style={styles.healthMetricValue}>${data.totalSpending.toLocaleString()}</Text>
              <Text style={styles.healthMetricLabel}>Total Spending</Text>
            </View>
            <View style={styles.healthMetric}>
              <Text style={[styles.healthMetricValue, { color: data.monthlyChange < 0 ? '#10B981' : '#EF4444' }]}>
                {data.monthlyChange > 0 ? '+' : ''}{data.monthlyChange}%
              </Text>
              <Text style={styles.healthMetricLabel}>vs Last Month</Text>
            </View>
            <View style={styles.healthMetric}>
              <Text style={styles.healthMetricValue}>{data.transactionCount}</Text>
              <Text style={styles.healthMetricLabel}>Transactions</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderInsightCard = (insight: InsightCard) => (
    <Animated.View key={insight.id} style={[styles.insightCard, { backgroundColor: 'white' }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: insight.color + '20' }]}>
          <Ionicons name={insight.icon} size={24} color={insight.color} />
        </View>
        {insight.value && (
          <View style={[styles.valueContainer, { backgroundColor: insight.color }]}>
            <Text style={styles.valueText}>{insight.value}</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle}>{insight.title}</Text>
      <Text style={styles.cardDescription}>{insight.description}</Text>
    </Animated.View>
  );

  const renderTabButton = (tab: 'insights' | 'trends' | 'recommendations', title: string, icon: keyof typeof Ionicons.glyphMap) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon} 
        size={18} 
        color={activeTab === tab ? '#4F46E5' : '#6B7280'} 
      />
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Animated.View style={styles.loadingDot} />
          <Text style={styles.loadingText}>Analyzing your financial data...</Text>
        </View>
      );
    }

    if (activeTab === 'insights') {
      return (
        <View style={styles.contentContainer}>
          {/* Financial Health Card */}
          {renderFinancialHealthCard()}
          
          {/* Top Spending Categories Grid */}
          <Text style={styles.sectionTitle}>Top Spending Categories</Text>
          <View style={styles.categoriesGrid}>
            {data.topCategories.map((category, index) => renderCategoryCard(category, index))}
          </View>
          
          {/* AI Insights */}
          <Text style={styles.sectionTitle}>AI-Powered Insights</Text>
          {mockInsights.map(renderInsightCard)}
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="analytics" size={64} color="#E5E7EB" />
        <Text style={styles.emptyStateTitle}>
          {activeTab === 'trends' ? 'Spending Trends' : 'Smart Recommendations'}
        </Text>
        <Text style={styles.emptyStateText}>
          {activeTab === 'trends' 
            ? 'Track your spending patterns over time with detailed analytics'
            : 'Get personalized recommendations to optimize your finances'
          }
        </Text>
        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaButtonText}>Add More Expenses</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle}>AI Financial Insights</Text>
                  <Text style={styles.headerSubtitle}>Powered by Machine Learning</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.refreshButton}>
                  <Ionicons name="refresh" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.tabContainer}>
              {renderTabButton('insights', 'Insights', 'analytics')}
              {renderTabButton('trends', 'Trends', 'trending-up')}
              {renderTabButton('recommendations', 'Tips', 'bulb')}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {renderContent()}
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal and Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.9,
    width: width,
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  
  // Header Styles
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#4F46E5',
  },
  
  // Content Area
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingTop: 24,
  },
  
  // Section Headers
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  
  // Financial Health Styles
  healthCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  healthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  healthBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  healthScore: {
    fontSize: 24,
    fontWeight: '700',
  },
  healthScoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  healthMetrics: {
    flex: 1,
  },
  healthMetric: {
    marginBottom: 12,
  },
  healthMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  healthMetricLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Categories Grid Styles
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    width: (width - 52) / 2, // Account for padding and gap
  },
  categoryCardLeft: {
    marginRight: 6,
  },
  categoryCardRight: {
    marginLeft: 6,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Insight Cards
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  
  // Loading State
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  
  // CTA Button
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
});

export default SmartSuggestionsComponent;