#!/usr/bin/env node
/**
 * Quick migration runner - uses your existing database connection
 * Run: node scripts/run-migration-quick.js
 */

const fs = require('fs');
const path = require('path');

// Try to load environment variables
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, use environment variables directly
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not found');
  console.error('Please set DATABASE_URL in your environment or .env.local file');
  process.exit(1);
}

// Read migration file
const migrationPath = path.join(__dirname, '../migrations/20250116000000_staff_training_system.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('🚀 Running Staff Training System Migration...\n');
console.log('📄 Migration file:', migrationPath);
console.log('🔗 Database:', DATABASE_URL.substring(0, 30) + '...\n');

// Use psql via child_process
const { execSync } = require('child_process');

try {
  console.log('Executing migration SQL...\n');
  execSync(`psql "${DATABASE_URL}" -f "${migrationPath}"`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  
  console.log('\n✅ Migration completed successfully!\n');
  console.log('📝 Next step: Run "npx prisma generate"');
} catch (error) {
  console.error('\n❌ Migration failed');
  console.error('Error:', error.message);
  process.exit(1);
}

