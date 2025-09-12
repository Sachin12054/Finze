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
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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

  const analyzeWithAI = async () => {
    if (!title.trim()) {
      Alert.alert('Input Required', 'Please enter a description to analyze with AI');
      return;
    }

    setAiAnalyzing(true);
    try {
      // Call AI categorization API - use network IP instead of localhost for mobile/emulator access
      const response = await fetch('http://10.12.71.153:8001/api/categorize', {
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
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for this transaction');
      return;
    }
    
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
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
  });

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
        backgroundColor={getThemeColors().overlay} 
      />
      <View style={[styles.modalOverlay, { backgroundColor: getThemeColors().overlay }]}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Animated.View 
              style={[
                styles.modalContainer,
                { 
                  backgroundColor: getThemeColors().background,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Professional Header */}
              <View style={[styles.headerContainer, { backgroundColor: getThemeColors().background }]}>
                <View style={[styles.headerContent, { borderBottomColor: getThemeColors().border }]}>
                  <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: getThemeColors().surface }]}
                    onPress={() => onOpenChange(false)}
                  >
                    <Ionicons name="arrow-back" size={24} color={getThemeColors().text} />
                  </TouchableOpacity>
                  <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: getThemeColors().text }]}>
                      {type === 'income' ? 'Add Income' : 'Add Expense'}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: getThemeColors().textSecondary }]}>
                      Track your financial activity
                    </Text>
                  </View>
                  <View style={styles.headerRight}>
                    <View style={[styles.typeIndicator, { backgroundColor: getThemeColors().surface }]}>
                      <Ionicons 
                        name={type === 'income' ? 'trending-up' : 'trending-down'} 
                        size={16} 
                        color={type === 'income' ? '#10b981' : '#ef4444'} 
                      />
                    </View>
                  </View>
                </View>
              </View>

          {/* Professional Tab System */}
          <View style={[styles.tabContainer, { backgroundColor: getThemeColors().surface }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'ai' && [styles.activeTab, { backgroundColor: getThemeColors().background }]]}
              onPress={() => setActiveTab('ai')}
            >
              <View style={styles.tabContent}>
                <Ionicons 
                  name="sparkles" 
                  size={18} 
                  color={activeTab === 'ai' ? '#6366f1' : getThemeColors().textSecondary} 
                />
                <Text style={[
                  styles.tabText, 
                  { color: getThemeColors().textSecondary },
                  activeTab === 'ai' && styles.activeTabText
                ]}>
                  AI Assistant
                </Text>
              </View>
              {activeTab === 'ai' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'manual' && [styles.activeTab, { backgroundColor: getThemeColors().background }]]}
              onPress={() => setActiveTab('manual')}
            >
              <View style={styles.tabContent}>
                <Ionicons 
                  name="pencil" 
                  size={18} 
                  color={activeTab === 'manual' ? '#6366f1' : getThemeColors().textSecondary} 
                />
                <Text style={[
                  styles.tabText, 
                  { color: getThemeColors().textSecondary },
                  activeTab === 'manual' && styles.activeTabText
                ]}>
                  Manual Entry
                </Text>
              </View>
              {activeTab === 'manual' && <View style={styles.tabIndicator} />}
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
                  <Text style={styles.sectionTitle}>Transaction Type</Text>
                  <View style={styles.typeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        type === 'expense' && styles.typeButtonActiveExpense
                      ]}
                      onPress={() => setType('expense')}
                    >
                      <Ionicons 
                        name="arrow-down-circle" 
                        size={20} 
                        color={type === 'expense' ? '#ffffff' : '#ef4444'} 
                      />
                      <Text style={[
                        styles.typeButtonText,
                        type === 'expense' && styles.typeButtonTextActive
                      ]}>
                        Expense
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        type === 'income' && styles.typeButtonActiveIncome
                      ]}
                      onPress={() => setType('income')}
                    >
                      <Ionicons 
                        name="arrow-up-circle" 
                        size={20} 
                        color={type === 'income' ? '#ffffff' : '#10b981'} 
                      />
                      <Text style={[
                        styles.typeButtonText,
                        type === 'income' && styles.typeButtonTextActive
                      ]}>
                        Income
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* AI Description Input */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Describe Your Transaction</Text>
                  <Text style={styles.sectionSubtitle}>Our AI will analyze and categorize it for you</Text>
                  <View style={styles.aiInputWrapper}>
                    <TextInput
                      style={styles.aiInput}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="e.g., Coffee ₹5"
                      placeholderTextColor="#94a3b8"
                      multiline
                      textAlignVertical="top"
                    />
                    <TouchableOpacity
                      style={[styles.analyzeButton, aiAnalyzing && styles.analyzeButtonDisabled]}
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
                  <View style={styles.aiResultContainer}>
                    <View style={styles.aiResultHeader}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      <Text style={styles.aiResultTitle}>AI Analysis Complete</Text>
                    </View>
                    <View style={styles.aiResultGrid}>
                      <View style={styles.aiResultItem}>
                        <Text style={styles.aiResultLabel}>Category</Text>
                        <View style={styles.aiResultValueContainer}>
                          <Ionicons 
                            name={getCategoryIcon(aiPredictedCategory) as any} 
                            size={16} 
                            color="#3b82f6" 
                          />
                          <Text style={styles.aiResultValue}>
                            {aiPredictedCategory}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.aiResultItem}>
                        <Text style={styles.aiResultLabel}>Confidence</Text>
                        <Text style={styles.aiResultValue}>
                          {(aiConfidence * 100).toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Amount Input */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Amount</Text>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0.00"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Date Display */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Date & Time</Text>
                  <View style={styles.dateTimeCard}>
                    <View style={styles.dateTimeContent}>
                      <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
                      <View>
                        <Text style={styles.dateText}>
                          {new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </Text>
                        <Text style={styles.timeText}>
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
                  <Text style={styles.sectionTitle}>Transaction Type</Text>
                  <View style={styles.typeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        type === 'expense' && styles.typeButtonActiveExpense
                      ]}
                      onPress={() => setType('expense')}
                    >
                      <Ionicons 
                        name="arrow-down-circle" 
                        size={20} 
                        color={type === 'expense' ? '#ffffff' : '#ef4444'} 
                      />
                      <Text style={[
                        styles.typeButtonText,
                        type === 'expense' && styles.typeButtonTextActive
                      ]}>
                        Expense
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        type === 'income' && styles.typeButtonActiveIncome
                      ]}
                      onPress={() => setType('income')}
                    >
                      <Ionicons 
                        name="arrow-up-circle" 
                        size={20} 
                        color={type === 'income' ? '#ffffff' : '#10b981'} 
                      />
                      <Text style={[
                        styles.typeButtonText,
                        type === 'income' && styles.typeButtonTextActive
                      ]}>
                        Income
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Title Input */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Title</Text>
                  <TextInput
                    style={styles.textInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter transaction title"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Amount Input */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Amount</Text>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0.00"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Category Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Category</Text>
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryCard,
                          category === cat.id && styles.selectedCategoryCard
                        ]}
                        onPress={() => setCategory(cat.id)}
                      >
                        <View style={styles.categoryIconContainer}>
                          <Ionicons 
                            name={cat.icon as any} 
                            size={20} 
                            color={category === cat.id ? '#ffffff' : '#64748b'} 
                          />
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

                {/* Description Input */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.sectionSubtitle}>Add additional notes (optional)</Text>
                  <TextInput
                    style={styles.textAreaInput}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add any additional details..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}
          </ScrollView>

          {/* Professional Action Footer */}
          <View style={[styles.footer, { backgroundColor: getThemeColors().background, borderTopColor: getThemeColors().border }]}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                type === 'income' ? styles.saveButtonIncome : styles.saveButtonExpense
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
});

export default AddExpenseDialog;