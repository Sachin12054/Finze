import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { EnhancedFirebaseService } from '../services/enhancedFirebaseService';

interface BudgetData {
  category: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  description?: string;
}

interface AddBudgetDialogProps {
  visible: boolean;
  onClose: () => void;
  isDarkTheme: boolean;
}

const AddBudgetDialog: React.FC<AddBudgetDialogProps> = ({
  visible,
  onClose,
  isDarkTheme
}) => {
  const [category, setCategory] = useState('Other');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [description, setDescription] = useState('');

  const handleSave = async () => {
    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter a budget amount');
      return;
    }

    try {
      const budgetData = {
        category,
        amount: parseFloat(amount),
        period,
        description: description.trim(),
        startDate: new Date().toISOString(),
        endDate: getEndDate(period),
        spent: 0,
        alertThreshold: 80, // Default alert at 80%
        isActive: true,
        notifications: true,
      };

      await EnhancedFirebaseService.addBudget(budgetData);

      // Create legacy format for backward compatibility
      const legacyBudgetData: BudgetData = {
        category,
        amount: parseFloat(amount),
        period,
        description: description.trim()
      };

      // Save to Firebase
      await EnhancedFirebaseService.addBudget(budgetData);
      onClose();
      
      // Reset form
      setCategory('Other');
      setAmount('');
      setPeriod('monthly');
      setDescription('');
      
      Alert.alert('Success', 'Budget created successfully!');
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to create budget. Please try again.');
    }
  };

  const getEndDate = (period: 'monthly' | 'weekly' | 'yearly'): string => {
    const now = new Date();
    switch (period) {
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'yearly':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString();
      default: // monthly
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Budget</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Other'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.selectedCategory
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryText,
                    category === cat && styles.selectedCategoryText
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Budget Amount *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Budget Period</Text>
            <View style={styles.periodContainer}>
              {[
                { key: 'weekly', label: 'Weekly' },
                { key: 'monthly', label: 'Monthly' },
                { key: 'yearly', label: 'Yearly' }
              ].map((periodOption) => (
                <TouchableOpacity
                  key={periodOption.key}
                  style={[
                    styles.periodButton,
                    period === periodOption.key && styles.selectedPeriod
                  ]}
                  onPress={() => setPeriod(periodOption.key as any)}
                >
                  <Text style={[
                    styles.periodText,
                    period === periodOption.key && styles.selectedPeriodText
                  ]}>
                    {periodOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a note about this budget"
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Budget</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  selectedCategory: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '500',
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  selectedPeriod: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
  },
  selectedPeriodText: {
    color: '#fff',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AddBudgetDialog;
