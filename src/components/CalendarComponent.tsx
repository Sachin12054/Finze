import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { CalendarDay, CalendarEvent, CalendarMonth, CalendarService } from '../services/calendarService';
import { TransactionCard, TransactionCardData } from './TransactionCard';

interface CalendarComponentProps {
  visible: boolean;
  onClose: () => void;
  refreshTrigger?: number;
}

export const CalendarComponent: React.FC<CalendarComponentProps> = ({
  visible,
  onClose,
  refreshTrigger = 0,
}) => {
  // Theme context
  const { isDarkTheme } = useTheme();
  
  // Theme-aware colors
  const getThemeColors = () => ({
    background: isDarkTheme ? '#1e293b' : '#ffffff',
    surface: isDarkTheme ? '#334155' : '#f8fafc',
    text: isDarkTheme ? '#f1f5f9' : '#1e293b',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b',
    border: isDarkTheme ? '#475569' : '#e2e8f0',
    overlay: isDarkTheme ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.9)',
    inputBackground: isDarkTheme ? '#475569' : '#ffffff',
    placeholder: isDarkTheme ? '#64748b' : '#94a3b8',
    primary: isDarkTheme ? '#60a5fa' : '#3b82f6',
    success: isDarkTheme ? '#34d399' : '#10b981',
    error: isDarkTheme ? '#fb7185' : '#ef4444',
    warning: isDarkTheme ? '#fbbf24' : '#f59e0b',
    primarySurface: isDarkTheme ? '#1e40af' : '#eff6ff',
    successSurface: isDarkTheme ? '#064e3b' : '#f0fdf4',
    errorSurface: isDarkTheme ? '#7f1d1d' : '#fef2f2',
    cardBackground: isDarkTheme ? '#374151' : '#ffffff',
    cardBorder: isDarkTheme ? '#475569' : '#f1f5f9',
    headerGradient: isDarkTheme ? ['#475569', '#64748b'] as const : ['#6366F1', '#8B5CF6'] as const,
  });

  const colors = getThemeColors();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarMonth | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshTrigger, setLastRefreshTrigger] = useState(-1);

  // Helper function to format currency properly
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount) || typeof amount !== 'number') {
      return '₹0.00';
    }
    return `₹${amount.toFixed(2)}`;
  };

  // Load calendar data for current month
  const loadCalendarData = async () => {
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
  };

  useEffect(() => {
    // Load calendar data when:
    // 1. Component becomes visible for the first time
    // 2. Month changes (currentDate dependency)
    // 3. Refresh trigger changes (but with throttling)
    if (visible) {
      // If no data yet, load immediately
      if (!calendarData) {
        loadCalendarData();
        setLastRefreshTrigger(refreshTrigger);
        return;
      }
      
      // If refresh trigger changed, wait a bit before refreshing to avoid flicker
      if (refreshTrigger !== lastRefreshTrigger) {
        const timeoutId = setTimeout(() => {
          if (visible) { // Check if still visible after timeout
            loadCalendarData();
            setLastRefreshTrigger(refreshTrigger);
          }
        }, 500); // 500ms delay to prevent rapid refreshes
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [visible, currentDate, refreshTrigger]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDay(null);
  };

  const renderDayEvents = (events: CalendarEvent[]) => {
    return events.slice(0, 2).map((event, index) => (
      <View
        key={event.id}
        style={[
          styles.eventDot,
          { backgroundColor: event.type === 'income' ? colors.success : colors.error }
        ]}
      />
    ));
  };

  const renderCalendarDay = ({ item: day }: { item: CalendarDay }) => {
    const isSelected = selectedDay?.date === day.date;
    const hasEvents = day.events && day.events.length > 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.dayContainer,
          { backgroundColor: colors.surface },
          !day.isCurrentMonth && { backgroundColor: 'transparent' },
          day.isToday && { backgroundColor: colors.primarySurface, borderColor: colors.primary, borderWidth: 2 },
          isSelected && { backgroundColor: colors.primary },
        ]}
        onPress={() => {
          setSelectedDay(day);
        }}
      >
        <View style={styles.dayContent}>
          <Text
            style={[
              styles.dayText,
              { color: colors.text },
              !day.isCurrentMonth && { color: colors.placeholder },
              day.isToday && { color: colors.primary, fontWeight: '700' },
              isSelected && { color: 'white', fontWeight: '700' },
            ]}
          >
            {day.dayOfMonth}
          </Text>
          
          {hasEvents && (
            <View style={styles.eventsContainer}>
              {renderDayEvents(day.events)}
              {day.events.length > 2 && (
                <Text style={[styles.moreEventsText, { color: colors.textSecondary }]}>+{day.events.length - 2}</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEventDetails = (event: CalendarEvent) => {
    // Convert CalendarEvent to TransactionCardData
    const transactionData: TransactionCardData = {
      id: event.id,
      title: event.title,
      amount: event.amount,
      type: event.type,
      category: event.category,
      date: event.date,
      description: event.description,
      source: event.isRecurring ? 'Recurring' : undefined,
    };

    return (
      <TransactionCard
        key={event.id}
        transaction={transactionData}
        compact={true}
        showDeleteButton={false}
      />
    );
  };

  if (!visible) return null;

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <LinearGradient colors={colors.headerGradient} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerCenterContainer}>
              <TouchableOpacity
                onPress={() => navigateMonth('prev')}
                style={styles.monthNavButton}
              >
                <Ionicons name="chevron-back" size={20} color="white" />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>
                {calendarData?.monthName} {calendarData?.year}
              </Text>
              
              <TouchableOpacity
                onPress={() => navigateMonth('next')}
                style={styles.monthNavButton}
              >
                <Ionicons name="chevron-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.spacer} />
          </View>
          
          <View style={styles.headerSummary}>
            <Text style={styles.monthTotal}>
              Net Amount: {formatCurrency(calendarData?.netAmount || 0)}
            </Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content}>
          {loading ? (
            <View style={[styles.loadingContainer, { backgroundColor: colors.cardBackground }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading calendar...</Text>
            </View>
          ) : (
            <>
              {/* Calendar Grid */}
              <View style={[styles.calendarContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                {/* Day Headers */}
                <View style={styles.dayHeaders}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <Text key={day} style={[styles.dayHeaderText, { color: colors.textSecondary }]}>
                      {day}
                    </Text>
                  ))}
                </View>

                {/* Calendar Days */}
                {calendarData && (
                  <FlatList
                    data={calendarData.days}
                    renderItem={renderCalendarDay}
                    keyExtractor={(item) => item.date}
                    numColumns={7}
                    scrollEnabled={false}
                    style={styles.daysGrid}
                  />
                )}
              </View>

              {/* Daily Spending Overview */}
              {calendarData && (
                <View style={[styles.summaryContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>Daily Spending Overview</Text>
                  
                  {/* Today's Spending */}
                  <View style={[styles.todaySpendingCard, { backgroundColor: colors.primarySurface, borderColor: colors.primary }]}>
                    <Text style={[styles.todayLabel, { color: colors.primary }]}>Today's Total</Text>
                    <Text style={[styles.todayAmount, { color: colors.primary }]}>
                      {formatCurrency(calendarData.days.find(day => day.isToday)?.totalExpenses || 0)}
                    </Text>
                    {(calendarData.days.find(day => day.isToday)?.events.length || 0) > 0 && (
                      <Text style={[styles.todayTransactions, { color: colors.textSecondary }]}>
                        {calendarData.days.find(day => day.isToday)?.events.length || 0} transactions
                      </Text>
                    )}
                  </View>

                  {/* Top Spending Days */}
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Top Spending Days This Month</Text>
                  <ScrollView style={styles.topSpendingList} showsVerticalScrollIndicator={false}>
                    {calendarData.days
                      .filter(day => day.totalExpenses > 0 && day.isCurrentMonth)
                      .sort((a, b) => b.totalExpenses - a.totalExpenses)
                      .slice(0, 5)
                      .map(day => (
                        <TouchableOpacity 
                          key={day.date}
                          style={[styles.spendingDayCard, { backgroundColor: colors.surface }]}
                          onPress={() => setSelectedDay(day)}
                        >
                          <View style={styles.spendingDayInfo}>
                            <Text style={[styles.spendingDate, { color: colors.text }]}>
                              {new Date(day.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                day: 'numeric' 
                              })}
                            </Text>
                            <Text style={[styles.spendingAmount, { color: colors.error }]}>
                              {formatCurrency(day.totalExpenses)}
                            </Text>
                          </View>
                          <Text style={[styles.spendingTransactions, { color: colors.textSecondary }]}>
                            {day.events.length} transaction{day.events.length !== 1 ? 's' : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>

                  {/* Monthly Stats */}
                  <View style={styles.monthlyStatsGrid}>
                    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg/Day</Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {formatCurrency(calendarData.totalExpenses / new Date(calendarData.year, calendarData.month + 1, 0).getDate())}
                      </Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Days</Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {calendarData.days.filter(day => day.totalExpenses > 0 && day.isCurrentMonth).length}
                      </Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Month</Text>
                      <Text style={[styles.statValue, { color: colors.error }]}>
                        {formatCurrency(calendarData.totalExpenses)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Selected Day Details */}
              {selectedDay && (
                <View style={[styles.dayDetailsContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.dayDetailsTitle, { color: colors.text }]}>
                    {new Date(selectedDay.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  
                  {selectedDay.events.length === 0 ? (
                    <Text style={[styles.noEventsText, { color: colors.textSecondary }]}>No transactions on this day</Text>
                  ) : (
                    <View style={styles.eventsListContainer}>
                      {selectedDay.events.map(renderEventDetails)}
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  monthNavButton: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginHorizontal: 20,
    textAlign: 'center',
    minWidth: 150,
  },
  spacer: {
    width: 40,
  },
  headerSummary: {
    alignItems: 'center',
    marginTop: 10,
  },
  monthTotal: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  calendarContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flex: 1,
  },
  dayContainer: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
    padding: 4,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  eventsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    minHeight: 8,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 1,
  },
  moreEventsText: {
    fontSize: 8,
    marginLeft: 2,
    fontWeight: '600',
  },
  summaryContainer: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  todaySpendingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  todayAmount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  todayTransactions: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  topSpendingList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  spendingDayCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  spendingDayInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  spendingDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  spendingAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  spendingTransactions: {
    fontSize: 12,
    fontWeight: '500',
  },
  monthlyStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  dayDetailsContainer: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  dayDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  noEventsText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  eventsListContainer: {
    gap: 12,
  },
});

export default CalendarComponent;