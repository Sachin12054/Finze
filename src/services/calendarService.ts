import { EnhancedFirebaseService } from './enhancedFirebaseService';

export interface CalendarEvent {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
}

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
}

export interface CalendarMonth {
  year: number;
  month: number;
  monthName: string;
  days: CalendarDay[];
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
}

export class CalendarService {
  // Generate calendar data for a specific month
  static async getCalendarMonth(year: number, month: number): Promise<CalendarMonth> {
    try {
      // Get start and end dates for the month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      // Adjust to include surrounding days for complete calendar view
      const calendarStart = new Date(startDate);
      calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());
      
      const calendarEnd = new Date(endDate);
      calendarEnd.setDate(calendarEnd.getDate() + (6 - calendarEnd.getDay()));

      // Fetch transactions for the period - force fresh data
      const transactions = await EnhancedFirebaseService.getTransactionsByDateRange(
        calendarStart.toISOString(),
        calendarEnd.toISOString()
      );

      // Generate calendar days
      const days: CalendarDay[] = [];
      let totalIncome = 0;
      let totalExpenses = 0;

      for (let date = new Date(calendarStart); date <= calendarEnd; date.setDate(date.getDate() + 1)) {
        const currentDate = new Date(date);
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Filter transactions for this day
        const dayTransactions = transactions.filter(transaction => 
          transaction.date.split('T')[0] === dateString
        );

        // Convert transactions to calendar events
        const events: CalendarEvent[] = dayTransactions.map(transaction => ({
          id: transaction.id!,
          title: transaction.title,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          date: transaction.date,
          description: transaction.description,
          isRecurring: transaction.source === 'Recurring',
          recurrencePattern: transaction.source === 'Recurring' ? 'Monthly' : undefined,
        }));

        // Calculate day totals
        const dayIncome = events
          .filter(event => event.type === 'income')
          .reduce((sum, event) => sum + event.amount, 0);
        
        const dayExpenses = events
          .filter(event => event.type === 'expense')
          .reduce((sum, event) => sum + event.amount, 0);

        // Add to month totals if it's in the current month
        if (currentDate.getMonth() === month) {
          totalIncome += dayIncome;
          totalExpenses += dayExpenses;
        }

        days.push({
          date: dateString,
          dayOfMonth: currentDate.getDate(),
          isCurrentMonth: currentDate.getMonth() === month,
          isToday: dateString === new Date().toISOString().split('T')[0],
          events,
          totalIncome: dayIncome,
          totalExpenses: dayExpenses,
          netAmount: dayIncome - dayExpenses,
        });
      }

      return {
        year,
        month,
        monthName: new Date(year, month).toLocaleString('default', { month: 'long' }),
        days,
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
      };
    } catch (error) {
      console.error('Error generating calendar month:', error);
      throw new Error('Failed to load calendar data');
    }
  }

  // Get events for a specific date
  static async getEventsForDate(date: string): Promise<CalendarEvent[]> {
    try {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const transactions = await EnhancedFirebaseService.getTransactionsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );

      return transactions.map(transaction => ({
        id: transaction.id!,
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        description: transaction.description,
        isRecurring: transaction.source === 'Recurring',
        recurrencePattern: transaction.source === 'Recurring' ? 'Monthly' : undefined,
      }));
    } catch (error) {
      console.error('Error fetching events for date:', error);
      return [];
    }
  }

  // Get upcoming recurring transactions
  static async getUpcomingRecurring(days: number = 30): Promise<CalendarEvent[]> {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const recurringTransactions = await EnhancedFirebaseService.getRecurringTransactions();
      const upcomingEvents: CalendarEvent[] = [];

      recurringTransactions.forEach(recurring => {
        // Generate upcoming occurrences based on recurrence pattern
        const events = this.generateRecurringEvents(recurring, new Date(), endDate);
        upcomingEvents.push(...events);
      });

      return upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error fetching upcoming recurring events:', error);
      return [];
    }
  }

  // Helper method to generate recurring events
  private static generateRecurringEvents(
    recurring: any,
    startDate: Date,
    endDate: Date
  ): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const current = new Date(Math.max(startDate.getTime(), new Date(recurring.nextDue).getTime()));

    while (current <= endDate) {
      events.push({
        id: `${recurring.id}-${current.toISOString()}`,
        title: recurring.title,
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category,
        date: current.toISOString(),
        description: recurring.description,
        isRecurring: true,
        recurrencePattern: recurring.frequency,
      });

      // Move to next occurrence based on frequency
      switch (recurring.frequency) {
        case 'daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'yearly':
          current.setFullYear(current.getFullYear() + 1);
          break;
        default:
          return events; // Unknown frequency, stop generating
      }
    }

    return events;
  }

  // Get calendar statistics for a month
  static async getMonthlyStats(year: number, month: number) {
    try {
      const calendarMonth = await this.getCalendarMonth(year, month);
      
      // Category breakdown
      const categoryStats: { [key: string]: { income: number; expenses: number } } = {};
      
      calendarMonth.days.forEach(day => {
        if (day.isCurrentMonth) {
          day.events.forEach(event => {
            if (!categoryStats[event.category]) {
              categoryStats[event.category] = { income: 0, expenses: 0 };
            }
            
            if (event.type === 'income') {
              categoryStats[event.category].income += event.amount;
            } else {
              categoryStats[event.category].expenses += event.amount;
            }
          });
        }
      });

      // Daily averages
      const activeDays = calendarMonth.days.filter(day => 
        day.isCurrentMonth && day.events.length > 0
      ).length;

      return {
        totalIncome: calendarMonth.totalIncome,
        totalExpenses: calendarMonth.totalExpenses,
        netAmount: calendarMonth.netAmount,
        averageDailyIncome: activeDays > 0 ? calendarMonth.totalIncome / activeDays : 0,
        averageDailyExpenses: activeDays > 0 ? calendarMonth.totalExpenses / activeDays : 0,
        activeDays,
        totalTransactions: calendarMonth.days.reduce((sum, day) => 
          day.isCurrentMonth ? sum + day.events.length : sum, 0
        ),
        categoryStats,
      };
    } catch (error) {
      console.error('Error calculating monthly stats:', error);
      throw new Error('Failed to calculate monthly statistics');
    }
  }
}

export default CalendarService;
