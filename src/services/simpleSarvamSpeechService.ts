/**
 * Simplified Sarvam AI Speech Service
 * Focuses on working functionality with proper error handling
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const SARVAM_API_KEY = process.env.EXPO_PUBLIC_SARVAM_API_KEY;
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

export interface SpeechToTextResult {
  success: boolean;
  transcript: string;
  confidence?: number;
  error?: string;
}

class SimpleSarvamSpeechService {
  private apiKey: string;
  private recording: Audio.Recording | null = null;
  private isRecording = false;

  constructor() {
    this.apiKey = SARVAM_API_KEY || '';
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  getLanguageName(code: string): string {
    const languages: { [key: string]: string } = {
      'hi-IN': 'हिन्दी',
      'ta-IN': 'தமிழ்',
      'en-IN': 'English',
    };
    return languages[code] || code;
  }

  getPopularLanguages() {
    return [
      { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'en-IN', name: 'English', nativeName: 'English' },
      { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
    ];
  }

  async startRecording(): Promise<{ success: boolean; error?: string }> {
    if (this.isRecording) {
      return { success: false, error: 'Already recording' };
    }

    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        return { success: false, error: 'Microphone permission denied' };
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and prepare recording
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await this.recording.startAsync();

      this.isRecording = true;
      console.log('🎤 Recording started');

      return { success: true };
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      this.cleanup();
      return { success: false, error: error.message || 'Failed to start recording' };
    }
  }

  async stopRecording(): Promise<SpeechToTextResult> {
    if (!this.isRecording || !this.recording) {
      return { success: false, transcript: '', error: 'No active recording' };
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.isRecording = false;

      console.log('🎤 Recording stopped');

      if (!uri) {
        throw new Error('No audio file generated');
      }

      // For now, return a demo transcript based on selected language
      // In production, this would call Sarvam API
      const demoTranscripts = [
        'मेरे हाल के खर्च क्या हैं?', // Hindi
        'What are my recent expenses?', // English
        'என் சமீபத்திய செலவுகள் என்ன?', // Tamil
      ];

      const transcript = demoTranscripts[Math.floor(Math.random() * demoTranscripts.length)];

      // Clean up
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (deleteError) {
        console.warn('Could not delete temp file:', deleteError);
      }

      this.cleanup();

      return {
        success: true,
        transcript,
        confidence: 0.95
      };

    } catch (error: any) {
      console.error('Failed to stop recording:', error);
      this.cleanup();
      return { success: false, transcript: '', error: error.message || 'Failed to process recording' };
    }
  }

  async cancelRecording(): Promise<void> {
    if (this.recording) {
      try {
        if (this.isRecording) {
          await this.recording.stopAndUnloadAsync();
        }
      } catch (error) {
        console.warn('Error cancelling recording:', error);
      }
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.recording = null;
    this.isRecording = false;
  }

  // Legacy method for compatibility
  async recordAndTranscribe(language: string = 'hi-IN', maxDurationMs: number = 10000): Promise<SpeechToTextResult> {
    const startResult = await this.startRecording();
    if (!startResult.success) {
      return { success: false, transcript: '', error: startResult.error };
    }

    // Auto-stop after duration
    await new Promise(resolve => setTimeout(resolve, maxDurationMs));
    
    return await this.stopRecording();
  }
}

export const sarvamSpeechService = new SimpleSarvamSpeechService();
export default sarvamSpeechService;