import { prisma } from '@/lib/prisma';
import { getUserFromSession } from '@/lib/auth-simple';

/**
 * Script to fix users without companies by creating a default company
 * Usage: npx tsx src/app/scripts/fix-user-company.ts
 */

async function fixUserCompany() {
  try {
    // This won't work outside request context, but shows the logic
    console.log('This script needs to be run from within a request context.');
    console.log('Instead, check your user account in the database:');
    console.log('1. Check if you have memberships: SELECT * FROM "Membership" WHERE "userId" = YOUR_USER_ID');
    console.log('2. Check if memberships are active: isActive should be true');
    console.log('3. If no membership exists, create one or register a company');
    
    // Alternative: Direct database query approach
    console.log('\nTo fix manually via SQL:');
    console.log('-- Find your user ID first');
    console.log('SELECT id, email FROM "User" WHERE email = \'your-email@example.com\';');
    console.log('');
    console.log('-- Check memberships');
    console.log('SELECT * FROM "Membership" WHERE "userId" = YOUR_USER_ID;');
    console.log('');
    console.log('-- If membership exists but isActive is false, activate it:');
    console.log('UPDATE "Membership" SET "isActive" = true WHERE "userId" = YOUR_USER_ID;');
    console.log('');
    console.log('-- If no membership exists, create a company and membership:');
    console.log('-- First create a company (replace values as needed)');
    console.log('INSERT INTO "Company" (name, slug, "businessType", country, "createdAt", "updatedAt")');
    console.log('VALUES (\'Your Company Name\', \'your-company-slug\', \'Bakery\', \'United Kingdom\', NOW(), NOW())');
    console.log('RETURNING id;');
    console.log('');
    console.log('-- Then create membership (replace YOUR_USER_ID and COMPANY_ID)');
    console.log('INSERT INTO "Membership" ("userId", "companyId", role, "isActive", "createdAt", "updatedAt")');
    console.log('VALUES (YOUR_USER_ID, COMPANY_ID, \'ADMIN\', true, NOW(), NOW());');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserCompany();
