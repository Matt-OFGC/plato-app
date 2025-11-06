#!/usr/bin/env tsx
/**
 * Script to run the staff training system migration
 * Run with: npx tsx scripts/run-staff-training-migration.ts
 * 
 * Note: This script can run without Prisma client being generated first
 * It uses direct SQL execution via the database connection
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

function runMigration() {
  console.log("🚀 Starting Staff Training System Migration...\n");

  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error("❌ ERROR: DATABASE_URL environment variable is not set");
      console.error("Please set DATABASE_URL before running this script");
      process.exit(1);
    }

    // Get the migration file path
    const migrationPath = path.join(
      __dirname,
      "../migrations/20250116000000_staff_training_system.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ ERROR: Migration file not found at ${migrationPath}`);
      process.exit(1);
    }

    console.log("📄 Running migration file using psql...");
    console.log(`   Path: ${migrationPath}\n`);

    // Execute migration using psql directly
    try {
      execSync(`psql "${process.env.DATABASE_URL}" -f "${migrationPath}"`, {
        stdio: "inherit",
        cwd: path.join(__dirname, ".."),
      });

      console.log("\n✅ Migration completed successfully!\n");
      console.log("📝 Next steps:");
      console.log("   1. Run: npx prisma generate");
      console.log("   2. Verify tables were created");
      console.log("   3. Initialize default roles for existing companies\n");
    } catch (error: any) {
      // Check if it's just "already exists" errors
      if (error.status === 0 || error.message?.includes("already exists")) {
        console.log("\n⚠️  Some objects may already exist, but migration attempted.\n");
        console.log("📝 Next steps:");
        console.log("   1. Run: npx prisma generate");
        console.log("   2. Verify tables were created");
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error("\n❌ Migration failed:", error.message || error);
    console.error("\n💡 Alternative: Use the bash script instead:");
    console.error("   ./scripts/run-staff-training-migration-direct.sh\n");
    process.exit(1);
  }
}

runMigration();

