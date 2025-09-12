import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../services/firebase';

interface User {
  uid: string;
  email: string;
  displayName?: string;
  name?: string;
  photoURL?: string;
}

interface UserProfileData {
  fullName?: string;
  displayName?: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  profilePic?: string;
  darkMode?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

interface ProfileDialogProps {
  visible: boolean;
  onClose: () => void;
  user: User;
  isDarkTheme?: boolean;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({
  visible,
  onClose,
  user,
  isDarkTheme = false,
}) => {
  const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionCount, setTransactionCount] = useState(0);
  const [daysActive, setDaysActive] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (visible && user.uid) {
      fetchUserProfile();
    }
  }, [visible, user.uid]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const profileRef = doc(db, "users", user.uid, "profile", "info");
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const data = profileSnap.data() as UserProfileData;
        setUserProfileData(data);
        
        // Calculate days active
        if (data.createdAt) {
          const createdDate = data.createdAt.toDate();
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - createdDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysActive(diffDays);
        }
      }
      
      // Fetch transaction count
      // You can implement this based on your transaction collection structure
      setTransactionCount(Math.floor(Math.random() * 100) + 1); // Placeholder
      
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      '🚪 Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              onClose();
              router.replace("/auth/login");
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleSettings = () => {
    onClose();
    router.push('/Profile');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = userProfileData?.displayName || userProfileData?.fullName || user.displayName || user.name || 'User';

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.profileCard, isDarkTheme && styles.profileCardDark]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={[styles.loadingText, isDarkTheme && styles.loadingTextDark]}>Loading...</Text>
            </View>
          ) : (
            <>
              {/* Close Button */}
              <TouchableOpacity style={[styles.closeButton, isDarkTheme && styles.closeButtonDark]} onPress={onClose}>
                <Ionicons name="close" size={18} color={isDarkTheme ? "#94A3B8" : "#6B7280"} />
              </TouchableOpacity>

              {/* Compact Profile Header */}
              <View style={styles.compactHeader}>
                <View style={styles.avatarContainer}>
                  {userProfileData?.profilePic ? (
                    <Image source={{ uri: userProfileData.profilePic }} style={styles.compactAvatar} />
                  ) : (
                    <View style={styles.compactAvatarFallback}>
                      <Text style={styles.compactAvatarText}>{getInitials(displayName)}</Text>
                    </View>
                  )}
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                  </View>
                </View>
                
                <View style={styles.userInfo}>
                  <Text style={[styles.compactUserName, isDarkTheme && styles.compactUserNameDark]}>{displayName}</Text>
                  <Text style={[styles.compactUserEmail, isDarkTheme && styles.compactUserEmailDark]}>{user.email}</Text>
                  {userProfileData?.phone && (
                    <Text style={[styles.compactUserPhone, isDarkTheme && styles.compactUserPhoneDark]}>{userProfileData.phone}</Text>
                  )}
                  {userProfileData?.location && (
                    <Text style={[styles.compactUserLocation, isDarkTheme && styles.compactUserLocationDark]}>📍 {userProfileData.location}</Text>
                  )}
                </View>
              </View>

              {/* Simple Action Button */}
              <TouchableOpacity style={styles.compactButton} onPress={handleSignOut}>
                <Ionicons name="log-out" size={16} color="white" />
                <Text style={styles.compactButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 320,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
    position: 'relative',
  },
  profileCardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonDark: {
    backgroundColor: '#334155',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingTextDark: {
    color: '#94A3B8',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  compactAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  compactAvatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  compactAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  userInfo: {
    flex: 1,
  },
  compactUserName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  compactUserNameDark: {
    color: '#F1F5F9',
  },
  compactUserEmail: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  compactUserEmailDark: {
    color: '#94A3B8',
  },
  compactUserPhone: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
    marginBottom: 2,
  },
  compactUserPhoneDark: {
    color: '#8B5CF6',
  },
  compactUserLocation: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  compactUserLocationDark: {
    color: '#94A3B8',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  compactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
});

export default ProfileDialog;
