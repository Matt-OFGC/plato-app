/**
 * Quick script to grant Plato Bake access to matt@ofgc.uk
 * Uses raw SQL to work even if migration hasn't been run yet
 */

import { prisma } from "../lib/prisma";

async function grantAccess() {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: "matt@ofgc.uk" },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      console.error("❌ User not found");
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.email} (ID: ${user.id})`);

    // Try to create subscription via raw SQL (works even if table doesn't exist in Prisma client)
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "UserAppSubscription" ("userId", "app", "status", "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd", "createdAt", "updatedAt")
        VALUES (${user.id}, 'plato_bake', 'active', NOW(), NOW() + INTERVAL '1 year', false, NOW(), NOW())
        ON CONFLICT ("userId", "app") 
        DO UPDATE SET 
          "status" = 'active',
          "currentPeriodStart" = NOW(),
          "currentPeriodEnd" = NOW() + INTERVAL '1 year',
          "cancelAtPeriodEnd" = false,
          "updatedAt" = NOW()
      `);
      console.log(`✅ Granted Plato Bake access to ${user.email}`);
    } catch (error: any) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.log("⚠️  UserAppSubscription table doesn't exist yet.");
        console.log("📝 Please run the migration first:");
        console.log("   npx prisma migrate dev --name add_user_app_subscriptions");
        console.log("\n   Or manually create the table using the SQL in:");
        console.log("   prisma/migrations/add_user_app_subscriptions.sql");
      } else {
        throw error;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

grantAccess();

