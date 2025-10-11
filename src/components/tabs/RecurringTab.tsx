import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { BounceIn, FadeInRight } from 'react-native-reanimated';
import { EnhancedFirebaseService, Recurrence } from '../../services/firebase/enhancedFirebaseService';

interface RecurringTabProps {
  recurrences: Recurrence[];
  isDarkTheme: boolean;
  onAddRecurring: () => void;
  onEditRecurring?: (recurrence: Recurrence) => void;
}

export const RecurringTab: React.FC<RecurringTabProps> = ({
  recurrences,
  isDarkTheme,
  onAddRecurring,
  onEditRecurring
}) => {
  const styles = getRecurringStyles(isDarkTheme);

  const handleDeleteRecurring = async (recurrence: Recurrence) => {
    Alert.alert(
      'Delete Recurring Transaction',
      `Are you sure you want to delete "${recurrence.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (recurrence.id) {
                // Actually delete from Firebase database
                await EnhancedFirebaseService.deleteRecurrence(recurrence.id);
                Alert.alert('Success', 'Recurring transaction deleted permanently');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete recurring transaction');
            }
          }
        }
      ]
    );
  };

  const handleToggleStatus = async (recurrence: Recurrence) => {
    try {
      if (recurrence.id) {
        const newStatus = !recurrence.isActive;
        await EnhancedFirebaseService.updateRecurrence(recurrence.id, { 
          isActive: newStatus 
        });
        Alert.alert(
          'Success', 
          `Recurring transaction "${recurrence.title}" has been ${newStatus ? 'activated' : 'paused'}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update recurring transaction');
    }
  };

  if (!Array.isArray(recurrences) || recurrences.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="repeat-outline" size={64} color={isDarkTheme ? '#64748B' : '#94A3B8'} />
        <Text style={styles.emptyTitle}>No Recurring Transactions</Text>
        <Text style={styles.emptySubtitle}>Set up automatic payments and income</Text>
        <Pressable style={styles.emptyButton} onPress={onAddRecurring}>
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            style={styles.emptyButtonGradient}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.emptyButtonText}>Add Recurring</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 20 }}
      >
        <View style={styles.recurringList}>
          {recurrences.map((recurrence, index) => {
            if (!recurrence || !recurrence.title || typeof recurrence.amount !== 'number') {
              return null;
            }

            const isIncome = recurrence.type === 'income';
            const iconName = isIncome ? 'trending-up' : 'trending-down';
            
            // Adjust colors based on active status
            let gradientColors: readonly [string, string];
            if (!recurrence.isActive) {
              // Paused - use muted gray colors
              gradientColors = ['#9CA3AF', '#6B7280'] as const;
            } else if (isIncome) {
              gradientColors = ['#4CAF50', '#388E3C'] as const;
            } else {
              gradientColors = ['#FF6B6B', '#FF5722'] as const;
            }

            return (
              <Animated.View
                key={recurrence.id || `recurring-${index}`}
                entering={FadeInRight.delay(index * 100).springify()}
                style={[styles.recurringCard, !recurrence.isActive && styles.pausedCard]}
              >
                <LinearGradient
                  colors={gradientColors}
                  style={styles.recurringGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.recurringHeader}>
                    <View style={styles.recurringInfo}>
                      <Animated.View 
                        style={styles.recurringIconContainer}
                        entering={BounceIn.delay(index * 150)}
                      >
                        <Ionicons name={iconName as any} size={24} color="white" />
                      </Animated.View>
                      <View style={styles.recurringTextContainer}>
                        <Text style={styles.recurringCategory}>{recurrence.title}</Text>
                        <Text style={styles.recurringPeriod}>Every {recurrence.frequency}</Text>
                      </View>
                    </View>
                    <View style={styles.recurringAmountContainer}>
                      <Text style={styles.recurringType}>
                        {isIncome ? 'Income' : 'Expense'}
                      </Text>
                      {!recurrence.isActive && (
                        <View style={styles.pausedBadge}>
                          <Ionicons name="pause" size={12} color="white" />
                          <Text style={styles.pausedText}>Paused</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.recurringAmountSection}>
                    <Text style={styles.recurringAmount}>
                      {isIncome ? '+' : '-'}₹{recurrence.amount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.recurringNext}>
                      {recurrence.isActive 
                        ? `Next: ${new Date(recurrence.nextDate).toLocaleDateString()}`
                        : 'Paused - No next payment'
                      }
                    </Text>
                  </View>

                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => onEditRecurring?.(recurrence)}
                    >
                      <Ionicons name="create-outline" size={18} color="white" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.toggleButton]}
                      onPress={() => handleToggleStatus(recurrence)}
                    >
                      <Ionicons 
                        name={recurrence.isActive ? "pause-outline" : "play-outline"} 
                        size={18} 
                        color="white" 
                      />
                      <Text style={styles.actionButtonText}>
                        {recurrence.isActive ? 'Pause' : 'Resume'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteRecurring(recurrence)}
                    >
                      <Ionicons name="trash-outline" size={18} color="white" />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </Animated.View>
            );
          })}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View 
        style={styles.fabContainer}
        entering={BounceIn.delay(500)}
      >
        <Pressable style={styles.fab} onPress={onAddRecurring}>
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="white" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const getRecurringStyles = (isDark: boolean) => StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: isDark ? '#F1F5F9' : '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: isDark ? '#94A3B8' : '#64748B',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  recurringList: {
    gap: 16,
  },
  recurringCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  pausedCard: {
    opacity: 0.75,
  },
  recurringGradient: {
    padding: 20,
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recurringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  recurringIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurringTextContainer: {
    flex: 1,
  },
  recurringCategory: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  recurringPeriod: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  recurringAmountContainer: {
    alignItems: 'flex-end',
  },
  recurringType: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pausedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
    gap: 3,
  },
  pausedText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  recurringAmountSection: {
    alignItems: 'flex-start',
  },
  recurringAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  recurringNext: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: 4,
    minHeight: 36,
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
