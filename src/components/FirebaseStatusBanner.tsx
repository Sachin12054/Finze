import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../services/firebase/firebase';
import { checkFirebaseStatus, FirebaseStatus, getFirebaseSetupMessage } from '../services/firebase/firebaseStatus';

interface FirebaseStatusBannerProps {
  onDismiss?: () => void;
  style?: any;
}

export const FirebaseStatusBanner: React.FC<FirebaseStatusBannerProps> = ({ 
  onDismiss,
  style 
}) => {
  const [status, setStatus] = useState<FirebaseStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (auth.currentUser) {
        const result = await checkFirebaseStatus(auth.currentUser.uid);
        setStatus(result);
      }
    };

    checkStatus();
  }, []);

  if (!status || dismissed || status.canAccessProfile) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const getBannerColor = () => {
    if (!status.rulesDeployed) return '#ff6b6b'; // Red for rules not deployed
    return '#ffa726'; // Orange for other issues
  };

  return (
    <View style={[styles.banner, { backgroundColor: getBannerColor() }, style]}>
      <View style={styles.content}>
        <Text style={styles.message}>
          {getFirebaseSetupMessage(status)}
        </Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    margin: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    fontFamily: 'monospace', // For command text
  },
  dismissButton: {
    marginLeft: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});