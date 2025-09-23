import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EnhancedFirebaseService, SavingsGoal } from '../services/enhancedFirebaseService';

interface AddSavingsGoalDialogProps {
  visible: boolean;
  onClose: () => void;
  editingGoal?: SavingsGoal | null;
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
  editingGoal,
  isDarkTheme
}) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [addAmount, setAddAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = getStyles(isDarkTheme);

  // Handle editing mode
  useEffect(() => {
    if (editingGoal && visible) {
      setName(editingGoal.name);
      setTargetAmount(editingGoal.targetAmount.toString());
      setCurrentAmount(editingGoal.currentAmount.toString());
      setAddAmount('');
      const goalDate = new Date(editingGoal.targetDate);
      setTargetDate(editingGoal.targetDate.split('T')[0]); // Format for input
      setSelectedDate(goalDate);
      setCategory(editingGoal.category);
      setDescription(editingGoal.description || '');
    } else if (visible) {
      // Reset form for new goal
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setAddAmount('');
      setTargetDate('');
      setSelectedDate(new Date());
      setCategory('');
      setDescription('');
    }
  }, [editingGoal, visible]);

  // Handle adding amount to current amount
  const handleAddAmount = () => {
    const currentAmountValue = parseFloat(currentAmount) || 0;
    const addAmountValue = parseFloat(addAmount) || 0;
    
    if (addAmountValue <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to add');
      return;
    }
    
    const newTotal = currentAmountValue + addAmountValue;
    setCurrentAmount(newTotal.toString());
    setAddAmount('');
    Alert.alert('Success', `₹${addAmountValue} added to current savings!`);
  };

  // Handle date picker change
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    
    // Validate date (must be in future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (currentDate <= today) {
      Alert.alert('Invalid Date', 'Please select a future date for your savings goal');
      return;
    }
    
    setSelectedDate(currentDate);
    setTargetDate(currentDate.toISOString().split('T')[0]);
  };

  // Format date for display
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleSave = async () => {
    if (!name || !targetAmount || !targetDate || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate target amount
    const targetAmountValue = parseFloat(targetAmount);
    if (targetAmountValue <= 0) {
      Alert.alert('Invalid Amount', 'Target amount must be greater than 0');
      return;
    }

    // Validate current amount
    const currentAmountValue = parseFloat(currentAmount);
    if (currentAmountValue < 0) {
      Alert.alert('Invalid Amount', 'Current amount cannot be negative');
      return;
    }

    // Validate date
    const goalDate = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (goalDate <= today) {
      Alert.alert('Invalid Date', 'Target date must be in the future');
      return;
    }

    setLoading(true);
    try {
      const goalData = {
        name,
        targetAmount: targetAmountValue,
        currentAmount: currentAmountValue,
        targetDate: goalDate.toISOString(),
        category,
        priority: 'medium' as const,
        description,
        isCompleted: false
      };

      if (editingGoal && editingGoal.id) {
        // Update existing goal
        await EnhancedFirebaseService.updateSavingsGoal(editingGoal.id, goalData);
        Alert.alert('Success', 'Savings goal updated successfully!');
      } else {
        // Create new goal
        await EnhancedFirebaseService.addSavingsGoal(goalData);
        Alert.alert('Success', 'Savings goal created successfully!');
      }
      
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save savings goal');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setAddAmount('');
    setTargetDate('');
    setSelectedDate(new Date());
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
              {editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </Animated.View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Goal Categories */}
              <Animated.View 
                style={styles.section}
                entering={FadeInUp.delay(400)}
              >
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
              </Animated.View>

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
              <Animated.View 
                style={styles.section}
                entering={FadeInUp.delay(600)}
              >
                <Text style={styles.label}>Current Amount</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={currentAmount}
                    onChangeText={setCurrentAmount}
                    keyboardType="numeric"
                    placeholder="Current savings amount"
                    placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                  />
                </View>
                
                {/* Add Amount Section - Always show for convenience */}
                <View style={styles.addAmountSection}>
                  <Text style={styles.addAmountLabel}>
                    {editingGoal ? 'Add more savings:' : 'Quick add to current amount:'}
                  </Text>
                  <View style={styles.addAmountContainer}>
                    <View style={[styles.inputContainer, { flex: 1 }]}>
                      <Text style={styles.currencySymbol}>+₹</Text>
                      <TextInput
                        style={styles.amountInput}
                        value={addAmount}
                        onChangeText={setAddAmount}
                        keyboardType="numeric"
                        placeholder="Amount to add"
                        placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        (!addAmount || parseFloat(addAmount) <= 0) && styles.addButtonDisabled
                      ]}
                      onPress={handleAddAmount}
                      disabled={!addAmount || parseFloat(addAmount) <= 0}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.addAmountHint}>
                    This will be added to your current amount above
                  </Text>
                </View>
              </Animated.View>

              {/* Target Date */}
              <Animated.View 
                style={styles.section}
                entering={FadeInUp.delay(700)}
              >
                <Text style={styles.label}>Target Date *</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={targetDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                    {targetDate ? formatDateForDisplay(selectedDate) : 'Select target date'}
                  </Text>
                  <Ionicons 
                    name="calendar-outline" 
                    size={20} 
                    color={isDarkTheme ? '#64748B' : '#94A3B8'} 
                  />
                </TouchableOpacity>
                
                <View style={styles.dateQuickSelect}>
                  <Text style={styles.quickSelectLabel}>Quick select:</Text>
                  <View style={styles.quickSelectButtons}>
                    {[3, 6, 12, 24].map((months) => (
                      <TouchableOpacity
                        key={months}
                        style={styles.quickSelectButton}
                        onPress={() => {
                          const newDate = new Date();
                          newDate.setMonth(newDate.getMonth() + months);
                          setSelectedDate(newDate);
                          setTargetDate(newDate.toISOString().split('T')[0]);
                        }}
                      >
                        <Text style={styles.quickSelectText}>
                          {months < 12 ? `${months}M` : `${months/12}Y`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {showDatePicker && (
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Tomorrow
                  />
                )}
              </Animated.View>

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
                {loading 
                  ? (editingGoal ? 'Updating...' : 'Creating...') 
                  : (editingGoal ? 'Update Savings Goal' : 'Create Savings Goal')
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#374151' : '#f0f0f0',
    backgroundColor: isDark ? '#1F2937' : '#ffffff',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  addAmountSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: isDark ? '#374151' : '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#E2E8F0',
  },
  addAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#F1F5F9' : '#1E293B',
    marginBottom: 12,
  },
  addAmountContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  addButtonDisabled: {
    backgroundColor: isDark ? '#4B5563' : '#9CA3AF',
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  addAmountHint: {
    fontSize: 12,
    color: isDark ? '#9CA3AF' : '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  datePickerContainer: {
    marginTop: 12,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? '#374151' : '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: '500',
    color: isDark ? '#F1F5F9' : '#1E293B',
  },
  datePickerPlaceholder: {
    fontSize: 16,
    fontWeight: '500',
    color: isDark ? '#64748B' : '#94A3B8',
  },
});
