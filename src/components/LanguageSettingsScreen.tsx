/**
 * Language Settings Screen for Finze
 * Allows users to configure voice input and output languages
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { Language, realTimeSarvamSpeechService } from '../services/realTimeSarvamSpeechService';

interface LanguageSettingsProps {
  visible: boolean;
  onClose: () => void;
  currentInputLanguage: string;
  currentOutputLanguage: string;
  onLanguageChange: (inputLang: string, outputLang: string) => void;
}

export const LanguageSettingsScreen: React.FC<LanguageSettingsProps> = ({
  visible,
  onClose,
  currentInputLanguage,
  currentOutputLanguage,
  onLanguageChange,
}) => {
  const { isDarkTheme } = useTheme();
  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInput, setSelectedInput] = useState(currentInputLanguage);
  const [selectedOutput, setSelectedOutput] = useState(currentOutputLanguage);

  const colors = {
    background: isDarkTheme ? '#0f0f23' : '#ffffff',
    surface: isDarkTheme ? '#1e1e2e' : '#f8fafc',
    text: isDarkTheme ? '#f8f9fc' : '#1f2937',
    textSecondary: isDarkTheme ? '#9ca3af' : '#6b7280',
    primary: '#2563eb',
    success: '#10b981',
    border: isDarkTheme ? '#374151' : '#e5e7eb',
    card: isDarkTheme ? '#374151' : '#ffffff',
  };

  useEffect(() => {
    if (visible) {
      loadLanguages();
    }
  }, [visible]);

  const loadLanguages = async () => {
    try {
      setLoading(true);
      console.log('🌐 LanguageSettings: Loading languages...');
      
      // Refresh backend connection to ensure we have the latest URL
      await realTimeSarvamSpeechService.refreshBackendConnection();
      
      const languages = await realTimeSarvamSpeechService.getSupportedLanguages();
      setSupportedLanguages(languages);
      console.log(`✅ LanguageSettings: Loaded ${languages.length} languages`);
    } catch (error) {
      console.error('❌ LanguageSettings: Failed to load languages:', error);
      
      // Show user-friendly error with retry option
      Alert.alert(
        'Connection Error', 
        'Unable to load language options. Please check your internet connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: loadLanguages }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onLanguageChange(selectedInput, selectedOutput);
    
    const inputLang = supportedLanguages.find(l => l.code === selectedInput);
    const outputLang = supportedLanguages.find(l => l.code === selectedOutput);
    
    Alert.alert(
      '✅ Languages Updated',
      `Input: ${inputLang?.native || selectedInput}\nOutput: ${outputLang?.native || selectedOutput}`,
      [{ text: 'OK', onPress: onClose }]
    );
  };

  const LanguageCard = ({ 
    language, 
    isSelected, 
    onSelect, 
    type 
  }: { 
    language: Language; 
    isSelected: boolean; 
    onSelect: () => void; 
    type: 'input' | 'output';
  }) => (
    <TouchableOpacity
      style={[styles.languageCard, isSelected && styles.languageCardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      {isSelected && (
        <LinearGradient
          colors={type === 'input' ? ['#667eea', '#764ba2'] : ['#10b981', '#059669']}
          style={styles.selectedGradient}
        />
      )}
      
      <View style={styles.languageInfo}>
        <Text style={[styles.languageNative, isSelected && styles.languageNativeSelected]}>
          {language.native}
        </Text>
        <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
          {language.name}
        </Text>
      </View>
      
      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Professional Gradient Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Animated.View entering={FadeIn.duration(400)} style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Language Settings</Text>
              <Text style={styles.headerSubtitle}>Choose your preferred languages</Text>
            </View>
            
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.saveButtonGradient}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <Animated.View entering={FadeInUp} style={styles.loadingContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.loadingSpinner}
              >
                <Ionicons name="hourglass-outline" size={32} color="#fff" />
              </LinearGradient>
              <Text style={styles.loadingText}>Loading languages...</Text>
            </Animated.View>
          ) : (
            <>
              {/* Input Language Section */}
              <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.sectionIconContainer}
                  >
                    <Ionicons name="mic" size={20} color="#fff" />
                  </LinearGradient>
                  <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>Voice Input</Text>
                    <Text style={styles.sectionSubtitle}>Language you speak</Text>
                  </View>
                </View>
                
                <View style={styles.languageList}>
                  {supportedLanguages.map((language, index) => (
                    <Animated.View key={language.code} entering={SlideInRight.delay(150 + index * 30)}>
                      <LanguageCard
                        language={language}
                        isSelected={selectedInput === language.code}
                        onSelect={() => setSelectedInput(language.code)}
                        type="input"
                      />
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>

              {/* Output Language Section */}
              <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.sectionIconContainer}
                  >
                    <Ionicons name="chatbubbles" size={20} color="#fff" />
                  </LinearGradient>
                  <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>AI Response</Text>
                    <Text style={styles.sectionSubtitle}>Language for responses</Text>
                  </View>
                </View>
                
                <View style={styles.languageList}>
                  {supportedLanguages.map((language, index) => (
                    <Animated.View key={language.code} entering={SlideInRight.delay(250 + index * 30)}>
                      <LanguageCard
                        language={language}
                        isSelected={selectedOutput === language.code}
                        onSelect={() => setSelectedOutput(language.code)}
                        type="output"
                      />
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>

              {/* Translation Info */}
              {selectedInput !== selectedOutput && (
                <Animated.View entering={FadeInUp.delay(300)} style={styles.translationCard}>
                  <LinearGradient
                    colors={['#fbbf2410', '#f59e0b10']}
                    style={styles.translationGradient}
                  >
                    <View style={styles.translationHeader}>
                      <View style={styles.translationIconContainer}>
                        <Ionicons name="swap-horizontal" size={18} color="#f59e0b" />
                      </View>
                      <Text style={styles.translationTitle}>Auto Translation</Text>
                    </View>
                    <Text style={styles.translationText}>
                      {supportedLanguages.find(l => l.code === selectedInput)?.native} → {' '}
                      {supportedLanguages.find(l => l.code === selectedOutput)?.native}
                    </Text>
                  </LinearGradient>
                </Animated.View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontWeight: '500',
  },
  saveButton: {
    width: 40,
    height: 40,
  },
  saveButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingSpinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500',
  },
  languageList: {
    paddingHorizontal: 20,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  languageCardSelected: {
    borderColor: 'transparent',
  },
  selectedGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  languageInfo: {
    flex: 1,
  },
  languageNative: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 3,
  },
  languageNativeSelected: {
    color: '#fff',
  },
  languageName: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  languageNameSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  checkmarkContainer: {
    marginLeft: 12,
  },
  translationCard: {
    margin: 20,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  translationGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#fbbf2440',
    borderRadius: 16,
  },
  translationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  translationIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  translationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f59e0b',
  },
  translationText: {
    fontSize: 14,
    color: '#78716c',
    lineHeight: 20,
    fontWeight: '500',
  },
});