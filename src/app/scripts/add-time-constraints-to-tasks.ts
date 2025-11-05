import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function addTimeConstraints() {
  console.log('🕐 Adding time constraints to scheduled tasks...');
  
  try {
    // Add time window columns to ScheduledTask table
    await prisma.$executeRaw`
      ALTER TABLE "ScheduledTask"
      ADD COLUMN IF NOT EXISTS "timeWindowStart" TIME,
      ADD COLUMN IF NOT EXISTS "timeWindowEnd" TIME,
      ADD COLUMN IF NOT EXISTS "enforceTimeWindow" BOOLEAN DEFAULT false
    `;
    
    console.log('✅ Time constraint columns added to ScheduledTask table');
    
    // Add index for time-based queries
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_scheduled_task_time_window 
      ON "ScheduledTask"("enforceTimeWindow", "timeWindowStart", "timeWindowEnd")
      WHERE "enforceTimeWindow" = true
    `;
    
    console.log('✅ Time window index created');
    console.log('\n✅ Time constraints migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  addTimeConstraints()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { addTimeConstraints };

