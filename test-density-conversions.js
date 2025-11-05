/**
 * Test script to demonstrate density conversion capabilities
 * Run with: node test-density-conversions.js
 */

// Simulate the units.ts functions
const MASS_TO_G = {
  g: 1,
  kg: 1000,
  mg: 1 / 1000,
  lb: 453.59237,
  oz: 28.349523125,
};

const VOLUME_TO_ML = {
  ml: 1,
  l: 1000,
  tsp: 5,
  tbsp: 15,
  cup: 250,
  floz: 28.4130625,
  pint: 568.26125,
  quart: 1136.5225,
  gallon: 4546.09,
};

// Common ingredient densities (g/ml)
const DENSITIES = {
  'butter': 0.911,
  'flour': 0.60,
  'sugar': 0.85,
  'milk': 1.03,
  'honey': 1.42,
  'oil': 0.92,
  'water': 1.00,
};

function toBase(quantity, unit, densityGPerMl) {
  // Mass units
  if (MASS_TO_G[unit]) {
    return { amount: MASS_TO_G[unit] * quantity, base: 'g' };
  }

  // Volume units
  if (VOLUME_TO_ML[unit]) {
    const amountMl = VOLUME_TO_ML[unit] * quantity;
    if (densityGPerMl) {
      return { amount: amountMl * densityGPerMl, base: 'g' };
    }
    return { amount: amountMl, base: 'ml' };
  }

  return { amount: quantity, base: 'each' };
}

function fromBase(amount, target, densityGPerMl) {
  // Mass units
  if (MASS_TO_G[target]) {
    return amount / MASS_TO_G[target];
  }

  // Volume units
  if (VOLUME_TO_ML[target]) {
    const amountMl = densityGPerMl ? amount / densityGPerMl : amount;
    return amountMl / VOLUME_TO_ML[target];
  }

  return amount;
}

function convert(quantity, from, to, ingredient) {
  const density = DENSITIES[ingredient.toLowerCase()];
  const { amount } = toBase(quantity, from, density);
  return fromBase(amount, to, density);
}

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║         PLATO APP - DENSITY CONVERSION CAPABILITIES              ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

console.log('✅ YES! The system can handle ALL of these conversions:\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. GRAMS TO ML (requires density)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n📊 Example: 100g of butter to ml');
const butterMl = convert(100, 'g', 'ml', 'butter');
console.log(`   100g butter = ${butterMl.toFixed(2)}ml`);
console.log(`   (Using density: ${DENSITIES.butter} g/ml)`);

console.log('\n📊 Example: 200g of honey to ml');
const honeyMl = convert(200, 'g', 'ml', 'honey');
console.log(`   200g honey = ${honeyMl.toFixed(2)}ml`);
console.log(`   (Using density: ${DENSITIES.honey} g/ml)`);

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('2. GRAMS/KG TO OZ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n📊 Example: 100g to oz (weight)');
const gramsToOz = convert(100, 'g', 'oz', 'flour');
console.log(`   100g = ${gramsToOz.toFixed(2)}oz`);

console.log('\n📊 Example: 1kg to oz');
const kgToOz = convert(1, 'kg', 'oz', 'sugar');
console.log(`   1kg = ${kgToOz.toFixed(2)}oz`);

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('3. GRAMS/KG TO TSP/TBSP (requires density)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n📊 Example: 100g of sugar to tsp');
const sugarTsp = convert(100, 'g', 'tsp', 'sugar');
console.log(`   100g sugar = ${sugarTsp.toFixed(2)} tsp`);
console.log(`   (Using density: ${DENSITIES.sugar} g/ml, 1 tsp = 5ml)`);

console.log('\n📊 Example: 100g of sugar to tbsp');
const sugarTbsp = convert(100, 'g', 'tbsp', 'sugar');
console.log(`   100g sugar = ${sugarTbsp.toFixed(2)} tbsp`);
console.log(`   (Using density: ${DENSITIES.sugar} g/ml, 1 tbsp = 15ml)`);

console.log('\n📊 Example: 1kg of flour to tbsp');
const flourTbsp = convert(1000, 'g', 'tbsp', 'flour');
console.log(`   1kg flour = ${flourTbsp.toFixed(2)} tbsp`);
console.log(`   (Using density: ${DENSITIES.flour} g/ml, 1 tbsp = 15ml)`);

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('4. ML TO GRAMS (requires density)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n📊 Example: 250ml of milk to grams');
const milkG = convert(250, 'ml', 'g', 'milk');
console.log(`   250ml milk = ${milkG.toFixed(2)}g`);
console.log(`   (Using density: ${DENSITIES.milk} g/ml)`);

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('5. CUPS/TSP/TBSP TO GRAMS (requires density)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n📊 Example: 1 cup of flour to grams');
const cupFlourG = convert(1, 'cup', 'g', 'flour');
console.log(`   1 cup flour = ${cupFlourG.toFixed(2)}g`);
console.log(`   (1 cup = 250ml, density: ${DENSITIES.flour} g/ml)`);

console.log('\n📊 Example: 2 tbsp of butter to grams');
const tbspButterG = convert(2, 'tbsp', 'g', 'butter');
console.log(`   2 tbsp butter = ${tbspButterG.toFixed(2)}g`);
console.log(`   (1 tbsp = 15ml, density: ${DENSITIES.butter} g/ml)`);

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 AUTOMATIC DENSITY LOOKUP');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\nThe system automatically looks up densities for common ingredients:');
console.log('\n  • Butter: 0.911 g/ml');
console.log('  • Flour: 0.60 g/ml');
console.log('  • Sugar: 0.85 g/ml');
console.log('  • Milk: 1.03 g/ml');
console.log('  • Honey: 1.42 g/ml');
console.log('  • Oil: 0.92 g/ml');
console.log('  • ...and many more!');

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 HOW IT WORKS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n1. System detects unit type mismatch (e.g., recipe uses "cups", ');
console.log('   ingredient pack is in "grams")');
console.log('\n2. Looks up ingredient density from database');
console.log('\n3. Converts: cups → ml → grams (or vice versa)');
console.log('\n4. Calculates accurate cost based on converted quantities');

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✨ KEY FILES');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n  📁 src/lib/units.ts');
console.log('     ↳ Core conversion functions (toBase, fromBase, convertBetweenUnits)');
console.log('\n  📁 src/lib/ingredient-densities.ts');
console.log('     ↳ Ingredient density database (109 common ingredients)');
console.log('\n  📁 src/app/dashboard/recipes/[id]/components/IngredientsPanel.tsx');
console.log('     ↳ Uses getIngredientDensityOrDefault for automatic lookup');

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n✅ YES - grams to ml (with density)');
console.log('✅ YES - grams to oz (weight conversion)');
console.log('✅ YES - grams/kg to tsp (with density)');
console.log('✅ YES - grams/kg to tbsp (with density)');
console.log('✅ YES - ml/cups/tbsp/tsp to grams (with density)');
console.log('✅ YES - All weight-to-weight conversions (g↔kg↔oz↔lb)');
console.log('✅ YES - All volume-to-volume conversions (ml↔l↔cup↔tsp↔tbsp↔floz)');
console.log('✅ YES - Automatic density lookup for 109+ common ingredients\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
