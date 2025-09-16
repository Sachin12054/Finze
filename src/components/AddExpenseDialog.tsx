import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { EnhancedFirebaseService } from '../services/enhancedFirebaseService';

const { width } = Dimensions.get('window');

interface ExpenseData {
  title: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  source: string;
  type: 'income' | 'expense';
}

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: ExpenseData) => void;
  editingExpense?: any;
}

interface ValidationErrors {
  title?: string;
  amount?: string;
  category?: string;
  description?: string;
}

const CATEGORIES = [
  { id: 'Food & Dining', label: 'Food & Dining', icon: 'restaurant' },
  { id: 'Transportation', label: 'Transportation', icon: 'car' },
  { id: 'Shopping', label: 'Shopping', icon: 'bag' },
  { id: 'Entertainment', label: 'Entertainment', icon: 'game-controller' },
  { id: 'Technology', label: 'Technology', icon: 'phone-portrait' },
  { id: 'Bills & Utilities', label: 'Bills & Utilities', icon: 'receipt' },
  { id: 'Healthcare', label: 'Healthcare', icon: 'medical' },
  { id: 'Travel', label: 'Travel', icon: 'airplane' },
  { id: 'Education', label: 'Education', icon: 'school' },
  { id: 'Business', label: 'Business', icon: 'briefcase' },
  { id: 'Other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  editingExpense
}) => {
  // Theme context
  const { isDarkTheme } = useTheme();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('manual');
  
  // Common states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  
  // AI specific states
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiPredictedCategory, setAiPredictedCategory] = useState('');
  const [aiConfidence, setAiConfidence] = useState(0);
  const [aiAnalyzed, setAiAnalyzed] = useState(false);
  
  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Validation states
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Validation functions
  const validateTitle = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Title is required';
    }
    if (value.trim().length < 2) {
      return 'Title must be at least 2 characters long';
    }
    if (value.trim().length > 100) {
      return 'Title must be less than 100 characters';
    }
    return undefined;
  };

  const validateAmount = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Amount is required';
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'Please enter a valid number';
    }
    if (numValue <= 0) {
      return 'Amount must be greater than 0';
    }
    if (numValue > 10000000) {
      return 'Amount seems too large. Please check.';
    }
    // Check for more than 2 decimal places
    if (value.includes('.') && value.split('.')[1].length > 2) {
      return 'Amount can have maximum 2 decimal places';
    }
    return undefined;
  };

  const validateCategory = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Please select a category';
    }
    if (!CATEGORIES.find(cat => cat.id === value)) {
      return 'Please select a valid category';
    }
    return undefined;
  };

  const validateDescription = (value: string): string | undefined => {
    if (value.trim().length > 500) {
      return 'Description must be less than 500 characters';
    }
    return undefined;
  };

  // Handle field changes with validation
  const handleFieldChange = (field: keyof ValidationErrors, value: string) => {
    // Update the field value
    switch (field) {
      case 'title':
        setTitle(value);
        break;
      case 'amount':
        setAmount(value);
        break;
      case 'category':
        setCategory(value);
        break;
      case 'description':
        setDescription(value);
        break;
    }

    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate and update errors
    let error: string | undefined;
    switch (field) {
      case 'title':
        error = validateTitle(value);
        break;
      case 'amount':
        error = validateAmount(value);
        break;
      case 'category':
        error = validateCategory(value);
        break;
      case 'description':
        error = validateDescription(value);
        break;
    }

    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Validate all fields
  const validateAllFields = (): boolean => {
    const titleError = validateTitle(title);
    const amountError = validateAmount(amount);
    const categoryError = validateCategory(category);
    const descriptionError = validateDescription(description);

    const newErrors: ValidationErrors = {};
    if (titleError) newErrors.title = titleError;
    if (amountError) newErrors.amount = amountError;
    if (categoryError) newErrors.category = categoryError;
    if (descriptionError) newErrors.description = descriptionError;

    setErrors(newErrors);
    setTouched({ title: true, amount: true, category: true, description: true });

    return Object.keys(newErrors).length === 0;
  };

  const analyzeWithAI = async () => {
    if (!title.trim()) {
      Alert.alert('Input Required', 'Please enter a description to analyze with AI');
      return;
    }

    setAiAnalyzing(true);
    try {
      // Call AI categorization API - use network IP instead of localhost for mobile/emulator access
      const response = await fetch('http://10.195.3.148:8001/api/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: title.trim()
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Map AI categories to frontend categories
        const categoryMapping: { [key: string]: string } = {
          // New Ultra-Perfect categorizer categories (exact match)
          'Food & Dining': 'Food & Dining',
          'Transportation': 'Transportation',
          'Shopping': 'Shopping',
          'Entertainment': 'Entertainment',
          'Technology': 'Technology',
          'Bills & Utilities': 'Bills & Utilities',
          'Healthcare': 'Healthcare',
          'Travel': 'Travel',
          'Education': 'Education',
          'Business': 'Business',
          'Other': 'Other',
          
          // Legacy support for old categorizer (lowercase)
          'food': 'Food & Dining',
          'transport': 'Transportation',
          'shopping': 'Shopping',
          'entertainment': 'Entertainment',
          'technology': 'Technology',
          'bills': 'Bills & Utilities',
          'healthcare': 'Healthcare',
          'travel': 'Travel',
          'education': 'Education',
          'business': 'Business',
          'other': 'Other'
        };
        
        const mappedCategory = categoryMapping[result.category] || 'Other';
        
        setAiPredictedCategory(mappedCategory);
        setAiConfidence(result.confidence || 0);
        setCategory(mappedCategory);
        setAiAnalyzed(true);
        
        Alert.alert(
          'AI Analysis Complete', 
          `Predicted Category: ${mappedCategory}\nConfidence: ${(result.confidence * 100).toFixed(1)}%`,
          [{ text: 'Great!', style: 'default' }]
        );
      } else {
        throw new Error('AI service unavailable');
      }
    } catch (error) {
      console.error('AI Analysis error:', error);
      Alert.alert(
        'AI Analysis Failed', 
        'Could not connect to AI service. Please use manual categorization.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setAiAnalyzing(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset for next open
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [open]);

  const handleSave = async () => {
    // Validate all fields first
    if (!validateAllFields()) {
      Alert.alert('Validation Error', 'Please fix all errors before saving');
      return;
    }

    try {
      const transactionData = {
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date: new Date().toISOString(),
        description: description.trim(),
        source: 'Manual' as const,
        type: type === 'expense' ? 'expense' as const : 'income' as const,
        tags: [category],
        location: '',
        paymentMethod: 'Cash', // Default payment method
      };

      await EnhancedFirebaseService.addTransaction(transactionData);
      
      onOpenChange(false);
      
      // Reset form
      setTitle('');
      setAmount('');
      setCategory('Other');
      setDescription('');
      setType('expense');
      setAiPredictedCategory('');
      setAiConfidence(0);
      setAiAnalyzed(false);
      setErrors({});
      setTouched({});
      
      Alert.alert(
        'Success', 
        `${type === 'expense' ? 'Expense' : 'Income'} saved successfully!`,
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert(
        'Error', 
        'Failed to save transaction. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const getCategoryIcon = (categoryLabel: string) => {
    const category = CATEGORIES.find(c => c.label === categoryLabel);
    return category?.icon || 'ellipsis-horizontal';
  };

  // Theme-aware colors
  const getThemeColors = () => ({
    background: isDarkTheme ? '#1e293b' : '#ffffff',
    surface: isDarkTheme ? '#334155' : '#f8fafc',
    text: isDarkTheme ? '#f1f5f9' : '#1e293b',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b',
    border: isDarkTheme ? '#475569' : '#e2e8f0',
    overlay: isDarkTheme ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.8)',
    inputBackground: isDarkTheme ? '#475569' : '#ffffff',
    placeholder: isDarkTheme ? '#64748b' : '#94a3b8',
    primary: isDarkTheme ? '#60a5fa' : '#3b82f6',
    success: isDarkTheme ? '#34d399' : '#10b981',
    error: isDarkTheme ? '#fb7185' : '#ef4444',
    warning: isDarkTheme ? '#fbbf24' : '#f59e0b',
  });

  // Get theme colors
  const colors = getThemeColors();

  return (
    <Modal
      visible={open}
      animationType="none"
      transparent={true}
      onRequestClose={() => onOpenChange(false)}
      statusBarTranslucent
    >
      <StatusBar 
        barStyle={isDarkTheme ? "light-content" : "light-content"} 
        backgroundColor={colors.overlay} 
      />
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Animated.View 
              style={[
                styles.modalContainer,
                { 
                  backgroundColor: colors.background,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Professional Header */}
              <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.headerContent, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.surface }]}
                    onPress={() => onOpenChange(false)}
                  >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                      {type === 'income' ? 'Add Income' : 'Add Expense'}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                      Track your financial activity
                    </Text>
                  </View>
                  <View style={styles.headerRight}>
                    <View style={[styles.typeIndicator, { backgroundColor: colors.surface }]}>
                      <Ionicons 
                        name={type === 'income' ? 'trending-up' : 'trending-down'} 
                        size={16} 
                        color={type === 'income' ? colors.success : colors.error} 
                      />
                    </View>
                  </View>
                </View>
              </View>

          {/* Professional Tab System */}
          <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'ai' && [styles.activeTab, { backgroundColor: colors.background }]]}
              onPress={() => setActiveTab('ai')}
            >
              <View style={styles.tabContent}>
                <Ionicons 
                  name="sparkles" 
                  size={18} 
                  color={activeTab === 'ai' ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.tabText, 
                  { color: colors.textSecondary },
                  activeTab === 'ai' && [styles.activeTabText, { color: colors.primary }]
                ]}>
                  AI Assistant
                </Text>
              </View>
              {activeTab === 'ai' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'manual' && [styles.activeTab, { backgroundColor: colors.background }]]}
              onPress={() => setActiveTab('manual')}
            >
              <View style={styles.tabContent}>
                <Ionicons 
                  name="pencil" 
                  size={18} 
                  color={activeTab === 'manual' ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.tabText, 
                  { color: colors.textSecondary },
                  activeTab === 'manual' && [styles.activeTabText, { color: colors.primary }]
                ]}>
                  Manual Entry
                </Text>
              </View>
              {activeTab === 'manual' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'ai' ? (
              // AI Tab Content
              <>
                {/* Type Selection */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaction Type</Text>
                  <View style={styles.typeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        { borderColor: colors.border, backgroundColor: colors.inputBackground },
                        type === 'expense' && [styles.typeButtonActiveExpense, { backgroundColor: colors.error, borderColor: colors.error }]
                      ]}
                      onPress={() => setType('expense')}
                    >
                      <Ionicons 
                        name="arrow-down-circle" 
                        size={20} 
                        color={type === 'expense' ? '#ffffff' : colors.error} 
                      />
                      <Text style={[
                        styles.typeButtonText,
                        { color: colors.textSecondary },
                        type === 'expense' && styles.typeButtonTextActive
                      ]}>
                        Expense
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        { borderColor: colors.border, backgroundColor: colors.inputBackground },
                        type === 'income' && [styles.typeButtonActiveIncome, { backgroundColor: colors.success, borderColor: colors.success }]
                      ]}
                      onPress={() => setType('income')}
                    >
                      <Ionicons 
                        name="arrow-up-circle" 
                        size={20} 
                        color={type === 'income' ? '#ffffff' : colors.success} 
                      />
                      <Text style={[
                        styles.typeButtonText,
                        { color: colors.textSecondary },
                        type === 'income' && styles.typeButtonTextActive
                      ]}>
                        Income
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* AI Description Input */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Describe Your Transaction</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Our AI will analyze and categorize it for you</Text>
                  <View style={styles.aiInputWrapper}>
                    <TextInput
                      style={[
                        styles.aiInput,
                        { 
                          borderColor: errors.title ? colors.error : colors.border,
                          backgroundColor: colors.inputBackground,
                          color: colors.text
                        }
                      ]}
                      value={title}
                      onChangeText={(text) => handleFieldChange('title', text)}
                      placeholder="e.g., Coffee at Starbucks ₹250"
                      placeholderTextColor={colors.placeholder}
                      multiline
                      textAlignVertical="top"
                    />
                    {errors.title && touched.title && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>{errors.title}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.analyzeButton, 
                        { backgroundColor: colors.primary },
                        (aiAnalyzing || !title.trim()) && [styles.analyzeButtonDisabled, { backgroundColor: colors.textSecondary }]
                      ]}
                      onPress={analyzeWithAI}
                      disabled={aiAnalyzing || !title.trim()}
                    >
                      {aiAnalyzing ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons name="sparkles" size={16} color="#ffffff" />
                          <Text style={styles.analyzeButtonText}>Analyze</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* AI Analysis Result */}
                {aiAnalyzed && (
                  <View style={[styles.aiResultContainer, { backgroundColor: isDarkTheme ? '#064e3b' : '#f0fdf4', borderColor: isDarkTheme ? '#059669' : '#bbf7d0' }]}>
                    <View style={styles.aiResultHeader}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={[styles.aiResultTitle, { color: colors.success }]}>AI Analysis Complete</Text>
                    </View>
                    <View style={styles.aiResultGrid}>
                      <View style={styles.aiResultItem}>
                        <Text style={[styles.aiResultLabel, { color: colors.success }]}>Category</Text>
                        <View style={styles.aiResultValueContainer}>
                          <Ionicons 
                            name={getCategoryIcon(aiPredictedCategory) as any} 
                            size={16} 
                            color={colors.primary} 
                          />
                          <Text style={[styles.aiResultValue, { color: colors.success }]}>
                            {aiPredictedCategory}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.aiResultItem}>
                        <Text style={[styles.aiResultLabel, { color: colors.success }]}>Confidence</Text>
                        <Text style={[styles.aiResultValue, { color: colors.success }]}>
                          {(aiConfidence * 100).toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Amount Input */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Amount</Text>
                  <View style={[
                    styles.amountInputContainer,
                    { 
                      borderColor: errors.amount ? colors.error : colors.border,
                      backgroundColor: colors.inputBackground
                    }
                  ]}>
                    <Text style={[styles.currencySymbol, { color: colors.primary }]}>₹</Text>
                    <TextInput
                      style={[styles.amountInput, { color: colors.text }]}
                      value={amount}
                      onChangeText={(text) => handleFieldChange('amount', text)}
                      placeholder="0.00"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="numeric"
                    />
                  </View>
                  {errors.amount && touched.amount && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color={colors.error} />
                      <Text style={[styles.errorText, { color: colors.error }]}>{errors.amount}</Text>
                    </View>
                  )}
                </View>

                {/* Date Display */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Date & Time</Text>
                  <View style={[styles.dateTimeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.dateTimeContent}>
                      <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                      <View>
                        <Text style={[styles.dateText, { color: colors.text }]}>
                          {new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </Text>
                        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                          {new Date().toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Category Selection (AI Mode) */}
                {aiAnalyzed && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Category Selection</Text>
                    <Text style={styles.sectionSubtitle}>AI suggested category is highlighted</Text>
                    <View style={styles.categoryGrid}>
                      {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryCard,
                            category === cat.id && styles.selectedCategoryCard,
                            aiPredictedCategory === cat.id && styles.aiSuggestedCategoryCard
                          ]}
                          onPress={() => setCategory(cat.id)}
                        >
                          <View style={styles.categoryIconContainer}>
                            <Ionicons 
                              name={cat.icon as any} 
                              size={20} 
                              color={
                                category === cat.id 
                                  ? '#ffffff' 
                                  : aiPredictedCategory === cat.id 
                                    ? '#f59e0b' 
                                    : '#64748b'
                              } 
                            />
                            {aiPredictedCategory === cat.id && (
                              <View style={styles.aiSuggestedBadge}>
                                <Ionicons name="sparkles" size={10} color="#f59e0b" />
                              </View>
                            )}
                          </View>
                          <Text style={[
                            styles.categoryCardText,
                            category === cat.id && styles.selectedCategoryCardText
                          ]}>
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              // Manual Tab Content
              <>
                {/* Type Selection */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaction Type</Text>
                  <View style={styles.typeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        { borderColor: colors.border, backgroundColor: colors.inputBackground },
                        type === 'expense' && [styles.typeButtonActiveExpense, { backgroundColor: colors.error, borderColor: colors.error }]
                      ]}
                      onPress={() => setType('expense')}
                    >
                      <Ionicons 
                        name="arrow-down-circle" 
                        size={20} 
                        color={type === 'expense' ? '#ffffff' : colors.error} 
                      />
                      <Text style={[
                        styles.typeButtonText,
                        { color: colors.textSecondary },
                        type === 'expense' && styles.typeButtonTextActive
                      ]}>
                        Expense
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        { borderColor: colors.border, backgroundColor: colors.inputBackground },
                        type === 'income' && [styles.typeButtonActiveIncome, { backgroundColor: colors.success, borderColor: colors.success }]
                      ]}
                      onPress={() => setType('income')}
                    >
                      <Ionicons 
                        name="arrow-up-circle" 
                        size={20} 
                        color={type === 'income' ? '#ffffff' : colors.success} 
                      />
                      <Text style={[
                        styles.typeButtonText,
                        { color: colors.textSecondary },
                        type === 'income' && styles.typeButtonTextActive
                      ]}>
                        Income
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Title Input */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Title</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        borderColor: errors.title ? colors.error : colors.border,
                        backgroundColor: colors.inputBackground,
                        color: colors.text
                      }
                    ]}
                    value={title}
                    onChangeText={(text) => handleFieldChange('title', text)}
                    placeholder="Enter transaction title"
                    placeholderTextColor={colors.placeholder}
                  />
                  {errors.title && touched.title && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color={colors.error} />
                      <Text style={[styles.errorText, { color: colors.error }]}>{errors.title}</Text>
                    </View>
                  )}
                </View>

                {/* Amount Input */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Amount</Text>
                  <View style={[
                    styles.amountInputContainer,
                    { 
                      borderColor: errors.amount ? colors.error : colors.border,
                      backgroundColor: colors.inputBackground
                    }
                  ]}>
                    <Text style={[styles.currencySymbol, { color: colors.primary }]}>₹</Text>
                    <TextInput
                      style={[styles.amountInput, { color: colors.text }]}
                      value={amount}
                      onChangeText={(text) => handleFieldChange('amount', text)}
                      placeholder="0.00"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="numeric"
                    />
                  </View>
                  {errors.amount && touched.amount && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color={colors.error} />
                      <Text style={[styles.errorText, { color: colors.error }]}>{errors.amount}</Text>
                    </View>
                  )}
                </View>

                {/* Category Selection */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Category</Text>
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryCard,
                          { 
                            borderColor: colors.border, 
                            backgroundColor: colors.inputBackground 
                          },
                          category === cat.id && [styles.selectedCategoryCard, { 
                            backgroundColor: colors.primary, 
                            borderColor: colors.primary 
                          }]
                        ]}
                        onPress={() => {
                          setCategory(cat.id);
                          // Clear category error
                          const newErrors = { ...errors };
                          delete newErrors.category;
                          setErrors(newErrors);
                        }}
                      >
                        <View style={styles.categoryIconContainer}>
                          <Ionicons 
                            name={cat.icon as any} 
                            size={20} 
                            color={category === cat.id ? '#ffffff' : colors.textSecondary} 
                          />
                        </View>
                        <Text style={[
                          styles.categoryCardText,
                          { color: colors.textSecondary },
                          category === cat.id && styles.selectedCategoryCardText
                        ]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.category && touched.category && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color={colors.error} />
                      <Text style={[styles.errorText, { color: colors.error }]}>{errors.category}</Text>
                    </View>
                  )}
                </View>

                {/* Description Input */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    Add additional notes (optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.textAreaInput,
                      { 
                        borderColor: errors.description ? colors.error : colors.border,
                        backgroundColor: colors.inputBackground,
                        color: colors.text
                      }
                    ]}
                    value={description}
                    onChangeText={(text) => handleFieldChange('description', text)}
                    placeholder="Add any additional details..."
                    placeholderTextColor={colors.placeholder}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  {errors.description && touched.description && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color={colors.error} />
                      <Text style={[styles.errorText, { color: colors.error }]}>{errors.description}</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          {/* Professional Action Footer */}
          <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                type === 'income' ? [styles.saveButtonIncome, { backgroundColor: colors.success }] : [styles.saveButtonExpense, { backgroundColor: colors.error }]
              ]}
              onPress={handleSave}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color="#ffffff" 
              />
              <Text style={styles.saveButtonText}>
                Save {type === 'income' ? 'Income' : 'Expense'}
              </Text>
            </TouchableOpacity>
          </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Professional Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
    paddingTop: 40, // Minimal top padding
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },

  // Professional Header
  headerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 24,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Professional Tab System
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    position: 'relative',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderRadius: 8,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 3,
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#6366f1',
  },

  // Scrollable Content
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100, // More padding for footer
  },

  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },

  // Type Selection
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  typeButtonActiveExpense: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  typeButtonActiveIncome: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },

  // Input Styles
  textInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1e293b',
  },
  textAreaInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1e293b',
    height: 100,
  },

  // Amount Input
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingLeft: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3b82f6',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },

  // AI Specific Styles
  aiInputWrapper: {
    gap: 12,
  },
  aiInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1e293b',
    minHeight: 80,
  },
  analyzeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },

  // AI Result Styles
  aiResultContainer: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  aiResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
  },
  aiResultGrid: {
    gap: 12,
  },
  aiResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiResultLabel: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  aiResultValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiResultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
  },

  // Date Time Display
  dateTimeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  dateTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  timeText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (width - 64) / 3, // 3 columns with padding
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  selectedCategoryCard: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  aiSuggestedCategoryCard: {
    borderColor: '#f59e0b',
    borderWidth: 3,
    backgroundColor: '#fffbeb',
  },
  categoryIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  aiSuggestedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    padding: 2,
  },
  categoryCardText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 14,
  },
  selectedCategoryCardText: {
    color: '#ffffff',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveButtonExpense: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  saveButtonIncome: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Error Validation Styles
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});

export default AddExpenseDialog;