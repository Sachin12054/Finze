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

interface AddSavingsGoalDialogProps {
  visible: boolean;
  onClose: () => void;
  isDarkTheme: boolean;
}

const goalCategories = [
  { name: 'Emergency Fund', icon: 'shield-checkmark', color: '#FF5722' },
  { name: 'Vacation', icon: 'airplane', color: '#2196F3' },
  { name: 'Car', icon: 'car-sport', color: '#FF9800' },
  { name: 'House', icon: 'home', color: '#4CAF50' },
  { name: 'Education', icon: 'school', color: '#9C27B0' },
  { name: 'Gadgets', icon: 'phone-portrait', color: '#607D8B' },
  { name: 'Investment', icon: 'trending-up', color: '#009688' },
  { name: 'Other', icon: 'star', color: '#795548' }
];

export const AddSavingsGoalDialog: React.FC<AddSavingsGoalDialogProps> = ({
  visible,
  onClose,
  isDarkTheme
}) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = getStyles(isDarkTheme);

  const handleSave = async () => {
    if (!name || !targetAmount || !targetDate || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await EnhancedFirebaseService.addSavingsGoal({
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount),
        targetDate: new Date(targetDate).toISOString(),
        category,
        priority: 'medium',
        isCompleted: false
      });

      Alert.alert('Success', 'Savings goal created successfully!');
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create savings goal');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate('');
    setCategory('');
    setDescription('');
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getSuggestedDate = (months: number): string => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return formatDateForInput(date);
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
              <Text style={styles.title}>Create Savings Goal</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={isDarkTheme ? '#E2E8F0' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Goal Categories */}
              <View style={styles.section}>
                <Text style={styles.label}>Goal Category *</Text>
                <View style={styles.categoryGrid}>
                  {goalCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.name}
                      style={[
                        styles.categoryItem,
                        category === cat.name && { 
                          backgroundColor: cat.color,
                          borderColor: cat.color 
                        }
                      ]}
                      onPress={() => setCategory(cat.name)}
                    >
                      <Ionicons 
                        name={cat.icon as any} 
                        size={18} 
                        color={category === cat.name ? '#FFFFFF' : cat.color} 
                      />
                      <Text style={[
                        styles.categoryText,
                        category === cat.name && styles.categoryTextSelected
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Goal Name */}
              <View style={styles.section}>
                <Text style={styles.label}>Goal Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., New iPhone, Europe Trip"
                  placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                />
              </View>

              {/* Target Amount */}
              <View style={styles.section}>
                <Text style={styles.label}>Target Amount *</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                    keyboardType="numeric"
                    placeholder="Enter target amount"
                    placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                  />
                </View>
              </View>

              {/* Current Amount */}
              <View style={styles.section}>
                <Text style={styles.label}>Current Amount</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={currentAmount}
                    onChangeText={setCurrentAmount}
                    keyboardType="numeric"
                    placeholder="Enter current amount"
                    placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                  />
                </View>
              </View>

              {/* Target Date */}
              <View style={styles.section}>
                <Text style={styles.label}>Target Date *</Text>
                <TextInput
                  style={styles.input}
                  value={targetDate}
                  onChangeText={setTargetDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                />
                <View style={styles.dateQuickSelect}>
                  <Text style={styles.quickSelectLabel}>Quick select:</Text>
                  <View style={styles.quickSelectButtons}>
                    {[3, 6, 12, 24].map((months) => (
                      <TouchableOpacity
                        key={months}
                        style={styles.quickSelectButton}
                        onPress={() => setTargetDate(getSuggestedDate(months))}
                      >
                        <Text style={styles.quickSelectText}>
                          {months < 12 ? `${months}M` : `${months/12}Y`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={styles.section}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.descriptionInput]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add notes about your goal..."
                  placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Progress Preview */}
              {targetAmount && currentAmount && (
                <View style={styles.section}>
                  <Text style={styles.label}>Progress Preview</Text>
                  <View style={styles.progressPreview}>
                    <View style={styles.progressInfo}>
                      <Text style={styles.progressAmount}>
                        ₹{parseFloat(currentAmount || '0').toLocaleString('en-IN')} of ₹{parseFloat(targetAmount).toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.progressPercentage}>
                        {Math.round((parseFloat(currentAmount || '0') / parseFloat(targetAmount)) * 100)}% Complete
                      </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressBarFill,
                            { 
                              width: `${Math.min((parseFloat(currentAmount || '0') / parseFloat(targetAmount)) * 100, 100)}%` 
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}
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
                    {loading ? 'Creating...' : 'Create Goal'}
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
    maxHeight: '95%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  content: {
    padding: 24,
    minHeight: 700,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#374151' : '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#E2E8F0',
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: isDark ? '#94A3B8' : '#64748B',
  },
  categoryTextSelected: {
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
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateQuickSelect: {
    marginTop: 12,
  },
  quickSelectLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#94A3B8' : '#64748B',
    marginBottom: 8,
  },
  quickSelectButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickSelectButton: {
    backgroundColor: isDark ? '#4B5563' : '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickSelectText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#E2E8F0' : '#475569',
  },
  progressPreview: {
    backgroundColor: isDark ? '#374151' : '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#E2E8F0',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#F1F5F9' : '#1E293B',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  progressBarContainer: {},
  progressBar: {
    height: 8,
    backgroundColor: isDark ? '#4B5563' : '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
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
