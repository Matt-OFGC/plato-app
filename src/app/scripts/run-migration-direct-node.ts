#!/usr/bin/env tsx
/**
 * Run migration using direct PostgreSQL connection (no Prisma client needed)
 */

import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  console.log("🚀 Starting Staff Training System Migration...\n");

  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error("❌ ERROR: DATABASE_URL environment variable is not set");
      console.error("Please set DATABASE_URL before running this script");
      process.exit(1);
    }

    // Try to use pg library if available
    let pg: any;
    try {
      pg = await import("pg");
    } catch (e) {
      console.error("❌ ERROR: 'pg' package not found");
      console.error("Please install: npm install pg");
      console.error("\nAlternatively, run the SQL file directly:");
      console.error(`psql $DATABASE_URL -f migrations/20250116000000_staff_training_system.sql`);
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

    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    console.log("📄 Reading migration file...");
    console.log(`   Path: ${migrationPath}\n`);

    // Connect to database
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    console.log("✅ Connected to database\n");

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📊 Found ${statements.length} SQL statements\n`);

    // Execute each statement
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length < 10) continue;

      try {
        console.log(`   [${i + 1}/${statements.length}] Executing...`);
        await client.query(statement);
        successCount++;
        console.log(`   ✅ Statement ${i + 1} executed successfully\n`);
      } catch (error: any) {
        // Skip if table/index already exists
        if (
          error.message?.includes("already exists") ||
          error.code === "42P07" ||
          error.code === "42710"
        ) {
          skippedCount++;
          console.log(`   ⚠️  Statement ${i + 1} skipped (already exists)\n`);
          continue;
        }
        errorCount++;
        console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
        console.log(`   Statement: ${statement.substring(0, 100)}...\n`);
      }
    }

    await client.end();

    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Summary:");
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Skipped (already exists): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log("=".repeat(50) + "\n");

    if (errorCount === 0) {
      console.log("✅ Migration completed successfully!\n");
      console.log("📝 Next steps:");
      console.log("   1. Run: npx prisma generate");
      console.log("   2. Verify tables were created");
      console.log("   3. Test the application\n");
    } else {
      console.log("⚠️  Migration completed with some errors");
      console.log("   Check the errors above and verify manually\n");
    }
  } catch (error: any) {
    console.error("\n❌ Migration failed:", error.message || error);
    console.error("\n💡 Alternative: Run SQL file directly:");
    console.error(`   psql $DATABASE_URL -f migrations/20250116000000_staff_training_system.sql\n`);
    process.exit(1);
  }
}

runMigration();

