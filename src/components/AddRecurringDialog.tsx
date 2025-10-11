import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
import { EnhancedFirebaseService, Recurrence } from '../services/firebase/enhancedFirebaseService';

interface AddRecurringDialogProps {
  visible: boolean;
  onClose: () => void;
  isDarkTheme: boolean;
  editingRecurrence?: Recurrence | null;
}

const frequencies = [
  { value: 'daily' as const, label: 'Daily', icon: 'today' },
  { value: 'weekly' as const, label: 'Weekly', icon: 'calendar' },
  { value: 'monthly' as const, label: 'Monthly', icon: 'calendar-outline' },
  { value: 'yearly' as const, label: 'Yearly', icon: 'calendar-clear' }
];

const transactionTypes = [
  { value: 'income', label: 'Income', icon: 'arrow-down-circle', color: '#4CAF50' },
  { value: 'expense', label: 'Expense', icon: 'arrow-up-circle', color: '#FF5722' }
];

export const AddRecurringDialog: React.FC<AddRecurringDialogProps> = ({
  visible,
  onClose,
  isDarkTheme,
  editingRecurrence
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = getStyles(isDarkTheme);
  const isEditing = !!editingRecurrence;

  // Populate form when editing
  useEffect(() => {
    if (editingRecurrence) {
      setTitle(editingRecurrence.title || '');
      setAmount(editingRecurrence.amount.toString());
      setType(editingRecurrence.type);
      setFrequency(editingRecurrence.frequency);
      setDescription(''); // Description might not be in the interface
    } else {
      // Reset form when not editing
      setTitle('');
      setAmount('');
      setType('expense');
      setFrequency('monthly');
      setDescription('');
    }
  }, [editingRecurrence, visible]);

  const handleSave = async () => {
    if (!title || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const nextDate = getNextDate(frequency);
      
      const recurrenceData = {
        title,
        amount: amountValue,
        type,
        frequency,
        category: type === 'income' ? 'Income' : 'General', // Auto-assign category
        nextDate: nextDate.toISOString(),
        isActive: true
      };

      if (isEditing && editingRecurrence?.id) {
        // Update existing recurrence
        await EnhancedFirebaseService.updateRecurrence(editingRecurrence.id, recurrenceData);
        Alert.alert('Success', 'Recurring transaction updated successfully!');
      } else {
        // Create new recurrence
        await EnhancedFirebaseService.addRecurrence(recurrenceData);
        Alert.alert('Success', 'Recurring transaction created successfully!');
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save recurring transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getNextDate = (freq: string): Date => {
    const now = new Date();
    switch (freq) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case 'yearly':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setType('expense');
    setFrequency('monthly');
    setDescription('');
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
            <Text style={styles.title}>
              {isEditing ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </Animated.View>

        <ScrollView style={styles.content}>
          {/* Transaction Type */}
          <Animated.View 
            style={styles.inputGroup}
            entering={FadeInUp.delay(400)}
          >
            <Text style={styles.label}>Transaction Type</Text>
            <View style={styles.typeContainer}>
              {transactionTypes.map((txType, index) => (
                <Animated.View
                  key={txType.value}
                  style={{ flex: 1 }}
                  entering={BounceIn.delay(500 + index * 100)}
                >
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      type === txType.value && styles.selectedType
                    ]}
                    onPress={() => setType(txType.value as 'income' | 'expense')}
                  >
                    <Ionicons 
                      name={txType.icon as any} 
                      size={16} 
                      color={type === txType.value ? '#fff' : txType.color} 
                    />
                    <Text style={[
                      styles.typeText,
                      type === txType.value && styles.selectedTypeText
                    ]}>
                      {txType.label}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Title Input */}
          <Animated.View 
            style={styles.inputGroup}
            entering={FadeInUp.delay(600)}
          >
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Salary, Rent, Subscription"
              placeholderTextColor="#999"
            />
          </Animated.View>

          {/* Amount Input */}
          <Animated.View 
            style={styles.inputGroup}
            entering={FadeInUp.delay(700)}
          >
            <Text style={styles.label}>Amount *</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#999"
              />
            </View>
          </Animated.View>

          {/* Frequency Selection */}
          <Animated.View 
            style={styles.inputGroup}
            entering={FadeInUp.delay(800)}
          >
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.frequencyContainer}>
              {frequencies.map((freq, index) => (
                <Animated.View
                  key={freq.value}
                  entering={BounceIn.delay(900 + index * 100)}
                >
                  <TouchableOpacity
                    style={[
                      styles.frequencyButton,
                      frequency === freq.value && styles.selectedFrequency
                    ]}
                    onPress={() => setFrequency(freq.value)}
                  >
                    <Ionicons 
                      name={freq.icon as any} 
                      size={16} 
                      color={frequency === freq.value ? '#fff' : '#666'} 
                    />
                    <Text style={[
                      styles.frequencyText,
                      frequency === freq.value && styles.selectedFrequencyText
                    ]}>
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Description Input */}
          <Animated.View 
            style={styles.inputGroup}
            entering={FadeInUp.delay(1100)}
          >
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add notes or details..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </Animated.View>
        </ScrollView>

        <Animated.View 
          style={styles.footer}
          entering={FadeInUp.delay(1200)}
        >
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Recurring Transaction' : 'Create Recurring Transaction')
              }
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
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
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
  selectedType: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  typeText: {
    fontSize: 14,
    color: isDark ? '#D1D5DB' : '#666',
  },
  selectedTypeText: {
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
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
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
  selectedFrequency: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  frequencyText: {
    fontSize: 14,
    color: isDark ? '#D1D5DB' : '#666',
  },
  selectedFrequencyText: {
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
