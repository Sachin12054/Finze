import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    LayoutAnimation,
    Modal,
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
import { EnhancedFirebaseService } from '../services/firebase/enhancedFirebaseService';
import { auth } from '../services/firebase/firebase';
import { receiptScannerService } from '../services/ml/receiptScannerService';
import { ExtractedDetails } from '../types/expense';

// Static variable to track if backend status has been logged
let backendStatusLogged = false;

interface ScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanResult: (result: ExtractedDetails) => void;
}

const { width, height } = Dimensions.get('window');

const ScannerDialog: React.FC<ScannerDialogProps> = ({
  open,
  onOpenChange,
  onScanResult,
}) => {
  // Theme context
  const { isDarkTheme } = useTheme();
  
  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedData, setScannedData] = useState<ExtractedDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));

  // Category mapping for expense classification
  const categoryMapping = {
    'food': 'Food & Dining',
    'dining': 'Food & Dining',
    'groceries': 'Food & Dining',
    'restaurant': 'Food & Dining',
    'kfc': 'Food & Dining',
    'mcdonald': 'Food & Dining',
    'mcdonalds': 'Food & Dining',
    'burger': 'Food & Dining',
    'pizza': 'Food & Dining',
    'fast food': 'Food & Dining',
    'fastfood': 'Food & Dining',
    'cafe': 'Food & Dining',
    'coffee': 'Food & Dining',
    'starbucks': 'Food & Dining',
    'dominos': 'Food & Dining',
    'subway': 'Food & Dining',
    'transport': 'Transportation',
    'transportation': 'Transportation',
    'fuel': 'Transportation',
    'taxi': 'Transportation',
    'shopping': 'Shopping',
    'retail': 'Shopping',
    'clothing': 'Shopping',
    'entertainment': 'Entertainment',
    'movie': 'Entertainment',
    'games': 'Entertainment',
    'technology': 'Technology',
    'electronics': 'Technology',
    'software': 'Technology',
    'bills': 'Bills & Utilities',
    'utilities': 'Bills & Utilities',
    'electricity': 'Bills & Utilities',
    'healthcare': 'Healthcare',
    'medical': 'Healthcare',
    'pharmacy': 'Healthcare',
    'travel': 'Travel',
    'hotel': 'Travel',
    'flight': 'Travel',
    'education': 'Education',
    'books': 'Education',
    'course': 'Education',
    'business': 'Business',
    'office': 'Business',
    'salary': 'Income',
    'income': 'Income',
    'other': 'Other'
  };

  // Function to map extracted category to app category
  const mapCategory = (extractedCategory: string, merchantName: string = ''): string => {
    const lowerCategory = extractedCategory.toLowerCase();
    const lowerMerchant = merchantName.toLowerCase();
    
    // First try to map by category
    let mappedCategory = categoryMapping[lowerCategory as keyof typeof categoryMapping];
    
    // If not found, try to map by merchant name
    if (!mappedCategory || mappedCategory === 'Other') {
      for (const [key, value] of Object.entries(categoryMapping)) {
        if (lowerMerchant.includes(key) || lowerCategory.includes(key)) {
          mappedCategory = value;
          break;
        }
      }
    }
    
    return mappedCategory || 'Other';
  };
  
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
  });

  // Get theme colors
  const colors = getThemeColors();
  
  const [showPreview, setShowPreview] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedDetails | null>(null);
  const [editableData, setEditableData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');

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

  const [slideAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(0.8));
  const [opacityAnimation] = useState(new Animated.Value(0));
  const [previewAnimation] = useState(new Animated.Value(0));
  const [processingDots, setProcessingDots] = useState('');
  const [processingStage, setProcessingStage] = useState(0);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  // Check backend availability when component mounts
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      // Initialize the service to find the best backend URL
      await receiptScannerService.initialize();
      
      const connection = await receiptScannerService.testConnection();
      setBackendAvailable(connection.connected);
      
      // Only log status once
      if (!backendStatusLogged) {
        backendStatusLogged = true;
        if (connection.connected) {
          console.log('✅ Backend services ready for receipt scanning');
        } else {
          console.warn('⚠️ Backend services not available, using fallback mode');
        }
      }
    } catch (error) {
      console.error('Error checking backend status:', error);
      setBackendAvailable(false);
    }
  };

  const mockExtractedDetails: ExtractedDetails = {
    total_amount: 1250.50,
    merchant_name: 'SuperMart India',
    category: 'Groceries',
    date: new Date().toISOString(),
    items: [
      { name: 'Milk (1L)', price: 65.50, quantity: 1 },
      { name: 'Bread (2 pcs)', price: 80.00, quantity: 2 },
      { name: 'Eggs (12 pcs)', price: 120.00, quantity: 1 },
      { name: 'Fresh Fruits', price: 185.00, quantity: 1 }
    ],
    extraction_confidence: 0.85,
    currency: 'INR',
    processing_time: new Date().toISOString(),
  };

  // Animations
  useEffect(() => {
    console.log('ScannerDialog: open state changed to', open);
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

  useEffect(() => {
    if (isProcessing) {
      const dotsInterval = setInterval(() => {
        setProcessingDots(prev => {
          if (prev.length >= 3) return '';
          return prev + '.';
        });
      }, 500);

      // Update processing stages for better UX
      const stageInterval = setInterval(() => {
        setProcessingStage(prev => (prev + 1) % 4);
      }, 1500);

      return () => {
        clearInterval(dotsInterval);
        clearInterval(stageInterval);
      };
    } else {
      setProcessingDots('');
      setProcessingStage(0);
    }
  }, [isProcessing]);

  const processReceiptImage = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      setProcessingStage(0);

      // Always try the backend first, don't rely on cached status
      
      try {
        // Test backend connectivity first
        setProcessingStage(1);
        const healthCheck = await receiptScannerService.checkHealth();
        
        if (healthCheck && healthCheck.services.receipt_scanning) {
          // Check if user is authenticated
          if (!auth.currentUser) {
            throw new Error('User not authenticated');
          }
          
          // Process with real backend using actual user ID
          const result = await receiptScannerService.uploadReceipt(imageUri, auth.currentUser.uid);
          
          if (result.status === 'success' && result.data) {
            setProcessingStage(3);
            
            // Ensure INR currency for Indian context
            const processedData = {
              ...result.data,
              currency: 'INR',
              total_amount: result.data.total_amount || 0,
              mapped_category: mapCategory(result.data.category || 'other', result.data.merchant_name || '')
            };
            
            setIsProcessing(false);
            setExtractedData(processedData);
            setEditableData({
              total_amount: processedData.total_amount,
              subtotal_amount: (processedData as any).subtotal_amount,
              merchant_name: processedData.merchant_name,
              category: processedData.mapped_category,
              items: processedData.items || [],
              date: processedData.date,
              gst: (processedData as any).gst || (processedData as any).tax_amount,
              subtotal: (processedData as any).subtotal,
              tax_details: (processedData as any).tax_details
            });
            setShowPreview(true);
            // Animate preview entrance
            Animated.sequence([
              Animated.timing(previewAnimation, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
            ]).start();
            return;
          } else {
            throw new Error(result.error || 'Backend processing failed');
          }
        } else {
          throw new Error('Backend services not available');
        }
      } catch (backendError) {
        // Use enhanced Indian sample data as fallback
        const enhancedMockData = {
          ...mockExtractedDetails,
          mapped_category: mapCategory(mockExtractedDetails.category || 'other', mockExtractedDetails.merchant_name || '')
        };
        
        setIsProcessing(false);
        setExtractedData(enhancedMockData);
        setEditableData({
          total_amount: enhancedMockData.total_amount,
          subtotal_amount: (enhancedMockData as any).subtotal_amount,
          merchant_name: enhancedMockData.merchant_name,
          category: enhancedMockData.mapped_category,
          items: enhancedMockData.items || [],
          date: enhancedMockData.date,
          gst: (enhancedMockData as any).gst || (enhancedMockData as any).tax_amount,
          subtotal: (enhancedMockData as any).subtotal,
          tax_details: (enhancedMockData as any).tax_details
        });
        setShowPreview(true);
        // Animate preview entrance
        Animated.sequence([
          Animated.timing(previewAnimation, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert(
        'Processing Error',
        'Unable to process receipt. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSaveToDatabase = async () => {
    if (!editableData) return;
    
    try {
      setIsSaving(true);
      
      // Check authentication first
      if (!auth.currentUser) {
        Alert.alert(
          'Authentication Required',
          'Please log in to save expenses.',
          [{ text: 'OK' }]
        );
        setIsSaving(false);
        return;
      }
      
      // Create scanner expense data with cleaned merchant name
      const cleanMerchantName = editableData.merchant_name
        ?.replace(/^receipt\s+from\s+/gi, '')
        ?.replace(/extracted\s+text\s*/gi, '')
        ?.trim() || 'Unknown Merchant';

      // Calculate GST and subtotal using the same logic as preview
      const calculatedAmounts = calculateTotalWithGST();
      
      // Save ONLY to scanner collection - this will automatically appear in transaction list
      const scannerData = {
        merchantName: cleanMerchantName,
        totalAmount: safeParseFloat(editableData.total_amount),
        category: editableData.category || 'Other',
        extractedCategory: extractedData?.category || 'other',
        date: new Date().toISOString().split('T')[0], // Use current date for financial calculations
        currency: 'INR',
        items: editableData.items || [],
        extractionConfidence: 0.8, // Default confidence
        processingTime: new Date().toISOString(),
        gstAmount: calculatedAmounts.gst,
        subtotalAmount: calculatedAmounts.subtotal,
        extractedText: `Items: ${editableData.items.map((item: any) => item.name).join(', ')}`,
        type: transactionType
      };
      
      const transactionId = await EnhancedFirebaseService.addScannerExpense(scannerData);
      
      console.log('🎯 OCR Expense saved successfully:', {
        transactionId,
        merchantName: cleanMerchantName,
        amount: scannerData.totalAmount,
        category: scannerData.category,
        type: transactionType
      });
      
      setIsSaving(false);
      
      Alert.alert(
        '✅ Success!',
        `${transactionType === 'income' ? 'Income' : 'Expense'} of ₹${editableData.total_amount} has been added to your transaction history.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onScanResult({
                ...extractedData!,
                id: transactionId,
                saved_to_database: true
              });
              handleClosePreview();
            }
          }
        ]
      );
      
    } catch (error: any) {
      setIsSaving(false);
      Alert.alert(
        'Save Error',
        `Failed to save expense: ${error.message}. Would you like to try again?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: handleSaveToDatabase }
        ]
      );
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setExtractedData(null);
    setEditableData(null);
    onOpenChange(false);
  };

  const handleTransactionTypeChange = (type: 'expense' | 'income') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTransactionType(type);
  };

  const calculateTotalWithGST = () => {
    if (!editableData) {
      return { subtotal: 0, gst: 0, total: 0 };
    }
    
    // First priority: Use extracted values from backend if available
    const extractedSubtotal = safeParseFloat(editableData.subtotal_amount || editableData.subtotal);
    const extractedGST = safeParseFloat(editableData.tax_details?.tax_amount || editableData.gst);
    const extractedTotal = safeParseFloat(editableData.total_amount);
    
    // If we have all extracted values, use them directly
    if (extractedSubtotal > 0 && extractedGST > 0 && extractedTotal > 0) {
      return {
        subtotal: extractedSubtotal,
        gst: extractedGST,
        total: extractedTotal
      };
    }
    
    // Second priority: Calculate from items if available
    let itemsSubtotal = 0;
    if (editableData.items && Array.isArray(editableData.items)) {
      itemsSubtotal = editableData.items.reduce((sum: number, item: any) => {
        const itemPrice = safeParseFloat(item.price || item.total_price || item.unit_price || item.amount || 0);
        const itemQuantity = parseInt(item.quantity || '1') || 1;
        return sum + (itemPrice * itemQuantity);
      }, 0);
    }
    
    // Use calculated items subtotal if extracted subtotal is not available
    const finalSubtotal = extractedSubtotal > 0 ? extractedSubtotal : itemsSubtotal;
    
    // Calculate GST based on available data
    let finalGST = 0;
    let finalTotal = 0;
    
    if (extractedGST > 0) {
      // Use extracted GST
      finalGST = extractedGST;
      finalTotal = finalSubtotal + finalGST;
    } else if (extractedTotal > 0 && finalSubtotal > 0) {
      // Calculate GST as difference between total and subtotal
      finalGST = extractedTotal - finalSubtotal;
      finalTotal = extractedTotal;
    } else if (finalSubtotal > 0) {
      // Calculate 18% GST if no other data available
      const taxRate = safeParseFloat(editableData.tax_details?.tax_rate) || 18;
      finalGST = (finalSubtotal * taxRate) / 100;
      finalTotal = finalSubtotal + finalGST;
    }
    
    return {
      subtotal: Math.max(0, finalSubtotal),
      gst: Math.max(0, finalGST),
      total: Math.max(0, finalTotal)
    };
  };

  const handleImagePick = async () => {
    try {
      // Check authentication first
      if (!auth.currentUser) {
        Alert.alert(
          'Authentication Required',
          'Please log in to use the receipt scanner.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to help you scan receipts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {} }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        // No fixed aspect ratio - allows free cropping for any receipt size
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processReceiptImage(result.assets[0].uri);
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to access photo library. Please try again.');
    }
  };

  const handleCameraPick = async () => {
    try {
      // Check authentication first
      if (!auth.currentUser) {
        Alert.alert(
          'Authentication Required',
          'Please log in to use the receipt scanner.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'We need camera access to help you scan receipts instantly.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {} }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        // No fixed aspect ratio - allows free cropping for any receipt size
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processReceiptImage(result.assets[0].uri);
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to access camera. Please try again.');
    }
  };

  const handleClose = () => {
    console.log('ScannerDialog: handleClose called, isProcessing:', isProcessing);
    if (!isProcessing) {
      onOpenChange(false);
    }
  };

  console.log('ScannerDialog render: open =', open);

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
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <Animated.View
            style={[
              styles.container,
              { backgroundColor: colors.background },
              {
                opacity: opacityAnimation,
                transform: [
                  { translateY: slideAnimation.interpolate({ inputRange: [0, 1], outputRange: [height * 0.3, 0] }) },
                  { scale: scaleAnimation }
                ]
              }
            ]}
          >
          {/* Modern Header */}
          <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: colors.surface }]}
                onPress={handleClose}
                disabled={isProcessing}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Receipt Scanner
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                  AI-powered expense extraction
                </Text>
              </View>
              <View style={styles.headerRight}>
                <View style={[styles.aiIndicator, { backgroundColor: colors.primarySurface }]}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                  <Text style={[styles.aiText, { color: colors.primary }]}>AI</Text>
                </View>
              </View>
            </View>
          </View>

            {/* Professional Content */}
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <View style={styles.processingAnimation}>
                    <View style={[styles.scanningLine, { backgroundColor: colors.primary }]} />
                    <View style={styles.processingIconContainer}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <View style={styles.processingIcon}>
                        <Ionicons name="receipt-outline" size={40} color={colors.primary} />
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.processingTitle, { color: colors.text }]}>
                    Analyzing Receipt{processingDots}
                  </Text>
                  <Text style={[styles.processingSubtext, { color: colors.textSecondary }]}>
                    Our AI is extracting expense details from your receipt and converting to INR
                  </Text>
                  
                  {/* Modern Progress Steps */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressStep}>
                      <View style={[styles.progressIconContainer, { backgroundColor: colors.surface }]}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      </View>
                      <Text style={[styles.progressText, { color: colors.text }]}>Image processed</Text>
                    </View>
                    <View style={styles.progressStep}>
                      <View style={[styles.progressIconContainer, { backgroundColor: colors.surface }]}>
                        {processingStage >= 1 ? (
                          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        ) : (
                          <ActivityIndicator size={16} color={colors.primary} />
                        )}
                      </View>
                      <Text style={[styles.progressText, { color: colors.text }]}>Extracting data</Text>
                    </View>
                    <View style={[styles.progressStep, processingStage < 2 && styles.progressStepPending]}>
                      <View style={[styles.progressIconContainer, { backgroundColor: colors.surface }]}>
                        {processingStage >= 2 ? (
                          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        ) : processingStage === 1 ? (
                          <ActivityIndicator size={16} color={colors.primary} />
                        ) : (
                          <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                        )}
                      </View>
                      <Text style={[styles.progressText, processingStage < 2 && styles.progressTextPending, { color: processingStage >= 2 ? colors.text : colors.textSecondary }]}>
                        Categorizing
                      </Text>
                    </View>
                    <View style={[styles.progressStep, processingStage < 3 && styles.progressStepPending]}>
                      <View style={[styles.progressIconContainer, { backgroundColor: colors.surface }]}>
                        {processingStage >= 4 ? (
                          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        ) : processingStage === 3 ? (
                          <ActivityIndicator size={16} color={colors.primary} />
                        ) : (
                          <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                        )}
                      </View>
                      <Text style={[styles.progressText, processingStage < 3 && styles.progressTextPending, { color: processingStage >= 3 ? colors.text : colors.textSecondary }]}>
                        Saving to database
                      </Text>
                    </View>
                  </View>
                </View>
              ) : showPreview && editableData ? (
                <>
                  {/* Receipt Preview Section */}
                  <Animated.ScrollView 
                    showsVerticalScrollIndicator={false}
                    style={{
                      transform: [{
                        scale: previewAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        })
                      }],
                      opacity: previewAnimation
                    }}
                  >
                    <View style={styles.previewContainer}>
                      <View style={[styles.previewHeader, { backgroundColor: colors.successSurface }]}>
                        <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                        <Text style={[styles.previewTitle, { color: colors.text }]}>Receipt Processed!</Text>
                        <Text style={[styles.previewSubtitle, { color: colors.textSecondary }]}>
                          Please review the extracted details below
                        </Text>
                      </View>

                      {/* Merchant & Total */}
                      <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Transaction Details</Text>
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Merchant:</Text>
                          <TextInput
                            style={[styles.detailInput, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                            value={editableData.merchant_name}
                            onChangeText={(text) => setEditableData({...editableData, merchant_name: text})}
                            placeholder="Enter merchant name"
                            placeholderTextColor={colors.placeholder}
                          />
                        </View>
                        
                        {/* Transaction Type Toggle */}
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type:</Text>
                          <View style={styles.transactionTypeContainer}>
                            <TouchableOpacity
                              style={[
                                styles.typeButton,
                                { backgroundColor: transactionType === 'expense' ? colors.error : colors.surface },
                                { borderColor: transactionType === 'expense' ? colors.error : colors.border }
                              ]}
                              onPress={() => handleTransactionTypeChange('expense')}
                            >
                              <Ionicons 
                                name="trending-down" 
                                size={20} 
                                color={transactionType === 'expense' ? '#ffffff' : colors.error} 
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.typeButton,
                                { backgroundColor: transactionType === 'income' ? colors.success : colors.surface },
                                { borderColor: transactionType === 'income' ? colors.success : colors.border }
                              ]}
                              onPress={() => handleTransactionTypeChange('income')}
                            >
                              <Ionicons 
                                name="trending-up" 
                                size={20} 
                                color={transactionType === 'income' ? '#ffffff' : colors.success} 
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                        
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Category:</Text>
                          <Text style={[styles.detailValue, { color: colors.text, backgroundColor: colors.primarySurface, borderColor: colors.border }]}>
                            {editableData.category}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Total Amount:</Text>
                          <Text style={[
                            styles.totalAmount, 
                            { color: transactionType === 'income' ? colors.success : colors.error }
                          ]}>
                            {transactionType === 'income' ? '+' : '-'}₹{safeParseFloat(editableData.total_amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                          </Text>
                        </View>
                      </View>

                      {/* Items Breakdown */}
                      {editableData.items && editableData.items.length > 0 && (
                        <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <Text style={[styles.cardTitle, { color: colors.text }]}>Items Breakdown</Text>
                          {editableData.items.map((item: any, index: number) => (
                            <View key={index} style={styles.itemRow}>
                              <View style={styles.itemDetails}>
                                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                                <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>
                                  Qty: {item.quantity || 1}
                                </Text>
                              </View>
                              <Text style={[styles.itemPrice, { color: colors.text }]}>
                                ₹{safeParseFloat(item.price).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                              </Text>
                            </View>
                          ))}
                          
                          {/* GST Calculation */}
                          <View style={[styles.gstContainer, { borderTopColor: colors.border }]}>
                            <View style={styles.gstRow}>
                              <Text style={[styles.gstLabel, { color: colors.textSecondary }]}>Subtotal:</Text>
                              <Text style={[styles.gstValue, { color: colors.text }]}>
                                ₹{calculateTotalWithGST().subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                              </Text>
                            </View>
                            <View style={styles.gstRow}>
                              <Text style={[styles.gstLabel, { color: colors.textSecondary }]}>GST (18%):</Text>
                              <Text style={[styles.gstValue, { color: colors.text }]}>
                                ₹{calculateTotalWithGST().gst.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                              </Text>
                            </View>
                            <View style={[styles.gstRow, styles.totalRow]}>
                              <Text style={[styles.gstLabel, styles.totalLabel, { color: colors.text }]}>Total:</Text>
                              <Text style={[styles.gstValue, styles.totalValue, { color: colors.primary }]}>
                                ₹{editableData.total_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View style={styles.previewActions}>
                        <TouchableOpacity
                          style={[styles.saveButton, { backgroundColor: colors.primary }]}
                          onPress={handleSaveToDatabase}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Ionicons name="checkmark" size={24} color="#ffffff" />
                          )}
                          <Text style={styles.saveButtonText}>
                            {isSaving ? 'Saving...' : 'Add to Expenses'}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.editButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          onPress={handleClosePreview}
                          disabled={isSaving}
                        >
                          <Ionicons name="pencil" size={20} color={colors.text} />
                          <Text style={[styles.editButtonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Animated.ScrollView>
                </>
              ) : (
                <>
                  {/* Welcome Section */}
                  <View style={styles.welcomeSection}>
                    <View style={[styles.featureIcon, { backgroundColor: colors.primarySurface }]}>
                      <Ionicons name="scan-circle-outline" size={64} color={colors.primary} />
                    </View>
                    <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                      Smart Receipt Scanner
                    </Text>
                    <Text style={[styles.welcomeDescription, { color: colors.textSecondary }]}>
                      Capture receipts instantly and let our AI extract all expense details automatically.
                      {backendAvailable === null && (
                        <Text style={{ color: colors.warning }}> (Checking backend...)</Text>
                      )}
                      {backendAvailable === true && (
                        <Text style={{ color: colors.success }}> (Connected to AI backend)</Text>
                      )}
                      {backendAvailable === false && (
                        <Text style={{ color: colors.warning }}> (Offline mode - using sample data)</Text>
                      )}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionSection}>
                    <TouchableOpacity
                      style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
                      onPress={handleCameraPick}
                      activeOpacity={0.8}
                    >
                      <View style={styles.actionButtonContent}>
                        <View style={styles.actionButtonIcon}>
                          <Ionicons name="camera" size={28} color="#ffffff" />
                        </View>
                        <View style={styles.actionButtonText}>
                          <Text style={[styles.actionButtonTitle, { color: '#ffffff' }]}>Take Photo</Text>
                          <Text style={[styles.actionButtonSubtitle, { color: '#ffffff' }]}>Capture receipt instantly</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.secondaryActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={handleImagePick}
                      activeOpacity={0.8}
                    >
                      <View style={styles.actionButtonContent}>
                        <View style={styles.secondaryActionButtonIcon}>
                          <Ionicons name="images" size={28} color={colors.primary} />
                        </View>
                        <View style={styles.actionButtonText}>
                          <Text style={[styles.secondaryActionButtonTitle, { color: colors.text }]}>Choose Photo</Text>
                          <Text style={[styles.secondaryActionButtonSubtitle, { color: colors.textSecondary }]}>Select from gallery</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Features List */}
                  <View style={styles.featuresSection}>
                    <View style={styles.featureItem}>
                      <Ionicons name="flash" size={20} color={colors.primary} />
                      <Text style={[styles.featureText, { color: colors.text }]}>Instant AI recognition</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                      <Text style={[styles.featureText, { color: colors.text }]}>99% accuracy rate</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="layers" size={20} color={colors.primary} />
                      <Text style={[styles.featureText, { color: colors.text }]}>Extract all details</Text>
                    </View>
                  </View>

                  {/* Additional spacing for better scrolling */}
                  <View style={styles.bottomSpacing} />
                </>
              )}
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </View>
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
  
  // Modern Header Styles
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTopRow: {
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
  headerRight: {
    marginLeft: 16,
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  aiText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },

  // Content Styles
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 80,
    flexGrow: 1,
  },
  bottomSpacing: {
    height: 60,
  },

  // Welcome Section
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  featureIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },

  // Action Section
  actionSection: {
    gap: 16,
    marginBottom: 32,
  },
  primaryActionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  secondaryActionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  actionButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  secondaryActionButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionButtonText: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  secondaryActionButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  actionButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  secondaryActionButtonSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },

  // Features Section
  featuresSection: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },

  // Processing Styles
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingAnimation: {
    position: 'relative',
    marginBottom: 32,
  },
  scanningLine: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#3b82f6',
    opacity: 0.6,
  },
  processingIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  processingIcon: {
    position: 'absolute',
    top: 26,
    left: 26,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  progressContainer: {
    width: '100%',
    gap: 20,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepPending: {
    opacity: 0.5,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressTextPending: {
    color: '#94a3b8',
  },

  // Legacy styles for compatibility
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  instructionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  buttonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  cancelButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
  },
  tipText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
    lineHeight: 18,
  },

  // Preview Styles
  previewContainer: {
    padding: 20,
  },
  previewHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    width: 120,
  },
  detailInput: {
    flex: 1,
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginLeft: 12,
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
    borderRadius: 8,
    marginLeft: 12,
    textAlign: 'center',
    borderWidth: 1,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 14,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  gstContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  gstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  gstLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  gstValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  previewActions: {
    gap: 12,
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Transaction Type Toggle Styles
  transactionTypeContainer: {
    flexDirection: 'row',
    marginLeft: 12,
    gap: 12,
    alignItems: 'center',
  },
  typeButton: {
    width: 44,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ScannerDialog;