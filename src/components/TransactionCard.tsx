import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface TransactionCardData {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description?: string;
  source?: string;
}

interface TransactionCardProps {
  transaction: TransactionCardData;
  onLongPress?: (transaction: TransactionCardData) => void;
  onDeletePress?: (transaction: TransactionCardData) => void;
  showDeleteButton?: boolean;
  compact?: boolean;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onLongPress,
  onDeletePress,
  showDeleteButton = false,
  compact = false,
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
    placeholder: isDarkTheme ? '#64748b' : '#94a3b8',
    primary: isDarkTheme ? '#60a5fa' : '#3b82f6',
    success: isDarkTheme ? '#34d399' : '#10b981',
    error: isDarkTheme ? '#fb7185' : '#ef4444',
    warning: isDarkTheme ? '#fbbf24' : '#f59e0b',
    successSurface: isDarkTheme ? '#064e3b' : '#f0fdf4',
    errorSurface: isDarkTheme ? '#7f1d1d' : '#fef2f2',
    cardBackground: isDarkTheme ? '#374151' : '#ffffff',
    cardBorder: isDarkTheme ? '#475569' : '#f1f5f9',
  });

  const colors = getThemeColors();

  // Helper function to format currency properly
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount) || typeof amount !== 'number') {
      return '₹0.00';
    }
    return `₹${amount.toFixed(2)}`;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: compact ? '2-digit' : 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <TouchableOpacity
      style={[
        compact ? styles.transactionCardCompact : styles.transactionCard,
        { 
          backgroundColor: colors.cardBackground, 
          borderColor: colors.cardBorder,
        }
      ]}
      onLongPress={onLongPress ? () => onLongPress(transaction) : undefined}
      activeOpacity={0.7}
    >
      <View style={styles.transactionContent}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: transaction.type === 'income' ? colors.successSurface : colors.errorSurface }
        ]}>
          <Ionicons 
            name={transaction.type === 'income' ? "trending-up" : "trending-down"} 
            size={compact ? 16 : 18} 
            color={transaction.type === 'income' ? colors.success : colors.error} 
          />
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={[
            compact ? styles.transactionTitleCompact : styles.transactionTitle, 
            { color: colors.text }
          ]}>
            {transaction.title || 'Untitled'}
          </Text>
          <Text style={[
            compact ? styles.transactionCategoryCompact : styles.transactionCategory, 
            { color: colors.textSecondary }
          ]}>
            {transaction.category || 'Uncategorized'}
          </Text>
          <Text style={[
            compact ? styles.transactionDateCompact : styles.transactionDate, 
            { color: colors.placeholder }
          ]}>
            {formatDate(transaction.date)}
          </Text>
          {transaction.source && transaction.source !== 'Manual' && (
            <View style={[
              styles.sourceBadge, 
              { backgroundColor: transaction.source === 'OCR' ? colors.primary : colors.warning }
            ]}>
              <Text style={styles.sourceBadgeText}>{transaction.source}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.transactionRight}>
          <Text style={[
            compact ? styles.transactionAmountCompact : styles.transactionAmount,
            { color: transaction.type === 'income' ? colors.success : colors.error }
          ]}>
            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Text>
          {showDeleteButton && onDeletePress && (
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.surface }]}
              onPress={() => onDeletePress(transaction)}
            >
              <Ionicons name="trash-outline" size={14} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  transactionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionCardCompact: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionTitleCompact: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    marginBottom: 4,
  },
  transactionCategoryCompact: {
    fontSize: 12,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  transactionDateCompact: {
    fontSize: 10,
    marginBottom: 2,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  sourceBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  transactionAmountCompact: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TransactionCard;