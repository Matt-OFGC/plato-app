#!/usr/bin/env node

/**
 * Fix user account - ensure they have a company and active membership
 * Usage: node scripts/fix-user-account.js <email>
 */

const { PrismaClient } = require('../src/generated/prisma');
require('dotenv').config({ path: '../../.env' });

const prisma = new PrismaClient();

// Helper functions (copied from lib/company-defaults.ts)
function generateDefaultCompanyName(email) {
  const username = email.split('@')[0];
  return `${username.charAt(0).toUpperCase() + username.slice(1)}'s Company`;
}

async function generateCompanySlug(name) {
  const baseSlug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.company.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

async function fixUserAccount(email) {
  try {
    console.log(`\n🔍 Looking up user: ${email}...`);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        Membership: {
          include: {
            Company: true
          }
        }
      }
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.email} (ID: ${user.id})`);
    console.log(`   Memberships: ${user.Membership.length}`);

    // Check memberships
    const activeMemberships = user.Membership.filter(m => m.isActive);
    const inactiveMemberships = user.Membership.filter(m => !m.isActive);

    if (activeMemberships.length > 0) {
      const membership = activeMemberships[0];
      // Fetch company separately if not included
      const company = membership.Company || await prisma.company.findUnique({
        where: { id: membership.companyId }
      });
      
      console.log(`\n✅ User has active membership:`);
      console.log(`   Company: ${company?.name || 'Unknown'} (ID: ${membership.companyId})`);
      console.log(`   Role: ${membership.role}`);
      console.log(`   Membership ID: ${membership.id}`);
      console.log(`\n✅ Account is already set up correctly!`);
      return;
    }

    if (inactiveMemberships.length > 0) {
      // Activate the first inactive membership
      const membership = inactiveMemberships[0];
      console.log(`\n⚠️  Found inactive membership, activating...`);
      
      await prisma.membership.update({
        where: { id: membership.id },
        data: { isActive: true }
      });

      // Fetch company separately if not included
      const company = membership.Company || await prisma.company.findUnique({
        where: { id: membership.companyId }
      });
      
      console.log(`✅ Activated membership:`);
      console.log(`   Company: ${company?.name || 'Unknown'} (ID: ${membership.companyId})`);
      console.log(`   Role: ${membership.role}`);
      console.log(`   Membership ID: ${membership.id}`);
      console.log(`\n✅ Account fixed!`);
      return;
    }

    // No memberships at all - create company and membership
    console.log(`\n⚠️  User has no memberships. Creating company and membership...`);
    
    const defaultCompanyName = generateDefaultCompanyName(user.email);
    const slug = await generateCompanySlug(defaultCompanyName);

    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const newCompany = await tx.company.create({
        data: {
          name: defaultCompanyName,
          slug,
          country: 'United Kingdom',
        },
      });

      // Create active membership
      const newMembership = await tx.membership.create({
        data: {
          userId: user.id,
          companyId: newCompany.id,
          role: 'ADMIN',
          isActive: true,
        },
      });

      return { company: newCompany, membership: newMembership };
    });

    console.log(`✅ Created company and membership:`);
    console.log(`   Company: ${result.company.name} (ID: ${result.company.id})`);
    console.log(`   Role: ADMIN`);
    console.log(`   Membership ID: ${result.membership.id}`);
    console.log(`\n✅ Account fixed!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/fix-user-account.js <email>');
  console.error('Example: node scripts/fix-user-account.js user@example.com');
  process.exit(1);
}

fixUserAccount(email);

