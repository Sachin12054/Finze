import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { receiptScannerService } from '../services/receiptScannerService';
import { ExtractedDetails } from '../types/expense';

interface ExpensePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedData: ExtractedDetails | null;
  onSave: (data: ExtractedDetails) => void;
}

const ExpensePreviewDialog: React.FC<ExpensePreviewDialogProps> = ({
  open,
  onOpenChange,
  extractedData,
  onSave,
}) => {
  const { isDarkTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  
  // Theme-aware colors
  const getThemeColors = () => ({
    background: isDarkTheme ? '#1e293b' : '#ffffff',
    surface: isDarkTheme ? '#334155' : '#f8fafc',
    text: isDarkTheme ? '#f1f5f9' : '#1e293b',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b',
    border: isDarkTheme ? '#475569' : '#e2e8f0',
    overlay: isDarkTheme ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.5)',
    primary: isDarkTheme ? '#60a5fa' : '#3b82f6',
    success: isDarkTheme ? '#34d399' : '#10b981',
    error: isDarkTheme ? '#fb7185' : '#ef4444',
    warning: isDarkTheme ? '#fbbf24' : '#f59e0b',
    primarySurface: isDarkTheme ? '#1e40af' : '#eff6ff',
    successSurface: isDarkTheme ? '#064e3b' : '#f0fdf4',
  });

  const colors = getThemeColors();

  const handleSave = async () => {
    if (!extractedData) return;

    try {
      setIsSaving(true);

      // Try to save to backend
      const backendData = {
        total_amount: extractedData.total_amount || 0,
        merchant_name: extractedData.merchant_name || 'Unknown',
        date: extractedData.date || new Date().toISOString(),
        category: extractedData.category,
        extracted_text: extractedData.notes || '',
        ...extractedData
      };
      const result = await receiptScannerService.saveExpense('user_123', backendData);
      
      if (result.status === 'success') {
        Alert.alert(
          'Success!',
          'Expense has been saved to your account.',
          [
            {
              text: 'OK',
              onPress: () => {
                onSave(extractedData);
                onOpenChange(false);
              },
            },
          ]
        );
      } else {
        // Even if backend fails, still save locally
        Alert.alert(
          'Saved Locally',
          result.error + ' The expense has been saved locally.',
          [
            {
              text: 'OK',
              onPress: () => {
                onSave(extractedData);
                onOpenChange(false);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      // Still proceed with local save
      Alert.alert(
        'Saved Locally',
        'Unable to sync with server, but the expense has been saved locally.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSave(extractedData);
              onOpenChange(false);
            },
          },
        ]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    // Handle NaN, null, undefined values
    const validAmount = (typeof amount === 'number' && !isNaN(amount)) ? amount : 0;
    
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(validAmount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(validAmount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!extractedData) return null;

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="slide"
      onRequestClose={() => !isSaving && onOpenChange(false)}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: colors.surface }]}
                onPress={() => !isSaving && onOpenChange(false)}
                disabled={isSaving}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Review Expense</Text>
              <View style={styles.headerRight}>
                <View style={[styles.confidenceIndicator, { backgroundColor: colors.successSurface }]}>
                  <Text style={[styles.confidenceText, { color: colors.success }]}>
                    {Math.round((extractedData.extraction_confidence || 0.8) * 100)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Content */}
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                {/* Main Info Card */}
                <View style={[styles.mainCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.merchantSection}>
                    <View style={[styles.merchantIcon, { backgroundColor: colors.primarySurface }]}>
                      <Ionicons name="storefront" size={32} color={colors.primary} />
                    </View>
                    <View style={styles.merchantInfo}>
                      <Text style={[styles.merchantName, { color: colors.text }]}>
                        {extractedData.merchant_name || 'Unknown Merchant'}
                      </Text>
                      {extractedData.merchant_address && (
                        <Text style={[styles.merchantAddress, { color: colors.textSecondary }]}>
                          {extractedData.merchant_address}
                        </Text>
                      )}
                      <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>
                        {formatDate(extractedData.date || new Date().toISOString())}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.amountSection}>
                    <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Amount</Text>
                    <Text style={[styles.totalAmount, { color: colors.text }]}>
                      {formatCurrency(extractedData.total_amount || 0, extractedData.currency || 'INR')}
                    </Text>
                  </View>
                </View>

                {/* Category and Details */}
                <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.detailRow}>
                    <Ionicons name="pricetag" size={20} color={colors.primary} />
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Category</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {extractedData.category || 'Other'}
                    </Text>
                  </View>

                  {extractedData.payment_method && (
                    <View style={styles.detailRow}>
                      <Ionicons name="card" size={20} color={colors.primary} />
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Payment Method</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {extractedData.payment_method}
                      </Text>
                    </View>
                  )}

                  {extractedData.receipt_number && (
                    <View style={styles.detailRow}>
                      <Ionicons name="receipt" size={20} color={colors.primary} />
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Receipt #</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {extractedData.receipt_number}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Items List */}
                {extractedData.items && extractedData.items.length > 0 && (
                  <View style={[styles.itemsCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.itemsTitle, { color: colors.text }]}>Items</Text>
                    {extractedData.items.map((item, index) => (
                      <View key={index} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.itemInfo}>
                          <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                          {item.quantity && item.quantity > 1 && (
                            <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>
                              Qty: {item.quantity}
                            </Text>
                          )}
                        </View>
                        <Text style={[styles.itemPrice, { color: colors.text }]}>
                          {formatCurrency(item.price || 0, extractedData.currency || 'INR')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Tax and Additional Charges */}
                {(extractedData.tax_details || 
                  (extractedData.discounts && extractedData.discounts.length > 0) ||
                  (extractedData.additional_charges && extractedData.additional_charges.length > 0)) && (
                  <View style={[styles.extrasCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.extrasTitle, { color: colors.text }]}>Additional Details</Text>
                    
                    {extractedData.tax_details && (
                      <View style={styles.extraRow}>
                        <Text style={[styles.extraLabel, { color: colors.textSecondary }]}>
                          Tax ({extractedData.tax_details.rate}%)
                        </Text>
                        <Text style={[styles.extraValue, { color: colors.text }]}>
                          {formatCurrency(extractedData.tax_details.amount, extractedData.currency || 'INR')}
                        </Text>
                      </View>
                    )}

                    {extractedData.discounts?.map((discount, index) => (
                      <View key={index} style={styles.extraRow}>
                        <Text style={[styles.extraLabel, { color: colors.textSecondary }]}>
                          {discount.description}
                        </Text>
                        <Text style={[styles.extraValue, { color: colors.success }]}>
                          -{formatCurrency(discount.amount, extractedData.currency || 'INR')}
                        </Text>
                      </View>
                    ))}

                    {extractedData.additional_charges?.map((charge, index) => (
                      <View key={index} style={styles.extraRow}>
                        <Text style={[styles.extraLabel, { color: colors.textSecondary }]}>
                          {charge.description}
                        </Text>
                        <Text style={[styles.extraValue, { color: colors.text }]}>
                          {formatCurrency(charge.amount, extractedData.currency || 'INR')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Notes */}
                {extractedData.notes && (
                  <View style={[styles.notesCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.notesTitle, { color: colors.text }]}>Notes</Text>
                    <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                      {extractedData.notes}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => !isSaving && onOpenChange(false)}
                disabled={isSaving}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#ffffff" />
                    <Text style={styles.saveButtonText}>Save Expense</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerRight: {
    marginLeft: 16,
  },
  confidenceIndicator: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  mainCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  merchantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  merchantIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  merchantAddress: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 14,
    color: '#64748b',
  },
  amountSection: {
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
  },
  detailsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    flex: 1,
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  itemsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#64748b',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  extrasCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  extrasTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  extraLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  extraValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  notesCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  notesText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    gap: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  saveButton: {
    flex: 2,
    height: 50,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default ExpensePreviewDialog;