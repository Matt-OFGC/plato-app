/**
 * Script to grant app access to a user
 * Usage: npx tsx scripts/grant-app-access.ts <email> <app>
 * Example: npx tsx scripts/grant-app-access.ts matt@ofgc.uk plato_bake
 */

import { prisma } from "../lib/prisma";
import type { App } from "../lib/apps/types";

async function grantAppAccess(email: string, app: App) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.email} (ID: ${user.id})`);

    // Check if UserAppSubscription table exists, if not create subscription manually
    let existing = null;
    try {
      existing = await prisma.userAppSubscription.findUnique({
      where: {
        userId_app: {
          userId: user.id,
          app,
        },
      },
      });
    } catch (error: any) {
      // Table doesn't exist yet - we'll create it manually via raw SQL
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('⚠️  UserAppSubscription table not found. Creating subscription via raw SQL...');
        
        // Create subscription directly via raw SQL
        await prisma.$executeRawUnsafe(`
          INSERT INTO "UserAppSubscription" ("userId", "app", "status", "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd", "createdAt", "updatedAt")
          VALUES (${user.id}, '${app}', 'active', NOW(), NOW() + INTERVAL '1 year', false, NOW(), NOW())
          ON CONFLICT ("userId", "app") 
          DO UPDATE SET 
            "status" = 'active',
            "currentPeriodStart" = NOW(),
            "currentPeriodEnd" = NOW() + INTERVAL '1 year',
            "cancelAtPeriodEnd" = false,
            "updatedAt" = NOW()
        `);
        
        console.log(`✅ Granted ${app} access to ${email} via raw SQL`);
        process.exit(0);
      }
      throw error;
    }

    if (existing) {
      // Update existing subscription to active
      await prisma.userAppSubscription.update({
        where: {
          userId_app: {
            userId: user.id,
            app,
          },
        },
        data: {
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          cancelAtPeriodEnd: false,
        },
      });
      console.log(`✅ Updated existing ${app} subscription for ${email}`);
    } else {
      // Create new subscription
      await prisma.userAppSubscription.create({
        data: {
          userId: user.id,
          app,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          cancelAtPeriodEnd: false,
        },
      });
      console.log(`✅ Granted ${app} access to ${email}`);
    }

    console.log(`\n🎉 Success! ${email} now has access to ${app}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Get command line arguments
const email = process.argv[2];
const app = process.argv[3] as App;

if (!email || !app) {
  console.error("Usage: npx tsx scripts/grant-app-access.ts <email> <app>");
  console.error("Example: npx tsx scripts/grant-app-access.ts matt@ofgc.uk plato_bake");
  process.exit(1);
}

if (app !== "plato" && app !== "plato_bake") {
  console.error(`❌ Invalid app: ${app}. Must be "plato" or "plato_bake"`);
  process.exit(1);
}

grantAppAccess(email, app);

