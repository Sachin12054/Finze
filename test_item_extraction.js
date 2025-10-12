/**
 * Test script for item extraction functionality
 */

// Simulate the extractItemsFromText function
function extractItemsFromText(extractedText, totalAmount) {
  console.log('🔍 Extracting items from text:', extractedText);
  
  const items = [];
  const lines = extractedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Common patterns for Indian receipts
  const itemPatterns = [
    // Pattern: "Item Name ₹123.45" or "Item Name Rs 123.45" or "Item Name 123.45"
    /^(.+?)(?:\s+[₹Rs\.]+\s*)?(\d+(?:\.\d{1,2})?)$/,
    // Pattern: "Item Name x1 ₹123.45"  
    /^(.+?)\s*x(\d+)\s*[₹Rs\.]*\s*(\d+(?:\.\d{1,2})?)$/,
    // Pattern: "1. Item Name ₹123.45"
    /^\d+\.?\s*(.+?)(?:\s+[₹Rs\.]+\s*)?(\d+(?:\.\d{1,2})?)$/,
    // Pattern: "Item Name Qty: 1 ₹123.45"
    /^(.+?)\s*(?:Qty:|Quantity:)?\s*(\d+)?\s*[₹Rs\.]*\s*(\d+(?:\.\d{1,2})?)$/
  ];
  
  const skipWords = ['subtotal', 'total', 'gst', 'tax', 'discount', 'amount', 'bill', 'receipt', 'thank you', 'visit again', 'pvt', 'ltd', 'street', 'phone', 'mobile'];
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Skip header/footer lines
    if (skipWords.some(word => lowerLine.includes(word))) {
      continue;
    }
    
    // Skip if line contains date patterns
    if (/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(line)) {
      continue;
    }
    
    // Try each pattern
    for (const pattern of itemPatterns) {
      const match = line.match(pattern);
      if (match) {
        let itemName = '';
        let price = 0;
        let quantity = 1;
        
        if (pattern.source.includes('x(')) {
          // Pattern with quantity
          itemName = match[1]?.trim();
          quantity = parseInt(match[2]) || 1;
          price = parseFloat(match[3]) || 0;
        } else if (match.length === 3) {
          // Simple pattern
          itemName = match[1]?.trim();
          price = parseFloat(match[2]) || 0;
        }
        
        if (itemName && itemName.length > 2 && price > 0) {
          console.log(`✅ Found item: ${itemName} - ₹${price} (Qty: ${quantity})`);
          items.push({
            name: itemName,
            price: price,
            quantity: quantity
          });
          break; // Move to next line after finding a match
        }
      }
    }
  }
  
  // If no items found but we have a total, try to create a generic item
  if (items.length === 0 && totalAmount > 0) {
    const merchantMatch = extractedText.match(/^([^₹\n]+)/);
    const itemName = merchantMatch ? merchantMatch[1].trim() : 'Purchase';
    
    console.log(`📝 Creating generic item: ${itemName} - ₹${totalAmount}`);
    items.push({
      name: itemName,
      price: totalAmount,
      quantity: 1
    });
  }
  
  console.log(`🔍 Extracted ${items.length} items:`, items);
  return items;
}

// Test cases based on your actual receipt
const testCases = [
  {
    name: "KFC Receipt",
    text: `KFC Devyani Food Street Pvt.Ltd
Food & Dining
Krushers Chocolash ₹150.00
Regular Strawberry Swirl ₹116.67
Subtotal: ₹266.67
GST: ₹13.33
Total: ₹280.00`,
    expectedTotal: 280.00
  },
  {
    name: "Generic Receipt",
    text: `SuperMart India
Milk (1L) ₹65.50
Bread (2 pcs) x2 ₹80.00
Eggs (12 pcs) ₹120.00
Fresh Fruits ₹185.00
Subtotal: ₹1130.50
GST: ₹120.00
Total: ₹1250.50`,
    expectedTotal: 1250.50
  },
  {
    name: "Simple Receipt",
    text: `Restaurant ABC
1. Biryani ₹250
2. Lassi ₹50
Total: ₹300`,
    expectedTotal: 300.00
  }
];

console.log('🧪 Testing Item Extraction Functionality\n');

testCases.forEach((testCase, index) => {
  console.log(`\n--- Test ${index + 1}: ${testCase.name} ---`);
  console.log('Input text:');
  console.log(testCase.text);
  console.log('\nExtraction result:');
  
  const extractedItems = extractItemsFromText(testCase.text, testCase.expectedTotal);
  
  const extractedTotal = extractedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  console.log(`\n📊 Summary: ${extractedItems.length} items, Total: ₹${extractedTotal.toFixed(2)}`);
  
  if (Math.abs(extractedTotal - testCase.expectedTotal) < 1) {
    console.log('✅ PASS: Total matches expected amount');
  } else {
    console.log(`❌ FAIL: Expected ₹${testCase.expectedTotal}, got ₹${extractedTotal.toFixed(2)}`);
  }
  
  console.log('=' .repeat(50));
});

console.log('\n🎉 Item extraction testing completed!');