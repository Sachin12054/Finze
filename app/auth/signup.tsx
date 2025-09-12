// app/auth/signup.tsx
import { useRouter } from "expo-router"
import React, { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated"
import AuthService from "../../src/services/authService"

export default function Signup() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // validators
  const validateName = (v: string) => {
    if (!v || v.trim().length === 0) return "Name is required"
    if (v.trim().length < 2) return "Name is too short"
    return ""
  }
  const validateEmail = (v: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!v) return "Email is required"
    if (!regex.test(v)) return "Enter a valid email"
    return ""
  }
  const validatePassword = (v: string) => {
    if (!v) return "Password is required"
    if (v.length < 6) return "Password must be at least 6 characters"
    if (!/[a-z]/.test(v)) return "Include at least one lowercase letter"
    if (!/[A-Z]/.test(v)) return "Include at least one uppercase letter"
    if (!/\d/.test(v)) return "Include at least one number"
    return ""
  }
  const validateConfirm = (v: string) => {
    if (!v) return "Please confirm password"
    if (v !== password) return "Passwords do not match"
    return ""
  }

  const handleInput = (field: string, value: string) => {
    if (field === "name") {
      setName(value)
      setErrors(prev => ({ ...prev, name: validateName(value) }))
    }
    if (field === "email") {
      setEmail(value)
      setErrors(prev => ({ ...prev, email: validateEmail(value) }))
    }
    if (field === "password") {
      setPassword(value)
      setErrors(prev => ({ ...prev, password: validatePassword(value) }))
      // update confirm error if needed
      if (confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: validateConfirm(confirmPassword) }))
    }
    if (field === "confirmPassword") {
      setConfirmPassword(value)
      setErrors(prev => ({ ...prev, confirmPassword: validateConfirm(value) }))
    }
  }

  const signup = async () => {
    // run validations
    const nameErr = validateName(name)
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password)
    const confirmErr = validateConfirm(confirmPassword)

    if (nameErr || emailErr || passErr || confirmErr) {
      setErrors({ name: nameErr, email: emailErr, password: passErr, confirmPassword: confirmErr })
      return
    }

    setLoading(true)
    try {
      // Use AuthService for signup and profile creation
      await AuthService.signUp(email.trim(), password, name.trim())
      
      // success - navigate to home
      router.replace("/(tabs)")
    } catch (err: any) {
      Alert.alert("Signup Error", err?.message ?? "Unable to sign up")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.card}>
          <Animated.Text entering={FadeInUp.duration(500)} style={styles.title}>Create Account</Animated.Text>
          <Text style={styles.subtitle}>Join Finze to start managing your finances</Text>

          {/* Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="John Doe"
              value={name}
              onChangeText={v => handleInput("name", v)}
              autoCapitalize="words"
            />
            {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={v => handleInput("email", v)}
            />
            {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password ? styles.inputError : null]}
              placeholder="Create a strong password"
              secureTextEntry
              value={password}
              onChangeText={v => handleInput("password", v)}
            />
            {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
          </View>

          {/* Confirm */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
              placeholder="Re-enter password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={v => handleInput("confirmPassword", v)}
            />
            {errors.confirmPassword ? <Text style={styles.error}>{errors.confirmPassword}</Text> : null}
          </View>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={signup} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.linkRow}>
            <Text style={styles.small}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: { 
    backgroundColor: "#fff", borderRadius: 24, padding: 32, maxWidth: 520,
    alignSelf: "center", width: "100%", shadowColor: "#000", shadowOpacity: 0.08,
    shadowRadius: 20, elevation: 12, borderWidth: 1, borderColor: "#f1f5f9",
  },
  title: { fontSize: 30, fontWeight: "800", textAlign: "center", color: "#1e293b", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#64748b", textAlign: "center", marginBottom: 28 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 15, color: "#374151", marginBottom: 8, fontWeight: "600" },
  input: { 
    borderWidth: 2, borderColor: "#e2e8f0", borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 20, fontSize: 16, color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  inputError: { borderColor: "#ef4444", backgroundColor: "#fef2f2" },
  error: { color: "#ef4444", fontSize: 13, marginTop: 8, fontWeight: "500" },
  button: { 
    backgroundColor: "#3b82f6", paddingVertical: 18, borderRadius: 16, alignItems: "center", marginTop: 8,
    shadowColor: "#3b82f6", shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  buttonDisabled: { backgroundColor: "#9ca3af" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 17 },
  linkRow: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  small: { color: "#64748b", fontSize: 15 },
  link: { color: "#3b82f6", fontWeight: "700" },
})
