import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { LegacyExpense } from "../services/legacyAdapterService";

interface TransactionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: LegacyExpense[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (id: string, updatedExpense: Partial<LegacyExpense>) => void;
}

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
  const [editExpense, setEditExpense] = useState<LegacyExpense | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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
        comparison = a.amount - b.amount;
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
    .reduce((sum, expense) => sum + expense.amount, 0);
    
  const totalExpenses = filteredExpenses
    .filter(expense => expense.type === 'expense')
    .reduce((sum, expense) => sum + expense.amount, 0);
    
  const netBalance = totalIncome - totalExpenses;

  // Export to CSV
  const exportToCSV = async () => {
    try {
      const csvHeaders = ['Date', 'Title', 'Category', 'Amount', 'Type', 'Source'];
      const csvData = filteredExpenses.map(expense => [
        expense.date,
        expense.title || 'Untitled',
        expense.category || 'Uncategorized',
        expense.amount.toString(),
        expense.type,
        expense.source || 'Manual'
      ]);
      
      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      const fileName = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Transactions'
      });
      
      Alert.alert('Success', 'Transactions exported successfully!');
    } catch (error) {
      console.error('Export CSV error:', error);
      Alert.alert('Error', 'Failed to export CSV');
    }
  };

  // Export to PDF (as text report for React Native)
  const exportToPDF = async () => {
    try {
      let pdfContent = `TRANSACTION HISTORY REPORT\n`;
      pdfContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
      pdfContent += `SUMMARY:\n`;
      pdfContent += `Total Income: ₹${totalIncome.toFixed(2)}\n`;
      pdfContent += `Total Expenses: ₹${totalExpenses.toFixed(2)}\n`;
      pdfContent += `Net Amount: ₹${netBalance.toFixed(2)}\n\n`;
      pdfContent += `TRANSACTIONS (${filteredExpenses.length} total):\n`;
      pdfContent += `${'='.repeat(50)}\n`;
      
      filteredExpenses.forEach((expense) => {
        pdfContent += `Date: ${expense.date}\n`;
        pdfContent += `Title: ${expense.title || 'Untitled'}\n`;
        pdfContent += `Category: ${expense.category || 'Uncategorized'}\n`;
        pdfContent += `Amount: ₹${expense.amount.toFixed(2)} (${expense.type})\n`;
        pdfContent += `Source: ${expense.source || 'Manual'}\n`;
        pdfContent += `${'-'.repeat(30)}\n`;
      });
      
      const fileName = `transactions_report_${new Date().toISOString().split('T')[0]}.txt`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, pdfContent);
      
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/plain',
        dialogTitle: 'Export Transaction Report'
      });
      
      Alert.alert('Success', 'Transaction report exported successfully!');
    } catch (error) {
      console.error('Export PDF error:', error);
      Alert.alert('Error', 'Failed to export report');
    }
  };

  // Handle edit submission
  const handleEditSubmit = () => {
    if (!editExpense || !editExpense.id) return;
    const parsedAmount = parseFloat(editExpense.amount.toString());
    if (!editExpense.title || isNaN(parsedAmount) || parsedAmount <= 0 || !editExpense.category) return;
    onEditExpense(editExpense.id, {
      title: editExpense.title,
      amount: parsedAmount,
      category: editExpense.category,
      type: editExpense.type,
    });
    setEditExpense(null);
  };

  const handleDeleteExpense = (expense: LegacyExpense) => {
    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete "${expense.title || 'this transaction'}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => onDeleteExpense(expense.id)
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

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => onOpenChange(false)}
      transparent={false}
    >
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Transaction History</Text>
            <TouchableOpacity onPress={() => onOpenChange(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Income</Text>
                <Text style={[styles.summaryValue, styles.incomeText]}>₹{totalIncome.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Expenses</Text>
                <Text style={[styles.summaryValue, styles.expenseText]}>₹{totalExpenses.toFixed(2)}</Text>
              </View>
            </View>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Balance</Text>
                <Text style={[styles.summaryValue, netBalance >= 0 ? styles.incomeText : styles.expenseText]}>
                  ₹{netBalance.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* Search and Filter Controls */}
          <View style={styles.controlsContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              placeholderTextColor="#9ca3af"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filtersScrollView}
            >
              <View style={styles.filtersRow}>
                <TouchableOpacity 
                  style={[styles.filterButton, filterType === 'all' && styles.activeFilter]}
                  onPress={() => setFilterType('all')}
                >
                  <Text style={[styles.filterText, filterType === 'all' && styles.activeFilterText]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, filterType === 'income' && styles.activeFilter]}
                  onPress={() => setFilterType('income')}
                >
                  <Text style={[styles.filterText, filterType === 'income' && styles.activeFilterText]}>Income</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, filterType === 'expense' && styles.activeFilter]}
                  onPress={() => setFilterType('expense')}
                >
                  <Text style={[styles.filterText, filterType === 'expense' && styles.activeFilterText]}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.toggleFiltersButton}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Text style={styles.toggleFiltersText}>{showFilters ? 'Simple' : 'Advanced'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Advanced Filters */}
            {showFilters && (
              <View style={styles.advancedFilters}>
                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Date Range:</Text>
                  <View style={styles.dateInputContainer}>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="From (YYYY-MM-DD)"
                      placeholderTextColor="#9ca3af"
                      value={dateFrom}
                      onChangeText={setDateFrom}
                    />
                    <TextInput
                      style={styles.dateInput}
                      placeholder="To (YYYY-MM-DD)"
                      placeholderTextColor="#9ca3af"
                      value={dateTo}
                      onChangeText={setDateTo}
                    />
                  </View>
                </View>
                
                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Amount Range:</Text>
                  <View style={styles.amountInputContainer}>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="Min"
                      placeholderTextColor="#9ca3af"
                      value={amountMin}
                      onChangeText={setAmountMin}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={styles.amountInput}
                      placeholder="Max"
                      placeholderTextColor="#9ca3af"
                      value={amountMax}
                      onChangeText={setAmountMax}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Export Buttons */}
            <View style={styles.exportContainer}>
              <TouchableOpacity style={styles.exportButton} onPress={exportToCSV}>
                <Text style={styles.exportButtonText}>Export CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton} onPress={exportToPDF}>
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sort Controls */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.sortScrollView}
            >
              <TouchableOpacity 
                style={[styles.sortButton, sortBy === 'date' && styles.activeSortButton]}
                onPress={() => toggleSort('date')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'date' && styles.activeSortButtonText]}>
                  Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sortButton, sortBy === 'amount' && styles.activeSortButton]}
                onPress={() => toggleSort('amount')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'amount' && styles.activeSortButtonText]}>
                  Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sortButton, sortBy === 'category' && styles.activeSortButton]}
                onPress={() => toggleSort('category')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'category' && styles.activeSortButtonText]}>
                  Category {sortBy === 'category' && (sortOrder === 'desc' ? '↓' : '↑')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Transaction List */}
          <View style={styles.transactionListContainer}>
            <Text style={styles.transactionCount}>
              {sortedExpenses.length} transaction{sortedExpenses.length !== 1 ? 's' : ''}
            </Text>
            {sortedExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No transactions found</Text>
              </View>
            ) : (
              sortedExpenses.map((expense) => (
                <TouchableOpacity
                  key={expense.id}
                  style={styles.transactionItem}
                  onLongPress={() => setEditExpense(expense)}
                >
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>{expense.title || 'Untitled'}</Text>
                    <Text style={styles.transactionCategory}>{expense.category || 'Uncategorized'}</Text>
                    <Text style={styles.transactionDate}>{expense.date}</Text>
                    {expense.source && expense.source !== 'Manual' && (
                      <View style={[styles.sourceBadge, { backgroundColor: expense.source === 'OCR' ? '#3b82f6' : '#8b5cf6' }]}>
                        <Text style={styles.sourceBadgeText}>{expense.source}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <Text style={[
                      styles.transactionAmount,
                      expense.type === 'income' ? styles.incomeAmount : styles.expenseAmount
                    ]}>
                      {expense.type === 'income' ? '+' : '-'}₹{expense.amount.toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteExpense(expense)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        {/* Edit Modal */}
        {editExpense && (
          <Modal
            visible={true}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setEditExpense(null)}
          >
            <View style={styles.editModal}>
              <View style={styles.editContent}>
                <Text style={styles.editTitle}>Edit Transaction</Text>
                
                <TextInput
                  style={styles.editInput}
                  placeholder="Title"
                  placeholderTextColor="#9ca3af"
                  value={editExpense.title || ''}
                  onChangeText={(text) => setEditExpense({...editExpense, title: text})}
                />
                
                <TextInput
                  style={styles.editInput}
                  placeholder="Amount"
                  placeholderTextColor="#9ca3af"
                  value={editExpense.amount.toString()}
                  onChangeText={(text) => setEditExpense({...editExpense, amount: parseFloat(text) || 0})}
                  keyboardType="numeric"
                />
                
                <TextInput
                  style={styles.editInput}
                  placeholder="Category"
                  placeholderTextColor="#9ca3af"
                  value={editExpense.category || ''}
                  onChangeText={(text) => setEditExpense({...editExpense, category: text})}
                />
                
                <View style={styles.editButtonContainer}>
                  <TouchableOpacity 
                    style={styles.editCancelButton}
                    onPress={() => setEditExpense(null)}
                  >
                    <Text style={styles.editCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.editSaveButton}
                    onPress={handleEditSubmit}
                  >
                    <Text style={styles.editSaveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50, // Safe area
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#1f2937',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  closeButton: {
    fontSize: 24,
    color: '#9ca3af',
    padding: 5,
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: '#374151',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeText: {
    color: '#10b981',
  },
  expenseText: {
    color: '#ef4444',
  },
  controlsContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#f9fafb',
    marginBottom: 12,
  },
  filtersScrollView: {
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#374151',
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  toggleFiltersButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#6b7280',
  },
  toggleFiltersText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  advancedFilters: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 6,
    padding: 8,
    color: '#f9fafb',
    fontSize: 14,
  },
  amountInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 6,
    padding: 8,
    color: '#f9fafb',
    fontSize: 14,
  },
  exportContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sortContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sortLabel: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  sortScrollView: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#374151',
    marginRight: 8,
  },
  activeSortButton: {
    backgroundColor: '#3b82f6',
  },
  sortButtonText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: '#ffffff',
  },
  transactionListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  transactionCount: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sourceBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  transactionDetails: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  incomeAmount: {
    color: '#10b981',
  },
  expenseAmount: {
    color: '#ef4444',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  editModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editContent: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f9fafb',
    marginBottom: 20,
    textAlign: 'center',
  },
  editInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#f9fafb',
    marginBottom: 16,
  },
  editButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  editCancelButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editCancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  editSaveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editSaveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TransactionHistory;
