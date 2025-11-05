import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function addTemperatureStorage() {
  console.log('🌡️ Adding temperature storage tables...');
  
  try {
    // Create TemplateAppliance table - stores saved appliance names per template
    console.log('1. Creating TemplateAppliance table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TemplateAppliance" (
        id SERIAL PRIMARY KEY,
        "templateId" INTEGER NOT NULL REFERENCES "TaskTemplate"(id) ON DELETE CASCADE,
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "applianceName" VARCHAR(255) NOT NULL,
        "applianceType" VARCHAR(50) NOT NULL DEFAULT 'fridge',
        "location" VARCHAR(255),
        "orderIndex" INTEGER DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("templateId", "applianceName", "companyId")
      )
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_template_appliance_template 
      ON "TemplateAppliance"("templateId", "companyId", "isActive")
    `;
    console.log('✅ TemplateAppliance table created');

    // Create TemperatureRecord table - stores all temperature readings
    console.log('2. Creating TemperatureRecord table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TemperatureRecord" (
        id SERIAL PRIMARY KEY,
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "templateId" INTEGER REFERENCES "TaskTemplate"(id) ON DELETE SET NULL,
        "taskInstanceId" INTEGER REFERENCES "TaskInstance"(id) ON DELETE SET NULL,
        "applianceName" VARCHAR(255) NOT NULL,
        "applianceType" VARCHAR(50) NOT NULL,
        "recordType" VARCHAR(50) NOT NULL DEFAULT 'fridge_freezer',
        "temperature" DECIMAL(5,2) NOT NULL,
        "unit" VARCHAR(10) DEFAULT 'celsius',
        "checkPeriod" VARCHAR(10),
        "location" VARCHAR(255),
        "notes" TEXT,
        "recordedBy" INTEGER REFERENCES "User"(id),
        "recordedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_temperature_record_company_date 
      ON "TemperatureRecord"("companyId", "recordedAt" DESC)
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_temperature_record_template 
      ON "TemperatureRecord"("templateId", "recordedAt" DESC)
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_temperature_record_appliance 
      ON "TemperatureRecord"("applianceName", "recordedAt" DESC)
    `;
    console.log('✅ TemperatureRecord table created');

    // Create DailyTemperatureCheck table - for AM/PM checks
    console.log('3. Creating DailyTemperatureCheck table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "DailyTemperatureCheck" (
        id SERIAL PRIMARY KEY,
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "checkDate" DATE NOT NULL,
        "checkPeriod" VARCHAR(10) NOT NULL,
        "checkType" VARCHAR(100) NOT NULL,
        "temperature" DECIMAL(5,2),
        "unit" VARCHAR(10) DEFAULT 'celsius',
        "notes" TEXT,
        "completed" BOOLEAN DEFAULT false,
        "completedBy" INTEGER REFERENCES "User"(id),
        "completedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("companyId", "checkDate", "checkPeriod", "checkType")
      )
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_daily_check_company_date 
      ON "DailyTemperatureCheck"("companyId", "checkDate" DESC, "checkPeriod")
    `;
    console.log('✅ DailyTemperatureCheck table created');

    console.log('✅ All temperature storage tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating temperature storage tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addTemperatureStorage()
  .then(() => {
    console.log('✅ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

