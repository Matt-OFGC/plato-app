#!/usr/bin/env tsx
/**
 * Setup Database - Creates all tables from Prisma schema
 * Run this after resetting the database
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  
  try {
    // Use Prisma's db push to sync schema (creates tables if they don't exist)
    // This is safer than migrate deploy when starting fresh
    const { execSync } = require('child_process');
    
    console.log('📦 Pushing Prisma schema to database...');
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      stdio: 'inherit',
      cwd: __dirname + '/..',
    });
    
    console.log('✅ Database schema created successfully!');
    
    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: __dirname + '/..',
    });
    
    console.log('✅ Prisma client generated!');
    console.log('✅ Database setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();




