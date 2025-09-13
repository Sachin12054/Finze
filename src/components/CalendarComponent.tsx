import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CalendarDay, CalendarEvent, CalendarMonth, CalendarService } from '../services/calendarService';

interface CalendarComponentProps {
  visible: boolean;
  onClose: () => void;
}

export const CalendarComponent: React.FC<CalendarComponentProps> = ({
  visible,
  onClose,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarMonth | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [loading, setLoading] = useState(false);

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
      Alert.alert('Error', 'Failed to load calendar data');
      console.error('Calendar loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadCalendarData();
    }
  }, [visible, currentDate]);

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
          { backgroundColor: event.type === 'income' ? '#10B981' : '#EF4444' }
        ]}
      />
    ));
  };

  const renderCalendarDay = ({ item: day }: { item: CalendarDay }) => {
    const isSelected = selectedDay?.date === day.date;
    const hasEvents = day.events.length > 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.dayContainer,
          !day.isCurrentMonth && styles.dayOutOfMonth,
          day.isToday && styles.dayToday,
          isSelected && styles.daySelected,
        ]}
        onPress={() => setSelectedDay(day)}
      >
        <Text
          style={[
            styles.dayText,
            !day.isCurrentMonth && styles.dayTextOutOfMonth,
            day.isToday && styles.dayTextToday,
            isSelected && styles.dayTextSelected,
          ]}
        >
          {day.dayOfMonth}
        </Text>
        
        {hasEvents && (
          <View style={styles.eventsContainer}>
            {renderDayEvents(day.events)}
            {day.events.length > 2 && (
              <Text style={styles.moreEventsText}>+{day.events.length - 2}</Text>
            )}
          </View>
        )}

        {hasEvents && (
          <View style={styles.dayAmountContainer}>
            {day.totalIncome > 0 && (
              <Text style={styles.incomeText}>+₹{day.totalIncome}</Text>
            )}
            {day.totalExpenses > 0 && (
              <Text style={styles.expenseText}>-₹{day.totalExpenses}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEventDetails = (event: CalendarEvent) => (
    <View key={event.id} style={styles.eventDetail}>
      <View style={styles.eventHeader}>
        <View
          style={[
            styles.eventTypeIndicator,
            { backgroundColor: event.type === 'income' ? '#10B981' : '#EF4444' }
          ]}
        />
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text
          style={[
            styles.eventAmount,
            { color: event.type === 'income' ? '#10B981' : '#EF4444' }
          ]}
        >
          {event.type === 'income' ? '+' : '-'}₹{event.amount.toFixed(2)}
        </Text>
      </View>
      <Text style={styles.eventCategory}>{event.category}</Text>
      {event.description && (
        <Text style={styles.eventDescription}>{event.description}</Text>
      )}
      {event.isRecurring && (
        <View style={styles.recurringBadge}>
          <Ionicons name="repeat" size={12} color="#6366F1" />
          <Text style={styles.recurringText}>Recurring</Text>
        </View>
      )}
    </View>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <TouchableOpacity
                onPress={() => navigateMonth('prev')}
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={20} color="white" />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>
                {calendarData?.monthName} {calendarData?.year}
              </Text>
              
              <TouchableOpacity
                onPress={() => navigateMonth('next')}
                style={styles.navButton}
              >
                <Ionicons name="chevron-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.monthTotal}>
                Net: ₹{calendarData?.netAmount.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content}>
          {/* Calendar Grid */}
          <View style={styles.calendarContainer}>
            {/* Day Headers */}
            <View style={styles.dayHeaders}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.dayHeaderText}>
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

          {/* Month Summary */}
          {calendarData && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Monthly Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Income</Text>
                  <Text style={[styles.summaryValue, styles.incomeColor]}>
                    +₹{calendarData.totalIncome.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Expenses</Text>
                  <Text style={[styles.summaryValue, styles.expenseColor]}>
                    -₹{calendarData.totalExpenses.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Net Amount</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      calendarData.netAmount >= 0 ? styles.incomeColor : styles.expenseColor
                    ]}
                  >
                    {calendarData.netAmount >= 0 ? '+' : ''}₹{calendarData.netAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Selected Day Details */}
          {selectedDay && (
            <View style={styles.dayDetailsContainer}>
              <Text style={styles.dayDetailsTitle}>
                {new Date(selectedDay.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              
              {selectedDay.events.length === 0 ? (
                <Text style={styles.noEventsText}>No transactions on this day</Text>
              ) : (
                <View style={styles.eventsListContainer}>
                  {selectedDay.events.map(renderEventDetails)}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  navButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginHorizontal: 20,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  monthTotal: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#6B7280',
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
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayOutOfMonth: {
    backgroundColor: 'transparent',
  },
  dayToday: {
    backgroundColor: '#EBF4FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  daySelected: {
    backgroundColor: '#6366F1',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  dayTextOutOfMonth: {
    color: '#D1D5DB',
  },
  dayTextToday: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  dayTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
  eventsContainer: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  moreEventsText: {
    fontSize: 8,
    color: '#6B7280',
  },
  dayAmountContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  incomeText: {
    fontSize: 8,
    color: '#10B981',
    fontWeight: '600',
  },
  expenseText: {
    fontSize: 8,
    color: '#EF4444',
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  incomeColor: {
    color: '#10B981',
  },
  expenseColor: {
    color: '#EF4444',
  },
  dayDetailsContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  noEventsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 20,
  },
  eventsListContainer: {
    gap: 12,
  },
  eventDetail: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTypeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  eventAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  eventCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
    marginBottom: 4,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 16,
  },
  recurringText: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default CalendarComponent;