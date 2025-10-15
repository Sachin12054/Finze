import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword } from "firebase/auth";
import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { auth, db } from '../services/firebase/firebase';

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
}

interface ExpenseData {
  amount: number;
  description: string;
  category: string;
  date: string;
}

interface TransactionSummary {
  totalExpenses: number;
  totalIncome?: number;
  transactionCount: number;
  currentBalance: number;
  categories: { [key: string]: number };
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({
  visible,
  onClose,
  user,
}) => {
  const { isDarkTheme, toggleTheme } = useTheme();
  
  // Professional color system
  const colors = {
    background: isDarkTheme ? '#0F172A' : '#FFFFFF',
    surface: isDarkTheme ? '#1E293B' : '#F8FAFC',
    surfaceElevated: isDarkTheme ? '#334155' : '#FFFFFF',
    primary: '#6366F1',
    primaryLight: '#8B5CF6',
    text: isDarkTheme ? '#F1F5F9' : '#1E293B',
    textSecondary: isDarkTheme ? '#CBD5E1' : '#475569',
    textMuted: isDarkTheme ? '#94A3B8' : '#64748B',
    border: isDarkTheme ? '#334155' : '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    shadow: isDarkTheme ? '#000000' : '#000000',
  };
  const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary>({
    totalExpenses: 0,
    transactionCount: 0,
    currentBalance: 0,
    categories: {}
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (visible && user.uid) {
      fetchUserProfile();
    }
  }, [visible, user.uid]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile data
      const profileRef = doc(db, "users", user.uid, "profile", "info");
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const data = profileSnap.data() as UserProfileData;
        setUserProfileData(data);
      }
      
      // Fetch transaction summary for export
      await fetchTransactionSummary();
      
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionSummary = async () => {
    try {
      // Fetch all manual transactions
      const expensesRef = collection(db, "users", user.uid, "expenses");
      const expensesSnap = await getDocs(expensesRef);
      
      // Fetch all scanner expenses
      const scannerExpensesRef = collection(db, "users", user.uid, "scanner_expenses");
      const scannerExpensesSnap = await getDocs(scannerExpensesRef);
      
      let totalExpenses = 0;
      let totalIncome = 0;
      let transactionCount = 0;
      const expenseCategories: { [key: string]: number } = {};
      const incomeCategories: { [key: string]: number } = {};
      
      // Define income categories and transaction types
      const incomeTypeIdentifiers = ["Salary", "Income", "Deposit", "Allowance", "Scholarship", "income"];
      
      console.log('📊 Fetching transactions - Manual:', expensesSnap.size, 'Scanner:', scannerExpensesSnap.size);
      
      // Process manual transactions
      expensesSnap.forEach((doc) => {
        const transaction = doc.data();
        // Ensure amount is parsed as a number
        const amount = parseFloat(transaction.amount) || 0;
        const category = transaction.category || 'Other';
        const type = transaction.type || '';
        
        transactionCount++;
        
        // Check if this is income based on type or category
        const isIncome = type.toLowerCase() === 'income' || 
                        incomeTypeIdentifiers.some(inc => 
                          category.toLowerCase().includes(inc.toLowerCase())
                        );
        
        if (isIncome) {
          // This is income
          totalIncome += amount;
          incomeCategories[category] = (incomeCategories[category] || 0) + amount;
        } else {
          // This is an expense
          totalExpenses += amount;
          expenseCategories[category] = (expenseCategories[category] || 0) + amount;
        }
      });
      
      console.log('💰 After manual transactions - Income:', totalIncome, 'Expenses:', totalExpenses);
      
      // Process scanner expenses
      scannerExpensesSnap.forEach((doc) => {
        const expense = doc.data();
        // Ensure amount is parsed as a number
        const amount = parseFloat(expense.amount) || 0;
        const category = expense.category || 'Other';
        
        console.log('🔍 Scanner expense:', category, amount);
        
        transactionCount++;
        totalExpenses += amount;
        expenseCategories[category] = (expenseCategories[category] || 0) + amount;
      });
      
      console.log('💰 FINAL - Income:', totalIncome, 'Expenses:', totalExpenses, 'Balance:', totalIncome - totalExpenses, 'Transactions:', transactionCount);
      
      // Calculate current balance (Income - Expenses)
      const currentBalance = totalIncome - totalExpenses;
      
      setTransactionSummary({
        totalExpenses,
        transactionCount,
        currentBalance,
        categories: expenseCategories, // Only expense categories for breakdown
        totalIncome, // Add total income to state
      });
      
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    try {
      const user = auth.currentUser;
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordDialog(false);
        Alert.alert('Success', 'Password updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const profileRef = doc(db, "users", user.uid, "profile", "info");
      const docSnap = await getDoc(profileRef);
      
      const updates: any = {
        updatedAt: new Date().toISOString(),
      };

      if (editFullName.trim()) {
        updates.fullName = editFullName.trim();
        updates.displayName = editFullName.trim();
      }

      if (editPhone.trim()) {
        updates.phone = editPhone.trim();
      }

      if (docSnap.exists()) {
        // Update existing profile - merge with existing data
        await setDoc(profileRef, updates, { merge: true });
      } else {
        // Create new profile
        updates.createdAt = new Date().toISOString();
        await setDoc(profileRef, updates);
      }

      setEditFullName('');
      setEditPhone('');
      setShowEditProfileDialog(false);
      Alert.alert('Success', 'Profile updated successfully');
      fetchUserProfile(); // Refresh profile data
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        userInfo: {
          fullName: userProfileData?.fullName || 'N/A',
          email: user.email,
          phone: userProfileData?.phone || 'N/A',
        },
        financialSummary: {
          totalIncome: `₹${(transactionSummary.totalIncome || 0).toLocaleString()}`,
          totalExpenses: `₹${transactionSummary.totalExpenses.toLocaleString()}`,
          transactionCount: transactionSummary.transactionCount,
          currentBalance: `₹${transactionSummary.currentBalance.toLocaleString()}`,
          categoryBreakdown: Object.entries(transactionSummary.categories)
            .map(([category, amount]) => `${category}: ₹${amount.toLocaleString()}`)
            .join('\n'),
        },
        exportDate: new Date().toISOString(),
      };

      const exportText = `
FINZE - Financial Data Export
Generated on: ${new Date().toLocaleDateString()}

USER INFORMATION:
• Full Name: ${exportData.userInfo.fullName}
• Email: ${exportData.userInfo.email}
• Phone: ${exportData.userInfo.phone}

FINANCIAL SUMMARY:
• Total Income: ${exportData.financialSummary.totalIncome}
• Total Expenses: ${exportData.financialSummary.totalExpenses}
• Current Balance: ${exportData.financialSummary.currentBalance}
• Total Transactions: ${exportData.financialSummary.transactionCount}

EXPENSE CATEGORY BREAKDOWN:
${exportData.financialSummary.categoryBreakdown}

This data was exported from your Finze account on ${new Date().toLocaleString()}.
      `;

      await Share.share({
        message: exportText,
        title: 'Finze Financial Data Export',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This action will permanently delete your account and all associated data. This cannot be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => confirmDeleteAccount()
        }
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Delete user data from Firestore
      const batch = writeBatch(db);
      
      // Delete profile data
      const profileRef = doc(db, "users", user.uid, "profile", "info");
      batch.delete(profileRef);
      
      // Delete expenses collection
      const expensesRef = collection(db, "users", user.uid, "expenses");
      const expensesSnap = await getDocs(expensesRef);
      expensesSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Delete any other user collections you have
      // Add more collections as needed
      
      await batch.commit();
      
      // Delete the user account
      await user.delete();
      
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
      onClose();
      router.replace("/auth/welcome");
      
    } catch (error: any) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account. You may need to sign in again and try again.');
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
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.professionalCard, { backgroundColor: colors.background }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading profile...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Professional Header */}
                <View style={[styles.professionalHeader, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity 
                    style={[styles.closeButton, { backgroundColor: colors.surface }]} 
                    onPress={onClose}
                  >
                    <Ionicons name="close" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>Profile Settings</Text>
                </View>

                {/* Professional Profile Section */}
                <View style={styles.profileSection}>
                  <View style={styles.avatarContainer}>
                    {userProfileData?.profilePic ? (
                      <Image source={{ uri: userProfileData.profilePic }} style={styles.professionalAvatar} />
                    ) : (
                      <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
                      </View>
                    )}
                    <View style={[styles.statusIndicator, { backgroundColor: colors.success }]} />
                  </View>
                  
                  <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
                    {userProfileData?.phone && (
                      <Text style={[styles.userPhone, { color: colors.textMuted }]}>{userProfileData.phone}</Text>
                    )}
                  </View>
                </View>

                {/* Professional Settings Menu */}
                <View style={styles.settingsMenu}>
                  
                  {/* Edit Profile */}
                  <TouchableOpacity 
                    style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      setEditFullName(userProfileData?.fullName || '');
                      setEditPhone(userProfileData?.phone || '');
                      setShowEditProfileDialog(true);
                    }}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="person" size={20} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={[styles.settingTitle, { color: colors.text }]}>Edit Profile</Text>
                        <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>Update name and phone</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                  
                  {/* Dark Mode Toggle */}
                  <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="moon" size={20} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
                        <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>App appearance</Text>
                      </View>
                    </View>
                    <Switch
                      value={isDarkTheme}
                      onValueChange={toggleTheme}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={isDarkTheme ? '#ffffff' : '#f4f3f4'}
                    />
                  </View>

                  {/* Change Password */}
                  <TouchableOpacity 
                    style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowPasswordDialog(true)}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: colors.warning + '20' }]}>
                        <Ionicons name="key" size={20} color={colors.warning} />
                      </View>
                      <View>
                        <Text style={[styles.settingTitle, { color: colors.text }]}>Change Password</Text>
                        <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>Update your password</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* Export Data */}
                  <TouchableOpacity 
                    style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={handleExportData}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: colors.success + '20' }]}>
                        <Ionicons name="download" size={20} color={colors.success} />
                      </View>
                      <View>
                        <Text style={[styles.settingTitle, { color: colors.text }]}>Export Data</Text>
                        <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>Download your financial data</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* Delete Account */}
                  <TouchableOpacity 
                    style={[styles.settingItem, styles.dangerItem, { backgroundColor: colors.error + '08', borderColor: colors.error + '20' }]}
                    onPress={handleDeleteAccount}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: colors.error + '20' }]}>
                        <Ionicons name="trash" size={20} color={colors.error} />
                      </View>
                      <View>
                        <Text style={[styles.settingTitle, { color: colors.error }]}>Delete Account</Text>
                        <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>Permanently remove account</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>

                {/* Professional Sign Out Button */}
                <TouchableOpacity 
                  style={[styles.signOutButton, { backgroundColor: colors.primary }]} 
                  onPress={handleSignOut}
                >
                  <Ionicons name="log-out-outline" size={20} color="#ffffff" />
                  <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal visible={showPasswordDialog} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.passwordDialog, { backgroundColor: colors.background }]}>
            <View style={[styles.passwordHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.passwordTitle, { color: colors.text }]}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordDialog(false)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordForm}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Current Password</Text>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="Enter current password"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>New Password</Text>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Enter new password"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirm New Password</Text>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <TouchableOpacity 
                style={[styles.passwordSubmitButton, { backgroundColor: colors.primary }]} 
                onPress={handleChangePassword}
              >
                <Text style={styles.passwordSubmitText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfileDialog} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.passwordDialog, { backgroundColor: colors.background }]}>
            <View style={[styles.passwordHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.passwordTitle, { color: colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfileDialog(false)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordForm}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number</Text>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity 
                style={[styles.passwordSubmitButton, { backgroundColor: colors.primary }]} 
                onPress={handleUpdateProfile}
              >
                <Text style={styles.passwordSubmitText}>Update Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  
  // Professional Card Design
  professionalCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  
  // Professional Header
  professionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    marginBottom: 24,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  
  // Loading State
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Profile Section
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 32,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  professionalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  userPhone: {
    fontSize: 15,
    fontWeight: '600',
  },
  
  // Settings Menu
  settingsMenu: {
    gap: 16,
    marginBottom: 32,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  dangerItem: {
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Professional Sign Out Button
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
    letterSpacing: -0.2,
  },
  
  // Password Dialog Styles
  passwordDialog: {
    borderRadius: 24,
    marginHorizontal: 20,
    paddingBottom: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    marginBottom: 24,
  },
  passwordTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  passwordForm: {
    paddingHorizontal: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  passwordInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 1,
  },
  passwordSubmitButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  passwordSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.2,
  },
});

export default ProfileDialog;
