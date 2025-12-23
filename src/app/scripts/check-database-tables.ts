#!/usr/bin/env tsx
/**
 * Check if database tables exist
 * Run this to verify database setup
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function checkTables() {
  console.log('🔍 Checking database tables...\n');
  
  try {
    // Try to query the User table
    const userCount = await prisma.user.count();
    console.log('✅ User table exists');
    console.log(`   Found ${userCount} users\n`);
    
    // Try to query the Company table
    const companyCount = await prisma.company.count();
    console.log('✅ Company table exists');
    console.log(`   Found ${companyCount} companies\n`);
    
    // Try to query the Recipe table
    const recipeCount = await prisma.recipe.count();
    console.log('✅ Recipe table exists');
    console.log(`   Found ${recipeCount} recipes\n`);
    
    // Try to query the Ingredient table
    const ingredientCount = await prisma.ingredient.count();
    console.log('✅ Ingredient table exists');
    console.log(`   Found ${ingredientCount} ingredients\n`);
    
    // Try to query the Membership table
    const membershipCount = await prisma.membership.count();
    console.log('✅ Membership table exists');
    console.log(`   Found ${membershipCount} memberships\n`);
    
    console.log('✅ All tables exist! Database is set up correctly.');
    
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.error('❌ Tables do not exist!');
      console.error('   Error:', error.message);
      console.error('\n💡 Solution: Run `npx prisma db push --accept-data-loss`');
      process.exit(1);
    } else {
      console.error('❌ Error checking tables:', error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();

