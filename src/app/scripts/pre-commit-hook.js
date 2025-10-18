#!/usr/bin/env node

/**
 * Pre-commit Hook for Code Quality
 * 
 * This script runs before each commit to ensure code quality standards
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Running pre-commit code quality checks...\n');

try {
  // Run the code quality check
  execSync('node scripts/code-quality-check.js', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('\n✅ All checks passed! Proceeding with commit...\n');
  process.exit(0);
} catch (error) {
  console.log('\n❌ Code quality checks failed!');
  console.log('Please fix the issues above before committing.\n');
  process.exit(1);
}
