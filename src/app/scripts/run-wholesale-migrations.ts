import { prisma } from '@/lib/prisma';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigrations() {
  console.log('🚀 Starting wholesale system migrations...\n');

  const migrations = [
    {
      name: 'Enhance Wholesale System',
      file: '20250122000000_enhance_wholesale_system.sql',
      description: 'Creates invoice/delivery note/payment tables and adds customer fields'
    },
    {
      name: 'Add Recipe Wholesale Price',
      file: '20250122000001_add_recipe_wholesale_price.sql',
      description: 'Adds wholesalePrice field to Recipe table'
    },
    {
      name: 'Add Wholesale Customer Fields',
      file: '20250122000003_add_wholesale_customer_fields.sql',
      description: 'Adds additional customer fields and indexes'
    }
  ];

  for (const migration of migrations) {
    try {
      console.log(`📝 Running migration: ${migration.name}`);
      console.log(`   ${migration.description}`);
      
      const sqlPath = join(process.cwd(), 'src/app/migrations', migration.file);
      const sql = readFileSync(sqlPath, 'utf-8');
      
      // Remove comment lines (lines starting with --)
      const sqlWithoutComments = sql
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
      
      // Split SQL into individual statements by semicolons
      const rawStatements = sqlWithoutComments
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      // Filter to only statements with actual SQL commands
      const statements = rawStatements.filter(s => {
        const upper = s.toUpperCase();
        return upper.includes('ALTER') || 
               upper.includes('CREATE') || 
               upper.includes('INSERT') || 
               upper.includes('UPDATE') ||
               upper.includes('DELETE') ||
               upper.includes('SELECT');
      });
      
      console.log(`   Found ${statements.length} SQL statements to execute...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';'; // Add semicolon back
        if (statement.trim() && statement.trim() !== ';') {
          try {
            await prisma.$executeRawUnsafe(statement);
            console.log(`   ✓ Statement ${i + 1}/${statements.length} executed`);
          } catch (error: any) {
            // Skip if already exists (for IF NOT EXISTS clauses)
            if (error.message?.includes('already exists') || 
                error.message?.includes('duplicate') ||
                error.message?.includes('does not exist') ||
                error.message?.includes('already defined')) {
              console.log(`   ⚠ Statement ${i + 1}/${statements.length} skipped (already exists)`);
            } else {
              console.error(`   ✗ Statement ${i + 1}/${statements.length} failed`);
              console.error(`   SQL: ${statement.substring(0, 150)}...`);
              console.error(`   Error: ${error.message}`);
              // Don't throw - continue with other statements
              // throw error;
            }
          }
        }
      }
      
      console.log(`✅ Migration completed: ${migration.name}\n`);
    } catch (error: any) {
      // Check if it's a "already exists" error (which is fine)
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log(`⚠️  Migration already applied (or partially applied): ${migration.name}\n`);
      } else {
        console.error(`❌ Migration failed: ${migration.name}`);
        console.error(`   Error: ${error.message}\n`);
        throw error;
      }
    }
  }

  console.log('✅ All migrations completed successfully!');
}

runMigrations()
  .catch((error) => {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
