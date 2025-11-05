#!/usr/bin/env node
// Execute SQL file using Node.js PostgreSQL client (alternative to psql)
// Usage: node scripts/execute-sql-file.js <database_url> <sql_file>

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.argv[2];
const SQL_FILE = process.argv[3];

if (!DATABASE_URL || !SQL_FILE) {
  console.error('Usage: node scripts/execute-sql-file.js <database_url> <sql_file>');
  process.exit(1);
}

if (!fs.existsSync(SQL_FILE)) {
  console.error(`Error: SQL file not found: ${SQL_FILE}`);
  process.exit(1);
}

const sql = fs.readFileSync(SQL_FILE, 'utf8');

async function executeSQL() {
  const client = new Client({
    connectionString: DATABASE_URL,
    // For CREATE INDEX CONCURRENTLY, we need to disable transactions
    // CONCURRENTLY operations cannot run in a transaction
  });

  try {
    await client.connect();
    
    // Check if file contains CONCURRENTLY (needs special handling)
    const hasConcurrently = sql.includes('CREATE INDEX CONCURRENTLY') || 
                           sql.includes('DROP INDEX CONCURRENTLY');
    
    // Check if file contains DO blocks or transactions (needs special handling)
    const hasDoBlocks = sql.includes('DO $$') || sql.includes('DO $');
    const hasTransaction = sql.includes('BEGIN;') && sql.includes('COMMIT;');
    
    if (hasConcurrently) {
      // For CONCURRENTLY operations, execute statements one by one outside transaction
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\s*$/));
      
      for (const statement of statements) {
        if (statement.includes('CONCURRENTLY')) {
          // Execute CONCURRENTLY statements without transaction
          // For CREATE INDEX CONCURRENTLY, IF NOT EXISTS is not supported
          // So we check first, or catch "already exists" error
          try {
            await client.query(statement);
          } catch (err) {
            // If index already exists, that's fine - continue
            if (err.message && err.message.includes('already exists')) {
              console.log(`⚠️  Index already exists, skipping: ${statement.substring(0, 100)}...`);
            } else {
              throw err; // Re-throw other errors
            }
          }
        } else {
          // Other statements can be in transaction
          await client.query(statement);
        }
      }
    } else if (hasDoBlocks || hasTransaction) {
      // Files with DO blocks or transactions must be executed as a single statement
      // This preserves the block structure and transaction boundaries
      await client.query(sql);
    } else {
      // Regular SQL - split by semicolons (simple case)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\s*$/));
      
      for (const statement of statements) {
        if (statement) {
          await client.query(statement);
        }
      }
    }
    
    console.log(`✅ Successfully executed: ${SQL_FILE}`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error executing ${SQL_FILE}:`, error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

executeSQL();


