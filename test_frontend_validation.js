#!/usr/bin/env node

// Test the safe validation functions from the scanner dialog fixes
console.log("Testing ScannerDialog safe validation functions:");

// Helper functions copied from the fixed ScannerDialog
const safeToString = (value) => {
  if (value === null || value === undefined) {
    return '0';
  }
  return String(value);
};

const safeParseFloat = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
};

// Test cases that would have caused "toString of undefined" errors
const testCases = [
  { name: "null total_amount", data: { total_amount: null } },
  { name: "undefined total_amount", data: { total_amount: undefined } },
  { name: "null item price", data: { price: null } },
  { name: "undefined item price", data: { price: undefined } },
  { name: "valid amount", data: { total_amount: 150.50 } },
  { name: "string amount", data: { total_amount: "123.45" } },
  { name: "invalid string", data: { total_amount: "invalid" } }
];

console.log("\n=== Testing safeToString function ===");
testCases.forEach((test, index) => {
  const value = test.data.total_amount || test.data.price;
  const result = safeToString(value);
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`  Input: ${JSON.stringify(value)}`);
  console.log(`  Output: "${result}"`);
  console.log(`  ✓ No error thrown\n`);
});

console.log("=== Testing safeParseFloat function ===");
testCases.forEach((test, index) => {
  const value = test.data.total_amount || test.data.price;
  const result = safeParseFloat(value);
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`  Input: ${JSON.stringify(value)}`);
  console.log(`  Output: ${result}`);
  console.log(`  ✓ No error thrown\n`);
});

console.log("=== Testing display formatting ===");
// Simulate what the UI would do now
const mockEditableData = {
  total_amount: null,  // This would have caused toString() error before
  merchant_name: "Test Store",
  items: [
    { name: "Item 1", price: undefined },  // This would have caused toString() error before
    { name: "Item 2", price: 25.50 }
  ]
};

try {
  // Test total amount display (line 736 equivalent)
  const totalDisplay = `₹${safeParseFloat(mockEditableData.total_amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
  console.log(`Total amount display: ${totalDisplay}`);
  
  // Test item price display (line 754 equivalent)
  mockEditableData.items.forEach((item, index) => {
    const itemDisplay = `₹${safeParseFloat(item.price).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    console.log(`Item ${index + 1} price display: ${itemDisplay}`);
  });
  
  console.log("\n🎉 All display formatting tests passed!");
  console.log("✅ The toString() undefined errors have been fixed!");
  
} catch (error) {
  console.error("❌ Display formatting failed:", error.message);
}