import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from '../../src/contexts/ThemeContext';
import AuthService from "../../src/services/authService";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const themeToggleScale = useRef(new Animated.Value(1)).current;
  const themeToggleRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkBiometricAvailability();
    
    Animated.parallel([
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 1000, 
        useNativeDriver: true 
      }),
      Animated.timing(slideAnim, { 
        toValue: 0, 
        duration: 1000, 
        useNativeDriver: true 
      })
    ]).start();
  }, []);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const savedEmail = await SecureStore.getItemAsync("biometricEmail");
    setIsBiometricAvailable(compatible && enrolled && !!savedEmail);
  };

  const validate = () => {
    let emailError = "";
    let passwordError = "";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      emailError = "Email is required";
    } else if (!emailRegex.test(email.trim())) {
      emailError = "Please enter a valid email address";
    }
    
    if (!password) {
      passwordError = "Password is required";
    } else if (password.length < 6) {
      passwordError = "Password must be at least 6 characters";
    }
    
    setErrors({ email: emailError, password: passwordError });
    
    if (emailError || passwordError) {
      // Shake animation for validation errors
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true })
      ]).start();
      return false;
    }
    
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      await AuthService.signIn(email.trim(), password);
      await SecureStore.setItemAsync("biometricEmail", email.trim());
      await SecureStore.setItemAsync("biometricPassword", password);
      
      // Success animation
      Animated.timing(buttonScale, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true
      }).start(() => {
        router.replace("/(tabs)");
      });
      
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Please check your credentials and try again");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    router.push('/auth/forgot-password' as any);
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in with biometrics",
        cancelLabel: "Cancel",
        fallbackLabel: "Use Password"
      });
      
      if (result.success) {
        const savedEmail = await SecureStore.getItemAsync("biometricEmail");
        const savedPass = await SecureStore.getItemAsync("biometricPassword");
        
        if (savedEmail && savedPass) {
          try {
            await AuthService.signIn(savedEmail, savedPass);
            router.replace("/(tabs)");
          } catch {
            Alert.alert("Authentication Error", "Stored credentials are invalid. Please login manually.");
          }
        } else {
          Alert.alert("No Saved Credentials", "Please login manually first to enable biometric authentication.");
        }
      }
    } catch (error) {
      Alert.alert("Biometric Error", "Failed to authenticate with biometrics");
    }
  };

  const animatePress = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(buttonScale, { 
        toValue: 0.95, 
        duration: 100, 
        useNativeDriver: true 
      }),
      Animated.timing(buttonScale, { 
        toValue: 1, 
        duration: 100, 
        useNativeDriver: true 
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

  return (
    <SafeAreaView style={[styles.container, isDarkTheme && styles.containerDark]}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={isDarkTheme ? "#0f172a" : "#f8fafc"} />
      
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
            size={20} 
            color={isDarkTheme ? "#fbbf24" : "#6b7280"} 
          />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Background Gradient */}
      <LinearGradient
        colors={isDarkTheme ? ['#0f172a', '#1e293b', '#334155'] : ['#f8fafc', '#ffffff', '#f1f5f9']}
        style={styles.backgroundGradient}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.contentContainer}>
          <Animated.View 
            style={[
              styles.formContainer, 
              { 
                opacity: fadeAnim, 
                transform: [
                  { translateY: slideAnim },
                  { translateX: shakeAnim }
                ] 
              }
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Ionicons name="wallet" size={28} color="#ffffff" />
                </View>
              </View>
              
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={errors.email ? "#EF4444" : "#9CA3AF"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                    }}
                  />
                </View>
                {errors.email && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.email}</Text>
                  </View>
                )}
              </View>

              {/* Password Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={errors.password ? "#EF4444" : "#9CA3AF"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                    }}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.password}</Text>
                  </View>
                )}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity 
                style={styles.forgotPasswordContainer} 
                onPress={handleForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity 
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
                  onPress={() => animatePress(handleLogin)} 
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.loadingText}>Signing In...</Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Biometric Login */}
              {isBiometricAvailable && (
                <View style={styles.biometricContainer}>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.biometricButton} 
                    onPress={handleBiometricLogin}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="finger-print" size={24} color="#007AFF" />
                    <Text style={styles.biometricButtonText}>Sign in with Biometrics</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity 
                  onPress={() => router.push("/auth/signup")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  themeToggle: {
    top: 27,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  themeToggleDark: {
    backgroundColor: '#1e293b',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    maxWidth: 380,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "400",
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    marginLeft: 4,
    fontWeight: "500",
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 48,
  },
  loginButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  biometricContainer: {
    marginTop: 20,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    color: "#9CA3AF",
    fontSize: 13,
    paddingHorizontal: 12,
    fontWeight: "500",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  biometricButtonText: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  bottomSection: {
    alignItems: "center",
    marginTop: 16,
  },
  signupContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  signupText: {
    fontSize: 14,
    color: "#6B7280",
  },
  signupLink: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
});