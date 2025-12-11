/**
 * Script to enable pgvector extension in PostgreSQL
 */

import { prisma } from "../lib/prisma";

async function enablePgVector() {
  try {
    console.log("Enabling pgvector extension...");

    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);

    console.log("✅ pgvector extension enabled successfully!");
    console.log("\nNote: You can now update MentorKnowledgeIndex.embedding to use vector type");
    console.log("Current implementation uses JSON storage, which works fine.");
  } catch (error: any) {
    if (error.message?.includes("permission denied")) {
      console.error("❌ Permission denied. You may need to run this as a database superuser.");
      console.log("Alternatively, contact your database provider to enable the extension.");
    } else if (error.message?.includes("extension") && error.message?.includes("does not exist")) {
      console.error("❌ pgvector extension not available in your PostgreSQL installation.");
      console.log("You may need to install it or use a provider that supports it (like Neon).");
    } else {
      console.error("❌ Error enabling pgvector:", error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

enablePgVector();








