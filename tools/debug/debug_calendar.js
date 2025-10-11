/**
 * Calendar Component Debug Test
 * 
 * This script helps debug calendar component issues by testing with mock data
 */

const testCalendarData = {
  year: 2024,
  month: 11, // December
  monthName: 'December',
  totalIncome: 5000,
  totalExpenses: 3000,
  netAmount: 2000,
  days: [
    // Generate some sample days with events
    {
      date: '2024-12-01',
      dayOfMonth: 1,
      isCurrentMonth: true,
      isToday: false,
      events: [
        {
          id: 'test-1',
          title: 'Grocery Shopping',
          amount: 150,
          type: 'expense',
          category: 'Food & Dining',
          date: '2024-12-01',
          description: 'Weekly groceries',
          isRecurring: false
        }
      ],
      totalIncome: 0,
      totalExpenses: 150,
      netAmount: -150
    },
    {
      date: '2024-12-02',
      dayOfMonth: 2,
      isCurrentMonth: true,
      isToday: false,
      events: [
        {
          id: 'test-2',
          title: 'Salary',
          amount: 5000,
          type: 'income',
          category: 'Income',
          date: '2024-12-02',
          description: 'Monthly salary',
          isRecurring: true
        }
      ],
      totalIncome: 5000,
      totalExpenses: 0,
      netAmount: 5000
    },
    {
      date: '2024-12-03',
      dayOfMonth: 3,
      isCurrentMonth: true,
      isToday: true,
      events: [
        {
          id: 'test-3',
          title: 'Coffee',
          amount: 50,
          type: 'expense',
          category: 'Food & Dining',
          date: '2024-12-03',
          description: 'Morning coffee',
          isRecurring: false
        },
        {
          id: 'test-4',
          title: 'Bus Ticket',
          amount: 25,
          type: 'expense',
          category: 'Transportation',
          date: '2024-12-03',
          description: 'Daily commute',
          isRecurring: false
        }
      ],
      totalIncome: 0,
      totalExpenses: 75,
      netAmount: -75
    }
  ]
};

console.log('📅 Calendar Component Debug Data');
console.log('==================================');
console.log();

console.log('📊 Monthly Summary:');
console.log(`   Total Income: ₹${testCalendarData.totalIncome.toFixed(2)}`);
console.log(`   Total Expenses: ₹${testCalendarData.totalExpenses.toFixed(2)}`);
console.log(`   Net Amount: ₹${testCalendarData.netAmount.toFixed(2)}`);
console.log();

console.log('📋 Sample Days with Events:');
testCalendarData.days.forEach((day, index) => {
  console.log(`   Day ${day.dayOfMonth} (${day.date}):`);
  console.log(`     - Events: ${day.events.length}`);
  console.log(`     - Income: ₹${day.totalIncome}`);
  console.log(`     - Expenses: ₹${day.totalExpenses}`);
  console.log(`     - Net: ₹${day.netAmount}`);
  
  day.events.forEach((event, eventIndex) => {
    console.log(`       ${eventIndex + 1}. ${event.title} - ${event.type === 'income' ? '+' : '-'}₹${event.amount}`);
  });
  console.log();
});

console.log('🔍 Debugging Tips:');
console.log('1. Check if CalendarService.getCalendarMonth() returns data in this format');
console.log('2. Verify Enhanced Firebase Service includes both manual and scanner transactions');
console.log('3. Check if TransactionCard component renders properly with this data');
console.log('4. Ensure theme colors are being applied correctly');
console.log('5. Verify modal presentation and scrolling work on device');
console.log();

console.log('✅ Use this data structure to test calendar component manually');
console.log('Copy this object into CalendarComponent for testing if needed');

// Export for potential use in testing
module.exports = { testCalendarData };