import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AIInsights, enhancedGeminiAIInsightsService } from '../services/enhancedGeminiAIInsightsService';
import { auth } from '../services/firebase/firebase';

export const SimpleAITest: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        
        if (!user) {
          setError('No authenticated user');
          return;
        }

        console.log('🧪 Testing AI insights service...');
        const data = await enhancedGeminiAIInsightsService.generateAIInsights(user.uid, 'month');
        console.log('🧪 Service returned:', data);
        
        setInsights(data);
        setError(null);
      } catch (err) {
        console.error('🧪 Test error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Loading AI insights...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!insights) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No insights available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🤖 AI Insights Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analytics</Text>
        <Text style={styles.text}>Total Spent: ₹{insights.totalSpent}</Text>
        <Text style={styles.text}>Total Transactions: {insights.totalTransactions}</Text>
        <Text style={styles.text}>Average Transaction: ₹{insights.avgTransactionAmount.toFixed(2)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.text}>{insights.summary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {insights.recommendations.map((rec, index) => (
          <Text key={index} style={styles.recommendation}>• {rec}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Generated At</Text>
        <Text style={styles.text}>{insights.generatedAt.toLocaleString()}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  recommendation: {
    fontSize: 14,
    marginBottom: 5,
    color: '#444',
    paddingLeft: 10,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});