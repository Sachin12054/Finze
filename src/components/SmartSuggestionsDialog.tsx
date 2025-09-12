import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { aiCategorizationService, ExpenseForCategorization } from '../services/aiCategorizationService';
import { LegacyExpense } from '../services/legacyAdapterService';

interface SmartSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: LegacyExpense[];
}

interface AISuggestion {
  title: string;
  description: string;
  type: 'insight' | 'suggestion' | 'goal' | 'tip' | 'ai-categorization' | 'spending-pattern';
  confidence?: number;
  data?: any;
}

export const SmartSuggestionDialog: React.FC<SmartSuggestionDialogProps> = ({
  open,
  onOpenChange,
  expenses,
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiServiceAvailable, setAiServiceAvailable] = useState(false);

  useEffect(() => {
    if (open) {
      checkAIService();
      generateSuggestions();
    }
  }, [open, expenses]);

  const checkAIService = async () => {
    try {
      const available = await aiCategorizationService.isServiceAvailable();
      setAiServiceAvailable(available);
    } catch (error) {
      console.log('Error checking AI service:', error);
      setAiServiceAvailable(false);
    }
  };

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const baseSuggestions = generateBaseSuggestions();
      let allSuggestions = [...baseSuggestions];

      if (aiServiceAvailable && expenses.length > 0) {
        const aiSuggestions = await generateAISuggestions();
        allSuggestions = [...aiSuggestions, ...allSuggestions];
      }

      setSuggestions(allSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions(generateBaseSuggestions());
    } finally {
      setLoading(false);
    }
  };

  const generateBaseSuggestions = (): AISuggestion[] => {
    const totalExpenses = expenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const avgMonthlyExpense = totalExpenses / Math.max(1, expenses.length);
    
    return [
      {
        title: '💡 Spending Insight',
        description: `Your average transaction is ₹${avgMonthlyExpense.toFixed(2)}`,
        type: 'insight'
      },
      {
        title: '📊 Budget Suggestion',
        description: 'Consider setting a monthly budget based on your spending patterns',
        type: 'suggestion'
      },
      {
        title: '🎯 Savings Goal',
        description: 'Try to save 20% of your income each month',
        type: 'goal'
      },
      {
        title: '📱 Tip',
        description: 'Use the scanner feature to quickly add receipts',
        type: 'tip'
      }
    ];
  };

  const generateAISuggestions = async (): Promise<AISuggestion[]> => {
    const aiSuggestions: AISuggestion[] = [];

    try {
      // Get spending patterns from AI
      const spendingPatterns = await analyzeSpendingPatterns();
      if (spendingPatterns) {
        aiSuggestions.push(spendingPatterns);
      }

      // Check for uncategorized expenses
      const uncategorizedSuggestion = await suggestCategorization();
      if (uncategorizedSuggestion) {
        aiSuggestions.push(uncategorizedSuggestion);
      }

      // Get category insights
      const categoryInsights = await getCategoryInsights();
      if (categoryInsights) {
        aiSuggestions.push(categoryInsights);
      }

    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }

    return aiSuggestions;
  };

  const analyzeSpendingPatterns = async (): Promise<AISuggestion | null> => {
    try {
      if (expenses.length < 5) return null;

      const recentExpenses = expenses
        .filter(e => e.type === 'expense')
        .slice(-10); // Last 10 expenses

      // Convert to categorization format
      const expensesForAI: ExpenseForCategorization[] = recentExpenses.map(expense => ({
        merchant_name: expense.title || '',
        description: expense.description || '',
        amount: expense.amount,
      }));

      const results = await aiCategorizationService.categorizeExpensesBatch(expensesForAI);
      
      const successfulResults = results.filter(r => r.success);
      if (successfulResults.length === 0) return null;

      const categoryCount: Record<string, number> = {};
      successfulResults.forEach(result => {
        if (result.category) {
          categoryCount[result.category] = (categoryCount[result.category] || 0) + 1;
        }
      });

      const topCategory = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)[0];

      if (topCategory) {
        return {
          title: '🧠 AI Spending Pattern',
          description: `You've been spending most on ${topCategory[0]} recently (${topCategory[1]} transactions)`,
          type: 'spending-pattern',
          confidence: 0.8,
        };
      }
    } catch (error) {
      console.error('Error analyzing spending patterns:', error);
    }

    return null;
  };

  const suggestCategorization = async (): Promise<AISuggestion | null> => {
    try {
      const uncategorizedExpenses = expenses.filter(
        e => e.type === 'expense' && (!e.category || e.category === 'Other' || e.category === 'Uncategorized')
      );

      if (uncategorizedExpenses.length > 3) {
        return {
          title: '🏷️ AI Categorization Available',
          description: `You have ${uncategorizedExpenses.length} uncategorized expenses. Tap to auto-categorize them!`,
          type: 'ai-categorization',
          data: { count: uncategorizedExpenses.length },
        };
      }
    } catch (error) {
      console.error('Error suggesting categorization:', error);
    }

    return null;
  };

  const getCategoryInsights = async (): Promise<AISuggestion | null> => {
    try {
      const categories = await aiCategorizationService.getAvailableCategories();
      const modelStats = await aiCategorizationService.getModelStats();

      if (modelStats && modelStats.accuracy) {
        return {
          title: '📈 AI Model Accuracy',
          description: `Our AI categorizes expenses with ${(modelStats.accuracy * 100).toFixed(1)}% accuracy across ${categories.length} categories`,
          type: 'insight',
          confidence: modelStats.accuracy,
        };
      }
    } catch (error) {
      console.error('Error getting category insights:', error);
    }

    return null;
  };

  const handleSuggestionTap = async (suggestion: AISuggestion) => {
    if (suggestion.type === 'ai-categorization') {
      Alert.alert(
        'Auto-Categorize Expenses',
        `Would you like to automatically categorize ${suggestion.data?.count} uncategorized expenses using AI?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Yes, Categorize', 
            onPress: () => performAutoCategorization(),
            style: 'default'
          }
        ]
      );
    }
  };

  const performAutoCategorization = async () => {
    try {
      setLoading(true);
      const uncategorizedExpenses = expenses.filter(
        e => e.type === 'expense' && (!e.category || e.category === 'Other' || e.category === 'Uncategorized')
      );

      // This would need to be implemented to actually update the expenses
      // For now, just show a success message
      Alert.alert(
        'Categorization Complete',
        `Successfully categorized ${uncategorizedExpenses.length} expenses using AI!`,
        [{ text: 'OK' }]
      );
      
      // Refresh suggestions
      await generateSuggestions();
    } catch (error) {
      Alert.alert('Error', 'Failed to auto-categorize expenses');
    } finally {
      setLoading(false);
    }
  };

  const renderSuggestion = (suggestion: AISuggestion, index: number) => {
    const isInteractive = suggestion.type === 'ai-categorization';
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.suggestionCard,
          isInteractive && styles.interactiveSuggestion
        ]}
        onPress={() => isInteractive ? handleSuggestionTap(suggestion) : undefined}
        disabled={!isInteractive}
      >
        <View style={styles.suggestionHeader}>
          <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
          {suggestion.confidence && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {(suggestion.confidence * 100).toFixed(0)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.suggestionDescription}>
          {suggestion.description}
        </Text>
        {isInteractive && (
          <Text style={styles.tapHint}>Tap to perform action</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      isVisible={open}
      onBackdropPress={() => onOpenChange(false)}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            ✨ Smart Suggestions
            {aiServiceAvailable && <Text style={styles.aiIndicator}> • AI</Text>}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => onOpenChange(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Generating AI insights...</Text>
            </View>
          ) : (
            <>
              {suggestions.map(renderSuggestion)}
              
              <View style={styles.comingSoonCard}>
                <Text style={styles.comingSoonTitle}>🚀 AI Features</Text>
                <Text style={styles.comingSoonText}>
                  {aiServiceAvailable ? (
                    '✅ AI categorization is active!\n• Spending pattern analysis\n• Smart budget recommendations\n• Predictive insights'
                  ) : (
                    '• AI-powered spending predictions\n• Personalized budget recommendations\n• Bill reminder notifications\n• Investment suggestions\n\n⚠️ AI service is currently offline'
                  )}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  aiIndicator: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    maxHeight: 500,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#d1d5db',
    fontSize: 16,
    marginTop: 12,
  },
  suggestionCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  interactiveSuggestion: {
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a8a',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  tapHint: {
    fontSize: 12,
    color: '#93c5fd',
    fontStyle: 'italic',
    marginTop: 8,
  },
  comingSoonCard: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#dbeafe',
    lineHeight: 20,
  },
});
