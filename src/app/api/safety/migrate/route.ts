import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

// Endpoint to run migration (protected, requires authentication)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🌡️ Starting Safety module migration...");

    const results: string[] = [];

    try {
      // First, check if basic safety tables exist, if not create them
      let taskTemplateExists = false;
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "TaskTemplate" LIMIT 1`);
        taskTemplateExists = true;
        results.push("ℹ️ TaskTemplate table already exists");
      } catch {
        // TaskTemplate doesn't exist, we need to create the full safety schema first
        console.log("TaskTemplate doesn't exist, creating full safety schema...");
        
        // Add safety_enabled and data_retention_days to companies table
        try {
          await prisma.$executeRaw`
            ALTER TABLE "Company" 
            ADD COLUMN IF NOT EXISTS "safety_enabled" BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS "data_retention_days" INTEGER DEFAULT 730
          `;
          results.push("✅ Added safety fields to Company table");
        } catch (e: any) {
          if (!e?.message?.includes('already exists') && e?.code !== '42701') {
            throw e;
          }
        }

        // Create TaskTemplate table
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
        results.push("✅ TaskTemplate table created");

        // Create TemplateChecklistItem table
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
          )
        `;
        results.push("✅ TemplateChecklistItem table created");

        // Create ScheduledTask table (add time window columns if missing)
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
        // Add time window columns if they don't exist
        try {
          await prisma.$executeRaw`
            ALTER TABLE "ScheduledTask" 
            ADD COLUMN IF NOT EXISTS "timeWindowStart" TIME,
            ADD COLUMN IF NOT EXISTS "timeWindowEnd" TIME,
            ADD COLUMN IF NOT EXISTS "enforceTimeWindow" BOOLEAN DEFAULT false
          `;
        } catch (e: any) {
          // Columns might already exist, ignore error
          if (e?.code !== '42701') {
            console.warn("Could not add time window columns:", e.message);
          }
        }
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS idx_scheduled_task_company 
          ON "ScheduledTask"("companyId", "isActive")
        `;
        results.push("✅ ScheduledTask table created");

        // Create TaskInstance table
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
          CREATE INDEX IF NOT EXISTS idx_task_instance_company_date 
          ON "TaskInstance"("companyId", "dueDate" DESC)
        `;
        results.push("✅ TaskInstance table created");

        // Create TaskCompletion table (matches the full schema)
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
        results.push("✅ TaskCompletion table created");

        // Create ChecklistItemCompletion table
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "ChecklistItemCompletion" (
            id SERIAL PRIMARY KEY,
            "taskCompletionId" INTEGER NOT NULL REFERENCES "TaskCompletion"(id) ON DELETE CASCADE,
            "checklistItemId" INTEGER REFERENCES "TemplateChecklistItem"(id),
            "itemText" TEXT NOT NULL,
            "itemOrder" INTEGER NOT NULL,
            checked BOOLEAN NOT NULL DEFAULT true,
            "isCompleted" BOOLEAN DEFAULT false,
            "temperatureValue" DECIMAL(5,2),
            "temperatureUnit" VARCHAR(10),
            notes TEXT,
            "checkedAt" TIMESTAMP,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        results.push("✅ ChecklistItemCompletion table created");

        // Create TaskPhoto table
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
        results.push("✅ TaskPhoto table created");

        // Create TaskComment table
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
        results.push("✅ TaskComment table created");

        // Create TemperatureSensor table
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
          )
        `;
        results.push("✅ TemperatureSensor table created");

        // Create TemperatureReading table
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
        results.push("✅ TemperatureReading table created");

        // Create EquipmentRegister table
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
          )
        `;
        results.push("✅ EquipmentRegister table created");

        // Create EquipmentIssue table
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
          )
        `;
        results.push("✅ EquipmentIssue table created");

        // Create SmartAlert table
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
        results.push("✅ SmartAlert table created");
      }

      // Now create temperature storage tables
      // Create TemplateAppliance table
      console.log("1. Creating TemplateAppliance table...");
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "TemplateAppliance" (
          id SERIAL PRIMARY KEY,
          "templateId" INTEGER NOT NULL REFERENCES "TaskTemplate"(id) ON DELETE CASCADE,
          "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
          "applianceName" VARCHAR(255) NOT NULL,
          "applianceType" VARCHAR(50) NOT NULL DEFAULT 'fridge',
          location VARCHAR(255),
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
      results.push("✅ TemplateAppliance table created");

      // Create TemperatureRecord table
      console.log("2. Creating TemperatureRecord table...");
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
          location VARCHAR(255),
          notes TEXT,
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
      results.push("✅ TemperatureRecord table created");

      // Create DailyTemperatureCheck table
      console.log("3. Creating DailyTemperatureCheck table...");
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "DailyTemperatureCheck" (
          id SERIAL PRIMARY KEY,
          "companyId" INTEGER NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
          "checkDate" DATE NOT NULL,
          "checkPeriod" VARCHAR(10) NOT NULL,
          "checkType" VARCHAR(100) NOT NULL,
          "temperature" DECIMAL(5,2),
          "unit" VARCHAR(10) DEFAULT 'celsius',
          notes TEXT,
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
      results.push("✅ DailyTemperatureCheck table created");

      return NextResponse.json({
        success: true,
        message: "Migration completed successfully",
        results,
      });
    } catch (error: any) {
      console.error("Migration error:", error);
      
      // Check if tables already exist
      if (error?.code === '42P07' || error?.message?.includes('already exists')) {
        return NextResponse.json({
          success: true,
          message: "Tables already exist - migration skipped",
          results: ["ℹ️ Tables already exist - no migration needed"],
        });
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Migration failed",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

