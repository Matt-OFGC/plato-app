import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function migrateSafetySchema() {
  console.log('🛡️ Starting Safety module database migration...');
  
  try {
    // Add safety_enabled and data_retention_days to companies table
    console.log('1. Adding safety fields to companies table...');
    await prisma.$executeRaw`
      ALTER TABLE "Company" 
      ADD COLUMN IF NOT EXISTS "safety_enabled" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "data_retention_days" INTEGER DEFAULT 730;
    `;
    console.log('✅ Companies table updated');

    // Create task_templates table
    console.log('2. Creating task_templates table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TaskTemplate" (
        id SERIAL PRIMARY KEY,
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        emoji VARCHAR(10),
        "isSystemTemplate" BOOLEAN DEFAULT false,
        "isActive" BOOLEAN DEFAULT true,
        "createdBy" INTEGER REFERENCES "User"(id),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_company_templates 
      ON "TaskTemplate"("companyId", category, "isActive")
    `;
    console.log('✅ TaskTemplate table created');

    // Create template_checklist_items table
    console.log('3. Creating template_checklist_items table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TemplateChecklistItem" (
        id SERIAL PRIMARY KEY,
        "templateId" INTEGER NOT NULL REFERENCES "TaskTemplate"(id) ON DELETE CASCADE,
        "itemText" TEXT NOT NULL,
        "itemOrder" INTEGER NOT NULL,
        "requiresPhoto" BOOLEAN DEFAULT false,
        "requiresTemperature" BOOLEAN DEFAULT false,
        "requiresNotes" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ TemplateChecklistItem table created');

    // Create scheduled_tasks table
    console.log('4. Creating scheduled_tasks table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ScheduledTask" (
        id SERIAL PRIMARY KEY,
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "siteId" INTEGER,
        "templateId" INTEGER NOT NULL REFERENCES "TaskTemplate"(id),
        "assignedTo" INTEGER REFERENCES "User"(id),
        "scheduleType" VARCHAR(50) NOT NULL,
        "scheduleTime" TIME,
        "scheduleDays" JSONB,
        "timeWindow" VARCHAR(50),
        "isActive" BOOLEAN DEFAULT true,
        "startDate" DATE NOT NULL,
        "endDate" DATE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_scheduled_task_company 
      ON "ScheduledTask"("companyId", "isActive")
    `;
    console.log('✅ ScheduledTask table created');

    // Create task_instances table
    console.log('5. Creating task_instances table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TaskInstance" (
        id SERIAL PRIMARY KEY,
        "scheduledTaskId" INTEGER REFERENCES "ScheduledTask"(id) ON DELETE CASCADE,
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "siteId" INTEGER,
        "templateId" INTEGER NOT NULL REFERENCES "TaskTemplate"(id),
        "assignedTo" INTEGER REFERENCES "User"(id),
        "dueDate" DATE NOT NULL,
        "dueTime" TIME,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(50) DEFAULT 'normal',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_task_due 
      ON "TaskInstance"("companyId", "dueDate", status)
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_task_assigned 
      ON "TaskInstance"("assignedTo", status)
    `;
    console.log('✅ TaskInstance table created');

    // Create task_completions table (THE DIARY)
    console.log('6. Creating task_completions table (Safety Diary)...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TaskCompletion" (
        id SERIAL PRIMARY KEY,
        "taskInstanceId" INTEGER REFERENCES "TaskInstance"(id),
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "siteId" INTEGER,
        "templateId" INTEGER NOT NULL REFERENCES "TaskTemplate"(id),
        "completedBy" INTEGER NOT NULL REFERENCES "User"(id),
        "completedByName" VARCHAR(255) NOT NULL,
        "completedByRole" VARCHAR(50) NOT NULL,
        "completedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completionDate" DATE NOT NULL,
        "pinVerified" BOOLEAN NOT NULL DEFAULT true,
        "deviceId" VARCHAR(255),
        "ipAddress" INET,
        "taskName" VARCHAR(255) NOT NULL,
        "taskCategory" VARCHAR(100) NOT NULL,
        "durationMinutes" INTEGER,
        notes TEXT,
        status VARCHAR(50) NOT NULL,
        "flagReason" TEXT,
        "priorityLevel" VARCHAR(50),
        "checklistItemsTotal" INTEGER NOT NULL,
        "checklistItemsCompleted" INTEGER NOT NULL,
        "photosCount" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_completion_date 
      ON "TaskCompletion"("companyId", "completionDate" DESC)
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_completion_user 
      ON "TaskCompletion"("completedBy", "completionDate" DESC)
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_completion_status 
      ON "TaskCompletion"("companyId", status, "completionDate" DESC)
    `;
    console.log('✅ TaskCompletion table created');

    // Create checklist_item_completions table
    console.log('7. Creating checklist_item_completions table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ChecklistItemCompletion" (
        id SERIAL PRIMARY KEY,
        "taskCompletionId" INTEGER NOT NULL REFERENCES "TaskCompletion"(id) ON DELETE CASCADE,
        "itemText" TEXT NOT NULL,
        "itemOrder" INTEGER NOT NULL,
        checked BOOLEAN NOT NULL DEFAULT true,
        "temperatureValue" DECIMAL(5,2),
        "temperatureUnit" VARCHAR(10),
        notes TEXT,
        "checkedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ ChecklistItemCompletion table created');

    // Create task_photos table
    console.log('8. Creating task_photos table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TaskPhoto" (
        id SERIAL PRIMARY KEY,
        "taskCompletionId" INTEGER NOT NULL REFERENCES "TaskCompletion"(id) ON DELETE CASCADE,
        "checklistItemId" INTEGER REFERENCES "ChecklistItemCompletion"(id),
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "filePath" VARCHAR(500) NOT NULL,
        "fileName" VARCHAR(255) NOT NULL,
        "fileSize" INTEGER,
        "mimeType" VARCHAR(100),
        "isBeforePhoto" BOOLEAN DEFAULT false,
        "uploadedBy" INTEGER NOT NULL REFERENCES "User"(id),
        "uploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "thumbnailPath" VARCHAR(500)
      )
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_photo_completion 
      ON "TaskPhoto"("taskCompletionId")
    `;
    console.log('✅ TaskPhoto table created');

    // Create task_comments table
    console.log('9. Creating task_comments table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TaskComment" (
        id SERIAL PRIMARY KEY,
        "taskInstanceId" INTEGER REFERENCES "TaskInstance"(id) ON DELETE CASCADE,
        "taskCompletionId" INTEGER REFERENCES "TaskCompletion"(id) ON DELETE CASCADE,
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "commentText" TEXT NOT NULL,
        "mentionedUsers" JSONB,
        "createdBy" INTEGER NOT NULL REFERENCES "User"(id),
        "createdByName" VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_comment_task 
      ON "TaskComment"("taskInstanceId", "createdAt" DESC)
    `;
    console.log('✅ TaskComment table created');

    // Create temperature_sensors table
    console.log('10. Creating temperature_sensors table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TemperatureSensor" (
        id SERIAL PRIMARY KEY,
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "siteId" INTEGER,
        "sensorName" VARCHAR(255) NOT NULL,
        "sensorType" VARCHAR(100),
        location VARCHAR(255),
        "targetTemperature" DECIMAL(5,2),
        "minThreshold" DECIMAL(5,2),
        "maxThreshold" DECIMAL(5,2),
        "isActive" BOOLEAN DEFAULT true,
        "lastReadingAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ TemperatureSensor table created');

    // Create temperature_readings table
    console.log('11. Creating temperature_readings table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TemperatureReading" (
        id SERIAL PRIMARY KEY,
        "sensorId" INTEGER NOT NULL REFERENCES "TemperatureSensor"(id) ON DELETE CASCADE,
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "temperatureValue" DECIMAL(5,2) NOT NULL,
        "temperatureUnit" VARCHAR(10) DEFAULT 'celsius',
        "recordedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "isOutOfRange" BOOLEAN DEFAULT false
      )
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_sensor_readings 
      ON "TemperatureReading"("sensorId", "recordedAt" DESC)
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_company_readings 
      ON "TemperatureReading"("companyId", "recordedAt" DESC)
    `;
    console.log('✅ TemperatureReading table created');

    // Create equipment_register table
    console.log('12. Creating equipment_register table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "EquipmentRegister" (
        id SERIAL PRIMARY KEY,
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "siteId" INTEGER,
        "equipmentName" VARCHAR(255) NOT NULL,
        "equipmentCategory" VARCHAR(100),
        location VARCHAR(255),
        "qrCode" VARCHAR(100) UNIQUE,
        "lastServiceDate" DATE,
        "nextServiceDate" DATE,
        "warrantyExpiry" DATE,
        status VARCHAR(50) DEFAULT 'good',
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ EquipmentRegister table created');

    // Create equipment_issues table
    console.log('13. Creating equipment_issues table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "EquipmentIssue" (
        id SERIAL PRIMARY KEY,
        "equipmentId" INTEGER NOT NULL REFERENCES "EquipmentRegister"(id) ON DELETE CASCADE,
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "issueDescription" TEXT NOT NULL,
        severity VARCHAR(50),
        status VARCHAR(50) DEFAULT 'open',
        "reportedBy" INTEGER NOT NULL REFERENCES "User"(id),
        "reportedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "resolvedAt" TIMESTAMP,
        "resolvedBy" INTEGER REFERENCES "User"(id),
        "resolutionNotes" TEXT
      );
    `;
    console.log('✅ EquipmentIssue table created');

    // Create smart_alerts table
    console.log('14. Creating smart_alerts table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SmartAlert" (
        id SERIAL PRIMARY KEY,
        "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "alertType" VARCHAR(50) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        "actionRequired" VARCHAR(255),
        "relatedEntityType" VARCHAR(50),
        "relatedEntityId" INTEGER,
        "isRead" BOOLEAN DEFAULT false,
        "isDismissed" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_company_alerts 
      ON "SmartAlert"("companyId", "isDismissed", "createdAt" DESC)
    `;
    console.log('✅ SmartAlert table created');

    console.log('\n✅ Safety module database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateSafetySchema()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateSafetySchema };

