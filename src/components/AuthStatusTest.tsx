import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AuthService from '../services/auth/authService';

/**
 * Simple test component to verify authentication persistence
 * This can be temporarily added to any screen to test auth state
 */
export const AuthStatusTest: React.FC = () => {
  const { user, isLoading } = useAuth();

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>🔄 Checking authentication status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Auth Status Test</Text>
      
      {user ? (
        <View style={styles.userInfo}>
          <Text style={styles.status}>✅ User Authenticated</Text>
          <Text style={styles.detail}>UID: {user.uid}</Text>
          <Text style={styles.detail}>Email: {user.email || 'No email'}</Text>
          <Text style={styles.detail}>Display Name: {user.displayName || 'No name'}</Text>
          
          <Button
            title="Sign Out (Test)"
            onPress={handleSignOut}
            color="#ff3b30"
          />
        </View>
      ) : (
        <View style={styles.userInfo}>
          <Text style={styles.status}>❌ User Not Authenticated</Text>
          <Text style={styles.detail}>Redirecting to login...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4facfe',
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  userInfo: {
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  detail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default AuthStatusTest;