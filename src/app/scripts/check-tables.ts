import { prisma } from '@/lib/prisma';

async function checkTables() {
  console.log('🔍 Checking database tables...\n');

  try {
    // Check all tables
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log('📋 All tables in database:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
    // Check WholesaleCustomer columns
    console.log('\n📋 WholesaleCustomer columns:');
    const customerColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'WholesaleCustomer'
      ORDER BY column_name
    `;
    customerColumns.forEach(c => console.log(`   - ${c.column_name}`));
    
    // Check Recipe columns
    console.log('\n📋 Recipe columns:');
    const recipeColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Recipe'
      AND column_name LIKE '%wholesale%' OR column_name LIKE '%price%'
      ORDER BY column_name
    `;
    recipeColumns.forEach(c => console.log(`   - ${c.column_name}`));
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkTables()
  .finally(async () => {
    await prisma.$disconnect();
  });
