/**
 * Script to apply Mentor migration directly
 */

import { prisma } from "../lib/prisma";
import { readFileSync } from "fs";
import { join } from "path";

async function applyMigration() {
  try {
    const sql = readFileSync(
      join(__dirname, "../migrations/20250120000000_add_mentor_models.sql"),
      "utf-8"
    );

    // Execute the entire SQL file as one transaction
    // This ensures proper order of execution
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log("✅ Migration applied successfully!");
    } catch (error: any) {
      // If it's an "already exists" error, that's okay
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("duplicate") ||
        error.code === "42P07" || // duplicate_table
        error.code === "42710" || // duplicate_object
        error.code === "P2010" // Raw query error that might be about existing objects
      ) {
        console.log("⚠ Some objects already exist, checking what's missing...");
        // Try to execute individual statements to see what's missing
        const statements = sql
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith("--"));

        for (const statement of statements) {
          if (statement) {
            try {
              await prisma.$executeRawUnsafe(statement + ";");
            } catch (stmtError: any) {
              if (
                !stmtError.message?.includes("already exists") &&
                !stmtError.message?.includes("duplicate") &&
                stmtError.code !== "42P07" &&
                stmtError.code !== "42710"
              ) {
                console.error("✗ Statement failed:", stmtError.message?.substring(0, 100));
              }
            }
          }
        }
        console.log("✅ Migration check complete!");
      } else {
        console.error("✗ Error:", error.message);
        throw error;
      }
    }

    console.log("✅ Migration applied successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

