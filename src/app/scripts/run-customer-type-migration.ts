import { prisma } from '@/lib/prisma';

async function runMigration() {
  try {
    console.log('🔄 Running customerType migration...');
    
    // Check if column already exists
    const columnCheck = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'WholesaleCustomer' 
      AND column_name = 'customerType'
    `;
    
    if (columnCheck.length > 0) {
      console.log('✅ Column customerType already exists');
    } else {
      // Add the column
      await prisma.$executeRaw`
        ALTER TABLE "WholesaleCustomer" ADD COLUMN "customerType" TEXT DEFAULT 'wholesale'
      `;
      console.log('✅ Added customerType column');
    }
    
    // Update existing records
    const updateResult = await prisma.$executeRaw`
      UPDATE "WholesaleCustomer" SET "customerType" = 'wholesale' WHERE "customerType" IS NULL
    `;
    console.log(`✅ Updated existing customers to 'wholesale'`);
    
    // Verify the migration
    const verifyResult = await prisma.$queryRaw<Array<{ customerType: string | null; count: bigint }>>`
      SELECT "customerType", COUNT(*) as count
      FROM "WholesaleCustomer"
      GROUP BY "customerType"
    `;
    
    console.log('\n📊 Migration verification:');
    verifyResult.forEach(row => {
      console.log(`   ${row.customerType || 'NULL'}: ${row.count} customers`);
    });
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
