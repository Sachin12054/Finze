import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AICategorizationService, { SmartSuggestion, SpendingInsight } from '../services/ml/aiCategorizationService';

interface SmartSuggestionsProps {
  visible: boolean;
  onClose: () => void;
}

export const SmartSuggestionsComponent: React.FC<SmartSuggestionsProps> = ({
  visible,
  onClose,
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'insights'>('suggestions');

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suggestionsData, insightsData] = await Promise.all([
        AICategorizationService.generateSmartSuggestions(),
        AICategorizationService.generateSpendingInsights(),
      ]);
      setSuggestions(suggestionsData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error loading smart suggestions:', error);
      Alert.alert('Error', 'Failed to load smart suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionAction = (suggestion: SmartSuggestion) => {
    switch (suggestion.type) {
      case 'budget_alert':
        Alert.alert(
          'Budget Alert',
          `Would you like to review your ${suggestion.data?.budget?.category} budget?`,
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'Review Budget', 
              onPress: () => {
                // Navigate to budget editing screen
                console.log('Navigate to budget review');
              }
            }
          ]
        );
        break;
      case 'goal_recommendation':
        Alert.alert(
          'Create Goal',
          `Would you like to create an emergency fund goal for ₹${suggestion.data?.suggestedAmount?.toFixed(2)}?`,
          [
            { text: 'Not Now', style: 'cancel' },
            { 
              text: 'Create Goal', 
              onPress: () => {
                // Navigate to goal creation
                console.log('Navigate to goal creation');
              }
            }
          ]
        );
        break;
      case 'saving_opportunity':
        Alert.alert(
          'Saving Opportunity',
          suggestion.description,
          [
            { text: 'Dismiss', style: 'cancel' },
            { 
              text: 'View Details', 
              onPress: () => {
                // Navigate to detailed view
                console.log('Navigate to saving details');
              }
            }
          ]
        );
        break;
      case 'spending_pattern':
        Alert.alert(
          'Spending Pattern',
          suggestion.description,
          [
            { text: 'Got It', style: 'cancel' },
            { 
              text: 'View Transactions', 
              onPress: () => {
                // Navigate to transactions filtered by category
                console.log('Navigate to category transactions');
              }
            }
          ]
        );
        break;
    }
  };

  const getSuggestionIcon = (type: SmartSuggestion['type']) => {
    switch (type) {
      case 'budget_alert':
        return 'warning';
      case 'saving_opportunity':
        return 'savings';
      case 'spending_pattern':
        return 'trending-up';
      case 'goal_recommendation':
        return 'flag';
      default:
        return 'bulb';
    }
  };

  const getPriorityColor = (priority: SmartSuggestion['priority']) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getInsightIcon = (trend: SpendingInsight['trend']) => {
    switch (trend) {
      case 'increasing':
        return 'trending-up';
      case 'decreasing':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getInsightColor = (impact: SpendingInsight['impact']) => {
    switch (impact) {
      case 'positive':
        return '#10B981';
      case 'negative':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const renderSuggestion = (suggestion: SmartSuggestion, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.suggestionCard}
      onPress={() => suggestion.actionable && handleSuggestionAction(suggestion)}
      activeOpacity={suggestion.actionable ? 0.7 : 1}
    >
      <View style={styles.suggestionHeader}>
        <View style={styles.suggestionIconContainer}>
          <Ionicons 
            name={getSuggestionIcon(suggestion.type) as any} 
            size={20} 
            color={getPriorityColor(suggestion.priority)} 
          />
        </View>
        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
          <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(suggestion.priority) }]}>
          <Text style={styles.priorityText}>{suggestion.priority.toUpperCase()}</Text>
        </View>
      </View>
      
      {suggestion.actionable && (
        <View style={styles.actionContainer}>
          <Ionicons name="chevron-forward" size={16} color="#6B7280" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderInsight = (insight: SpendingInsight, index: number) => (
    <View key={index} style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <View style={[styles.insightIconContainer, { backgroundColor: getInsightColor(insight.impact) + '20' }]}>
          <Ionicons 
            name={getInsightIcon(insight.trend) as any} 
            size={18} 
            color={getInsightColor(insight.impact)} 
          />
        </View>
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>{insight.insight}</Text>
          <Text style={styles.insightCategory}>{insight.category}</Text>
        </View>
      </View>
      <Text style={styles.insightSuggestion}>{insight.suggestion}</Text>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Smart Insights</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'suggestions' && styles.activeTab]}
            onPress={() => setActiveTab('suggestions')}
          >
            <Ionicons 
              name="bulb" 
              size={20} 
              color={activeTab === 'suggestions' ? '#6366F1' : '#6B7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'suggestions' && styles.activeTabText]}>
              Suggestions ({suggestions.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
            onPress={() => setActiveTab('insights')}
          >
            <Ionicons 
              name="analytics" 
              size={20} 
              color={activeTab === 'insights' ? '#6366F1' : '#6B7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>
              Insights ({insights.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Analyzing your financial data...</Text>
            </View>
          ) : (
            <>
              {activeTab === 'suggestions' ? (
                <View style={styles.suggestionsContainer}>
                  {suggestions.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                      <Text style={styles.emptyStateTitle}>All Good!</Text>
                      <Text style={styles.emptyStateText}>
                        No urgent suggestions at the moment. Keep up the great work!
                      </Text>
                    </View>
                  ) : (
                    suggestions.map(renderSuggestion)
                  )}
                </View>
              ) : (
                <View style={styles.insightsContainer}>
                  {insights.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="analytics" size={48} color="#6B7280" />
                      <Text style={styles.emptyStateTitle}>Building Insights</Text>
                      <Text style={styles.emptyStateText}>
                        Add more transactions to get personalized spending insights.
                      </Text>
                    </View>
                  ) : (
                    insights.map(renderInsight)
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#EBF4FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  suggestionsContainer: {
    gap: 12,
  },
  suggestionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  actionContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    color: '#1F2937',
    marginBottom: 2,
  },
  insightCategory: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  insightSuggestion: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SmartSuggestionsComponent;
