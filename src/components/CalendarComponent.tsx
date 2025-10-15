import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { CalendarDay, CalendarEvent, CalendarMonth, CalendarService } from '../services/calendarService';
import { TransactionCard, TransactionCardData } from './TransactionCard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CalendarComponentProps {
  isVisible: boolean;
  onClose: () => void;
  onExpenseSelect?: (expense: any) => void;
  refreshTrigger?: number;
}

interface CalendarStats {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
  averageDaily: number;
  topSpendingDay: { date: string; amount: number };
}

export const CalendarComponent: React.FC<CalendarComponentProps> = ({
  isVisible,
  onClose,
  onExpenseSelect,
  refreshTrigger = 0,
}) => {
  // Theme context
  const { isDarkTheme } = useTheme();
  
  // Animation values
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(screenHeight), []);

  // Theme-aware colors
  const getThemeColors = () => ({
    background: isDarkTheme ? '#0f172a' : '#ffffff',
    surface: isDarkTheme ? '#1e293b' : '#f8fafc',
    surfaceElevated: isDarkTheme ? '#334155' : '#ffffff',
    text: isDarkTheme ? '#f1f5f9' : '#1e293b',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b',
    textMuted: isDarkTheme ? '#64748b' : '#94a3b8',
    border: isDarkTheme ? '#334155' : '#e2e8f0',
    borderLight: isDarkTheme ? '#475569' : '#f1f5f9',
    overlay: isDarkTheme ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.8)',
    primary: isDarkTheme ? '#3b82f6' : '#2563eb',
    primaryLight: isDarkTheme ? '#60a5fa' : '#3b82f6',
    primaryDark: isDarkTheme ? '#1d4ed8' : '#1e40af',
    success: isDarkTheme ? '#10b981' : '#059669',
    successLight: isDarkTheme ? '#34d399' : '#10b981',
    error: isDarkTheme ? '#ef4444' : '#dc2626',
    errorLight: isDarkTheme ? '#f87171' : '#ef4444',
    warning: isDarkTheme ? '#f59e0b' : '#d97706',
    warningLight: isDarkTheme ? '#fbbf24' : '#f59e0b',
    primarySurface: isDarkTheme ? '#1e3a8a' : '#eff6ff',
    successSurface: isDarkTheme ? '#064e3b' : '#ecfdf5',
    errorSurface: isDarkTheme ? '#7f1d1d' : '#fef2f2',
    warningSurface: isDarkTheme ? '#78350f' : '#fffbeb',
    cardBackground: isDarkTheme ? '#1e293b' : '#ffffff',
    cardShadow: isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
    headerGradient: isDarkTheme 
      ? ['#1e40af', '#3730a3'] as const 
      : ['#4f46e5', '#7c3aed'] as const,
    gradientOverlay: isDarkTheme 
      ? ['rgba(30, 64, 175, 0.9)', 'rgba(55, 48, 163, 0.9)'] as const 
      : ['rgba(79, 70, 229, 0.9)', 'rgba(124, 58, 237, 0.9)'] as const,
  });

  const colors = getThemeColors();

  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarMonth | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshTrigger, setLastRefreshTrigger] = useState(-1);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isNavigating, setIsNavigating] = useState(false);

  // Helper functions
  const formatCurrency = useCallback((amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount) || typeof amount !== 'number') {
      return '₹0.00';
    }
    return `₹${Math.abs(amount).toFixed(2)}`;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return dateString;
    }
  }, []);

  // Computed calendar statistics
  const calendarStats = useMemo((): CalendarStats => {
    if (!calendarData) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        transactionCount: 0,
        averageDaily: 0,
        topSpendingDay: { date: '', amount: 0 }
      };
    }

    const currentMonthDays = calendarData.days.filter(day => day.isCurrentMonth);
    const totalExpenses = currentMonthDays.reduce((sum, day) => {
      const amount = typeof day.totalExpenses === 'number' && !isNaN(day.totalExpenses) 
        ? day.totalExpenses 
        : 0;
      return sum + amount;
    }, 0);
    const totalIncome = currentMonthDays.reduce((sum, day) => {
      const amount = typeof day.totalIncome === 'number' && !isNaN(day.totalIncome) 
        ? day.totalIncome 
        : 0;
      return sum + amount;
    }, 0);
    const transactionCount = currentMonthDays.reduce((sum, day) => sum + day.events.length, 0);
    
    const daysWithExpenses = currentMonthDays.filter(day => day.totalExpenses > 0);
    const averageDaily = daysWithExpenses.length > 0 ? totalExpenses / daysWithExpenses.length : 0;
    
    const topDay = currentMonthDays.reduce((max, day) => 
      day.totalExpenses > max.totalExpenses ? day : max,
      { totalExpenses: 0, date: '' }
    );

    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      transactionCount,
      averageDaily,
      topSpendingDay: { date: topDay.date, amount: topDay.totalExpenses }
    };
  }, [calendarData]);

  // Load calendar data
  const loadCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await CalendarService.getCalendarMonth(
        currentDate.getFullYear(),
        currentDate.getMonth()
      );
      setCalendarData(data);
      
    } catch (error) {
      console.error('Calendar loading error:', error);
      Alert.alert('Error', 'Failed to load calendar data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  // Effects
  useEffect(() => {
    if (isVisible) {
      // Reset animations when modal opens
      fadeAnim.setValue(0);
      slideAnim.setValue(screenHeight);
      
      // Start animations immediately
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Load data when modal opens or when refresh is triggered
      if (!calendarData || refreshTrigger !== lastRefreshTrigger) {
        loadCalendarData();
        setLastRefreshTrigger(refreshTrigger);
      }
    } else {
      // Reset when modal closes
      fadeAnim.setValue(0);
      slideAnim.setValue(screenHeight);
    }
  }, [isVisible, refreshTrigger, calendarData, loadCalendarData, lastRefreshTrigger, fadeAnim, slideAnim]);

  // Separate effect for currentDate changes
  useEffect(() => {
    if (isVisible && calendarData) {
      // Only reload if the current calendar data doesn't match the current date
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      if (calendarData.year !== currentYear || 
          (calendarData.monthName !== new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }))) {
        loadCalendarData();
      }
    }
  }, [currentDate, isVisible, calendarData, loadCalendarData]);

  // Navigation functions
  const navigateMonth = useCallback(async (direction: 'prev' | 'next') => {
    if (isNavigating || loading) return; // Prevent multiple simultaneous navigations
    
    setIsNavigating(true);
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDay(null);
    
    // Load data for the new month
    setLoading(true);
    try {
      const data = await CalendarService.getCalendarMonth(
        newDate.getFullYear(),
        newDate.getMonth()
      );
      setCalendarData(data);
    } catch (error) {
      console.error('Calendar navigation error:', error);
      Alert.alert('Error', 'Failed to load calendar data. Please try again.');
    } finally {
      setLoading(false);
      setIsNavigating(false);
    }
  }, [currentDate, isNavigating, loading]);

  const goToToday = useCallback(async () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(null);
    
    // Load data for current month
    setLoading(true);
    try {
      const data = await CalendarService.getCalendarMonth(
        today.getFullYear(),
        today.getMonth()
      );
      setCalendarData(data);
    } catch (error) {
      console.error('Calendar navigation error:', error);
      Alert.alert('Error', 'Failed to load calendar data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle close with animation
  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [fadeAnim, slideAnim, onClose]);

  // Render functions
  const renderCalendarDay = useCallback(({ item: day }: { item: CalendarDay }) => {
    const isSelected = selectedDay?.date === day.date;
    const hasEvents = day.events && day.events.length > 0;
    const dayNumber = day.dayNumber || parseInt(day.date.split('-')[2]);
    
    return (
      <TouchableOpacity
        style={[
          styles.dayContainer,
          { backgroundColor: colors.surfaceElevated },
          !day.isCurrentMonth && { backgroundColor: 'transparent' },
          day.isToday && { 
            backgroundColor: colors.primarySurface, 
            borderColor: colors.primary, 
            borderWidth: 2 
          },
          isSelected && { backgroundColor: colors.primary },
        ]}
        onPress={() => setSelectedDay(day)}
        activeOpacity={0.7}
      >
        <View style={styles.dayContent}>
          <Text
            style={[
              styles.dayText,
              { color: colors.text },
              !day.isCurrentMonth && { color: colors.textMuted },
              day.isToday && { color: colors.primary, fontWeight: '700' },
              isSelected && { color: 'white', fontWeight: '700' },
            ]}
          >
            {dayNumber}
          </Text>
          
          {hasEvents && (
            <View style={styles.eventsContainer}>
              {/* Show only dots for income (green) and expenses (red) */}
              {day.totalIncome > 0 && (
                <View
                  style={[
                    styles.eventDot,
                    { backgroundColor: colors.success }
                  ]}
                />
              )}
              {day.totalExpenses > 0 && (
                <View
                  style={[
                    styles.eventDot,
                    { backgroundColor: colors.error }
                  ]}
                />
              )}
            </View>
          )}
          
          {day.totalExpenses > 0 && (
            <Text style={[styles.dayAmount, { color: colors.error }]}>
              ₹{day.totalExpenses.toFixed(0)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [selectedDay, colors]);

  const renderEventDetails = useCallback((event: CalendarEvent) => {
    const transactionData: TransactionCardData = {
      id: event.id,
      title: event.title,
      amount: event.amount,
      type: event.type,
      category: event.category,
      date: new Date().toISOString(), // Use current date as fallback
      description: event.description,
    };

    return (
      <TransactionCard
        key={event.id}
        transaction={transactionData}
        compact={true}
        showDeleteButton={false}
      />
    );
  }, []);

  const renderStatsCard = useCallback((
    title: string, 
    value: string, 
    icon: string, 
    color: string,
    subtitle?: string
  ) => (
    <View style={[styles.statsCard, { backgroundColor: colors.surfaceElevated }]}>
      <View style={[styles.statsIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View>
        <Text style={[styles.statsValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>{title}</Text>
        {subtitle && (
          <Text style={[{ fontSize: 10, marginTop: 2 }, { color: colors.textMuted }]}>{subtitle}</Text>
        )}
      </View>
    </View>
  ), [colors]);

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor={colors.background} barStyle={isDarkTheme ? "light-content" : "dark-content"} translucent={false} />
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <Animated.View 
            style={[
              styles.container,
              { 
                backgroundColor: colors.background,
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim }
                ]
              }
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                
                <View style={styles.headerCenter}>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>Calendar View</Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    Track your financial activity
                  </Text>
                </View>

                <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              {/* Month Navigation */}
              <View style={styles.monthNavigation}>
                <TouchableOpacity
                  onPress={() => navigateMonth('prev')}
                  style={[styles.monthNavButton, { backgroundColor: colors.surface }]}
                  activeOpacity={0.6}
                  disabled={loading || isNavigating}
                >
                  <Ionicons name="chevron-back" size={24} color={loading || isNavigating ? colors.textMuted : colors.text} />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={goToToday} style={styles.monthTitleContainer} activeOpacity={0.7}>
                  <Text style={[styles.monthTitle, { color: colors.text }]}>
                    {loading ? 'Loading...' : `${calendarData?.monthName || 'Loading'} ${calendarData?.year || new Date().getFullYear()}`}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => navigateMonth('next')}
                  style={[styles.monthNavButton, { backgroundColor: colors.surface }]}
                  activeOpacity={0.6}
                  disabled={loading || isNavigating}
                >
                  <Ionicons name="chevron-forward" size={24} color={loading || isNavigating ? colors.textMuted : colors.text} />
                </TouchableOpacity>
              </View>

              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expenses</Text>
                  <Text style={[styles.statValue, { color: colors.error }]}>₹{calendarStats.totalExpenses.toFixed(0)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Income</Text>
                  <Text style={[styles.statValue, { color: colors.success }]}>₹{calendarStats.totalIncome.toFixed(0)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Net</Text>
                  <Text style={[
                    styles.statValue, 
                    { color: calendarStats.netAmount >= 0 ? colors.success : colors.error }
                  ]}>
                    {calendarStats.netAmount >= 0 ? '+' : ''}₹{Math.abs(calendarStats.netAmount).toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
              bounces={true}
              scrollEventThrottle={16}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Loading calendar data...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Calendar Grid */}
                  <View style={[styles.calendarCard, { backgroundColor: colors.surfaceElevated }]}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>
                        {calendarData?.monthName || 'Loading'} {calendarData?.year || new Date().getFullYear()}
                      </Text>
                      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                        {calendarStats.transactionCount} transactions this month
                      </Text>
                    </View>

                    {/* Day Headers */}
                    <View style={styles.dayHeaders}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <Text key={day} style={[styles.dayHeaderText, { color: colors.textSecondary }]}>
                          {day}
                        </Text>
                      ))}
                    </View>

                    {/* Calendar Days Grid */}
                    {calendarData && calendarData.days.length > 0 ? (
                      <View style={styles.daysContainer}>
                        {calendarData.days.map((day, index) => {
                          const isSelected = selectedDay?.date === day.date;
                          const hasEvents = day.events && day.events.length > 0;
                          const dayNumber = day.dayNumber || parseInt(day.date.split('-')[2]);
                          
                          return (
                            <TouchableOpacity
                              key={day.date}
                              style={[
                                styles.dayCell,
                                { backgroundColor: colors.surface },
                                !day.isCurrentMonth && styles.dayOutsideMonth,
                                day.isToday && [styles.dayToday, { borderColor: colors.primary }],
                                isSelected && [styles.daySelected, { backgroundColor: colors.primary }],
                              ]}
                              onPress={() => setSelectedDay(isSelected ? null : day)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.dayText,
                                  { color: colors.text },
                                  !day.isCurrentMonth && { color: colors.textMuted },
                                  day.isToday && { color: colors.primary, fontWeight: '700' },
                                  isSelected && { color: 'white', fontWeight: '700' },
                                ]}
                              >
                                {dayNumber}
                              </Text>
                              
                              {hasEvents && (
                                <View style={styles.eventIndicators}>
                                  {/* Show only dots for income (green) and expenses (red) */}
                                  {day.totalIncome > 0 && (
                                    <View
                                      style={[
                                        styles.eventDot,
                                        { backgroundColor: colors.success }
                                      ]}
                                    />
                                  )}
                                  {day.totalExpenses > 0 && (
                                    <View
                                      style={[
                                        styles.eventDot,
                                        { backgroundColor: colors.error }
                                      ]}
                                    />
                                  )}
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.noDataContainer}>
                        <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                          No calendar data available
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Quick Stats Cards */}
                  <View style={styles.statsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Insights</Text>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScrollView}>
                      <View style={[styles.statsCard, { backgroundColor: colors.surfaceElevated }]}>
                        <View style={[styles.statsIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                          <Ionicons name="receipt-outline" size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.statsValue, { color: colors.text }]}>
                          {calendarStats.transactionCount}
                        </Text>
                        <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                          Transactions
                        </Text>
                      </View>

                      <View style={[styles.statsCard, { backgroundColor: colors.surfaceElevated }]}>
                        <View style={[styles.statsIconContainer, { backgroundColor: `${colors.success}20` }]}>
                          <Ionicons name="wallet-outline" size={24} color={colors.success} />
                        </View>
                        <Text style={[styles.statsValue, { color: colors.text }]}>
                          ₹{calendarStats.totalIncome.toFixed(0)}
                        </Text>
                        <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                          Total Income
                        </Text>
                      </View>

                      <View style={[styles.statsCard, { backgroundColor: colors.surfaceElevated }]}>
                        <View style={[styles.statsIconContainer, { backgroundColor: `${calendarStats.netAmount >= 0 ? colors.success : colors.error}20` }]}>
                          <Ionicons 
                            name={calendarStats.netAmount >= 0 ? "trending-up-outline" : "trending-down-outline"} 
                            size={24} 
                            color={calendarStats.netAmount >= 0 ? colors.success : colors.error} 
                          />
                        </View>
                        <Text style={[styles.statsValue, { color: colors.text }]}>
                          {calendarStats.netAmount >= 0 ? '+' : ''}₹{Math.abs(calendarStats.netAmount).toFixed(0)}
                        </Text>
                        <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                          Net Balance
                        </Text>
                      </View>
                    </ScrollView>
                  </View>

                  {/* Selected Day Details */}
                  {selectedDay && (
                    <View style={[styles.dayDetailsCard, { backgroundColor: colors.surfaceElevated }]}>
                      <View style={styles.dayDetailsHeader}>
                        <View>
                          <Text style={[styles.dayDetailsTitle, { color: colors.text }]}>
                            {new Date(selectedDay.date).toLocaleDateString('en-IN', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long'
                            })}
                          </Text>
                          <Text style={[styles.dayDetailsSubtitle, { color: colors.textSecondary }]}>
                            {selectedDay.events.length} transaction{selectedDay.events.length !== 1 ? 's' : ''}
                          </Text>
                          <View style={styles.dayAmountContainer}>
                            {selectedDay.totalIncome > 0 && (
                              <Text style={[styles.dayAmountText, { color: colors.success }]}>
                                Income: ₹{selectedDay.totalIncome.toFixed(0)}
                              </Text>
                            )}
                            {selectedDay.totalExpenses > 0 && (
                              <Text style={[styles.dayAmountText, { color: colors.error }]}>
                                Expenses: ₹{selectedDay.totalExpenses.toFixed(0)}
                              </Text>
                            )}
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => setSelectedDay(null)}
                          style={[styles.closeDayButton, { backgroundColor: colors.surface }]}
                        >
                          <Ionicons name="close" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                      
                      {selectedDay.events.length === 0 ? (
                        <View style={styles.noEventsContainer}>
                          <Ionicons name="calendar-clear-outline" size={40} color={colors.textMuted} />
                          <Text style={[styles.noEventsText, { color: colors.textSecondary }]}>
                            No transactions on this day
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.dayTransactions}>
                          {selectedDay.events.map(renderEventDetails)}
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal Structure (Full Screen)
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
    overflow: 'hidden',
  },

  // Header Styles
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleSection: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  monthTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
    paddingVertical: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerStats: {
    paddingHorizontal: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  headerStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  headerStatDivider: {
    width: 1,
    height: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 10,
  },

  // Content Styles
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContentContainer: {
    paddingBottom: 30,
    flexGrow: 1,
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Calendar Card Styles
  calendarCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 400,
    flex: 1,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Calendar Grid
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  dayCell: {
    width: `${100/7}%`,
    aspectRatio: 1.2,
    padding: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 50,
  },
  dayOutsideMonth: {
    opacity: 0.3,
  },
  dayToday: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  daySelected: {
    backgroundColor: '#3b82f6',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 3,
  },
  dayAmount: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 3,
  },
  eventIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 10,
    gap: 2,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },


  // No Data Styles
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  statsScrollView: {
    paddingRight: 20,
  },
  statsCard: {
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statsLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Day Details Card
  dayDetailsCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dayDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  dayDetailsSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayAmountContainer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dayAmountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeDayButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayTransactions: {
    gap: 10,
  },

  // No Events Styles
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noEventsText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
  },

  // Legacy compatibility styles
  dayContainer: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    padding: 6,
    borderRadius: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 50,
  },
  dayContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 12,
  },
  eventsListContainer: {
    gap: 12,
  },
});

export default CalendarComponent;