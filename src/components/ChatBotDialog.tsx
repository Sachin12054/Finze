import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
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
    View
} from 'react-native';
import Animated, {
    BounceIn,
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    interpolate,
    SlideInDown,
    SlideInLeft,
    SlideInRight,
    SlideInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
    ZoomIn
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { geminiChatBotService } from '../services/geminiChatBotService';
import { Language, LiveTranscription, realTimeSarvamSpeechService, SpeechResult } from '../services/realTimeSarvamSpeechService';
import { LanguageSettingsScreen } from './LanguageSettingsScreen';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatBotDialogProps {
  visible: boolean;
  onClose: () => void;
}

export const ChatBotDialog: React.FC<ChatBotDialogProps> = ({
  visible,
  onClose,
}) => {
  const { isDarkTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "👋 Hello! I'm Finze AI Assistant - Your Personal Financial Advisor\n\n💡 I have real-time access to your financial data and can provide intelligent insights on:\n\n• 📊 Spending patterns & budget optimization\n• 💰 Smart savings strategies\n• 📈 Income vs expense analysis\n• 🎯 Personalized financial goals\n• 🔍 Category-wise expense tracking\n\n🌟 Ask me anything about your finances, and I'll provide personalized advice based on your actual data!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN'); // Default to English
  const [targetLanguage, setTargetLanguage] = useState('en-IN'); // Translation target
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [liveTranscription, setLiveTranscription] = useState<LiveTranscription | null>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([]);
  const [showingLanguageSettings, setShowingLanguageSettings] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // 🎬 ANIMATION VALUES
  const pulseAnimation = useSharedValue(1);
  const orbAnimation = useSharedValue(0);
  const typingDotAnimation = useSharedValue(0);
  const recordingPulseAnimation = useSharedValue(1);
  const glowAnimation = useSharedValue(0);

  // Setup animations
  useEffect(() => {
    // Continuous pulse for recording indicator
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Rotating orbs in background
    orbAnimation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Typing indicator dots
    typingDotAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      false
    );

    // Recording pulse
    recordingPulseAnimation.value = withRepeat(
      withSequence(
        withSpring(1.4, { damping: 2, stiffness: 80 }),
        withSpring(1, { damping: 2, stiffness: 80 })
      ),
      -1,
      false
    );

    // Glow effect
    glowAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const orbRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbAnimation.value}deg` }],
  }));

  const typingDotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(typingDotAnimation.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(typingDotAnimation.value, [0, 1], [0.8, 1.1]) }],
  }));

  const recordingPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordingPulseAnimation.value }],
    opacity: interpolate(recordingPulseAnimation.value, [1, 1.4], [1, 0.6]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnimation.value, [0, 1], [0.5, 1]),
  }));

  // Voice Recognition Setup and Language Loading
  useEffect(() => {
    setRecognitionSupported(realTimeSarvamSpeechService.isAvailable());
    
    // Load supported languages with retry mechanism
    const loadLanguages = async () => {
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 Loading languages (attempt ${retryCount + 1}/${maxRetries})...`);
          const languages = await realTimeSarvamSpeechService.getSupportedLanguages();
          setSupportedLanguages(languages);
          console.log(`✅ Languages loaded successfully: ${languages.length} languages`);
          return; // Success, exit the retry loop
        } catch (error) {
          retryCount++;
          console.error(`❌ Failed to load languages (attempt ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount < maxRetries) {
            console.log(`⏳ Retrying in ${1000 * retryCount}ms...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Progressive delay
          } else {
            console.log('⚠️ All retry attempts failed, using fallback languages');
            // Fallback languages will be provided by the service
          }
        }
      }
    };
    
    // Add a small delay to ensure backend URL resolution completes
    setTimeout(() => {
      loadLanguages();
    }, 1000);
    
    // Set up live transcription callback
    realTimeSarvamSpeechService.setLiveTranscriptionCallback((transcription) => {
      setLiveTranscription(transcription);
    });
    
    // Update languages in service
    realTimeSarvamSpeechService.setLanguages(selectedLanguage, targetLanguage);
  }, []);

  // Update service when languages change
  useEffect(() => {
    realTimeSarvamSpeechService.setLanguages(selectedLanguage, targetLanguage);
  }, [selectedLanguage, targetLanguage]);

  // Cleanup recording timer
  useEffect(() => {
    return () => {
      // Only cleanup recording timer, don't cancel recording here
      // Let the stopListening function handle recording cleanup properly
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, [recordingTimer]);

  // Cleanup on dialog close
  useEffect(() => {
    if (!visible) {
      // Cancel any ongoing recording when dialog is closed
      if (isRecording) {
        realTimeSarvamSpeechService.cancelRecording();
        setIsRecording(false);
        setIsListening(false);
        if (recordingTimer) {
          clearInterval(recordingTimer);
          setRecordingTimer(null);
        }
      }
    }
  }, [visible, isRecording, recordingTimer]);

  // Text-to-Speech function for individual messages
  const speakMessage = async (message: string, messageId?: string) => {
    if (!voiceEnabled) return;
    
    // Stop current speech if any
    if (isSpeaking) {
      Speech.stop();
    }
    
    try {
      setIsSpeaking(true);
      if (messageId) {
        setSpeakingMessageId(messageId);
      }
      
      // Clean the message for better speech
      const cleanMessage = message
        .replace(/[🤖💰💡⚠️📊🔑⏱️🌐✅❌]/g, '') // Remove emojis
        .replace(/₹/g, 'rupees ') // Convert currency symbol
        .trim();
      
      await Speech.speak(cleanMessage, {
        language: selectedLanguage, // Use selected language
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        },
        onStopped: () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        },
        onError: () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        },
      });
      
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  // Enhanced Real-time Speech-to-Text function
  const startListening = async () => {
    if (!voiceEnabled) {
      Alert.alert(
        'Voice Disabled',
        'Please enable voice features in settings.'
      );
      return;
    }

    if (isListening || isRecording) {
      // Stop current recording
      await stopListening();
      return;
    }

    try {
      setIsListening(true);
      setLiveTranscription(null);
      
      const currentLang = supportedLanguages.find(lang => lang.code === selectedLanguage);
      const targetLang = supportedLanguages.find(lang => lang.code === targetLanguage);
      
      // Start real-time recording
      const startResult = await realTimeSarvamSpeechService.startRecording('user-123');
      
      if (startResult.success) {
        setIsRecording(true);
        setRecordingDuration(0);
        
        // Start recording timer
        const timer = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
        setRecordingTimer(timer);
        
        // Show live recording status with clear language flow
        const inputLang = currentLang?.native || selectedLanguage;
        const outputLang = targetLang?.native || targetLanguage;
        const sameLanguage = selectedLanguage === targetLanguage;
        
        Alert.alert(
          `🎤 ${sameLanguage ? 'Recording' : 'Recording & Translating'}`,
          sameLanguage 
            ? `Speaking & displaying in: ${inputLang}\n\nSpeak now - you'll see live transcription!`
            : `🗣️ Speak in: ${inputLang}\n📝 Display in: ${outputLang}\n\nSpeak now - translation will happen automatically!`,
          [
            {
              text: 'Stop Recording',
              onPress: () => stopListening(),
              style: 'default'
            }
          ]
        );
      } else {
        setIsListening(false);
        Alert.alert(
          'Recording Failed',
          startResult.error || 'Could not start recording. Please check microphone permissions.'
        );
      }
      
    } catch (error) {
      console.error('Speech recognition error:', error);
      setIsListening(false);
      Alert.alert(
        'Error',
        'Failed to start voice recognition. Please check your microphone permissions and try again.'
      );
    }
  };

  // Stop current speech
  const stopSpeaking = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  const stopListening = async () => {
    if (!isRecording) {
      setIsListening(false);
      return;
    }

    try {
      setIsListening(false);
      setIsRecording(false);
      setLiveTranscription(null);
      
      // Clear recording timer
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      
      // Show processing message
      const processingAlert = Alert.alert(
        '🔄 Processing...',
        'Converting speech to text and getting AI response...'
      );
      
      // Stop the current recording and get comprehensive result
      const result: SpeechResult = await realTimeSarvamSpeechService.stopRecording('user-123');

      // Clear processing alert
      // Note: Alert.dismiss() might not be available in all versions
      
      if (result.success && result.finalText.trim()) {
        // Set the transcribed/translated text
        setInputText(result.finalText);
        
        const wasTranslated = result.translationPerformed;
        const confidence = Math.round(result.confidence * 100);
        
        // Add AI response as bot message immediately
        if (result.aiResponse && result.aiResponse.trim()) {
          const aiMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: result.aiResponse,
            isUser: false,
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, aiMessage]);
        }
        
        // Show comprehensive result with clear language feedback
        const inputLangName = supportedLanguages.find(l => l.code === result.inputLanguage)?.native || result.inputLanguage;
        const outputLangName = supportedLanguages.find(l => l.code === result.targetLanguage)?.native || result.targetLanguage;
        
        let alertTitle = '';
        let alertMessage = '';
        
        if (wasTranslated) {
          // Different languages - show translation
          alertTitle = `🔄 Translated: ${inputLangName} → ${outputLangName} (${confidence}%)`;
          alertMessage = `You spoke in ${inputLangName}:\n"${result.originalTranscript}"\n\nTranslated to ${outputLangName}:\n"${result.finalText}"`;
        } else {
          // Same language - show direct processing
          alertTitle = `🗣️ Processed in ${inputLangName} (${confidence}%)`;
          alertMessage = `"${result.finalText}"`;
        }
        
        if (result.aiResponse) {
          alertMessage += '\n\n🤖 AI response added to chat!';
        }
        
        Alert.alert(alertTitle, alertMessage, [
            {
              text: 'Got it!',
              style: 'default'
            }
          ]
        );
      } else {
        // Show error or empty result
        Alert.alert(
          '❌ Processing Failed',
          result.error || 'Could not understand the audio. Please try speaking more clearly.',
          [
            {
              text: 'Try Again',
              onPress: () => startListening()
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      
      Alert.alert('Error', 'Failed to process recording. Please try again.');
    } finally {
      setRecordingDuration(0);
    }
  };

  // Enhanced Language Settings
  const showLanguageSettings = () => {
    if (supportedLanguages.length === 0) {
      Alert.alert('Loading...', 'Language list is being loaded. Please try again.');
      return;
    }

    const inputOptions = supportedLanguages.map((lang: Language) => ({
      text: `Input: ${lang.native} (${lang.name})`,
      onPress: () => {
        setSelectedLanguage(lang.code);
        showTargetLanguageSelector(lang);
      }
    }));

    Alert.alert(
      '🎤 Select Input Language',
      'Choose the language you will speak in:',
      [
        ...inputOptions,
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const showTargetLanguageSelector = (inputLang: Language) => {
    const targetOptions = supportedLanguages.map((lang: Language) => ({
      text: `${lang.native} (${lang.name}) ${lang.code === inputLang.code ? '(Same)' : ''}`,
      onPress: () => {
        setTargetLanguage(lang.code);
        
        const message = inputLang.code === lang.code 
          ? `Language set to ${lang.native}` 
          : `Input: ${inputLang.native} → Output: ${lang.native}`;
          
        Alert.alert('✅ Languages Configured', message);
      }
    }));

    Alert.alert(
      '🌐 Select Output Language',
      `Input: ${inputLang.native}\n\nChoose the language for text and AI responses:`,
      [
        ...targetOptions,
        {
          text: 'Back',
          style: 'cancel',
          onPress: () => showLanguageSettings()
        }
      ]
    );
  };

  // Get language display name
  const getLanguageName = (code: string): string => {
    const lang = supportedLanguages.find(l => l.code === code);
    return lang ? lang.native : code;
  };

  const colors = {
    background: isDarkTheme ? '#0f0f23' : '#ffffff',
    surface: isDarkTheme ? '#1e1e2e' : '#f9fafb',
    messagesBackground: isDarkTheme ? '#1a1a2e' : '#f3f4f6',
    text: isDarkTheme ? '#f8f9fc' : '#1f2937',
    textSecondary: isDarkTheme ? '#9ca3af' : '#6b7280',
    primary: '#667eea',
    success: '#10b981',
    border: isDarkTheme ? '#374151' : '#e5e7eb',
    userBubble: '#667eea',
    botBubble: isDarkTheme ? '#2d2d44' : '#ffffff',
    botBubbleBorder: isDarkTheme ? '#3d3d5c' : '#e5e7eb',
    botAvatarBg: isDarkTheme ? '#2d2d44' : '#ffffff',
    inputBg: isDarkTheme ? '#1e1e2e' : '#ffffff',
  };

  // Enhanced Gemini AI response generation
  const generateBotResponse = async (userMessage: string): Promise<string> => {
    try {
      console.log('🤖 Sending message to Gemini AI:', userMessage);
      const response = await geminiChatBotService.sendMessage(userMessage);
      console.log('✅ Gemini AI response received');
      return response;
    } catch (error) {
      console.error('❌ Gemini AI error:', error);
      
      // Enhanced error handling with specific messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key') || error.message.includes('API key')) {
          return "🔑 I need a valid Gemini API key to provide AI-powered responses. Please check the app configuration. In the meantime, I can still help with basic financial guidance based on your expense data!";
        }
        
        if (error.message.includes('timeout') || error.message.includes('Request timeout')) {
          return "⏱️ The AI service is taking too long to respond. Please try a simpler question or check your internet connection. I can still help with basic financial advice!";
        }
        
        if (error.message.includes('network') || error.message.includes('NetworkError')) {
          return "🌐 I'm having trouble connecting to Google AI right now. Please check your internet connection and try again. I can still analyze your local financial data though!";
        }
        
        if (error.message.includes('quota_exceeded')) {
          const retryMatch = error.message.match(/quota_exceeded:(\d+)s/);
          const retryMinutes = retryMatch ? Math.ceil(parseInt(retryMatch[1]) / 60) : 1;
          return `📊 I've exhausted all available AI models for today. Google's free tier limits are reached. Please try again in ${retryMinutes} minutes, or I can still provide intelligent financial advice using your local expense data! I can see you have ₹195,795 in expenses to analyze. 💰✨`;
        }
        
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          return "📊 I've reached my API usage limit for now. Please try again in a few minutes. I can still provide basic financial advice using your local data!";
        }
      }
      
      // Provide helpful fallback based on the question
      const message = userMessage.toLowerCase();
      
      if (message.includes('budget') || message.includes('spending')) {
        return "💰 I can help you create a budget! The 50/30/20 rule is a great starting point: 50% for needs, 30% for wants, 20% for savings. Would you like me to analyze your current spending patterns with full AI once my connection is restored?";
      }
      
      if (message.includes('save') || message.includes('saving')) {
        return "💡 For savings advice, I recommend starting with tracking your expenses to find areas where you can cut back. Once my full AI service is available, I can provide personalized savings strategies based on your actual spending data!";
      }
      
      return "⚠️ I'm currently experiencing connectivity issues with my advanced AI features. However, I can still help with basic financial questions using your local expense data! For the most personalized AI-powered advice, please try again in a few moments.";
    }
  };

  const sendMessage = async () => {
    if (inputText.trim() === '') return;

    const userMessageText = inputText.trim();
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Get AI response with real data
      const aiResponseText = await generateBotResponse(userMessageText);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // Note: Automatic voice removed - users can now click individual voice buttons
    } catch (error) {
      console.error('❌ Error generating bot response:', error);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or check your internet connection.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorResponse]);
      
      // Note: Automatic voice removed - users can click the voice button if needed
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    "Analyze my spending patterns",
    "How can I save more money?",
    "Create a budget plan for me",
    "What's my financial health?",
    "Which categories am I overspending?",
    "Set savings goals based on my income",
  ];

  const sendQuickQuestion = (question: string) => {
    setInputText(question);
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  useEffect(() => {
    if (messages.length > 1) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#667eea' }}>
        <KeyboardAvoidingView 
          style={[styles.container, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
        {/* 🎨 ULTRA-MODERN GLASSMORPHIC HEADER */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Animated.View 
            entering={FadeInDown.duration(600)}
            style={styles.headerContent}
          >
            {/* Left: Avatar + Title */}
            <View style={styles.headerLeft}>
              <Animated.View entering={ZoomIn.duration(500).delay(100)}>
                <View style={styles.botAvatar}>
                  <LinearGradient
                    colors={['#ffffff', '#f3f4f6']}
                    style={styles.botAvatarGradient}
                  >
                    <Ionicons name="sparkles" size={20} color="#667eea" />
                  </LinearGradient>
                </View>
              </Animated.View>
              
              <Animated.View 
                entering={FadeIn.duration(500).delay(200)}
                style={styles.headerInfo}
              >
                <Text style={styles.headerTitle}>Finze AI Assistant</Text>
                <View style={styles.statusContainer}>
                  <Animated.View 
                    style={[
                      styles.statusDot, 
                      { backgroundColor: isTyping ? '#fbbf24' : isSpeaking ? '#f87171' : '#10b981' },
                      (isTyping || isSpeaking) && pulseStyle
                    ]} 
                  />
                  <Text style={styles.headerSubtitle}>
                    {isTyping ? 'Thinking' : isSpeaking ? 'Speaking' : 'Active'}
                  </Text>
                </View>
              </Animated.View>
            </View>
            
            {/* Right: Controls */}
            <Animated.View 
              entering={FadeIn.duration(500).delay(300)}
              style={styles.headerControls}
            >
              {/* Language Selector */}
              <TouchableOpacity 
                onPress={() => setShowingLanguageSettings(true)}
                style={styles.languageButton}
              >
                <Ionicons name="language" size={18} color="#ffffff" />
              </TouchableOpacity>
              
              {/* Voice Toggle */}
              <TouchableOpacity 
                onPress={() => setVoiceEnabled(!voiceEnabled)} 
                style={styles.headerIconButton}
              >
                <Ionicons 
                  name={voiceEnabled ? "volume-high" : "volume-mute"} 
                  size={18} 
                  color="#ffffff" 
                />
              </TouchableOpacity>
              
              {/* Close Button */}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
          
          {/* Sarvam AI Badge (if available) */}
          {realTimeSarvamSpeechService.isAvailable() && (
            <Animated.View 
              entering={SlideInUp.duration(600).delay(800).springify()}
              style={styles.sarvamBadge}
            >
              <LinearGradient
                colors={['#10b98180', '#05966980']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sarvamBadgeGradient}
              >
                <Animated.View style={[styles.sarvamDot, glowStyle]} />
                <Text style={styles.sarvamText}>Voice AI Active</Text>
                <Ionicons name="mic" size={12} color="white" />
              </LinearGradient>
            </Animated.View>
          )}
        </LinearGradient>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={[styles.messagesContainer, { backgroundColor: colors.messagesBackground }]}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => (
            <Animated.View
              key={message.id}
              entering={message.isUser ? SlideInRight.delay(index * 100) : SlideInLeft.delay(index * 100)}
              style={[
                styles.messageWrapper,
                message.isUser ? styles.userMessageWrapper : styles.botMessageWrapper,
              ]}
            >
              {!message.isUser && (
                <View style={[styles.botMessageAvatar, { 
                  backgroundColor: colors.botAvatarBg, 
                  borderColor: colors.border 
                }]}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                </View>
              )}
              
              <View
                style={[
                  styles.messageBubble,
                  message.isUser
                    ? [styles.userBubble, { backgroundColor: colors.userBubble }]
                    : [styles.botBubble, { 
                        backgroundColor: colors.botBubble, 
                        borderColor: colors.botBubbleBorder 
                      }],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    { color: message.isUser ? 'white' : colors.text },
                  ]}
                >
                  {message.text}
                </Text>
                
                <View style={styles.messageFooter}>
                  <Text
                    style={[
                      styles.messageTime,
                      { color: message.isUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
                    ]}
                  >
                    {message.timestamp.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  
                  {/* Individual Voice Button for Bot Messages */}
                  {!message.isUser && voiceEnabled && (
                    <Animated.View
                      style={speakingMessageId === message.id ? {
                        transform: [{ scale: 1.1 }]
                      } : {}}
                    >
                      <TouchableOpacity
                        style={[
                          styles.speakButton, 
                          { 
                            backgroundColor: speakingMessageId === message.id 
                              ? colors.success 
                              : colors.primary,
                            opacity: isSpeaking && speakingMessageId !== message.id ? 0.5 : 1
                          }
                        ]}
                        onPress={() => speakMessage(message.text, message.id)}
                        disabled={isSpeaking && speakingMessageId !== message.id}
                      >
                        <Ionicons 
                          name={
                            speakingMessageId === message.id 
                              ? "volume-high" 
                              : "volume-medium"
                          } 
                          size={12} 
                          color="white" 
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </View>
              </View>
            </Animated.View>
          ))}

          {isTyping && (
            <Animated.View 
              entering={FadeInUp.springify()} 
              exiting={FadeOut.duration(300)}
              style={styles.typingIndicator}
            >
              <Animated.View 
                entering={ZoomIn.duration(400)}
                style={styles.botMessageAvatar}
              >
                <Ionicons name="sparkles" size={14} color={colors.primary} />
              </Animated.View>
              <View style={[styles.typingBubble, { backgroundColor: colors.botBubble }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }, typingDotStyle]} />
                  <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 4 }, typingDotStyle, { opacity: 0.7 }]} />
                  <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 4 }, typingDotStyle, { opacity: 0.4 }]} />
                </View>
                <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                  AI is thinking...
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <Animated.View 
              entering={FadeInDown.duration(600).delay(500)} 
              style={styles.quickQuestionsContainer}
            >
              <Text style={[styles.quickQuestionsTitle, { color: colors.textSecondary }]}>
                Quick questions:
              </Text>
              {quickQuestions.map((question, index) => (
                <Animated.View
                  key={index}
                  entering={SlideInLeft.duration(400).delay(600 + index * 100).springify()}
                >
                  <TouchableOpacity
                    style={[styles.quickQuestionButton, { borderColor: colors.border }]}
                    onPress={() => sendQuickQuestion(question)}
                  >
                    <Text style={[styles.quickQuestionText, { color: colors.primary }]}>
                      {question}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </Animated.View>
          )}
        </ScrollView>

        {/* Live Transcription Display */}
        {liveTranscription && (
          <Animated.View 
            entering={SlideInDown.duration(400).springify()}
            exiting={FadeOut.duration(300)}
            style={[styles.liveTranscriptionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.liveTranscriptionHeader}>
              <Animated.View entering={ZoomIn.duration(300)}>
                <Ionicons name="mic" size={16} color={colors.primary} />
              </Animated.View>
              <Text style={[styles.liveTranscriptionTitle, { color: colors.primary }]}>
                Live Transcription
              </Text>
              <Animated.View 
                entering={BounceIn.duration(400).delay(200)}
                style={[styles.confidenceBadge, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.confidenceText}>
                  {Math.round(liveTranscription.confidence * 100)}%
                </Text>
              </Animated.View>
            </View>
            <Animated.Text 
              entering={FadeIn.duration(400).delay(200)}
              style={[styles.liveTranscriptionText, { color: colors.text }]}
            >
              {liveTranscription.text}
            </Animated.Text>
            {liveTranscription.isFinal && (
              <Animated.Text 
                entering={SlideInRight.duration(400).springify()}
                style={[styles.finalTranscriptionLabel, { color: colors.success }]}
              >
                ✓ Final transcription
              </Animated.Text>
            )}
          </Animated.View>
        )}

        {/* Recording Status */}
        {isRecording && (
          <Animated.View 
            entering={SlideInDown.duration(400).springify()}
            exiting={SlideInUp.duration(300)}
            style={[styles.recordingStatusContainer, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]}
          >
            <View style={styles.recordingStatusContent}>
              <Animated.View style={[styles.recordingIndicator, recordingPulseStyle]} />
              <Text style={[styles.recordingStatusText, { color: '#dc2626' }]}>
                Recording {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </Text>
              <Text style={[styles.recordingLanguageText, { color: '#991b1b' }]}>
                {getLanguageName(selectedLanguage)} → {getLanguageName(targetLanguage)}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Input */}
        <Animated.View 
          entering={SlideInUp.duration(600).delay(400)}
          style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <TextInput
            style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
            placeholder="Ask me anything about finances..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          
          {/* Voice Button */}
          <Animated.View style={isRecording ? recordingPulseStyle : {}}>
            <TouchableOpacity
              style={[
                styles.voiceButton,
                { 
                  backgroundColor: isRecording ? '#ef4444' : // Red when recording
                    isListening ? colors.success : 
                    voiceEnabled ? colors.primary : colors.border 
                },
              ]}
              onPress={isListening ? stopListening : startListening}
              disabled={!voiceEnabled}
            >
              <Ionicons 
                name={isRecording ? "radio-button-on" : isListening ? "mic" : "mic-outline"} 
                size={20} 
                color={voiceEnabled ? 'white' : colors.textSecondary} 
              />
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? colors.primary : colors.border },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? 'white' : colors.textSecondary} 
            />
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Language Settings Modal */}
      <LanguageSettingsScreen
        visible={showingLanguageSettings}
        onClose={() => setShowingLanguageSettings(false)}
        currentInputLanguage={selectedLanguage}
        currentOutputLanguage={targetLanguage}
        onLanguageChange={(inputLang, outputLang) => {
          setSelectedLanguage(inputLang);
          setTargetLanguage(outputLang);
          realTimeSarvamSpeechService.setLanguages(inputLang, outputLang);
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // 🎨 ULTRA-MODERN GLASSMORPHIC HEADER
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 38,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerOrb1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    opacity: 0.6,
  },
  headerOrb2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  botAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  botAvatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  
  // 🎛️ MODERN HEADER CONTROLS
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  sarvamBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sarvamBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sarvamDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  sarvamText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // 💬 MODERN MESSAGE DESIGN
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  messagesContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  botMessageWrapper: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
  botMessageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    borderBottomRightRadius: 4,
    backgroundColor: '#667eea',
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.1,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.6,
  },
  
  // ⌨️ TYPING INDICATOR
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  typingText: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  
  // ⚡ MODERN QUICK QUESTIONS
  quickQuestionsContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  quickQuestionsTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
    color: '#6b7280',
  },
  quickQuestionButton: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  quickQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 20,
    color: '#667eea',
  },
  
  // 📝 MODERN INPUT CONTAINER
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontWeight: '400',
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // 🔊 MESSAGE SPEAK BUTTON
  speakButton: {
    padding: 6,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 32,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  
  // 🎙️ LIVE TRANSCRIPTION STYLES - PROFESSIONAL DESIGN
  liveTranscriptionContainer: {
    margin: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  liveTranscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveTranscriptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
    letterSpacing: 0.3,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  confidenceText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  liveTranscriptionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  finalTranscriptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  
  // 🔴 RECORDING STATUS - ANIMATED DESIGN
  recordingStatusContainer: {
    margin: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  recordingStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    marginRight: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  recordingStatusText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.3,
  },
  recordingLanguageText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
    marginTop: 2,
  },
});