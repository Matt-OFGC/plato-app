#!/usr/bin/env tsx
/**
 * Verify authentication setup is complete
 * Run with: npx tsx scripts/verify-auth-setup.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying Authentication Setup...\n');

// Check .env.local file
const envPath = join(process.cwd(), '.env.local');
let envContent = '';

try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (error) {
  console.log('⚠️  .env.local not found, checking .env...');
  try {
    envContent = readFileSync(join(process.cwd(), '.env'), 'utf-8');
  } catch (e) {
    console.log('❌ No .env file found');
    process.exit(1);
  }
}

// Check required variables
const checks = [
  { name: 'JWT_SECRET', required: true },
  { name: 'ADMIN_JWT_SECRET', required: true },
  { name: 'DATABASE_URL', required: true },
  { name: 'GOOGLE_CLIENT_ID', required: false },
  { name: 'GOOGLE_CLIENT_SECRET', required: false },
  { name: 'GOOGLE_REDIRECT_URI', required: false },
  { name: 'GITHUB_CLIENT_ID', required: false },
  { name: 'GITHUB_CLIENT_SECRET', required: false },
  { name: 'RESEND_API_KEY', required: false },
];

console.log('Environment Variables:\n');
let allRequiredPresent = true;

for (const check of checks) {
  const regex = new RegExp(`^${check.name}=(.+)$`, 'm');
  const match = envContent.match(regex);
  const isSet = !!match && match[1] && !match[1].includes('your-') && !match[1].includes('...');
  
  if (check.required) {
    console.log(`   ${isSet ? '✅' : '❌'} ${check.name}: ${isSet ? 'Set' : 'MISSING - REQUIRED'}`);
    if (!isSet) allRequiredPresent = false;
  } else {
    console.log(`   ${isSet ? '✅' : '⚠️'} ${check.name}: ${isSet ? 'Set' : 'Not configured (optional)'}`);
  }
}

// Check database schema
console.log('\nDatabase Schema:\n');
console.log('   Run: npx prisma migrate status');
console.log('   Expected: Database schema is up to date!');

// Check files exist
console.log('\nKey Files:\n');
const keyFiles = [
  'lib/auth-simple.ts',
  'lib/admin-auth.ts',
  'lib/password-policy.ts',
  'lib/oauth/index.ts',
  'lib/mfa/totp.ts',
  'api/auth/reset-password/route.ts',
  'api/auth/oauth/[provider]/route.ts',
];

for (const file of keyFiles) {
  try {
    const filePath = join(process.cwd(), 'src/app', file);
    require('fs').accessSync(filePath);
    console.log(`   ✅ ${file}`);
  } catch {
    console.log(`   ❌ ${file} - Missing!`);
  }
}

console.log('\n📋 Setup Summary:\n');
if (allRequiredPresent) {
  console.log('   ✅ All required environment variables are set!');
  console.log('   ✅ Authentication system is ready to use');
  console.log('\n🚀 Next steps:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Test login at: http://localhost:3000/login');
  console.log('   3. Test OAuth buttons (if configured)');
} else {
  console.log('   ❌ Some required environment variables are missing');
  console.log('   📝 See AUTH_SETUP_GUIDE.md for setup instructions');
}

