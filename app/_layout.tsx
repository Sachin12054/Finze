import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-get-random-values';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { ThemeProvider as CustomThemeProvider } from '../src/contexts/ThemeContext';
import { setupGlobalAsyncErrorHandling } from '../src/utils/asyncErrorHandler';
import '../src/utils/consoleSuppressions'; // Import warning suppressions

import { useColorScheme } from '@/hooks/useColorScheme';

// Loading component
function LoadingScreen() {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#ffffff' 
    }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ 
        marginTop: 16, 
        fontSize: 16, 
        color: '#666666',
        fontWeight: '500'
      }}>
        Loading Finze...
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize global error handling
    setupGlobalAsyncErrorHandling();
  }, []);

  useEffect(() => {
    if (loaded) {
      // Small delay to ensure everything is properly initialized
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  // Always wrap in CustomThemeProvider, even during loading
  if (!loaded || !isReady) {
    return (
      <CustomThemeProvider>
        <LoadingScreen />
      </CustomThemeProvider>
    );
  }

  return (
    <CustomThemeProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/loading" options={{ headerShown: false }} />
          <Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
          <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="auth/verification" options={{ headerShown: false }} />
          <Stack.Screen name="auth/new-password" options={{ headerShown: false }} />
          <Stack.Screen name="Profile" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
        <Toast />
      </ThemeProvider>
    </CustomThemeProvider>
  );
}
