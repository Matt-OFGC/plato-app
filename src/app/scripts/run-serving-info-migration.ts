import { prisma } from '../lib/prisma';

async function runMigration() {
  console.log('Running migration: Add servingsPerPack and servingUnit to Ingredient...');
  
  try {
    // Check if columns already exist
    const checkResult = await prisma.$queryRaw<any[]>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Ingredient' 
      AND column_name IN ('servingsPerPack', 'servingUnit')
    `;
    
    const existingColumns = checkResult.map((r: any) => r.column_name);
    
    if (existingColumns.includes('servingsPerPack') && existingColumns.includes('servingUnit')) {
      console.log('✅ Migration already applied - columns exist');
      return;
    }
    
    // Add columns if they don't exist
    if (!existingColumns.includes('servingsPerPack')) {
      await prisma.$executeRaw`
        ALTER TABLE "Ingredient" 
        ADD COLUMN "servingsPerPack" INTEGER
      `;
      console.log('✅ Added servingsPerPack column');
    }
    
    if (!existingColumns.includes('servingUnit')) {
      await prisma.$executeRaw`
        ALTER TABLE "Ingredient" 
        ADD COLUMN "servingUnit" TEXT
      `;
      console.log('✅ Added servingUnit column');
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });

