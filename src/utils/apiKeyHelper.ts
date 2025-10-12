/**
 * API Key Configuration Helper
 * Provides utilities to validate and help configure API keys
 */

export interface APIKeyValidation {
  isValid: boolean;
  message: string;
  suggestions?: string[];
}

/**
 * Validates Google Gemini API key format
 */
export function validateGeminiAPIKey(apiKey: string): APIKeyValidation {
  if (!apiKey || apiKey.trim() === '') {
    return {
      isValid: false,
      message: 'API key is empty or missing',
      suggestions: [
        'Get an API key from https://aistudio.google.com/app/apikey',
        'Add it to your .env file as EXPO_PUBLIC_GEMINI_API_KEY',
        'Restart your development server after adding the key'
      ]
    };
  }

  if (apiKey === 'your_gemini_api_key_here') {
    return {
      isValid: false,
      message: 'Please replace the placeholder API key with your actual key',
      suggestions: [
        'Get an API key from https://aistudio.google.com/app/apikey',
        'Replace "your_gemini_api_key_here" in your .env file',
        'The key should start with "AIza" and be about 39 characters long'
      ]
    };
  }

  if (!apiKey.startsWith('AIza')) {
    return {
      isValid: false,
      message: 'Gemini API key should start with "AIza"',
      suggestions: [
        'Check that you copied the correct API key',
        'Get a new key from https://aistudio.google.com/app/apikey',
        'Make sure you\'re using the Gemini API key, not other Google API keys'
      ]
    };
  }

  if (apiKey.length < 35 || apiKey.length > 45) {
    return {
      isValid: false,
      message: `API key length (${apiKey.length}) seems incorrect. Expected 39 characters.`,
      suggestions: [
        'Check that you copied the complete API key',
        'The key should be about 39 characters long',
        'Get a new key from https://aistudio.google.com/app/apikey if needed'
      ]
    };
  }

  return {
    isValid: true,
    message: 'API key format looks correct'
  };
}

/**
 * Gets instructions for setting up Gemini API
 */
export function getGeminiSetupInstructions(): string[] {
  return [
    '🔑 How to get a Gemini API Key:',
    '',
    '1. Visit https://aistudio.google.com/app/apikey',
    '2. Sign in with your Google account',
    '3. Click "Create API Key"',
    '4. Copy the generated key (starts with "AIza")',
    '5. Add it to your .env file:',
    '   EXPO_PUBLIC_GEMINI_API_KEY=your_copied_key_here',
    '6. Restart your development server',
    '',
    '💡 Note: The API key should be about 39 characters long',
    '💡 Make sure to enable the Generative AI API in Google Cloud Console',
    '💡 Free tier includes 15 requests per minute with generous limits'
  ];
}

/**
 * Displays API key setup instructions in console
 */
export function logGeminiSetupInstructions(): void {
  const instructions = getGeminiSetupInstructions();
  console.log('\n' + instructions.join('\n') + '\n');
}