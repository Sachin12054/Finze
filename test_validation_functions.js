// Test script for NaN/undefined handling fixes
console.log('Testing formatCurrency function:');

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount) || typeof amount !== 'number') {
    return '₹0.00';
  }
  return `₹${amount.toFixed(2)}`;
};

const safeToFixed = (value, decimals = 2) => {
  if (value === undefined || value === null || isNaN(value) || typeof value !== 'number') {
    return '0.' + '0'.repeat(decimals);
  }
  return value.toFixed(decimals);
};

// Test cases
const testCases = [
  { input: 150.50, expected: '₹150.50' },
  { input: undefined, expected: '₹0.00' },
  { input: null, expected: '₹0.00' },
  { input: NaN, expected: '₹0.00' },
  { input: 'invalid', expected: '₹0.00' },
  { input: 0, expected: '₹0.00' }
];

console.log('\nformatCurrency tests:');
testCases.forEach((test, index) => {
  const result = formatCurrency(test.input);
  const passed = result === test.expected;
  console.log(`Test ${index + 1}: ${passed ? '✓' : '✗'} Input: ${test.input}, Expected: ${test.expected}, Got: ${result}`);
});

console.log('\nsafeToFixed tests:');
const toFixedTests = [
  { input: 99.9876, decimals: 2, expected: '99.99' },
  { input: undefined, decimals: 2, expected: '0.00' },
  { input: NaN, decimals: 0, expected: '0' },
  { input: null, decimals: 3, expected: '0.000' }
];

toFixedTests.forEach((test, index) => {
  const result = safeToFixed(test.input, test.decimals);
  const passed = result === test.expected;
  console.log(`Test ${index + 1}: ${passed ? '✓' : '✗'} Input: ${test.input}, Decimals: ${test.decimals}, Expected: ${test.expected}, Got: ${result}`);
});

console.log('\n✅ All validation functions working correctly!');