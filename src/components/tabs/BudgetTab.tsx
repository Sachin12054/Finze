import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Budget, EnhancedFirebaseService, Transaction } from '../../services/enhancedFirebaseService';

interface BudgetTabProps {
  budgets: Budget[];
  transactions: Transaction[];
  isDarkTheme: boolean;
  onAddBudget: () => void;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({
  budgets,
  transactions,
  isDarkTheme,
  onAddBudget
}) => {
  const styles = getBudgetStyles(isDarkTheme);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editForm, setEditForm] = useState({
    amount: '',
    alertThreshold: 80
  });

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setEditForm({
      amount: budget.amount.toString(),
      alertThreshold: budget.alertThreshold || 80
    });
    setShowEditModal(true);
  };

  const handleUpdateBudget = async () => {
    if (!editingBudget) return;

    try {
      const amount = parseFloat(editForm.amount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid budget amount');
        return;
      }

      await EnhancedFirebaseService.updateBudget(editingBudget.id!, {
        amount,
        alertThreshold: editForm.alertThreshold
      });

      Alert.alert('Success', 'Budget updated successfully');
      setShowEditModal(false);
      setEditingBudget(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update budget');
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await EnhancedFirebaseService.deleteBudget(budgetId);
              Alert.alert('Success', 'Budget deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete budget');
            }
          }
        }
      ]
    );
  };

  const calculateSpent = (budget: Budget) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        if (!t.date.startsWith(currentMonth)) return false;
        
        const expenseCategory = t.category?.toLowerCase() || '';
        const budgetCategory = budget.category?.toLowerCase() || '';
        
        return expenseCategory === budgetCategory ||
               expenseCategory.includes(budgetCategory) ||
               budgetCategory.includes(expenseCategory);
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  if (!Array.isArray(budgets) || budgets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="wallet-outline" size={64} color={isDarkTheme ? '#64748B' : '#94A3B8'} />
        <Text style={styles.emptyTitle}>No Budgets Yet</Text>
        <Text style={styles.emptySubtitle}>Create your first budget to track spending</Text>
        <Pressable style={styles.emptyButton} onPress={onAddBudget}>
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            style={styles.emptyButtonGradient}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.emptyButtonText}>Add Budget</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 20 }}
    >
      <View style={styles.budgetList}>
        {budgets.map((budget, index) => {
          if (!budget || typeof budget.amount !== 'number' || !budget.category) {
            return null;
          }
          
          const spent = calculateSpent(budget);
          const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
          const progressColor = progress > 90 ? '#FF5722' : progress > 70 ? '#FF9800' : '#4CAF50';
          const isOverBudget = progress > 100;
          const alertThreshold = budget.alertThreshold || 80;
          const isWarning = progress > alertThreshold;
          
          return (
            <Animated.View
              key={budget.id || `budget-${index}`}
              entering={FadeInRight.delay(index * 100)}
              style={styles.budgetCard}
            >
              <LinearGradient
                colors={isDarkTheme ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
                style={styles.budgetCardGradient}
              >
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetCategoryContainer}>
                    <View style={[styles.budgetCategoryIcon, { backgroundColor: progressColor + '20' }]}>
                      <Ionicons 
                        name="wallet-outline" 
                        size={20} 
                        color={progressColor} 
                      />
                    </View>
                    <View>
                      <Text style={styles.budgetCategory}>{budget.category}</Text>
                      <Text style={styles.budgetPeriod}>{budget.period || 'Monthly'}</Text>
                    </View>
                  </View>
                  <View style={styles.budgetActions}>
                    <TouchableOpacity
                      onPress={() => handleEditBudget(budget)}
                      style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
                    >
                      <Ionicons name="pencil" size={14} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteBudget(budget.id!)}
                      style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                    >
                      <Ionicons name="trash" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Status Indicators */}
                {isOverBudget && (
                  <View style={[styles.statusBanner, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="warning" size={16} color="#DC2626" />
                    <Text style={[styles.statusText, { color: '#DC2626' }]}>Over Budget!</Text>
                  </View>
                )}
                {isWarning && !isOverBudget && (
                  <View style={[styles.statusBanner, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="alert-circle" size={16} color="#D97706" />
                    <Text style={[styles.statusText, { color: '#D97706' }]}>
                      Warning: {alertThreshold}% threshold reached
                    </Text>
                  </View>
                )}
                
                <View style={styles.budgetPercentageContainer}>
                  <Text style={[styles.budgetPercentage, { color: progressColor }]}>
                    {Math.round(progress)}%
                  </Text>
                  <Text style={styles.budgetPercentageLabel}>of budget used</Text>
                </View>
                
                <View style={styles.budgetAmountContainer}>
                  <Text style={styles.budgetAmount}>
                    ₹{spent.toLocaleString('en-IN')} / ₹{budget.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[
                    styles.budgetRemaining,
                    { color: isOverBudget ? '#DC2626' : '#059669' }
                  ]}>
                    {isOverBudget 
                      ? `₹${(spent - budget.amount).toLocaleString('en-IN')} over budget`
                      : `₹${Math.max(0, budget.amount - spent).toLocaleString('en-IN')} remaining`
                    }
                  </Text>
                </View>
                
                <View style={styles.budgetProgressBar}>
                  <View 
                    style={[
                      styles.budgetProgressFill,
                      {
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: progressColor
                      }
                    ]} 
                  />
                  {progress > 100 && (
                    <View style={[styles.overBudgetIndicator, { width: `${Math.min(progress - 100, 20)}%` }]} />
                  )}
                </View>

                {/* Budget Details */}
                <View style={styles.budgetDetails}>
                  <View style={styles.budgetDetailItem}>
                    <Text style={styles.budgetDetailLabel}>Alert Threshold</Text>
                    <Text style={styles.budgetDetailValue}>{alertThreshold}%</Text>
                  </View>
                  <View style={styles.budgetDetailItem}>
                    <Text style={styles.budgetDetailLabel}>Status</Text>
                    <Text style={[
                      styles.budgetDetailValue,
                      { color: budget.isActive ? '#059669' : '#DC2626' }
                    ]}>
                      {budget.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          );
        })}
      </View>
      
      {/* Edit Budget Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: isDarkTheme ? '#ffffff' : '#1f2937' }]}>
              Edit Budget: {editingBudget?.category}
            </Text>
            
            <Text style={[styles.inputLabel, { color: isDarkTheme ? '#d1d5db' : '#374151' }]}>
              Budget Amount
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                color: isDarkTheme ? '#ffffff' : '#1f2937',
                borderColor: isDarkTheme ? '#4b5563' : '#d1d5db'
              }]}
              placeholder="Enter amount"
              placeholderTextColor={isDarkTheme ? "#9ca3af" : "#6b7280"}
              keyboardType="numeric"
              value={editForm.amount}
              onChangeText={(text) => setEditForm({...editForm, amount: text})}
            />

            <Text style={[styles.inputLabel, { color: isDarkTheme ? '#d1d5db' : '#374151' }]}>
              Alert Threshold (%)
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                color: isDarkTheme ? '#ffffff' : '#1f2937',
                borderColor: isDarkTheme ? '#4b5563' : '#d1d5db'
              }]}
              placeholder="Alert percentage"
              placeholderTextColor={isDarkTheme ? "#9ca3af" : "#6b7280"}
              keyboardType="numeric"
              value={editForm.alertThreshold.toString()}
              onChangeText={(text) => setEditForm({...editForm, alertThreshold: parseInt(text) || 80})}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleUpdateBudget}
              >
                <Text style={styles.modalButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const getBudgetStyles = (isDark: boolean) => StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: isDark ? '#F1F5F9' : '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: isDark ? '#94A3B8' : '#64748B',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  budgetList: {
    gap: 16,
  },
  budgetCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  budgetCardGradient: {
    padding: 20,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  budgetCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: isDark ? '#F1F5F9' : '#1E293B',
  },
  budgetPeriod: {
    fontSize: 12,
    fontWeight: '500',
    color: isDark ? '#94A3B8' : '#64748B',
    marginTop: 2,
  },
  budgetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  budgetPercentageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetPercentage: {
    fontSize: 24,
    fontWeight: '800',
  },
  budgetPercentageLabel: {
    fontSize: 12,
    color: isDark ? '#94A3B8' : '#64748B',
    fontWeight: '500',
  },
  budgetAmountContainer: {
    marginBottom: 16,
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#E2E8F0' : '#475569',
    marginBottom: 4,
    textAlign: 'center',
  },
  budgetRemaining: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  budgetProgressBar: {
    height: 8,
    backgroundColor: isDark ? '#374151' : '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overBudgetIndicator: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#DC2626',
    right: 0,
    borderRadius: 4,
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetDetailItem: {
    alignItems: 'center',
  },
  budgetDetailLabel: {
    fontSize: 12,
    color: isDark ? '#94A3B8' : '#64748B',
    fontWeight: '500',
  },
  budgetDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#F1F5F9' : '#1E293B',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  confirmButton: {
    backgroundColor: '#059669',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
