import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../src/services/firebase';
import '../src/utils/consoleSuppressions'; // Suppress warnings early

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
      
      if (user) {
        // User is logged in, redirect to tabs
        router.replace('/(tabs)');
      } else {
        // User is not logged in, redirect to loading screen
        router.replace('/auth/loading' as any);
      }
    });

    return () => unsubscribe();
  }, [router]);

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