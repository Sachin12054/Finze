import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { deleteUser, signOut, updatePassword, updateProfile } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import Animated, {
  BounceIn,
  FadeInDown,
  FadeInUp,
  SlideInLeft,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring
} from "react-native-reanimated";
import { databaseService } from "../src/services/databaseService";
import { auth } from "../src/services/firebase";
import { deleteProfileImage, generatePlaceholderAvatar, UploadProgress } from "../src/services/imageUploadService";
import NotificationService from "../src/services/notificationService";

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(auth.currentUser?.email || "");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [profilePic, setProfilePic] = useState(
    generatePlaceholderAvatar(auth.currentUser?.uid || '', auth.currentUser?.displayName || '')
  );
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Animation values
  const profileScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const headerHeight = useSharedValue(0);

  const uid = auth.currentUser?.uid;

  // Animated styles
  const profileAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: profileScale.value }],
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  // Request permissions
  useEffect(() => {
    (async () => {
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const { status: notifStatus } = await NotificationService.requestPermissionsAsync();
      
      if (mediaStatus !== "granted") {
        Alert.alert("Permission Denied", "Please allow access to the photo library to change your profile picture.");
      }
    })();
  }, []);

  // Fetch profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      if (!uid) {
        console.log("No user signed in, redirecting to login");
        router.replace("/auth/login");
        return;
      }

      setIsLoading(true);
      console.log("Current user:", auth.currentUser?.email, auth.currentUser?.displayName);

      try {
        const userDoc = await databaseService.getUserById(uid);
        if (userDoc && userDoc.profile) {
          const data = userDoc.profile;
          setFullName(data.displayName || "");
          setDisplayName(data.displayName || auth.currentUser?.displayName || "User");
          setPhone(data.phone || "");
          setBio(""); // bio not in new schema
          setLocation(""); // location not in new schema
          setWebsite(""); // website not in new schema
          setDarkMode(data.preferences?.theme === 'dark' || false);
          setBiometricEnabled(false); // biometric not in new schema
          setNotificationsEnabled(data.preferences?.notifications || false);
          setPrivateAccount(false); // private account not in new schema
          if (data.avatar_url) setProfilePic(data.avatar_url);
        } else {
          console.log("No user document found, initializing with defaults");
          const defaultName = auth.currentUser?.displayName || "User";
          await databaseService.createUser({
            email: auth.currentUser?.email || "",
            displayName: defaultName,
            profile: {
              displayName: defaultName,
              avatar_url: profilePic,
              preferences: {
                theme: 'light',
                notifications: true
              }
            }
          });
          setDisplayName(defaultName);
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        
        // Handle specific permission errors with helpful messages
        if (error.message.includes('deploy Firestore rules')) {
          Alert.alert(
            "🔒 Setup Required", 
            "Database permissions need to be configured. Please run:\n\nfirebase deploy --only firestore:rules\n\nOr contact your developer.",
            [
              { text: "Continue Anyway", onPress: () => {
                // Set up default profile so app can continue
                const defaultName = auth.currentUser?.displayName || "User";
                setDisplayName(defaultName);
                setFullName(defaultName);
              }},
              { text: "OK" }
            ]
          );
        } else {
          Alert.alert("❌ Error", error.message || "Failed to fetch profile");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [uid, router, profilePic]);

  // Haptic feedback
  const hapticFeedback = () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([10]);
    }
  };

  // Animate profile picture on press
  const animateProfile = () => {
    hapticFeedback();
    profileScale.value = withSequence(
      withSpring(0.95),
      withSpring(1.05),
      withSpring(1)
    );
  };

  // Animate buttons
  const animateButton = (callback: () => void) => {
    hapticFeedback();
    buttonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    setTimeout(callback, 100);
  };

  // Save profile with animation
  const saveProfile = async () => {
    if (!uid) {
      Alert.alert("Error", "No user is signed in");
      return;
    }
    
    setIsLoading(true);
    try {
      await databaseService.updateUserProfile(uid, {
        displayName,
        phone,
        avatar_url: profilePic,
        preferences: {
          theme: darkMode ? 'dark' : 'light',
          notifications: notificationsEnabled,
          // other preferences can be preserved
        }
      });
      
      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName,
          photoURL: profilePic,
        });
      }
      
      Alert.alert("✅ Success", "Profile updated successfully!");
      setEditMode(false);
    } catch (error: any) {
      Alert.alert("❌ Error", error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Pick image with animation and Firebase upload
  const pickImage = async () => {
    animateProfile();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && uid) {
        await uploadImageToFirebase(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert("❌ Error", error.message || "Failed to pick image");
    }
  };

  // Take photo with Firebase upload
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && uid) {
        await uploadImageToFirebase(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert("❌ Error", error.message || "Failed to take photo");
    }
  };

  // Upload image to Firebase Storage
  const uploadImageToFirebase = async (imageUri: string) => {
    if (!uid) return;

    // Check authentication
    if (!auth.currentUser) {
      Alert.alert("❌ Error", "Please log in again to upload images.");
      return;
    }

    console.log('Current user:', auth.currentUser.uid);
    console.log('User authenticated:', !!auth.currentUser);

    // For now, let's use a simple approach and just save to Firestore
    // This is a temporary solution until Firebase Storage is properly configured
    Alert.alert(
      "⚠️ Storage Setup Required",
      "Firebase Storage needs to be configured. For now, your profile will use a generated avatar. Would you like to continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: async () => {
            try {
              // Generate a unique avatar based on user data
              const newAvatarUrl = generatePlaceholderAvatar(uid, displayName || fullName || auth.currentUser?.email || '');
              setProfilePic(newAvatarUrl);

              // Update Firestore
              await databaseService.updateUserProfile(uid, { avatar_url: newAvatarUrl });

              // Update Firebase Auth profile
              if (auth.currentUser) {
                await updateProfile(auth.currentUser, { photoURL: newAvatarUrl });
              }

              Alert.alert("✅ Avatar Updated", "Your profile avatar has been updated with a generated image.");
            } catch (error: any) {
              console.error('Error updating avatar:', error);
              Alert.alert("❌ Error", `Failed to update avatar: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  // Remove profile picture
  const removeProfilePicture = async () => {
    if (!uid) return;

    try {
      // Delete from Firebase Storage if it's a Firebase URL
      if (profilePic && profilePic.includes('firebase')) {
        await deleteProfileImage(profilePic);
      }

      // Set to placeholder
      const placeholderUrl = generatePlaceholderAvatar(uid, displayName || fullName);
      setProfilePic(placeholderUrl);

      // Update Firestore
      await databaseService.updateUserProfile(uid, { avatar_url: placeholderUrl });

      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: placeholderUrl });
      }

      Alert.alert("✅ Success", "Profile picture removed successfully!");
    } catch (error: any) {
      console.error('Error removing profile picture:', error);
      Alert.alert("❌ Error", "Failed to remove profile picture. Please try again.");
    }
  };

  // Profile picture options
  const showImageOptions = () => {
    const options: any[] = [
      { text: "📷 Camera", onPress: takePhoto },
      { text: "🖼️ Photo Library", onPress: pickImage },
    ];

    // Add remove option only if there's a custom profile picture
    if (profilePic && profilePic.includes('firebase')) {
      options.push({ text: "🗑️ Remove Photo", onPress: removeProfilePicture, style: "destructive" });
    }

    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert(
      "Profile Picture",
      "Choose an option",
      options
    );
  };

  // Change password with validation
  const changePassword = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "No user is signed in");
      return;
    }
    
    Alert.prompt(
      "Change Password",
      "Enter your new password (minimum 6 characters):",
      async (newPassword) => {
        if (!newPassword) return;
        if (newPassword.length < 6) {
          Alert.alert("Error", "Password must be at least 6 characters long");
          return;
        }
        try {
          await updatePassword(auth.currentUser!, newPassword);
          Alert.alert("✅ Success", "Password updated successfully");
        } catch (error: any) {
          Alert.alert("❌ Error", error.message || "Failed to update password");
        }
      },
      "secure-text"
    );
  };

  // Enable biometric authentication
  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware) {
        Alert.alert("Not Supported", "Biometric authentication is not available on this device");
        return;
      }
      
      if (!isEnrolled) {
        Alert.alert("No Biometrics", "Please set up biometric authentication in your device settings first");
        return;
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable biometric login",
        cancelLabel: "Cancel",
      });
      
      if (result.success) {
        setBiometricEnabled(true);
        Alert.alert("✅ Success", "Biometric login enabled");
      }
    } else {
      setBiometricEnabled(false);
    }
  };

  // Share profile
  const shareProfile = async () => {
    try {
      await Share.share({
        message: `Check out ${displayName}'s profile!`,
        title: "Share Profile",
      });
    } catch (error: any) {
      Alert.alert("Error", "Failed to share profile");
    }
  };

  // Export data
  const exportData = async () => {
    try {
      const userData = {
        fullName,
        displayName,
        email,
        phone,
        bio,
        location,
        website,
        darkMode,
        biometricEnabled,
        notificationsEnabled,
        privateAccount,
        exportDate: new Date().toISOString(),
      };
      
      await Share.share({
        message: `My Profile Data:\n${JSON.stringify(userData, null, 2)}`,
        title: "Export Profile Data",
      });
    } catch (error: any) {
      Alert.alert("Error", "Failed to export data");
    }
  };

  // Open website
  const openWebsite = async () => {
    if (!website) return;
    const url = website.startsWith('http') ? website : `https://${website}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Invalid website URL");
    }
  };

  // Delete account with confirmation
  const deleteAccount = async () => {
    if (!auth.currentUser || !uid) {
      Alert.alert("Error", "No user is signed in");
      return;
    }
    
    Alert.alert(
      "⚠️ Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "I'm Sure",
          style: "destructive",
          onPress: () => {
            Alert.prompt(
              "⚠️ Final Warning",
              "Type 'DELETE' to confirm account deletion:",
              (confirmation: string | undefined) => {
                if (confirmation === 'DELETE') {
                  performAccountDeletion();
                } else {
                  Alert.alert("Cancelled", "Account deletion cancelled");
                }
              }
            );
          },
        },
      ]
    );
  };

  const performAccountDeletion = async () => {
    try {
      // Delete user from our database (this will be handled by the new database service if needed)
      // await databaseService.deleteUser(uid!); // Can implement this later if needed
      await deleteUser(auth.currentUser!);
      Alert.alert("✅ Account Deleted", "Your account has been deleted successfully");
      router.replace("/auth/login");
    } catch (error: any) {
      Alert.alert("❌ Error", error.message || "Failed to delete account");
    }
  };

  // Logout with confirmation
  const logout = async () => {
    Alert.alert(
      "🚪 Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace("/auth/login");
            } catch (error: any) {
              Alert.alert("❌ Error", error.message || "Failed to sign out");
            }
          },
        },
      ]
    );
  };

  // Reset all settings
  const resetSettings = () => {
    Alert.alert(
      "🔄 Reset Settings",
      "Reset all settings to default values?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: () => {
            setDarkMode(false);
            setBiometricEnabled(false);
            setNotificationsEnabled(false);
            setPrivateAccount(false);
            Alert.alert("✅ Settings Reset", "All settings have been reset to default");
          },
        },
      ]
    );
  };

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar 
        barStyle={darkMode ? "light-content" : "dark-content"} 
        backgroundColor={darkMode ? "#1a1a1a" : "#ffffff"} 
      />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={darkMode ? ['#667eea', '#764ba2'] : ['#4facfe', '#00f2fe']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View entering={FadeInUp.duration(800)} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setEditMode(!editMode)} style={styles.headerAction}>
                <Ionicons 
                  name={editMode ? "checkmark" : "pencil"} 
                  size={24} 
                  color="#fff" 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={shareProfile} style={styles.headerAction}>
                <Ionicons name="share-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <Animated.View style={profileAnimatedStyle}>
            <TouchableOpacity 
              onPress={showImageOptions} 
              activeOpacity={0.8}
              disabled={isUploading}
            >
              <View style={styles.avatarContainer}>
                <Image source={{ uri: profilePic }} style={styles.avatar} />
                
                {/* Upload progress overlay */}
                {isUploading && (
                  <View style={styles.uploadOverlay}>
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressText}>
                        {uploadProgress?.message || 'Uploading...'}
                      </Text>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${uploadProgress?.progress || 0}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressPercent}>
                        {Math.round(uploadProgress?.progress || 0)}%
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* Camera overlay */}
                {!isUploading && (
                  <View style={styles.avatarOverlay}>
                    <Ionicons name="camera" size={20} color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={styles.name}>{displayName || fullName || "User"}</Text>
          <Text style={styles.email}>{email}</Text>
          {bio && <Text style={styles.bio}>{bio}</Text>}
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Personal Information Card */}
        <Animated.View entering={SlideInLeft.delay(200).duration(600)} style={[styles.card, darkMode && styles.darkCard]}>
          <View style={styles.cardHeader}>
            <FontAwesome5 name="user-edit" size={18} color={darkMode ? "#4facfe" : "#667eea"} />
            <Text style={[styles.section, darkMode && styles.darkText]}>Personal Information</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>Full Name</Text>
            <TextInput
              style={[styles.input, darkMode && styles.darkInput, !editMode && styles.inputDisabled]}
              placeholder="Enter your full name"
              placeholderTextColor={darkMode ? "#999" : "#666"}
              value={fullName}
              onChangeText={setFullName}
              editable={editMode}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>Display Name</Text>
            <TextInput
              style={[styles.input, darkMode && styles.darkInput, !editMode && styles.inputDisabled]}
              placeholder="How others see you"
              placeholderTextColor={darkMode ? "#999" : "#666"}
              value={displayName}
              onChangeText={setDisplayName}
              editable={editMode}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>Phone Number</Text>
            <TextInput
              style={[styles.input, darkMode && styles.darkInput, !editMode && styles.inputDisabled]}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor={darkMode ? "#999" : "#666"}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={editMode}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>Bio</Text>
            <TextInput
              style={[styles.textArea, darkMode && styles.darkInput, !editMode && styles.inputDisabled]}
              placeholder="Tell others about yourself..."
              placeholderTextColor={darkMode ? "#999" : "#666"}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              editable={editMode}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>Location</Text>
            <TextInput
              style={[styles.input, darkMode && styles.darkInput, !editMode && styles.inputDisabled]}
              placeholder="City, Country"
              placeholderTextColor={darkMode ? "#999" : "#666"}
              value={location}
              onChangeText={setLocation}
              editable={editMode}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>Website</Text>
            <View style={styles.websiteContainer}>
              <TextInput
                style={[styles.input, styles.websiteInput, darkMode && styles.darkInput, !editMode && styles.inputDisabled]}
                placeholder="www.yourwebsite.com"
                placeholderTextColor={darkMode ? "#999" : "#666"}
                value={website}
                onChangeText={setWebsite}
                editable={editMode}
              />
              {website && !editMode && (
                <TouchableOpacity onPress={openWebsite} style={styles.linkButton}>
                  <Ionicons name="link" size={20} color="#4facfe" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Security Card */}
        <Animated.View entering={SlideInRight.delay(400).duration(600)} style={[styles.card, darkMode && styles.darkCard]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="security" size={18} color={darkMode ? "#4facfe" : "#667eea"} />
            <Text style={[styles.section, darkMode && styles.darkText]}>Security & Privacy</Text>
          </View>
          
          <Animated.View entering={FadeInDown.delay(600).duration(500)}>
            <AnimatedTouchable 
              style={[styles.actionButton, darkMode && styles.darkButton]}
              onPress={() => animateButton(changePassword)}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="key-outline" size={20} color="#4facfe" />
                <Text style={[styles.actionButtonText, darkMode && styles.darkText]}>Change Password</Text>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </AnimatedTouchable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).duration(500)} style={styles.switchContainer}>
            <View style={styles.switchContent}>
              <MaterialIcons name="fingerprint" size={20} color={darkMode ? "#4facfe" : "#667eea"} />
              <Text style={[styles.switchLabel, darkMode && styles.darkText]}>Biometric Login</Text>
            </View>
            <Switch 
              value={biometricEnabled} 
              onValueChange={toggleBiometric}
              trackColor={{ false: "#767577", true: "#4facfe" }}
              thumbColor={biometricEnabled ? "#fff" : "#f4f3f4"}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(800).duration(500)} style={styles.switchContainer}>
            <View style={styles.switchContent}>
              <Ionicons name="shield-checkmark" size={20} color={darkMode ? "#4facfe" : "#667eea"} />
              <Text style={[styles.switchLabel, darkMode && styles.darkText]}>Private Account</Text>
            </View>
            <Switch 
              value={privateAccount} 
              onValueChange={setPrivateAccount}
              trackColor={{ false: "#767577", true: "#4facfe" }}
              thumbColor={privateAccount ? "#fff" : "#f4f3f4"}
            />
          </Animated.View>
        </Animated.View>

        {/* Preferences Card */}
        <Animated.View entering={SlideInLeft.delay(600).duration(600)} style={[styles.card, darkMode && styles.darkCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={18} color={darkMode ? "#4facfe" : "#667eea"} />
            <Text style={[styles.section, darkMode && styles.darkText]}>Preferences</Text>
          </View>

          <Animated.View entering={FadeInDown.delay(900).duration(500)} style={styles.switchContainer}>
            <View style={styles.switchContent}>
              <Ionicons name={darkMode ? "moon" : "sunny"} size={20} color={darkMode ? "#4facfe" : "#667eea"} />
              <Text style={[styles.switchLabel, darkMode && styles.darkText]}>Dark Mode</Text>
            </View>
            <Switch 
              value={darkMode} 
              onValueChange={setDarkMode}
              trackColor={{ false: "#767577", true: "#4facfe" }}
              thumbColor={darkMode ? "#fff" : "#f4f3f4"}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(1000).duration(500)} style={styles.switchContainer}>
            <View style={styles.switchContent}>
              <Ionicons name="notifications" size={20} color={darkMode ? "#4facfe" : "#667eea"} />
              <Text style={[styles.switchLabel, darkMode && styles.darkText]}>Push Notifications</Text>
            </View>
            <Switch 
              value={notificationsEnabled} 
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#767577", true: "#4facfe" }}
              thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
            />
          </Animated.View>
        </Animated.View>

        {/* Actions Card */}
        <Animated.View entering={SlideInRight.delay(800).duration(600)} style={[styles.card, darkMode && styles.darkCard]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="more-horiz" size={18} color={darkMode ? "#4facfe" : "#667eea"} />
            <Text style={[styles.section, darkMode && styles.darkText]}>Actions</Text>
          </View>

          <Animated.View entering={FadeInDown.delay(1100).duration(500)}>
            <AnimatedTouchable 
              style={[styles.actionButton, darkMode && styles.darkButton]}
              onPress={() => animateButton(exportData)}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="download-outline" size={20} color="#4facfe" />
                <Text style={[styles.actionButtonText, darkMode && styles.darkText]}>Export My Data</Text>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </AnimatedTouchable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(1200).duration(500)}>
            <AnimatedTouchable 
              style={[styles.actionButton, darkMode && styles.darkButton]}
              onPress={() => animateButton(resetSettings)}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="refresh-outline" size={20} color="#ff9500" />
                <Text style={[styles.actionButtonText, darkMode && styles.darkText]}>Reset Settings</Text>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </AnimatedTouchable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(1300).duration(500)}>
            <AnimatedTouchable 
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => animateButton(deleteAccount)}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                <Text style={styles.dangerButtonText}>Delete Account</Text>
                <Ionicons name="chevron-forward" size={16} color="#ff3b30" />
              </View>
            </AnimatedTouchable>
          </Animated.View>
        </Animated.View>

        {/* Save Button */}
        {editMode && (
          <Animated.View entering={BounceIn.delay(1400).duration(800)}>
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              style={styles.saveButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <TouchableOpacity 
                onPress={() => animateButton(saveProfile)}
                disabled={isLoading}
                style={styles.saveButtonInner}
              >
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.saveText}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Logout Button */}
        <Animated.View entering={FadeInDown.delay(1500).duration(600)}>
          <TouchableOpacity 
            style={[styles.logoutBtn, darkMode && styles.darkLogoutBtn]} 
            onPress={() => animateButton(logout)}
          >
            <Ionicons name="log-out-outline" size={20} color={darkMode ? "#fff" : "#333"} />
            <Text style={[styles.logoutText, darkMode && styles.darkText]}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  darkContainer: {
    backgroundColor: "#1a1a1a",
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAction: {
    marginLeft: 16,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    alignItems: "center",
    padding: 15,
  },
  progressText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    width: 80,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4facfe",
    borderRadius: 2,
  },
  progressPercent: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    fontStyle: "italic",
    maxWidth: width * 0.8,
  },
  scrollContainer: {
    flex: 1,
    marginTop: -20,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  darkCard: {
    backgroundColor: "#2a2a2a",
    shadowColor: "#fff",
    shadowOpacity: 0.05,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  section: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
    color: "#333",
  },
  darkText: {
    color: "#fff",
  },
  darkLabel: {
    color: "#ccc",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e1e5e9",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: "#333",
  },
  darkInput: {
    borderColor: "#444",
    backgroundColor: "#333",
    color: "#fff",
  },
  inputDisabled: {
    opacity: 0.7,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#e1e5e9",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: "#333",
    minHeight: 80,
    textAlignVertical: "top",
  },
  websiteContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  websiteInput: {
    flex: 1,
  },
  linkButton: {
    marginLeft: 10,
    padding: 10,
  },
  actionButton: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#e1e5e9",
  },
  darkButton: {
    backgroundColor: "#333",
    borderColor: "#444",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
    marginLeft: 12,
  },
  dangerButton: {
    backgroundColor: "#fff5f5",
    borderColor: "#ffebee",
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ff3b30",
    flex: 1,
    marginLeft: 12,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  switchContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 12,
  },
  saveButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 15,
    shadowColor: "#4facfe",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  saveText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkLogoutBtn: {
    backgroundColor: "#2a2a2a",
    borderColor: "#444",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
});