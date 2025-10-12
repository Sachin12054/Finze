/**
 * Test script for time period functionality
 */
const { getDateRange, getPeriodDisplayText, getPeriodEmoji } = require('./src/services/databaseService');

function testTimePeriods() {
  console.log('🔍 Testing time period functionality...\n');
  
  const periods = ['day', 'week', 'month', 'year'];
  
  periods.forEach(period => {
    const range = getDateRange(period);
    const displayText = getPeriodDisplayText(period);
    const emoji = getPeriodEmoji(period);
    
    console.log(`${emoji} ${period.toUpperCase()}`);
    console.log(`   Display: ${displayText}`);
    console.log(`   Range: ${range.start.toISOString().split('T')[0]} to ${range.end.toISOString().split('T')[0]}`);
    console.log(`   Days: ${Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24))} days`);
    console.log('');
  });
  
  // Test date filtering
  console.log('📊 Testing date filtering:');
  const testDates = [
    new Date(), // Today
    new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
    new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days ago
  ];
  
  testDates.forEach((date, index) => {
    console.log(`   Date ${index + 1}: ${date.toLocaleDateString()}`);
    periods.forEach(period => {
      const range = getDateRange(period);
      const isInRange = date >= range.start && date <= range.end;
      console.log(`     ${period}: ${isInRange ? '✅' : '❌'}`);
    });
    console.log('');
  });
}

// Only run if this file is executed directly
if (require.main === module) {
  testTimePeriods();
}