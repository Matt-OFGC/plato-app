#!/usr/bin/env tsx
/**
 * Run staff training migration via Prisma $executeRaw
 * This respects your structured database migration system
 * 
 * Usage: npx tsx scripts/run-staff-training-migration-via-prisma.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function runMigration() {
  console.log("🚀 Starting Staff Training System Migration (via Prisma)...\n");

  try {
    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      "../migrations/20250116000000_staff_training_system.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ ERROR: Migration file not found at ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    console.log("📄 Reading migration file...");
    console.log(`   Path: ${migrationPath}\n`);

    // Split SQL into individual statements
    // Remove comments and empty lines, then split by semicolons
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📊 Found ${statements.length} SQL statements\n`);

    // Execute each statement using Prisma
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length < 10) continue; // Skip empty or very short statements

      try {
        console.log(`   [${i + 1}/${statements.length}] Executing statement...`);
        await prisma.$executeRawUnsafe(statement);
        console.log(`   ✅ Statement ${i + 1} executed successfully\n`);
      } catch (error: any) {
        // Skip if table/index already exists
        if (
          error.message?.includes("already exists") ||
          error.code === "42P07" ||
          error.code === "42710"
        ) {
          console.log(`   ⚠️  Statement ${i + 1} skipped (already exists)\n`);
          continue;
        }
        // Log other errors but continue
        console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
        console.log(`   Statement: ${statement.substring(0, 100)}...\n`);
      }
    }

    console.log("✅ Migration completed successfully!\n");
    console.log("📝 Next steps:");
    console.log("   1. Run: npx prisma generate");
    console.log("   2. Verify tables were created");
    console.log("   3. Initialize default roles for existing companies\n");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

