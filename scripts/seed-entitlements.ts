/**
 * Seed Script: Initialize Entitlements for Existing Companies
 *
 * This script gives all existing companies:
 * - Full access to RECIPES (core module)
 * - 14-day trial for STAFF, WHOLESALE, MESSAGING
 *
 * Run with: npx tsx scripts/seed-entitlements.ts
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting entitlements seed...\n');

  // Get all companies
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
  });

  console.log(`Found ${companies.length} companies\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const company of companies) {
    try {
      console.log(`Processing: ${company.name} (ID: ${company.id})`);

      // Check if entitlements already exist
      const existing = await prisma.companyEntitlement.findMany({
        where: { companyId: company.id },
      });

      if (existing.length > 0) {
        console.log(`  ⚠️  Entitlements already exist (${existing.length} modules), skipping\n`);
        continue;
      }

      // Create entitlements
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14); // 14 days from now

      await prisma.companyEntitlement.createMany({
        data: [
          {
            companyId: company.id,
            module: 'RECIPES',
            isEnabled: true,
            isTrial: false, // Core module - always on
            notes: 'Core module - full access',
          },
          {
            companyId: company.id,
            module: 'STAFF',
            isEnabled: true,
            isTrial: true,
            trialEndsAt: trialEnd,
            notes: 'Auto-seeded with 14-day trial',
          },
          {
            companyId: company.id,
            module: 'WHOLESALE',
            isEnabled: true,
            isTrial: true,
            trialEndsAt: trialEnd,
            notes: 'Auto-seeded with 14-day trial',
          },
          {
            companyId: company.id,
            module: 'MESSAGING',
            isEnabled: true,
            isTrial: true,
            trialEndsAt: trialEnd,
            notes: 'Auto-seeded with 14-day trial',
          },
        ],
      });

      console.log(`  ✅ Created 4 entitlements (1 full, 3 trials)\n`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error: ${error}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Success: ${successCount} companies`);
  console.log(`❌ Errors: ${errorCount} companies`);
  console.log(`📊 Total: ${companies.length} companies`);
  console.log('='.repeat(50) + '\n');

  // Show summary stats
  const totalEntitlements = await prisma.companyEntitlement.count();
  const trialEntitlements = await prisma.companyEntitlement.count({
    where: { isTrial: true },
  });

  console.log('Final Stats:');
  console.log(`  Total Entitlements: ${totalEntitlements}`);
  console.log(`  Active Trials: ${trialEntitlements}`);
  console.log(`  Full Access: ${totalEntitlements - trialEntitlements}\n`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
