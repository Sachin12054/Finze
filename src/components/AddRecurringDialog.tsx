import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { EnhancedFirebaseService } from '../services/enhancedFirebaseService';

interface AddRecurringDialogProps {
  visible: boolean;
  onClose: () => void;
  isDarkTheme: boolean;
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
  isDarkTheme
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = getStyles(isDarkTheme);

  const handleSave = async () => {
    if (!title || !amount || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const nextDate = getNextDate(frequency);
      
      await EnhancedFirebaseService.addRecurrence({
        title,
        amount: parseFloat(amount),
        type,
        frequency,
        category,
        nextDate: nextDate.toISOString(),
        isActive: true
      });

      Alert.alert('Success', 'Recurring transaction created successfully!');
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create recurring transaction');
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
    setCategory('');
    setDescription('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={isDarkTheme ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
            style={styles.content}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Recurring Transaction</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={isDarkTheme ? '#E2E8F0' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Transaction Type */}
              <View style={styles.section}>
                <Text style={styles.label}>Transaction Type</Text>
                <View style={styles.typeContainer}>
                  {transactionTypes.map((txType) => (
                    <TouchableOpacity
                      key={txType.value}
                      style={[
                        styles.typeButton,
                        type === txType.value && { backgroundColor: txType.color }
                      ]}
                      onPress={() => setType(txType.value as 'income' | 'expense')}
                    >
                      <Ionicons 
                        name={txType.icon as any} 
                        size={20} 
                        color={type === txType.value ? '#FFFFFF' : txType.color} 
                      />
                      <Text style={[
                        styles.typeText,
                        type === txType.value && styles.typeTextSelected
                      ]}>
                        {txType.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Title Input */}
              <View style={styles.section}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Salary, Rent, Subscription"
                  placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                />
              </View>

              {/* Amount Input */}
              <View style={styles.section}>
                <Text style={styles.label}>Amount *</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="Enter amount"
                    placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                  />
                </View>
              </View>

              {/* Frequency Selection */}
              <View style={styles.section}>
                <Text style={styles.label}>Frequency</Text>
                <View style={styles.frequencyGrid}>
                  {frequencies.map((freq) => (
                    <TouchableOpacity
                      key={freq.value}
                      style={[
                        styles.frequencyItem,
                        frequency === freq.value && styles.frequencyItemSelected
                      ]}
                      onPress={() => setFrequency(freq.value)}
                    >
                      <Ionicons 
                        name={freq.icon as any} 
                        size={18} 
                        color={frequency === freq.value ? '#FFFFFF' : (isDarkTheme ? '#94A3B8' : '#64748B')} 
                      />
                      <Text style={[
                        styles.frequencyText,
                        frequency === freq.value && styles.frequencyTextSelected
                      ]}>
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Category Input */}
              <View style={styles.section}>
                <Text style={styles.label}>Category *</Text>
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="e.g., Salary, Bills, Entertainment"
                  placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                />
              </View>

              {/* Description Input */}
              <View style={styles.section}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.descriptionInput]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add notes or details..."
                  placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.saveGradient}
                >
                  <Text style={styles.saveText}>
                    {loading ? 'Creating...' : 'Create Recurring'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  content: {
    padding: 24,
    minHeight: 600,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: isDark ? '#F1F5F9' : '#1E293B',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? '#374151' : '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#E2E8F0' : '#374151',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: isDark ? '#374151' : '#F8FAFC',
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#E2E8F0',
    gap: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#94A3B8' : '#64748B',
  },
  typeTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: isDark ? '#374151' : '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
    color: isDark ? '#F1F5F9' : '#1E293B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#374151' : '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#E2E8F0',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#E2E8F0' : '#374151',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: isDark ? '#F1F5F9' : '#1E293B',
    paddingVertical: 16,
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#374151' : '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#E2E8F0',
    gap: 6,
  },
  frequencyItemSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#94A3B8' : '#64748B',
  },
  frequencyTextSelected: {
    color: '#FFFFFF',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: isDark ? '#374151' : '#F3F4F6',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#94A3B8' : '#64748B',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
