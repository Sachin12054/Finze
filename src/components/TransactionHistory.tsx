import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Transaction } from "../services/firebase/enhancedFirebaseService";

interface TransactionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: Transaction[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (id: string, updatedExpense: Partial<Transaction>) => void;
}

const { width, height } = Dimensions.get('window');

const categories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Income',
  'Other'
];

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  open,
  onOpenChange,
  expenses,
  onDeleteExpense,
  onEditExpense,
}) => {
  // Theme context
  const { isDarkTheme } = useTheme();
  
  // Theme-aware colors
  const getThemeColors = () => ({
    background: isDarkTheme ? '#1e293b' : '#ffffff',
    surface: isDarkTheme ? '#334155' : '#f8fafc',
    text: isDarkTheme ? '#f1f5f9' : '#1e293b',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b',
    border: isDarkTheme ? '#475569' : '#e2e8f0',
    overlay: isDarkTheme ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.9)',
    inputBackground: isDarkTheme ? '#475569' : '#ffffff',
    placeholder: isDarkTheme ? '#64748b' : '#94a3b8',
    primary: isDarkTheme ? '#60a5fa' : '#3b82f6',
    success: isDarkTheme ? '#34d399' : '#10b981',
    error: isDarkTheme ? '#fb7185' : '#ef4444',
    warning: isDarkTheme ? '#fbbf24' : '#f59e0b',
    primarySurface: isDarkTheme ? '#1e40af' : '#eff6ff',
    successSurface: isDarkTheme ? '#064e3b' : '#f0fdf4',
    errorSurface: isDarkTheme ? '#7f1d1d' : '#fef2f2',
    cardBackground: isDarkTheme ? '#374151' : '#ffffff',
    cardBorder: isDarkTheme ? '#475569' : '#f1f5f9',
  });

  const colors = getThemeColors();

  // Helper functions to handle NaN/undefined values
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount) || typeof amount !== 'number') {
      return '₹0.00';
    }
    return `₹${amount.toFixed(2)}`;
  };

  const safeToFixed = (value: number | undefined | null, decimals: number = 2): string => {
    if (value === undefined || value === null || isNaN(value) || typeof value !== 'number') {
      if (decimals === 0) return '0';
      return '0.' + '0'.repeat(decimals);
    }
    return value.toFixed(decimals);
  };

  // Safe helper functions for handling potentially undefined values
  const safeToString = (value: any): string => {
    if (value === null || value === undefined) {
      return '0';
    }
    return String(value);
  };

  const safeParseFloat = (value: any): number => {
    if (value === null || value === undefined) {
      return 0;
    }
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? 0 : parsed;
  };

  // Animation values
  const [slideAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(0.8));
  const [opacityAnimation] = useState(new Animated.Value(0));

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [monthYear, setMonthYear] = useState(() => {
    const now = new Date();
    return `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
  });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editExpense, setEditExpense] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Animations
  useEffect(() => {
    console.log('TransactionHistory: open state changed to', open);
    if (open) {
      Animated.parallel([
        Animated.spring(slideAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open]);

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = (expense.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (expense.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || expense.type === filterType;
    const expenseDate = new Date(expense.date);
    const [month, year] = monthYear.split('-').map(Number);
    const matchesMonth = expenseDate.getMonth() + 1 === month && expenseDate.getFullYear() === year;
    const matchesDateRange = (!dateFrom || expenseDate >= new Date(dateFrom)) &&
                             (!dateTo || expenseDate <= new Date(dateTo));
    const matchesAmountRange = (!amountMin || expense.amount >= parseFloat(amountMin)) &&
                               (!amountMax || expense.amount <= parseFloat(amountMax));
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    
    return matchesSearch && matchesType && (showFilters ? matchesDateRange && matchesAmountRange && matchesCategory : matchesMonth);
  });

  // Sort expenses
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'amount':
        const amountA = typeof a.amount === 'number' ? a.amount : 0;
        const amountB = typeof b.amount === 'number' ? b.amount : 0;
        comparison = amountA - amountB;
        break;
      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '');
        break;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Calculate totals
  const totalIncome = filteredExpenses
    .filter(expense => expense.type === 'income')
    .reduce((sum, expense) => {
      const amount = typeof expense.amount === 'number' && !isNaN(expense.amount) 
        ? expense.amount 
        : 0;
      return sum + amount;
    }, 0);
    
  const totalExpenses = filteredExpenses
    .filter(expense => expense.type === 'expense')
    .reduce((sum, expense) => {
      const amount = typeof expense.amount === 'number' && !isNaN(expense.amount) 
        ? expense.amount 
        : 0;
      return sum + amount;
    }, 0);
    
  const netBalance = totalIncome - totalExpenses;

  // Export functions (keeping original functionality)
  const exportToCSV = async () => {
    try {
      const csvHeaders = ['Date', 'Title', 'Category', 'Amount', 'Type', 'Source'];
      const csvData = filteredExpenses.map(expense => [
        expense.date,
        expense.title || 'Untitled',
        expense.category || 'Uncategorized',
        safeToString(expense.amount),
        expense.type,
        expense.source || 'Manual'
      ]);
      
      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      // TODO: Fix FileSystem.documentDirectory API issue
      console.log('Export CSV feature temporarily disabled');
      Alert.alert('Info', 'Export feature is temporarily disabled due to API changes');
      // const fileName = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      // const filePath = FileSystem.documentDirectory + fileName;
      // await FileSystem.writeAsStringAsync(filePath, csvContent);
      // await Sharing.shareAsync(filePath, {
      //   mimeType: 'text/csv',
      //   dialogTitle: 'Export Transactions'
      // });
      
      // Alert.alert('Success', 'Transactions exported successfully!');
    } catch (error) {
      console.error('Export CSV error:', error);
      Alert.alert('Error', 'Failed to export CSV');
    }
  };

  const exportToPDF = async () => {
    try {
      let pdfContent = `TRANSACTION HISTORY REPORT\n`;
      pdfContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
      pdfContent += `SUMMARY:\n`;
      pdfContent += `Total Income: ₹${safeToFixed(totalIncome, 2)}\n`;
      pdfContent += `Total Expenses: ₹${safeToFixed(totalExpenses, 2)}\n`;
      pdfContent += `Net Amount: ₹${safeToFixed(netBalance, 2)}\n\n`;
      pdfContent += `TRANSACTIONS (${filteredExpenses.length} total):\n`;
      pdfContent += `${'='.repeat(50)}\n`;
      
      filteredExpenses.forEach((expense) => {
        pdfContent += `Date: ${expense.date}\n`;
        pdfContent += `Title: ${expense.title || 'Untitled'}\n`;
        pdfContent += `Category: ${expense.category || 'Uncategorized'}\n`;
        pdfContent += `Amount: ₹${safeToFixed(expense.amount, 2)} (${expense.type})\n`;
        pdfContent += `Source: ${expense.source || 'Manual'}\n`;
        pdfContent += `${'-'.repeat(30)}\n`;
      });
      
      // TODO: Fix FileSystem.documentDirectory API issue
      console.log('Export PDF feature temporarily disabled');
      Alert.alert('Info', 'Export feature is temporarily disabled due to API changes');
      // const fileName = `transactions_report_${new Date().toISOString().split('T')[0]}.txt`;
      // const filePath = `${FileSystem.documentDirectory ?? ''}${fileName}`;
      // await FileSystem.writeAsStringAsync(filePath, pdfContent);
      // await Sharing.shareAsync(filePath, {
      //   mimeType: 'text/plain',
      //   dialogTitle: 'Export Transaction Report'
      // });
      
      // Alert.alert('Success', 'Transaction report exported successfully!');
    } catch (error) {
      console.error('Export PDF error:', error);
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const handleEditSubmit = () => {
    if (!editExpense || !editExpense.id) return;
    const parsedAmount = safeParseFloat(editExpense.amount);
    if (!editExpense.title || isNaN(parsedAmount) || parsedAmount <= 0 || !editExpense.category) return;
    onEditExpense(editExpense.id, {
      title: editExpense.title,
      amount: parsedAmount,
      category: editExpense.category,
      type: editExpense.type,
    });
    setEditExpense(null);
  };

  const handleDeleteExpense = (expense: Transaction) => {
    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete "${expense.title || 'this transaction'}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => expense.id && onDeleteExpense(expense.id)
        }
      ]
    );
  };

  const toggleSort = (field: 'date' | 'amount' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleClose = () => {
    console.log('TransactionHistory: handleClose called');
    onOpenChange(false);
  };

  console.log('TransactionHistory render: open =', open, 'expenses count =', expenses.length);

  if (!open) return null;

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.overlay} />
      <Animated.View 
        style={[
          styles.overlay,
          {
            backgroundColor: colors.overlay,
            opacity: opacityAnimation,
          }
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[
              styles.container,
              {
                backgroundColor: colors.background,
                transform: [
                  {
                    translateY: slideAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [height * 0.3, 0],
                    }),
                  },
                  { scale: scaleAnimation },
                ],
                opacity: opacityAnimation,
              },
            ]}
          >
            {/* Fixed Header */}
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <View style={styles.headerContent}>
                <TouchableOpacity
                  style={[styles.backButton, { backgroundColor: colors.surface }]}
                  onPress={handleClose}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                
                <View style={styles.headerTitleContainer}>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>Transaction History</Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    {sortedExpenses.length} transaction{sortedExpenses.length !== 1 ? 's' : ''} found
                  </Text>
                </View>
                
                <View style={[
                  styles.balanceIndicator, 
                  { backgroundColor: netBalance >= 0 ? colors.successSurface : colors.errorSurface }
                ]}>
                  <Ionicons 
                    name={netBalance >= 0 ? "trending-up" : "trending-down"} 
                    size={14} 
                    color={netBalance >= 0 ? colors.success : colors.error} 
                  />
                  <Text style={[styles.balanceText, { color: netBalance >= 0 ? colors.success : colors.error }]}>
                    ₹{safeToFixed(Math.abs(netBalance), 0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {/* Summary Cards */}
              <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <View style={styles.summaryContent}>
                  <View style={styles.summaryItem}>
                    <View style={[styles.summaryIconContainer, { backgroundColor: colors.successSurface }]}>
                      <Ionicons name="trending-up" size={18} color={colors.success} />
                    </View>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Income</Text>
                    <Text style={[styles.summaryValue, { color: colors.success }]}>{formatCurrency(totalIncome)}</Text>
                  </View>
                  
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  
                  <View style={styles.summaryItem}>
                    <View style={[styles.summaryIconContainer, { backgroundColor: colors.errorSurface }]}>
                      <Ionicons name="trending-down" size={18} color={colors.error} />
                    </View>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Expenses</Text>
                    <Text style={[styles.summaryValue, { color: colors.error }]}>{formatCurrency(totalExpenses)}</Text>
                  </View>
                  
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  
                  <View style={styles.summaryItem}>
                    <View style={[styles.summaryIconContainer, { backgroundColor: colors.primarySurface }]}>
                      <Ionicons name="wallet" size={18} color={colors.primary} />
                    </View>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Balance</Text>
                    <Text style={[styles.summaryValue, { color: netBalance >= 0 ? colors.success : colors.error }]}>
                      {formatCurrency(netBalance)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Search Bar */}
              <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search transactions..."
                  placeholderTextColor={colors.placeholder}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
                {searchTerm.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Chips */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
                style={styles.filterScrollView}
              >
                <TouchableOpacity 
                  style={[
                    styles.filterChip, 
                    filterType === 'all' && styles.filterChipActive,
                    { 
                      backgroundColor: filterType === 'all' ? colors.primary : colors.surface, 
                      borderColor: colors.border 
                    }
                  ]}
                  onPress={() => setFilterType('all')}
                >
                  <Text style={[
                    styles.filterChipText, 
                    { color: filterType === 'all' ? '#ffffff' : colors.text }
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.filterChip, 
                    filterType === 'income' && styles.filterChipActive,
                    { 
                      backgroundColor: filterType === 'income' ? colors.success : colors.surface, 
                      borderColor: colors.border 
                    }
                  ]}
                  onPress={() => setFilterType('income')}
                >
                  <Ionicons 
                    name="trending-up" 
                    size={14} 
                    color={filterType === 'income' ? '#ffffff' : colors.success} 
                    style={styles.filterChipIcon}
                  />
                  <Text style={[
                    styles.filterChipText, 
                    { color: filterType === 'income' ? '#ffffff' : colors.text }
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.filterChip, 
                    filterType === 'expense' && styles.filterChipActive,
                    { 
                      backgroundColor: filterType === 'expense' ? colors.error : colors.surface, 
                      borderColor: colors.border 
                    }
                  ]}
                  onPress={() => setFilterType('expense')}
                >
                  <Ionicons 
                    name="trending-down" 
                    size={14} 
                    color={filterType === 'expense' ? '#ffffff' : colors.error} 
                    style={styles.filterChipIcon}
                  />
                  <Text style={[
                    styles.filterChipText, 
                    { color: filterType === 'expense' ? '#ffffff' : colors.text }
                  ]}>
                    Expense
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.filterChip, 
                    styles.advancedFilterChip,
                    showFilters && styles.filterChipActive,
                    { 
                      backgroundColor: showFilters ? colors.warning : colors.surface, 
                      borderColor: colors.border 
                    }
                  ]}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Ionicons 
                    name="options" 
                    size={14} 
                    color={showFilters ? '#ffffff' : colors.warning} 
                    style={styles.filterChipIcon}
                  />
                  <Text style={[
                    styles.filterChipText, 
                    { color: showFilters ? '#ffffff' : colors.text }
                  ]}>
                    {showFilters ? 'Simple' : 'Advanced'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Advanced Filters */}
              {showFilters && (
                <View style={[styles.advancedFiltersContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.advancedFiltersTitle, { color: colors.text }]}>Advanced Filters</Text>
                  
                  <View style={styles.advancedFilterRow}>
                    <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Date Range</Text>
                    <View style={styles.dateRangeContainer}>
                      <TextInput
                        style={[styles.dateInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder="From (YYYY-MM-DD)"
                        placeholderTextColor={colors.placeholder}
                        value={dateFrom}
                        onChangeText={setDateFrom}
                      />
                      <TextInput
                        style={[styles.dateInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder="To (YYYY-MM-DD)"
                        placeholderTextColor={colors.placeholder}
                        value={dateTo}
                        onChangeText={setDateTo}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.advancedFilterRow}>
                    <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Amount Range</Text>
                    <View style={styles.amountRangeContainer}>
                      <TextInput
                        style={[styles.amountInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder="Min ₹"
                        placeholderTextColor={colors.placeholder}
                        value={amountMin}
                        onChangeText={setAmountMin}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[styles.amountInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder="Max ₹"
                        placeholderTextColor={colors.placeholder}
                        value={amountMax}
                        onChangeText={setAmountMax}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Sort Controls */}
              <View style={styles.sortSection}>
                <Text style={[styles.sortLabel, { color: colors.textSecondary }]}>Sort by:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.sortButtonsContainer}>
                    {(['date', 'amount', 'category'] as const).map((field) => (
                      <TouchableOpacity
                        key={field}
                        style={[
                          styles.sortButton,
                          { 
                            backgroundColor: sortBy === field ? colors.primary : colors.surface,
                            borderColor: colors.border
                          }
                        ]}
                        onPress={() => toggleSort(field)}
                      >
                        <Text style={[styles.sortButtonText, { color: sortBy === field ? '#ffffff' : colors.text }]}>
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                        </Text>
                        {sortBy === field && (
                          <Ionicons 
                            name={sortOrder === 'desc' ? "chevron-down" : "chevron-up"} 
                            size={12} 
                            color="#ffffff" 
                            style={styles.sortButtonIcon}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Export Controls */}
              <View style={styles.exportSection}>
                <TouchableOpacity 
                  style={[styles.exportButton, { backgroundColor: colors.success }]} 
                  onPress={exportToCSV}
                >
                  <Ionicons name="document-text" size={14} color="#ffffff" />
                  <Text style={styles.exportButtonText}>CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.exportButton, { backgroundColor: colors.primary }]} 
                  onPress={exportToPDF}
                >
                  <Ionicons name="document" size={14} color="#ffffff" />
                  <Text style={styles.exportButtonText}>Report</Text>
                </TouchableOpacity>
              </View>

              {/* Transaction List */}
              <View style={styles.transactionListContainer}>
                {sortedExpenses.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyStateIcon, { backgroundColor: colors.surface }]}>
                      <Ionicons name="receipt-outline" size={40} color={colors.textSecondary} />
                    </View>
                    <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No transactions found</Text>
                    <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                      Try adjusting your search filters
                    </Text>
                  </View>
                ) : (
                  sortedExpenses.map((expense, index) => (
                    <TouchableOpacity
                      key={expense.id}
                      style={[
                        styles.transactionCard,
                        { 
                          backgroundColor: colors.cardBackground, 
                          borderColor: colors.cardBorder,
                        }
                      ]}
                      onLongPress={() => setEditExpense(expense)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.transactionContent}>
                        <View style={[
                          styles.transactionIcon,
                          { backgroundColor: expense.type === 'income' ? colors.successSurface : colors.errorSurface }
                        ]}>
                          <Ionicons 
                            name={expense.type === 'income' ? "trending-up" : "trending-down"} 
                            size={18} 
                            color={expense.type === 'income' ? colors.success : colors.error} 
                          />
                        </View>
                        
                        <View style={styles.transactionDetails}>
                          <Text style={[styles.transactionTitle, { color: colors.text }]}>
                            {expense.title || 'Untitled'}
                          </Text>
                          <Text style={[styles.transactionCategory, { color: colors.textSecondary }]}>
                            {expense.category || 'Uncategorized'}
                          </Text>
                          <Text style={[styles.transactionDate, { color: colors.placeholder }]}>
                            {new Date(expense.date).toLocaleDateString('en-IN')}
                          </Text>
                          {expense.source && expense.source !== 'Manual' && (
                            <View style={[
                              styles.sourceBadge, 
                              { backgroundColor: expense.source === 'OCR' ? colors.primary : colors.warning }
                            ]}>
                              <Text style={styles.sourceBadgeText}>{expense.source}</Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.transactionRight}>
                          <Text style={[
                            styles.transactionAmount,
                            { color: expense.type === 'income' ? colors.success : colors.error }
                          ]}>
                            {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                          </Text>
                          <TouchableOpacity
                            style={[styles.deleteButton, { backgroundColor: colors.surface }]}
                            onPress={() => handleDeleteExpense(expense)}
                          >
                            <Ionicons name="trash-outline" size={14} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
              
              {/* Bottom Padding */}
              <View style={styles.bottomPadding} />
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>

      {/* Edit Modal */}
      {editExpense && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setEditExpense(null)}
        >
          <View style={[styles.editModalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.editModalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.editModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.editModalTitle, { color: colors.text }]}>Edit Transaction</Text>
                <TouchableOpacity onPress={() => setEditExpense(null)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.editModalBody}>
                <View style={styles.editInputContainer}>
                  <Text style={[styles.editInputLabel, { color: colors.textSecondary }]}>Title</Text>
                  <TextInput
                    style={[styles.editInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="Transaction title"
                    placeholderTextColor={colors.placeholder}
                    value={editExpense.title || ''}
                    onChangeText={(text) => setEditExpense({...editExpense, title: text})}
                  />
                </View>
                
                <View style={styles.editInputContainer}>
                  <Text style={[styles.editInputLabel, { color: colors.textSecondary }]}>Amount</Text>
                  <TextInput
                    style={[styles.editInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.placeholder}
                    value={safeToString(editExpense.amount)}
                    onChangeText={(text) => setEditExpense({...editExpense, amount: parseFloat(text) || 0})}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.editInputContainer}>
                  <Text style={[styles.editInputLabel, { color: colors.textSecondary }]}>Category</Text>
                  <TextInput
                    style={[styles.editInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="Select category"
                    placeholderTextColor={colors.placeholder}
                    value={editExpense.category || ''}
                    onChangeText={(text) => setEditExpense({...editExpense, category: text})}
                  />
                </View>
                
                <View style={styles.editInputContainer}>
                  <Text style={[styles.editInputLabel, { color: colors.textSecondary }]}>Type</Text>
                  <View style={styles.typeSelector}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        {
                          backgroundColor: editExpense.type === 'expense' ? colors.error : colors.surface,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setEditExpense({...editExpense, type: 'expense'})}
                    >
                      <Ionicons 
                        name="trending-down" 
                        size={16} 
                        color={editExpense.type === 'expense' ? '#ffffff' : colors.error} 
                      />
                      <Text style={[
                        styles.typeButtonText, 
                        { color: editExpense.type === 'expense' ? '#ffffff' : colors.text }
                      ]}>
                        Expense
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        {
                          backgroundColor: editExpense.type === 'income' ? colors.success : colors.surface,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setEditExpense({...editExpense, type: 'income'})}
                    >
                      <Ionicons 
                        name="trending-up" 
                        size={16} 
                        color={editExpense.type === 'income' ? '#ffffff' : colors.success} 
                      />
                      <Text style={[
                        styles.typeButtonText, 
                        { color: editExpense.type === 'income' ? '#ffffff' : colors.text }
                      ]}>
                        Income
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              <View style={styles.editModalFooter}>
                <TouchableOpacity 
                  style={[styles.editCancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setEditExpense(null)}
                >
                  <Text style={[styles.editCancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.editSaveButton, { backgroundColor: colors.primary }]}
                  onPress={handleEditSubmit}
                >
                  <Text style={styles.editSaveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: height * 0.92,
    minHeight: height * 0.60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
    flex: 1,
  },
  
  // Fixed Header
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  balanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },

  // Scrollable Content
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  clearButton: {
    marginLeft: 8,
  },

  // Filter Chips
  filterScrollView: {
    marginBottom: 16,
  },
  filterScrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  filterChipActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipIcon: {
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  advancedFilterChip: {
    marginLeft: 4,
  },

  // Advanced Filters
  advancedFiltersContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  advancedFiltersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  advancedFilterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amountRangeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // Sort Section (now standalone)
  sortSection: {
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  sortButtonIcon: {
    marginLeft: 2,
  },
  
  // Export Section (now standalone below sort)
  exportSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#10b981',
    gap: 4,
  },
  exportButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Transaction List
  transactionListContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 3,
  },
  transactionCategory: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 3,
  },
  transactionDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
  },
  sourceBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 100,
  },

  // Edit Modal
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  editModalBody: {
    padding: 20,
  },
  editInputContainer: {
    marginBottom: 16,
  },
  editInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  editModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  editCancelButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  editCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  editSaveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  editSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default TransactionHistory;