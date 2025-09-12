import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ExtractedDetails } from '../types/expense';

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
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [slideAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(0.8));
  const [opacityAnimation] = useState(new Animated.Value(0));
  const [processingDots, setProcessingDots] = useState('');

  const mockExtractedDetails: ExtractedDetails = {
    total_amount: 125.50,
    merchant_name: 'SuperMart',
    category: 'Food & Dining',
    date: new Date().toISOString(),
    items: [
      { name: 'Milk', price: 25.50, quantity: 1 },
      { name: 'Bread', price: 30.00, quantity: 2 },
      { name: 'Eggs', price: 40.00, quantity: 1 },
      { name: 'Fruits', price: 30.00, quantity: 1 }
    ]
  };

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(slideAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open]);

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setProcessingDots(prev => {
          if (prev.length >= 3) return '';
          return prev + '.';
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProcessingDots('');
    }
  }, [isProcessing]);

  const handleImagePick = async () => {
    try {
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        
        // Simulate AI processing with realistic delay
        setTimeout(() => {
          setIsProcessing(false);
          onScanResult(mockExtractedDetails);
          onOpenChange(false);
        }, 3000);
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to access photo library. Please try again.');
    }
  };

  const handleCameraPick = async () => {
    try {
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
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        
        // Simulate AI processing with realistic delay
        setTimeout(() => {
          setIsProcessing(false);
          onScanResult(mockExtractedDetails);
          onOpenChange(false);
        }, 3000);
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to access camera. Please try again.');
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
    }
  };

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
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
                      outputRange: [height * 0.8, 0],
                    }),
                  },
                  { scale: scaleAnimation },
                ],
                opacity: opacityAnimation,
              },
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
                  <Ionicons 
                    name="arrow-back" 
                    size={24} 
                    color={isProcessing ? colors.textSecondary : colors.text} 
                  />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>Receipt Scanner</Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>AI-powered expense extraction</Text>
                </View>
                <View style={styles.headerRight}>
                  <View style={[styles.aiIndicator, { backgroundColor: colors.primarySurface }]}>
                    <Ionicons name="sparkles" size={16} color={colors.primary} />
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
                    Our AI is extracting expense details from your receipt
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
                        <ActivityIndicator size={16} color={colors.primary} />
                      </View>
                      <Text style={[styles.progressText, { color: colors.text }]}>Extracting data</Text>
                    </View>
                    <View style={[styles.progressStep, styles.progressStepPending]}>
                      <View style={[styles.progressIconContainer, { backgroundColor: colors.surface }]}>
                        <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                      </View>
                      <Text style={[styles.progressText, styles.progressTextPending, { color: colors.textSecondary }]}>
                        Finalizing
                      </Text>
                    </View>
                  </View>
                </View>
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
      </Animated.View>
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
});

export default ScannerDialog;