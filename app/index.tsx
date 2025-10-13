import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import '../src/utils/consoleSuppressions'; // Suppress warnings early

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User is logged in, redirect to tabs
        console.log('User authenticated, navigating to tabs');
        router.replace('/(tabs)');
      } else {
        // User is not logged in, redirect to loading screen
        console.log('User not authenticated, navigating to auth');
        router.replace('/auth/loading' as any);
      }
    }
  }, [user, isLoading, router]);

  // Show loading spinner while checking auth state
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#0f172a' 
    }}>
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );
}