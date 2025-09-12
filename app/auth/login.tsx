import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated, Dimensions, KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from "react-native";
import AuthService from "../../src/services/authService";

const { width } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();
  }, []);

  const validate = () => {
    let e = "";
    let p = "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) e = "Enter a valid email address";
    if (password.length < 6) p = "Password must be at least 6 characters";
    if (password && !/[A-Z]/.test(password)) p = "Password must contain at least 1 uppercase letter";
    if (password && !/[0-9]/.test(password)) p = "Password must contain at least 1 number";
    setErrors({ email: e, password: p });
    return !e && !p;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await AuthService.signIn(email.trim(), password);
      await SecureStore.setItemAsync("biometricEmail", email);
      await SecureStore.setItemAsync("biometricPassword", password);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot password function
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address first.");
      return;
    }
    
    try {
      await AuthService.resetPassword(email.trim());
      Alert.alert(
        "Password Reset", 
        "Password reset email sent! Check your inbox and follow the instructions to reset your password."
      );
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleBiometricLogin = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return Alert.alert("Not supported", "Biometric login not supported on this device");
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return Alert.alert("No biometrics", "No FaceID/Fingerprint set up");

    const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Login with biometrics" });
    if (result.success) {
      const savedEmail = await SecureStore.getItemAsync("biometricEmail");
      const savedPass = await SecureStore.getItemAsync("biometricPassword");
      if (savedEmail && savedPass) {
        try {
          await AuthService.signIn(savedEmail, savedPass);
          router.replace("/(tabs)");
        } catch {
          Alert.alert("Error", "Stored credentials invalid. Please login manually.");
        }
      } else {
        Alert.alert("No saved credentials", "Login once manually to enable biometric login.");
      }
    }
  };

  // Button animation
  const animatePress = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => callback());
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>Welcome to Finze</Text>
          <Text style={styles.subtitle}>Sign in to manage your finances</Text>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password ? styles.inputError : null]}
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
          </View>

          {/* Login Button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity style={styles.button} onPress={() => animatePress(handleLogin)} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>
          </Animated.View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Biometric Login */}
          <TouchableOpacity style={[styles.button, { backgroundColor: "#0f172a" }]} onPress={handleBiometricLogin}>
            <Text style={styles.buttonText}>Login with FaceID / Fingerprint</Text>
          </TouchableOpacity>

          {/* Signup Redirect */}
          <View style={styles.bottomRow}>
            <Text style={styles.small}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/auth/signup")}>
              <Text style={[styles.small, styles.link]}> Sign up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: "#fff", borderRadius: 24, padding: 32, maxWidth: 520,
    alignSelf: "center", width: "100%", shadowColor: "#000", shadowOpacity: 0.08,
    shadowRadius: 20, elevation: 12, borderWidth: 1, borderColor: "#f1f5f9",
  },
  title: { fontSize: 32, fontWeight: "800", color: "#1e293b", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#64748b", textAlign: "center", marginBottom: 32 },
  field: { marginBottom: 20 },
  label: { fontSize: 15, color: "#374151", marginBottom: 8, fontWeight: "600" },
  input: {
    borderWidth: 2, borderColor: "#e2e8f0", borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 20, fontSize: 16, color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  inputError: { borderColor: "#ef4444", backgroundColor: "#fef2f2" },
  error: { color: "#ef4444", fontSize: 13, marginTop: 8, fontWeight: "500" },
  button: {
    backgroundColor: "#3b82f6", borderRadius: 16, paddingVertical: 18,
    alignItems: "center", marginTop: 8, shadowColor: "#3b82f6", shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  forgotPassword: { alignItems: "center", marginTop: 20 },
  forgotPasswordText: { color: "#3b82f6", fontSize: 15, fontWeight: "600" },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  small: { color: "#64748b", fontSize: 15 },
  link: { color: "#3b82f6", fontWeight: "700" },
});
