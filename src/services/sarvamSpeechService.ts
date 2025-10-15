/**
 * Sarvam AI Speech-to-Text Service
 * Provides advanced speech recognition with excellent Indian language support
 * Supports Hindi, Tamil, English and other Indian languages
 */

import axios from 'axios';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const SARVAM_API_KEY = process.env.EXPO_PUBLIC_SARVAM_API_KEY;
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

export interface SpeechToTextOptions {
  language?: string;
  model?: string;
  prompt?: string;
}

export interface SpeechToTextResult {
  success: boolean;
  transcript: string;
  confidence?: number;
  error?: string;
}

class SarvamSpeechService {
  private apiKey: string;
  private currentRecording: Audio.Recording | null = null;
  private isRecordingInProgress = false;

  constructor() {
    this.apiKey = SARVAM_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ Sarvam API key not found. Speech-to-text will use fallback mode.');
    }
  }

  /**
   * Record audio and convert to text using Sarvam AI
   * Supports Hindi, Tamil, English and other Indian languages
   */
  async recordAndTranscribe(
    language: string = 'hi-IN',
    maxDurationMs: number = 10000
  ): Promise<SpeechToTextResult> {
    if (!this.apiKey) {
      return {
        success: false,
        transcript: '',
        error: 'Sarvam API key not configured'
      };
    }

    // Prevent multiple recording sessions
    if (this.isRecordingInProgress) {
      return {
        success: false,
        transcript: '',
        error: 'Recording already in progress'
      };
    }

    this.isRecordingInProgress = true;
    
    try {
      console.log(`🎤 Starting audio recording for language: ${language}...`);

      // Clean up any existing recording first
      await this.cleanupRecording();

      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        return {
          success: false,
          transcript: '',
          error: 'Microphone permission not granted'
        };
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      this.currentRecording = new Audio.Recording();
      await this.currentRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

      await this.currentRecording.startAsync();
      console.log('🔴 Recording started...');

      // Wait for recording to complete
      await new Promise(resolve => setTimeout(resolve, maxDurationMs));
      
      if (this.currentRecording) {
        await this.currentRecording.stopAndUnloadAsync();
        console.log('⏹️ Recording stopped');

        const audioUri = this.currentRecording.getURI();
        if (!audioUri) {
          throw new Error('Failed to get audio recording URI');
        }

        // Convert audio to base64 for Sarvam API
        const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Call Sarvam API for transcription
        const response = await this.callSarvamSTT(base64Audio, language);

        // Clean up temporary file
        try {
          await FileSystem.deleteAsync(audioUri, { idempotent: true });
        } catch (deleteError) {
          console.warn('Could not delete temporary audio file:', deleteError);
        }

        return response;
      } else {
        throw new Error('Recording was cancelled');
      }

    } catch (error: any) {
      console.error('❌ Recording and transcription error:', error);
      return {
        success: false,
        transcript: '',
        error: error.message || 'Recording failed'
      };
    } finally {
      await this.cleanupRecording();
      this.isRecordingInProgress = false;
    }
  }

  /**
   * Clean up current recording safely
   */
  private async cleanupRecording(): Promise<void> {
    if (this.currentRecording) {
      try {
        const status = await this.currentRecording.getStatusAsync();
        if (status.isRecording) {
          await this.currentRecording.stopAndUnloadAsync();
        } else if (status.canRecord) {
          // Recording is prepared but not started, just unload
          this.currentRecording = null;
        }
      } catch (error) {
        console.warn('Error during recording cleanup:', error);
      } finally {
        this.currentRecording = null;
      }
    }
  }

  /**
   * Stop current recording manually
   */
  async stopRecording(): Promise<void> {
    if (this.currentRecording && this.isRecordingInProgress) {
      try {
        const status = await this.currentRecording.getStatusAsync();
        if (status.isRecording) {
          await this.currentRecording.stopAndUnloadAsync();
          console.log('⏹️ Recording stopped manually');
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      } finally {
        this.isRecordingInProgress = false;
      }
    }
  }

  /**
   * Call Sarvam API for speech-to-text conversion
   */
  private async callSarvamSTT(base64Audio: string, language: string): Promise<SpeechToTextResult> {
    try {
      const payload = {
        model: 'sarvam-2B',
        audio_base64: base64Audio,
        language_code: language,
      };

      const response = await axios.post(
        `${SARVAM_BASE_URL}/speech-to-text`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log('✅ Sarvam STT successful');

      return {
        success: true,
        transcript: response.data.transcript || '',
        confidence: response.data.confidence,
      };

    } catch (error: any) {
      console.error('❌ Sarvam API error:', error);

      let errorMessage = 'Speech recognition failed';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          errorMessage = 'Invalid Sarvam API key';
        } else if (status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later';
        } else if (status === 400) {
          errorMessage = data?.message || 'Invalid audio format or parameters';
        } else {
          errorMessage = data?.message || `API Error: ${status}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error - please check your connection';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }

      return {
        success: false,
        transcript: '',
        error: errorMessage
      };
    }
  }

  /**
   * Convert audio file to text using Sarvam AI
   */
  async transcribeAudio(
    audioUri: string, 
    options: SpeechToTextOptions = {}
  ): Promise<SpeechToTextResult> {
    if (!this.apiKey) {
      return {
        success: false,
        transcript: '',
        error: 'Sarvam API key not configured'
      };
    }

    try {
      console.log('🎤 Starting Sarvam speech-to-text transcription...');

      // Read the audio file as base64
      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: 'base64',
      });

      const language = options.language || 'hi-IN';
      const response = await this.callSarvamSTT(base64Audio, language);

      return response;

    } catch (error: any) {
      console.error('❌ Sarvam transcription error:', error);

      return {
        success: false,
        transcript: '',
        error: 'Speech recognition failed'
      };
    }
  }

  /**
   * Convert text to speech using Sarvam AI
   * Currently using expo-speech as fallback, can be enhanced later with Sarvam TTS
   */
  async textToSpeech(
    text: string,
    options: {
      language?: string;
      speaker?: string;
      speed?: number;
      pitch?: number;
    } = {}
  ): Promise<{ success: boolean; audioUri?: string; error?: string }> {
    console.log('🔊 Sarvam TTS service available, using expo-speech for now...');
    
    // For now, we'll use expo-speech which is already integrated in ChatBot
    // This can be enhanced later to use Sarvam's TTS API
    return {
      success: true,
      audioUri: undefined, // expo-speech handles playback directly
    };
  }

  /**
   * Check if Sarvam service is available
   */
  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Get supported languages with display names
   */
  getSupportedLanguages(): { code: string; name: string; nativeName: string }[] {
    return [
      { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'en-IN', name: 'English (India)', nativeName: 'English' },
      { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
      { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
      { code: 'ur-IN', name: 'Urdu', nativeName: 'اردو' },
    ];
  }

  /**
   * Get language display name
   */
  getLanguageName(code: string): string {
    const language = this.getSupportedLanguages().find(lang => lang.code === code);
    return language ? language.nativeName : code;
  }

  /**
   * Get popular languages for quick selection
   */
  getPopularLanguages(): { code: string; name: string; nativeName: string }[] {
    return [
      { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'en-IN', name: 'English', nativeName: 'English' },
      { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
    ];
  }
}

// Export singleton instance
export const sarvamSpeechService = new SarvamSpeechService();
export default sarvamSpeechService;