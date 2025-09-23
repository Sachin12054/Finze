import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { BounceIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EnhancedFirebaseService } from '../services/enhancedFirebaseService';

interface AddBudgetDialogProps {
  visible: boolean;
  onClose: () => void;
  isDarkTheme: boolean;
}

const categories = [
  { value: 'Food & Dining', label: 'Food & Dining', icon: 'restaurant' },
  { value: 'Transportation', label: 'Transportation', icon: 'car' },
  { value: 'Shopping', label: 'Shopping', icon: 'bag' },
  { value: 'Entertainment', label: 'Entertainment', icon: 'game-controller' },
  { value: 'Healthcare', label: 'Healthcare', icon: 'medical' },
  { value: 'Other', label: 'Other', icon: 'ellipsis-horizontal' }
];

const periods = [
  { value: 'weekly' as const, label: 'Weekly', icon: 'calendar' },
  { value: 'monthly' as const, label: 'Monthly', icon: 'calendar-outline' },
  { value: 'yearly' as const, label: 'Yearly', icon: 'calendar-clear' }
];

const AddBudgetDialog: React.FC<AddBudgetDialogProps> = ({
  visible,
  onClose,
  isDarkTheme
}) => {
  const [category, setCategory] = useState('Other');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = getStyles(isDarkTheme);

  const handleSave = async () => {
    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter a budget amount');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const budgetData = {
        category,
        amount: amountValue,
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
      
      // Reset form
      setCategory('Other');
      setAmount('');
      setPeriod('monthly');
      setDescription('');
      
      onClose();
      Alert.alert('Success', 'Budget created successfully!');
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to create budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getEndDate = (period: 'weekly' | 'monthly' | 'yearly'): string => {
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
      animationType="fade"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={styles.modalOverlay}
        entering={FadeInDown.duration(400)}
      >
        <SafeAreaView style={styles.container}>
          <Animated.View 
            style={styles.header}
            entering={FadeInUp.delay(200)}
          >
            <Text style={styles.title}>Create Budget</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </Animated.View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Category Selection */}
            <Animated.View 
              style={styles.inputGroup}
              entering={FadeInUp.delay(400)}
            >
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryContainer}>
                {categories.map((cat, index) => (
                  <Animated.View
                    key={cat.value}
                    entering={BounceIn.delay(500 + index * 100)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.categoryButton,
                        category === cat.value && styles.selectedCategory
                      ]}
                      onPress={() => setCategory(cat.value)}
                    >
                      <Ionicons 
                        name={cat.icon as any} 
                        size={16} 
                        color={category === cat.value ? '#fff' : '#666'} 
                      />
                      <Text style={[
                        styles.categoryText,
                        category === cat.value && styles.selectedCategoryText
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Budget Amount */}
            <Animated.View 
              style={styles.inputGroup}
              entering={FadeInUp.delay(600)}
            >
              <Text style={styles.label}>Budget Amount *</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </Animated.View>

            {/* Budget Period */}
            <Animated.View 
              style={styles.inputGroup}
              entering={FadeInUp.delay(700)}
            >
              <Text style={styles.label}>Budget Period *</Text>
              <View style={styles.periodContainer}>
                {periods.map((periodOption, index) => (
                  <Animated.View
                    key={periodOption.value}
                    style={{ flex: 1 }}
                    entering={BounceIn.delay(800 + index * 100)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.periodButton,
                        period === periodOption.value && styles.selectedPeriod
                      ]}
                      onPress={() => setPeriod(periodOption.value)}
                    >
                      <Ionicons 
                        name={periodOption.icon as any} 
                        size={16} 
                        color={period === periodOption.value ? '#fff' : '#666'} 
                      />
                      <Text style={[
                        styles.periodText,
                        period === periodOption.value && styles.selectedPeriodText
                      ]}>
                        {periodOption.label}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Description Input */}
            <Animated.View 
              style={styles.inputGroup}
              entering={FadeInUp.delay(900)}
            >
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add notes about this budget..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </Animated.View>
          </ScrollView>

          <Animated.View 
            style={styles.footer}
            entering={FadeInUp.delay(1000)}
          >
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Creating...' : 'Create Budget'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: isDark ? '#1F2937' : '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#374151' : '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: isDark ? '#F1F5F9' : '#333',
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
    color: isDark ? '#F1F5F9' : '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: isDark ? '#374151' : '#fff',
    color: isDark ? '#F1F5F9' : '#000',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#ddd',
    backgroundColor: isDark ? '#374151' : '#f9f9f9',
    gap: 6,
  },
  selectedCategory: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryText: {
    fontSize: 14,
    color: isDark ? '#D1D5DB' : '#666',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '500',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#ddd',
    borderRadius: 8,
    backgroundColor: isDark ? '#374151' : '#fff',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#F1F5F9' : '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: isDark ? '#F1F5F9' : '#000',
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#ddd',
    backgroundColor: isDark ? '#374151' : '#f9f9f9',
    gap: 6,
  },
  selectedPeriod: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  periodText: {
    fontSize: 14,
    color: isDark ? '#D1D5DB' : '#666',
  },
  selectedPeriodText: {
    color: '#fff',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#374151' : '#f0f0f0',
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
