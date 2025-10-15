import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ProfileDialog } from "../src/components/ProfileDialog";
import { useAuth } from "../src/contexts/AuthContext";
import { useTheme } from "../src/contexts/ThemeContext";

export default function ProfileScreen() {
  const { user } = useAuth();
  const { isDarkTheme } = useTheme();
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={[styles.loadingText, isDarkTheme && styles.darkText]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkTheme && styles.darkContainer]}>
      <StatusBar 
        barStyle={isDarkTheme ? "light-content" : "dark-content"} 
        backgroundColor={isDarkTheme ? "#1a1a1a" : "#ffffff"} 
      />
      
      <LinearGradient
        colors={isDarkTheme ? ['#667eea', '#764ba2'] : ['#4facfe', '#00f2fe']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.name}>{user.displayName || user.email}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        <TouchableOpacity 
          style={[styles.settingsButton, isDarkTheme && styles.darkButton]}
          onPress={() => setShowProfileDialog(true)}
        >
          <Ionicons name="settings" size={24} color={isDarkTheme ? '#fff' : '#6366F1'} />
          <Text style={[styles.settingsText, isDarkTheme && styles.darkText]}>
            Profile Settings
          </Text>
          <Ionicons name="chevron-forward" size={20} color={isDarkTheme ? '#fff' : '#6366F1'} />
        </TouchableOpacity>

        <Text style={[styles.description, isDarkTheme && styles.darkText]}>
          Manage your profile information, security settings, and preferences.
        </Text>
      </View>

      <ProfileDialog
        visible={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
        user={{
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || undefined,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fc",
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkContainer: {
    backgroundColor: "#0f0f23",
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  avatarContainer: {
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#fff",
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#6366F1",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  email: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    marginTop: -24,
  },
  settingsButton: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(79, 172, 254, 0.08)",
  },
  darkButton: {
    backgroundColor: "#1e1e2e",
    borderColor: "rgba(79, 172, 254, 0.15)",
  },
  settingsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a2e",
    flex: 1,
    marginLeft: 16,
    letterSpacing: 0.2,
  },
  darkText: {
    color: "#f8f9fc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
