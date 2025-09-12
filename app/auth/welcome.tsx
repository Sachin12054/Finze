import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import ExpoGoSocialAuthService from '../../src/services/expoGoSocialAuthService';
import SocialAuthService from '../../src/services/socialAuthService';

const { width, height } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [isExpoGo, setIsExpoGo] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const googleButtonScale = useRef(new Animated.Value(1)).current;
  const emailButtonScale = useRef(new Animated.Value(1)).current;
  const loginButtonScale = useRef(new Animated.Value(1)).current;
  const themeToggleScale = useRef(new Animated.Value(1)).current;
  const themeToggleRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if running in Expo Go
    const expoGoMode = Constants.appOwnership === 'expo';
    setIsExpoGo(expoGoMode);
    
    // Configure social auth services
    if (expoGoMode) {
      ExpoGoSocialAuthService.configureGoogleSignIn();
    } else {
      SocialAuthService.configureGoogleSignIn();
    }
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animatePress = (buttonScale: Animated.Value, callback: () => void) => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  const animateThemeToggle = () => {
    // Scale and rotate animation for theme toggle
    Animated.parallel([
      Animated.sequence([
        Animated.timing(themeToggleScale, {
          toValue: 0.85,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(themeToggleScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(themeToggleRotate, {
        toValue: isDarkTheme ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    toggleTheme();
  };

  const handleGoogleAuth = async () => {
    setLoading('google');
    
    try {
      const authService = isExpoGo ? ExpoGoSocialAuthService : SocialAuthService;
      
      // Check if Google Play Services is available
      const isGoogleAvailable = await authService.isGooglePlayServicesAvailable();
      if (!isGoogleAvailable && !isExpoGo) {
        Alert.alert('Not Available', 'Google Play Services is not available on this device');
        return;
      }
      
      const result = await authService.signInWithGoogle();
      
      // Navigate to home screen on success
      router.replace('/(tabs)' as any);
      
    } catch (error: any) {
      if (error.message === 'EXPO_GO_LIMITATION') {
        // User chose to use email instead
        router.push('/auth/signup' as any);
        return;
      }
      
      Alert.alert(
        'Authentication Failed',
        error.message || 'Failed to sign in with Google'
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDarkTheme && styles.containerDark]}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={isDarkTheme ? "#0f172a" : "#ffffff"} />
      
      {/* Theme Toggle Button */}
      <Animated.View style={{
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 1000,
        transform: [
          { scale: themeToggleScale },
          { 
            rotate: themeToggleRotate.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            })
          }
        ]
      }}>
        <TouchableOpacity
          style={[styles.themeToggle, isDarkTheme && styles.themeToggleDark]}
          onPress={animateThemeToggle}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isDarkTheme ? "sunny" : "moon"} 
            size={24} 
            color={isDarkTheme ? "#fbbf24" : "#6b7280"} 
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="wallet" size={36} color="#ffffff" />
            </View>
          </View>
          
          <Text style={[styles.welcomeTitle, isDarkTheme && styles.welcomeTitleDark]}>Welcome to Finze! 👋</Text>
          <Text style={[styles.welcomeSubtitle, isDarkTheme && styles.welcomeSubtitleDark]}>
            Smart expense tracking to help you achieve your financial goals.
          </Text>
        </View>

        {/* Authentication Buttons */}
        <View style={styles.authContainer}>
          {/* Google Sign In */}
          <Animated.View style={{ transform: [{ scale: googleButtonScale }] }}>
            <TouchableOpacity
              style={[styles.authButton, styles.googleButton, isDarkTheme && styles.googleButtonDark]}
              onPress={() => animatePress(googleButtonScale, () => handleGoogleAuth())}
              disabled={loading === 'google'}
              activeOpacity={0.8}
            >
              {loading === 'google' ? (
                <View style={styles.buttonContent}>
                  <View style={styles.loadingSpinner} />
                  <Text style={[styles.authButtonText, styles.googleButtonText, isDarkTheme && styles.googleButtonTextDark]}>
                    Signing in...
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="logo-google" size={24} color="#EA4335" />
                  <Text style={[styles.authButtonText, styles.googleButtonText, isDarkTheme && styles.googleButtonTextDark]}>
                    Sign Up with Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Email Sign Up */}
          <Animated.View style={{ transform: [{ scale: emailButtonScale }] }}>
            <TouchableOpacity
              style={[styles.authButton, styles.emailButton, isDarkTheme && styles.emailButtonDark]}
              onPress={() => animatePress(emailButtonScale, () => router.push('/auth/signup' as any))}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="mail-outline" size={24} color="#ffffff" />
                <Text style={[styles.authButtonText, styles.emailButtonText]}>
                  Sign Up with Email
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, isDarkTheme && styles.dividerLineDark]} />
            <Text style={[styles.dividerText, isDarkTheme && styles.dividerTextDark]}>or</Text>
            <View style={[styles.dividerLine, isDarkTheme && styles.dividerLineDark]} />
          </View>

          {/* Login Button */}
          <Animated.View style={{ transform: [{ scale: loginButtonScale }] }}>
            <TouchableOpacity
              style={[styles.loginButton, isDarkTheme && styles.loginButtonDark]}
              onPress={() => animatePress(loginButtonScale, () => router.push('/auth/login' as any))}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Log in to my Account</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Terms and Privacy */}
        <View style={styles.footer}>
          <Text style={[styles.termsText, isDarkTheme && styles.termsTextDark]}>
            By continuing, you agree to our{'                  '}
            <Text style={[styles.linkText, isDarkTheme && styles.linkTextDark]}>Terms of Service</Text> and{' '}
            <Text style={[styles.linkText, isDarkTheme && styles.linkTextDark]}>Privacy Policy</Text>
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  themeToggle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  themeToggleDark: {
    backgroundColor: '#1e293b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 110,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: -20,
    lineHeight: 36,
  },
  welcomeTitleDark: {
    color: '#ffffff',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    fontWeight: '400',
  },
  welcomeSubtitleDark: {
    color: '#94a3b8',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 56,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonText: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000000',
  },
  googleButtonDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  googleButtonText: {
    color: '#1a1a1a',
  },
  googleButtonTextDark: {
    color: '#ffffff',
  },
  emailButton: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
  },
  emailButtonDark: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  emailButtonText: {
    color: '#ffffff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerLineDark: {
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#999999',
    fontSize: 14,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  dividerTextDark: {
    color: '#64748b',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 56,
  },
  loginButtonDark: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
  },
  termsText: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  termsTextDark: {
    color: '#64748b',
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  linkTextDark: {
    color: '#10b981',
  },
  loadingSpinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderTopColor: '#007AFF',
    marginRight: 12,
  },
});