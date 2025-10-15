/**
 * Real-time Sarvam AI Speech Service with Live Detection
 * Connects to Finze Backend for speech processing, translation, and AI responses
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { findBestBackendUrl, getDefaultBackendUrl } from '../config/backendConfig';

// Helper function to create timeout with AbortController for React Native compatibility
function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  return controller;
}

// Dynamic backend URL - will be resolved at runtime
let BACKEND_BASE_URL: string | null = null;

export interface Language {
  code: string;
  name: string;
  native: string;
}

export interface SpeechResult {
  success: boolean;
  originalTranscript: string;
  finalText: string;
  aiResponse: string;
  inputLanguage: string;
  targetLanguage: string;
  confidence: number;
  translationPerformed: boolean;
  error?: string;
  warning?: string;
}

export interface LiveTranscription {
  text: string;
  confidence: number;
  isFinal: boolean;
}

class RealTimeSarvamSpeechService {
  private apiKey: string;
  private recording: Audio.Recording | null = null;
  private isRecording = false;
  private currentLanguage = 'en-IN';  // Default to English
  private targetLanguage = 'en-IN';   // Default to English
  private liveTranscriptionCallback?: (transcription: LiveTranscription) => void;
  private transcriptionInterval?: ReturnType<typeof setInterval>;
  private recordingStartTime = 0;
  private backendInitialized = false;

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_SARVAM_API_KEY || '';
    // Don't auto-initialize in constructor to avoid race conditions
  }

  /**
   * Ensure the service is properly initialized before use
   */
  async ensureInitialized(): Promise<void> {
    if (!this.backendInitialized) {
      await this.initializeBackend();
    }
  }

  /**
   * Initialize backend URL by finding the best working endpoint
   */
  private async initializeBackend(): Promise<void> {
    if (this.backendInitialized && BACKEND_BASE_URL) {
      return;
    }

    try {
      console.log('🔄 Speech service: Initializing backend connection...');
      
      // Try to find the best working backend
      const bestUrl = await findBestBackendUrl();
      BACKEND_BASE_URL = bestUrl || getDefaultBackendUrl();
      this.backendInitialized = true;
      
      console.log(`🗣️ Speech service initialized with: ${BACKEND_BASE_URL}`);
      
      // Verify the speech endpoint is working
      try {
        const controller = createTimeoutController(5000);
        const testResponse = await fetch(`${BACKEND_BASE_URL}/api/speech/languages`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        if (testResponse.ok) {
          console.log('✅ Speech service: Backend speech endpoint verified');
        } else {
          console.warn(`⚠️ Speech service: Backend speech endpoint test failed: ${testResponse.status}`);
        }
      } catch (testError) {
        console.warn('⚠️ Speech service: Could not verify speech endpoint:', testError);
      }
      
    } catch (error) {
      console.error('❌ Speech service: Failed to initialize backend:', error);
      // Fallback to default URL
      BACKEND_BASE_URL = getDefaultBackendUrl();
      this.backendInitialized = true;
      console.log(`🔄 Speech service: Using fallback URL: ${BACKEND_BASE_URL}`);
    }
  }

  /**
   * Get the current backend URL, initializing if needed
   */
  private async getBackendUrl(): Promise<string> {
    if (!BACKEND_BASE_URL || !this.backendInitialized) {
      await this.initializeBackend();
    }
    return BACKEND_BASE_URL || getDefaultBackendUrl();
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Force refresh the backend connection
   */
  async refreshBackendConnection(): Promise<string> {
    this.backendInitialized = false;
    BACKEND_BASE_URL = null;
    await this.initializeBackend();
    return BACKEND_BASE_URL || getDefaultBackendUrl();
  }

  async getSupportedLanguages(): Promise<Language[]> {
    try {
      // Ensure service is initialized before making requests
      await this.ensureInitialized();
      
      const backendUrl = await this.getBackendUrl();
      console.log(`🌐 Fetching languages from: ${backendUrl}/api/speech/languages`);
      
      const controller = createTimeoutController(10000); // 10 second timeout
      const response = await fetch(`${backendUrl}/api/speech/languages`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        console.log(`✅ Languages fetched successfully: ${data.languages.length} languages`);
        return data.languages;
      } else {
        throw new Error(data.error || 'Failed to get languages');
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      
      // Fallback to comprehensive language list
      const fallbackLanguages = [
        { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
        { code: 'en-IN', name: 'English', native: 'English' },
        { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்' },
        { code: 'te-IN', name: 'Telugu', native: 'తెలుగు' },
        { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ' },
        { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം' },
        { code: 'mr-IN', name: 'Marathi', native: 'मराठी' },
        { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી' },
        { code: 'bn-IN', name: 'Bengali', native: 'বাংলা' },
        { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
      ];
      
      console.log(`⚠️ Using fallback languages: ${fallbackLanguages.length} languages`);
      return fallbackLanguages;
    }
  }

  setLanguages(inputLanguage: string, targetLanguage?: string) {
    this.currentLanguage = inputLanguage;
    this.targetLanguage = targetLanguage || inputLanguage;
    console.log(`🌐 Language set: ${inputLanguage} -> ${this.targetLanguage}`);
  }

  setLiveTranscriptionCallback(callback: (transcription: LiveTranscription) => void) {
    this.liveTranscriptionCallback = callback;
  }

  private simulateLiveTranscription() {
    // DISABLED: Real-time transcription from actual speech
    // No simulation needed - we process real audio
    console.log('🎤 Live transcription: Waiting for real speech processing...');
  }

  private clearLiveTranscription() {
    if (this.transcriptionInterval) {
      clearInterval(this.transcriptionInterval);
      this.transcriptionInterval = undefined;
    }
  }

  async startRecording(userId: string = 'anonymous'): Promise<{ success: boolean; error?: string }> {
    if (this.isRecording) {
      return { success: false, error: 'Already recording' };
    }

    try {
      // Request permissions with more explicit handling
      console.log('🎤 Requesting microphone permissions...');
      const permission = await Audio.requestPermissionsAsync();
      console.log('🎤 Permission status:', permission.status);
      
      if (permission.status !== 'granted') {
        return { success: false, error: 'Microphone permission denied. Please enable microphone access in settings.' };
      }

      // Set audio mode with better settings for recording
      console.log('🎤 Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,  // Allow background recording
        playThroughEarpieceAndroid: false,
      });

      // Create and prepare recording
      console.log('🎤 Creating recording instance...');
      this.recording = new Audio.Recording();
      
      // Simplified, more compatible recording settings
      const recordingOptions = {
        android: {
          extension: '.m4a',  // More reliable on Android
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,  // Standard sample rate
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',  // More reliable on iOS
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 44100,  // Standard sample rate
          numberOfChannels: 2,
          bitRate: 128000,
        },
        web: {
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: 128000,
        },
      };

      console.log('🎤 Preparing recording...');
      await this.recording.prepareToRecordAsync(recordingOptions);
      
      console.log('🎤 Starting recording...');
      await this.recording.startAsync();

      this.isRecording = true;
      this.recordingStartTime = Date.now();
      
      // Real voice recording - no simulation needed
      console.log('🎤 Real-time recording started successfully - Speak now!');
      console.log(`Recording status:`, await this.recording.getStatusAsync());

      return { success: true };
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      this.cleanup();
      return { success: false, error: error.message || 'Failed to start recording' };
    }
  }

  async stopRecording(userId: string = 'anonymous'): Promise<SpeechResult> {
    if (!this.isRecording || !this.recording) {
      return {
        success: false,
        originalTranscript: '',
        finalText: '',
        aiResponse: '',
        inputLanguage: this.currentLanguage,
        targetLanguage: this.targetLanguage,
        confidence: 0,
        translationPerformed: false,
        error: 'No active recording'
      };
    }

    try {
      // Check minimum recording duration (at least 1 second)
      const recordingDuration = Date.now() - this.recordingStartTime;
      console.log(`🎤 Recording duration: ${recordingDuration}ms`);
      
      if (recordingDuration < 1000) {
        console.log('⚠️ Recording too short, extending...');
        // Wait a bit more to ensure we have valid audio data
        await new Promise(resolve => setTimeout(resolve, 1000 - recordingDuration));
      }

      console.log('🎤 Stopping recording...');
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.isRecording = false;
      this.clearLiveTranscription();

      console.log('🎤 Recording stopped, processing...');

      if (!uri) {
        throw new Error('No audio file generated');
      }

      // Read audio file and validate
      const audioInfo = await FileSystem.getInfoAsync(uri);
      const fileSize = audioInfo.exists && 'size' in audioInfo ? audioInfo.size : 0;
      console.log(`📊 Audio file exists: ${audioInfo.exists}, size: ${fileSize} bytes`);
      
      if (!audioInfo.exists) {
        throw new Error('Audio file was not created');
      }
      
      if (fileSize && fileSize < 1000) { // Less than 1KB is likely empty
        throw new Error('Audio file is too small - no valid audio data captured');
      }

      // Convert audio file to base64
      const audioData = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (!audioData || audioData.length < 100) {
        throw new Error('No valid audio data has been recorded');
      }

      console.log(`📊 Audio data size: ${audioData.length} chars (base64)`);
      console.log(`🌐 Sending to backend: ${this.currentLanguage} -> ${this.targetLanguage}`);

      // Ensure initialized and get backend URL
      await this.ensureInitialized();
      const backendUrl = await this.getBackendUrl();
      
      console.log(`📡 Posting to: ${backendUrl}/api/speech/speech-to-text`);
      console.log(`📊 Request body keys: audio_base64, audio_format, input_language, target_language, user_id`);
      
      // Send to backend for processing with timeout
      // Use JSON instead of FormData for better React Native compatibility
      const timeoutController = createTimeoutController(30000); // 30 second timeout
      
      const backendResponse = await fetch(`${backendUrl}/api/speech/speech-to-text`, {
        method: 'POST',
        signal: timeoutController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          audio_base64: audioData,
          audio_format: 'm4a',
          input_language: this.currentLanguage,
          target_language: this.targetLanguage,
          user_id: userId,
        }),
      });

      console.log(`📡 Response status: ${backendResponse.status} ${backendResponse.statusText}`);

      // Clean up temp file
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (deleteError) {
        console.warn('Could not delete temp file:', deleteError);
      }

      this.cleanup();

      console.log(`📡 Response status: ${backendResponse.status} ${backendResponse.statusText}`);

      if (!backendResponse.ok) {
        let errorMessage = `Backend error: ${backendResponse.status}`;
        try {
          const errorData = await backendResponse.json();
          errorMessage = errorData.error || errorMessage;
          console.error(`❌ Backend error details:`, errorData);
        } catch (e) {
          console.error(`❌ Could not parse error response`);
        }
        throw new Error(errorMessage);
      }

      const result = await backendResponse.json();

      if (result.status === 'success') {
        const data = result.data;
        console.log('✅ Backend processing successful');
        console.log(`📝 Original: "${data.original_transcript}"`);
        console.log(`📝 Final: "${data.final_text}"`);
        console.log(`🤖 AI Response: "${data.ai_response?.substring(0, 50)}..."`);
        
        // Check for warnings (e.g., mock transcription)
        if (data.warning) {
          console.warn(`⚠️ ${data.warning}`);
        }
        if (data.is_mock) {
          console.warn('⚠️ DEMO MODE: Using fallback transcription because Sarvam API key is invalid');
        }

        return {
          success: true,
          originalTranscript: data.original_transcript,
          finalText: data.final_text,
          aiResponse: data.ai_response,
          inputLanguage: data.input_language,
          targetLanguage: data.target_language,
          confidence: data.confidence,
          translationPerformed: data.translation_performed,
          warning: data.warning || (data.is_mock ? 'Using demonstration mode - please configure valid Sarvam API key' : undefined)
        };
      } else {
        throw new Error(result.error || 'Backend processing failed');
      }

    } catch (error: any) {
      console.error('Failed to process recording:', error);
      this.cleanup();
      
      return {
        success: false,
        originalTranscript: '',
        finalText: '',
        aiResponse: '',
        inputLanguage: this.currentLanguage,
        targetLanguage: this.targetLanguage,
        confidence: 0,
        translationPerformed: false,
        error: error.message || 'Failed to process recording'
      };
    }
  }

  async cancelRecording(): Promise<void> {
    if (this.recording) {
      try {
        // Check if recording is actually active
        const status = await this.recording.getStatusAsync();
        console.log('🎤 Cancel recording - status:', status);
        
        if (status.isRecording || status.isDoneRecording) {
          console.log('🎤 Stopping/unloading recording...');
          await this.recording.stopAndUnloadAsync();
        } else {
          console.log('🎤 Recording not active, just cleaning up...');
        }
      } catch (error) {
        console.warn('⚠️ Error cancelling recording (safe to ignore):', error);
        // Safe to ignore - recording may not have valid data yet
      }
    }
    this.clearLiveTranscription();
    this.cleanup();
  }

  private cleanup(): void {
    this.recording = null;
    this.isRecording = false;
    this.recordingStartTime = 0;
  }

  // Chat integration
  async sendChatMessage(message: string, userId: string = 'anonymous'): Promise<{
    success: boolean;
    aiResponse: string;
    error?: string;
  }> {
    try {
      await this.ensureInitialized();
      const backendUrl = await this.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/speech/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          user_id: userId,
          language: this.targetLanguage
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        return {
          success: true,
          aiResponse: result.data.ai_response
        };
      } else {
        throw new Error(result.error || 'Chat request failed');
      }
    } catch (error: any) {
      console.error('Chat message error:', error);
      return {
        success: false,
        aiResponse: '',
        error: error.message
      };
    }
  }

  // Translation service
  async translateText(text: string, sourceLanguage?: string, targetLanguage?: string): Promise<{
    success: boolean;
    translatedText: string;
    error?: string;
  }> {
    try {
      await this.ensureInitialized();
      const backendUrl = await this.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/speech/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          source_language: sourceLanguage || this.currentLanguage,
          target_language: targetLanguage || this.targetLanguage
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        return {
          success: true,
          translatedText: result.data.translated_text
        };
      } else {
        throw new Error(result.data?.error || 'Translation failed');
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      return {
        success: false,
        translatedText: text,
        error: error.message
      };
    }
  }

  getRecordingDuration(): number {
    return this.isRecording ? Date.now() - this.recordingStartTime : 0;
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  getTargetLanguage(): string {
    return this.targetLanguage;
  }

  /**
   * Debug method to test backend connectivity
   */
  async testBackendConnectivity(): Promise<{
    backendUrl: string;
    isConnected: boolean;
    healthStatus?: any;
    speechStatus?: any;
    error?: string;
  }> {
    try {
      const backendUrl = await this.getBackendUrl();
      console.log(`🔍 Testing backend connectivity: ${backendUrl}`);

      // Test health endpoint
      const healthController = createTimeoutController(10000);
      const healthResponse = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: healthController.signal,
      });

      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
      }

      const healthData = await healthResponse.json();
      
      // Test speech endpoint
      const speechController = createTimeoutController(10000);
      const speechResponse = await fetch(`${backendUrl}/api/speech/languages`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: speechController.signal,
      });

      if (!speechResponse.ok) {
        throw new Error(`Speech endpoint failed: ${speechResponse.status} ${speechResponse.statusText}`);
      }

      const speechData = await speechResponse.json();

      console.log('✅ Backend connectivity test passed');
      return {
        backendUrl,
        isConnected: true,
        healthStatus: healthData,
        speechStatus: speechData,
      };

    } catch (error: any) {
      console.error('❌ Backend connectivity test failed:', error);
      return {
        backendUrl: BACKEND_BASE_URL || 'unknown',
        isConnected: false,
        error: error.message,
      };
    }
  }
}

export const realTimeSarvamSpeechService = new RealTimeSarvamSpeechService();
export default realTimeSarvamSpeechService;