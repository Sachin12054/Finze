import { Expense, getAllExpenses } from './databaseService';
import { auth } from './firebase/firebase';

export interface CalendarEvent {
  id: string;
  title: string;
  amount: number;
  category: string;
  time: string;
  type: 'expense' | 'income';
  description?: string;
}

export interface CalendarDay {
  date: string; // ISO date string
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  totalExpenses: number;
  totalIncome: number;
  events: CalendarEvent[];
  weekday: string;
}

export interface CalendarMonth {
  year: number;
  month: number;
  monthName: string;
  days: CalendarDay[];
  totalExpenses: number;
  totalIncome: number;
  totalTransactions: number;
  previousMonth: {
    year: number;
    month: number;
  };
  nextMonth: {
    year: number;
    month: number;
  };
}

class CalendarServiceClass {
  /**
   * Get calendar data for a specific month
   */
  async getCalendarMonth(year: number, month: number): Promise<CalendarMonth> {
    try {
      console.log(`📅 Loading calendar data for ${year}-${month + 1}`);
      
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get all expenses for the user
      const allExpenses = await getAllExpenses(userId);
      
      // Filter expenses for the specific month
      const monthExpenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
      });

      // Generate calendar structure
      const calendarData = this.generateCalendarMonth(year, month, monthExpenses);
      
      console.log(`✅ Calendar loaded: ${calendarData.days.length} days, ${calendarData.totalTransactions} transactions`);
      return calendarData;
    } catch (error) {
      console.error('❌ Error loading calendar data:', error);
      throw error;
    }
  }

  private generateCalendarMonth(year: number, month: number, expenses: Expense[]): CalendarMonth {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    
    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End on Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    // Group expenses by date
    const expensesByDate = this.groupExpensesByDate(expenses);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayExpenses = expensesByDate[dateStr] || [];
      
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = this.isSameDate(currentDate, today);
      
      // Convert expenses to calendar events
      const events: CalendarEvent[] = dayExpenses.map(expense => ({
        id: expense.id,
        title: expense.title || expense.description || 'Transaction',
        amount: expense.amount,
        category: expense.category || expense.type || 'Other',
        time: this.formatTime(expense.date),
        type: 'expense' as const,
        description: expense.description
      }));

      const totalExpenses = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      days.push({
        date: dateStr,
        dayNumber: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        totalExpenses,
        totalIncome: 0, // For now, we're only handling expenses
        events,
        weekday: currentDate.toLocaleDateString('en-US', { weekday: 'short' })
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate totals for the month
    const monthlyExpenses = days
      .filter(day => day.isCurrentMonth)
      .reduce((sum, day) => sum + day.totalExpenses, 0);
    
    const monthlyTransactions = days
      .filter(day => day.isCurrentMonth)
      .reduce((sum, day) => sum + day.events.length, 0);

    return {
      year,
      month,
      monthName: new Date(year, month).toLocaleDateString('en-US', { month: 'long' }),
      days,
      totalExpenses: monthlyExpenses,
      totalIncome: 0,
      totalTransactions: monthlyTransactions,
      previousMonth: {
        year: month === 0 ? year - 1 : year,
        month: month === 0 ? 11 : month - 1
      },
      nextMonth: {
        year: month === 11 ? year + 1 : year,
        month: month === 11 ? 0 : month + 1
      }
    };
  }

  private groupExpensesByDate(expenses: Expense[]): { [date: string]: Expense[] } {
    const grouped: { [date: string]: Expense[] } = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(expense);
    });
    
    return grouped;
  }

  private formatTime(date: string | Date): string {
    const dateObj = new Date(date);
    return dateObj.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Get expenses for a specific date
   */
  async getExpensesForDate(date: Date): Promise<CalendarEvent[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const allExpenses = await getAllExpenses(userId);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayExpenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const expenseDateStr = expenseDate.toISOString().split('T')[0];
        return expenseDateStr === dateStr;
      });

      return dayExpenses.map(expense => ({
        id: expense.id,
        title: expense.title || expense.description || 'Transaction',
        amount: expense.amount,
        category: expense.category || expense.type || 'Other',
        time: this.formatTime(expense.date),
        type: 'expense' as const,
        description: expense.description
      }));
    } catch (error) {
      console.error('❌ Error getting expenses for date:', error);
      return [];
    }
  }

  /**
   * Get calendar overview for current month
   */
  async getCurrentMonthOverview(): Promise<{
    totalExpenses: number;
    totalTransactions: number;
    averageDaily: number;
    topSpendingDay: { date: string; amount: number };
  }> {
    try {
      const now = new Date();
      const calendarData = await this.getCalendarMonth(now.getFullYear(), now.getMonth());
      
      const currentMonthDays = calendarData.days.filter(day => day.isCurrentMonth);
      const daysWithExpenses = currentMonthDays.filter(day => day.totalExpenses > 0);
      
      const topDay = currentMonthDays.reduce((max, day) => 
        day.totalExpenses > max.totalExpenses ? day : max,
        { totalExpenses: 0, date: '' }
      );

      return {
        totalExpenses: calendarData.totalExpenses,
        totalTransactions: calendarData.totalTransactions,
        averageDaily: daysWithExpenses.length > 0 ? calendarData.totalExpenses / daysWithExpenses.length : 0,
        topSpendingDay: {
          date: topDay.date,
          amount: topDay.totalExpenses
        }
      };
    } catch (error) {
      console.error('❌ Error getting month overview:', error);
      return {
        totalExpenses: 0,
        totalTransactions: 0,
        averageDaily: 0,
        topSpendingDay: { date: '', amount: 0 }
      };
    }
  }
}

export const CalendarService = new CalendarServiceClass();
export default CalendarService;