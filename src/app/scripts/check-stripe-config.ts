/**
 * Script to check your current Stripe configuration
 * Run with: npx tsx scripts/check-stripe-config.ts
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

console.log('\n🔍 Checking Stripe Configuration...\n');

// Required environment variables based on stripe.ts
const requiredVars = {
  // Core Stripe keys
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Professional plan
  STRIPE_PROFESSIONAL_PRODUCT_ID: process.env.STRIPE_PROFESSIONAL_PRODUCT_ID,
  STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
  STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID: process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID,
  
  // Team plan
  STRIPE_TEAM_PRODUCT_ID: process.env.STRIPE_TEAM_PRODUCT_ID,
  STRIPE_TEAM_MONTHLY_PRICE_ID: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID,
  STRIPE_TEAM_ANNUAL_PRICE_ID: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID,
  
  // Business plan
  STRIPE_BUSINESS_PRODUCT_ID: process.env.STRIPE_BUSINESS_PRODUCT_ID,
  STRIPE_BUSINESS_MONTHLY_PRICE_ID: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
  STRIPE_BUSINESS_ANNUAL_PRICE_ID: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID,
};

// Old naming convention (for backwards compatibility check)
const oldVars = {
  STRIPE_PRO_PRODUCT_ID: process.env.STRIPE_PRO_PRODUCT_ID,
  STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
  STRIPE_SEAT_PRODUCT_ID: process.env.STRIPE_SEAT_PRODUCT_ID,
  STRIPE_SEAT_PRICE_ID: process.env.STRIPE_SEAT_PRICE_ID,
};

console.log('📋 Current Configuration:\n');

let hasNewConfig = false;
let hasOldConfig = false;

// Check new config
console.log('✅ New Configuration Format:');
Object.entries(requiredVars).forEach(([key, value]) => {
  const isSet = !!value;
  console.log(`  ${isSet ? '✅' : '❌'} ${key}: ${isSet ? 'Set' : 'Missing'}`);
  if (isSet) hasNewConfig = true;
});

// Check old config
console.log('\n📌 Old Configuration Format (may be used as fallback):');
Object.entries(oldVars).forEach(([key, value]) => {
  const isSet = !!value;
  console.log(`  ${isSet ? '✅' : '❌'} ${key}: ${isSet ? 'Set' : 'Missing'}`);
  if (isSet) hasOldConfig = true;
});

console.log('\n📝 Summary:\n');

if (hasNewConfig) {
  console.log('✅ You have the new configuration format set up!');
} else if (hasOldConfig) {
  console.log('⚠️  You have the OLD configuration format.');
  console.log('   You need to update to the new format with monthly/annual prices.');
  console.log('   See STRIPE_SETUP_GUIDE.md for details.');
} else {
  console.log('❌ No Stripe configuration found.');
  console.log('   See STRIPE_SETUP_GUIDE.md for setup instructions.');
}

// Check what's missing
const missing = Object.entries(requiredVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.log('\n❌ Missing Required Variables:\n');
  missing.forEach(key => console.log(`  - ${key}`));
}

console.log('\n💡 Next Steps:\n');
console.log('1. Check Stripe Dashboard: https://dashboard.stripe.com/products');
console.log('2. Create missing products/prices if needed');
console.log('3. Copy Product IDs and Price IDs to .env.local');
console.log('4. Check admin panel → Stripe Status tab for detailed status\n');












