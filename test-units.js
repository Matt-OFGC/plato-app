// Test unit conversion logic
const { toBase, fromBase, convertBetweenUnits } = require('./src/lib/units.ts');

console.log('Testing unit conversions...');

// Test 1: Basic mass conversion
try {
  const result1 = toBase(1, 'kg', undefined);
  console.log('1 kg to base:', result1); // Should be { amount: 1000, base: 'g' }
} catch (error) {
  console.log('Error in test 1:', error.message);
}

// Test 2: Volume conversion
try {
  const result2 = toBase(1, 'l', undefined);
  console.log('1 l to base:', result2); // Should be { amount: 1000, base: 'ml' }
} catch (error) {
  console.log('Error in test 2:', error.message);
}

// Test 3: Cross-unit conversion
try {
  const result3 = convertBetweenUnits(1, 'kg', 'g', undefined);
  console.log('1 kg to g:', result3); // Should be 1000
} catch (error) {
  console.log('Error in test 3:', error.message);
}

console.log('Unit conversion tests completed.');
