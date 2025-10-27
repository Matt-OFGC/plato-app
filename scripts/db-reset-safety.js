#!/usr/bin/env node

/**
 * Database Reset Safety Check
 * 
 * This script prevents accidental database resets in production environments.
 * It should be used as a pre-check before running prisma migrate reset.
 */

const args = process.argv.slice(2);
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Check for force flag
const forceFlag = args.includes('--force') || args.includes('-f');

if (isProduction) {
  console.error('❌ SAFETY CHECK FAILED: Cannot reset database in PRODUCTION environment!');
  console.error('   Current NODE_ENV:', process.env.NODE_ENV);
  console.error('   If you need to reset production database, you must:');
  console.error('   1. Take a full database backup first');
  console.error('   2. Set NODE_ENV=development temporarily');
  console.error('   3. Have explicit approval from a senior engineer');
  process.exit(1);
}

// Show warning for development
console.log('⚠️  WARNING: You are about to DELETE ALL DATA from the database!');
console.log('   This action cannot be undone.');
console.log('');
console.log('   Current environment:', process.env.NODE_ENV || 'development');
console.log('   Database URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set');
console.log('');

if (!forceFlag) {
  console.log('ℹ️  To proceed, you must run with --force flag:');
  console.log('   npm run db:reset -- --force');
  process.exit(1);
}

console.log('✅ Safety check passed. Proceeding with database reset...');
console.log('');
