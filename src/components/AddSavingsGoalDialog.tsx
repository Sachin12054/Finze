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
import { EnhancedFirebaseService, SavingsGoal } from '../services/firebase/enhancedFirebaseService';

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
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Real-time validation function
  const validateField = (field: string, value: string) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'targetAmount':
        const targetValue = parseFloat(value);
        if (value && (isNaN(targetValue) || targetValue <= 0)) {
          errors.targetAmount = 'Must be a valid number greater than 0';
        } else if (value && targetValue < 100) {
          errors.targetAmount = 'Must be at least ₹100';
        } else if (value && targetValue > 10000000) {
          errors.targetAmount = 'Cannot exceed ₹1,00,00,000';
        } else {
          delete errors.targetAmount;
        }
        break;
        
      case 'currentAmount':
        const currentValue = parseFloat(value);
        const targetValue2 = parseFloat(targetAmount);
        if (value && (isNaN(currentValue) || currentValue < 0)) {
          errors.currentAmount = 'Must be a valid number (0 or greater)';
        } else if (value && targetAmount && currentValue > targetValue2) {
          errors.currentAmount = 'Cannot exceed target amount';
        } else {
          delete errors.currentAmount;
        }
        break;
        
      case 'addAmount':
        const addValue = parseFloat(value);
        if (value && (isNaN(addValue) || addValue <= 0)) {
          errors.addAmount = 'Must be a valid number greater than 0';
        } else if (value && addValue > 1000000) {
          errors.addAmount = 'Consider adding smaller amounts';
        } else {
          delete errors.addAmount;
        }
        break;
        
      case 'name':
        if (value && value.length > 50) {
          errors.name = 'Goal name too long (max 50 characters)';
        } else if (value && value.length < 3) {
          errors.name = 'Goal name too short (min 3 characters)';
        } else {
          delete errors.name;
        }
        break;
    }
    
    setValidationErrors(errors);
  };

  // Enhanced setters with validation
  const setTargetAmountWithValidation = (value: string) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setTargetAmount(cleanValue);
    validateField('targetAmount', cleanValue);
  };

  const setCurrentAmountWithValidation = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setCurrentAmount(cleanValue);
    validateField('currentAmount', cleanValue);
  };

  const setAddAmountWithValidation = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setAddAmount(cleanValue);
    validateField('addAmount', cleanValue);
  };

  const setNameWithValidation = (value: string) => {
    setName(value);
    validateField('name', value);
  };

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

  // Handle adding amount to current amount with enhanced validation
  const handleAddAmount = () => {
    const currentAmountValue = parseFloat(currentAmount) || 0;
    const addAmountValue = parseFloat(addAmount) || 0;
    const targetAmountValue = parseFloat(targetAmount) || 0;
    
    // Basic validation
    if (isNaN(addAmountValue) || addAmountValue <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0 to add');
      return;
    }

    // Check if adding this amount would exceed the target
    const newTotal = currentAmountValue + addAmountValue;
    
    if (targetAmountValue > 0 && newTotal > targetAmountValue) {
      Alert.alert(
        'Amount Exceeds Target',
        `Adding ₹${addAmountValue.toLocaleString('en-IN')} would make your total ₹${newTotal.toLocaleString('en-IN')}, which exceeds your target of ₹${targetAmountValue.toLocaleString('en-IN')}.\n\nWould you like to continue anyway?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Continue',
            onPress: () => {
              setCurrentAmount(newTotal.toString());
              setAddAmount('');
              Alert.alert('Success', `₹${addAmountValue.toLocaleString('en-IN')} added! Your goal is now ${Math.round((newTotal / targetAmountValue) * 100)}% complete.`);
            }
          }
        ]
      );
      return;
    }

    // Reasonable single addition limit (₹10 lakh)
    if (addAmountValue > 1000000) {
      Alert.alert(
        'Large Amount',
        `You're adding ₹${addAmountValue.toLocaleString('en-IN')} at once. Are you sure this is correct?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              setCurrentAmount(newTotal.toString());
              setAddAmount('');
              
              // Show completion message if goal is reached
              if (targetAmountValue > 0 && newTotal >= targetAmountValue) {
                Alert.alert('🎉 Goal Completed!', `Congratulations! You've reached your savings goal of ₹${targetAmountValue.toLocaleString('en-IN')}!`);
              } else {
                Alert.alert('Success', `₹${addAmountValue.toLocaleString('en-IN')} added successfully!`);
              }
            }
          }
        ]
      );
      return;
    }
    
    // Normal addition
    setCurrentAmount(newTotal.toString());
    setAddAmount('');
    
    // Show completion message if goal is reached
    if (targetAmountValue > 0 && newTotal >= targetAmountValue) {
      Alert.alert('🎉 Goal Completed!', `Congratulations! You've reached your savings goal of ₹${targetAmountValue.toLocaleString('en-IN')}!`);
    } else {
      const progressPercent = targetAmountValue > 0 ? Math.round((newTotal / targetAmountValue) * 100) : 0;
      Alert.alert(
        'Success', 
        `₹${addAmountValue.toLocaleString('en-IN')} added successfully!${targetAmountValue > 0 ? ` You're now ${progressPercent}% towards your goal.` : ''}`
      );
    }
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

    // Enhanced validation for target amount
    const targetAmountValue = parseFloat(targetAmount);
    if (isNaN(targetAmountValue) || targetAmountValue <= 0) {
      Alert.alert('Invalid Amount', 'Target amount must be a valid number greater than 0');
      return;
    }

    // Set reasonable limits for goal amounts
    if (targetAmountValue < 100) {
      Alert.alert('Invalid Amount', 'Target amount must be at least ₹100');
      return;
    }

    if (targetAmountValue > 10000000) { // 1 crore limit
      Alert.alert('Invalid Amount', 'Target amount cannot exceed ₹1,00,00,000 (1 Crore)');
      return;
    }

    // Enhanced validation for current amount
    const currentAmountValue = parseFloat(currentAmount);
    if (isNaN(currentAmountValue) || currentAmountValue < 0) {
      Alert.alert('Invalid Amount', 'Current amount must be a valid number and cannot be negative');
      return;
    }

    // Critical validation: Current amount cannot exceed target amount
    if (currentAmountValue > targetAmountValue) {
      Alert.alert(
        'Invalid Amount', 
        `Current amount (₹${currentAmountValue.toLocaleString('en-IN')}) cannot be greater than target amount (₹${targetAmountValue.toLocaleString('en-IN')}). Please adjust your amounts.`
      );
      return;
    }

    // Warn if current amount is very close to target (95% or more)
    if (currentAmountValue >= targetAmountValue * 0.95) {
      Alert.alert(
        'Goal Almost Complete',
        `Your current amount is already ${Math.round((currentAmountValue / targetAmountValue) * 100)}% of your target. Consider increasing your target amount or marking this goal as complete.`,
        [
          { text: 'Continue Anyway', onPress: () => proceedWithSave() },
          { text: 'Adjust Amount', style: 'cancel' }
        ]
      );
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

    // Warn if target date is too far in the future (more than 10 years)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 10);
    
    if (goalDate > maxDate) {
      Alert.alert(
        'Long Term Goal',
        'Target date is more than 10 years away. Consider setting shorter term milestones.',
        [
          { text: 'Continue Anyway', onPress: () => proceedWithSave() },
          { text: 'Adjust Date', style: 'cancel' }
        ]
      );
      return;
    }

    // Validate monthly saving requirement
    const monthsToGoal = Math.ceil((goalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const remainingAmount = targetAmountValue - currentAmountValue;
    const monthlyRequired = remainingAmount / monthsToGoal;

    if (monthlyRequired > 100000) { // More than 1 lakh per month
      Alert.alert(
        'High Monthly Requirement',
        `You need to save ₹${monthlyRequired.toLocaleString('en-IN')} per month to reach this goal. This seems quite high. Consider adjusting your target amount or extending the timeline.`,
        [
          { text: 'Continue Anyway', onPress: () => proceedWithSave() },
          { text: 'Adjust Goal', style: 'cancel' }
        ]
      );
      return;
    }

    await proceedWithSave();
  };

  const proceedWithSave = async () => {
    setLoading(true);
    try {
      const targetAmountValue = parseFloat(targetAmount);
      const currentAmountValue = parseFloat(currentAmount);
      const goalDate = new Date(targetDate);

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
                  style={[
                    styles.input,
                    validationErrors.name && styles.inputError
                  ]}
                  value={name}
                  onChangeText={setNameWithValidation}
                  placeholder="e.g., New iPhone, Europe Trip"
                  placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                  maxLength={50}
                />
                {validationErrors.name && (
                  <Text style={styles.errorText}>{validationErrors.name}</Text>
                )}
              </View>

              {/* Target Amount */}
              <View style={styles.section}>
                <Text style={styles.label}>Target Amount *</Text>
                <View style={[
                  styles.inputContainer,
                  validationErrors.targetAmount && styles.inputError
                ]}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={targetAmount}
                    onChangeText={setTargetAmountWithValidation}
                    keyboardType="numeric"
                    placeholder="Enter target amount"
                    placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                  />
                </View>
                {validationErrors.targetAmount && (
                  <Text style={styles.errorText}>{validationErrors.targetAmount}</Text>
                )}
                {targetAmount && !validationErrors.targetAmount && (
                  <Text style={styles.helpText}>
                    Target: ₹{parseFloat(targetAmount).toLocaleString('en-IN')}
                  </Text>
                )}
              </View>

              {/* Current Amount */}
              <Animated.View 
                style={styles.section}
                entering={FadeInUp.delay(600)}
              >
                <Text style={styles.label}>Current Amount</Text>
                <View style={[
                  styles.inputContainer,
                  validationErrors.currentAmount && styles.inputError
                ]}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={currentAmount}
                    onChangeText={setCurrentAmountWithValidation}
                    keyboardType="numeric"
                    placeholder="Current savings amount"
                    placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                  />
                </View>
                {validationErrors.currentAmount && (
                  <Text style={styles.errorText}>{validationErrors.currentAmount}</Text>
                )}
                
                {/* Add Amount Section - Always show for convenience */}
                <View style={styles.addAmountSection}>
                  <Text style={styles.addAmountLabel}>
                    {editingGoal ? 'Add more savings:' : 'Quick add to current amount:'}
                  </Text>
                  <View style={styles.addAmountContainer}>
                    <View style={[
                      styles.inputContainer, 
                      { flex: 1 },
                      validationErrors.addAmount && styles.inputError
                    ]}>
                      <Text style={styles.currencySymbol}>+₹</Text>
                      <TextInput
                        style={styles.amountInput}
                        value={addAmount}
                        onChangeText={setAddAmountWithValidation}
                        keyboardType="numeric"
                        placeholder="Amount to add"
                        placeholderTextColor={isDarkTheme ? '#64748B' : '#94A3B8'}
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        (!addAmount || parseFloat(addAmount) <= 0 || validationErrors.addAmount) && styles.addButtonDisabled
                      ]}
                      onPress={handleAddAmount}
                      disabled={!addAmount || parseFloat(addAmount) <= 0 || !!validationErrors.addAmount}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                  {validationErrors.addAmount && (
                    <Text style={styles.errorText}>{validationErrors.addAmount}</Text>
                  )}
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
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    color: isDark ? '#94A3B8' : '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
