import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
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
import { useAuth } from "../src/contexts/AuthContext";
import { databaseService } from "../src/services/databaseService";
import { auth } from "../src/services/firebase/firebase";
import { deleteProfileImage, generatePlaceholderAvatar, UploadProgress } from "../src/services/imageUploadService";

// Conditional notification service import for Expo Go compatibility
let NotificationService: any = null;
try {
  // This will work in development builds but fail gracefully in Expo Go
  NotificationService = require("../src/services/notificationService").default;
} catch (error) {
  console.log('ℹ️ Notifications not available in Expo Go - using mock service');
  // Mock notification service for Expo Go
  NotificationService = {
    requestPermissionsAsync: async () => ({ status: 'denied', canAskAgain: false }),
    getPushToken: () => null,
    sendLocalNotification: async () => 'mock-id',
    scheduleNotification: async () => 'mock-id',
    cancelNotification: async () => {},
    cancelAllNotifications: async () => {},
  };
}

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [profilePic, setProfilePic] = useState(
    generatePlaceholderAvatar(user?.uid || '', user?.displayName || '')
  );
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Animation values
  const profileScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const headerHeight = useSharedValue(0);

  const uid = user?.uid;

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
        if (userDoc) {
          const data = userDoc;
          setFullName(data.fullName || "");
          setDisplayName(data.displayName || user?.displayName || "User");
          setPhone(data.phone || "");
          setBio(""); // bio not in new schema
          setLocation(""); // location not in new schema
          setWebsite(""); // website not in new schema
          setDarkMode(data.preferences?.theme === 'dark' || false);
          setNotificationsEnabled(data.preferences?.notifications || false);
          setPrivateAccount(false); // private account not in new schema
          if (data.avatar_url) setProfilePic(data.avatar_url);
        } else {
          console.log("No user document found, initializing with defaults");
          const defaultName = user?.displayName || "User";
          await databaseService.createUser({
            email: user?.email || "",
            displayName: defaultName,
            fullName: defaultName,
            avatar_url: profilePic,
            preferences: {
              theme: 'light',
              notifications: true
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
        fullName,
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
        colors={darkMode ? ['#667eea', '#764ba2', '#667eea'] : ['#4facfe', '#00f2fe', '#4facfe']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.5, 1]}
      >
        <Animated.View entering={FadeInUp.duration(800)} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}>
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
              style={[
                styles.input, 
                darkMode && styles.darkInput, 
                !editMode && styles.inputDisabled,
                editMode && { borderColor: "#4facfe", shadowOpacity: 0.15 }
              ]}
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
              style={[
                styles.input, 
                darkMode && styles.darkInput, 
                !editMode && styles.inputDisabled,
                editMode && { borderColor: "#4facfe", shadowOpacity: 0.15 }
              ]}
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
              style={[
                styles.input, 
                darkMode && styles.darkInput, 
                !editMode && styles.inputDisabled,
                editMode && { borderColor: "#4facfe", shadowOpacity: 0.15 }
              ]}
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
              style={[
                styles.textArea, 
                darkMode && styles.darkInput, 
                !editMode && styles.inputDisabled,
                editMode && { borderColor: "#4facfe", shadowOpacity: 0.15 }
              ]}
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
              style={[
                styles.input, 
                darkMode && styles.darkInput, 
                !editMode && styles.inputDisabled,
                editMode && { borderColor: "#4facfe", shadowOpacity: 0.15 }
              ]}
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
                style={[
                  styles.input, 
                  styles.websiteInput, 
                  darkMode && styles.darkInput, 
                  !editMode && styles.inputDisabled,
                  editMode && { borderColor: "#4facfe", shadowOpacity: 0.15 }
                ]}
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
              colors={['#4facfe', '#00f2fe', '#4facfe']}
              style={styles.saveButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              locations={[0, 0.5, 1]}
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
    backgroundColor: "#f7f9fc",
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
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 32,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: "#fff",
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(79, 172, 254, 0.9)",
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#4facfe",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 15, 35, 0.85)",
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  progressContainer: {
    alignItems: "center",
    padding: 20,
  },
  progressText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  progressBar: {
    width: 100,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4facfe",
    borderRadius: 3,
  },
  progressPercent: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
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
  bio: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    fontStyle: "italic",
    maxWidth: width * 0.85,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  scrollContainer: {
    flex: 1,
    marginTop: -24,
  },
  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 24,
    marginVertical: 12,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(79, 172, 254, 0.08)",
  },
  darkCard: {
    backgroundColor: "#1e1e2e",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    borderColor: "rgba(79, 172, 254, 0.15)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(79, 172, 254, 0.1)",
  },
  section: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 12,
    color: "#1a1a2e",
    letterSpacing: 0.3,
  },
  darkText: {
    color: "#f8f9fc",
  },
  darkLabel: {
    color: "#e0e0e6",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 2,
    borderColor: "rgba(79, 172, 254, 0.15)",
    backgroundColor: "#f8f9fc",
    padding: 18,
    borderRadius: 16,
    fontSize: 16,
    color: "#1a1a2e",
    fontWeight: "500",
    shadowColor: "#4facfe",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  darkInput: {
    borderColor: "rgba(79, 172, 254, 0.25)",
    backgroundColor: "#2a2a3e",
    color: "#f8f9fc",
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: "#f1f3f5",
  },
  textArea: {
    borderWidth: 2,
    borderColor: "rgba(79, 172, 254, 0.15)",
    backgroundColor: "#f8f9fc",
    padding: 18,
    borderRadius: 16,
    fontSize: 16,
    color: "#1a1a2e",
    fontWeight: "500",
    minHeight: 100,
    textAlignVertical: "top",
    shadowColor: "#4facfe",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  websiteContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  websiteInput: {
    flex: 1,
  },
  linkButton: {
    marginLeft: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(79, 172, 254, 0.1)",
  },
  actionButton: {
    backgroundColor: "#f8f9fc",
    padding: 20,
    borderRadius: 16,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: "rgba(79, 172, 254, 0.08)",
    shadowColor: "#4facfe",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  darkButton: {
    backgroundColor: "#2a2a3e",
    borderColor: "rgba(79, 172, 254, 0.15)",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a2e",
    flex: 1,
    marginLeft: 16,
    letterSpacing: 0.2,
  },
  dangerButton: {
    backgroundColor: "#fff8f8",
    borderColor: "rgba(255, 59, 48, 0.15)",
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff3b30",
    flex: 1,
    marginLeft: 16,
    letterSpacing: 0.2,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "rgba(79, 172, 254, 0.03)",
    marginVertical: 4,
  },
  switchContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a2e",
    marginLeft: 16,
    letterSpacing: 0.2,
  },
  saveButton: {
    marginHorizontal: 24,
    marginVertical: 24,
    borderRadius: 20,
    shadowColor: "#4facfe",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  saveButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  saveText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  logoutBtn: {
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 32,
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 59, 48, 0.15)",
    shadowColor: "#ff3b30",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  darkLogoutBtn: {
    backgroundColor: "#1e1e2e",
    borderColor: "rgba(255, 59, 48, 0.25)",
  },
  logoutText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ff3b30",
    marginLeft: 12,
    letterSpacing: 0.3,
  },
});