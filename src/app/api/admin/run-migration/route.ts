import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Admin-only endpoint to run the temperature storage migration
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("🌡️ Starting temperature storage migration", null, "Admin/Migration");

    const results: string[] = [];

    try {
      // Create TemplateAppliance table
      logger.debug("1. Creating TemplateAppliance table...", null, "Admin/Migration");
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
      logger.info("✅ TemplateAppliance table created", null, "Admin/Migration");

      // Create TemperatureRecord table
      logger.debug("2. Creating TemperatureRecord table...", null, "Admin/Migration");
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
      logger.info("✅ TemperatureRecord table created", null, "Admin/Migration");

      // Create DailyTemperatureCheck table
      logger.debug("3. Creating DailyTemperatureCheck table...", null, "Admin/Migration");
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
      logger.info("✅ DailyTemperatureCheck table created", null, "Admin/Migration");

      return NextResponse.json({
        success: true,
        message: "Migration completed successfully",
        results,
      });
    } catch (error: any) {
      logger.error("Migration error", error, "Admin/Migration");
      
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
    logger.error("Migration failed", error, "Admin/Migration");
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

// GET endpoint to check migration status
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if tables exist
    const tables = ['TemplateAppliance', 'TemperatureRecord', 'DailyTemperatureCheck'];
    const status: Record<string, boolean> = {};

    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(`
          SELECT 1 FROM "${table}" LIMIT 1
        `);
        status[table] = true;
      } catch (error: any) {
        if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
          status[table] = false;
        } else {
          status[table] = false; // Error checking, assume doesn't exist
        }
      }
    }

    const allExist = Object.values(status).every(Boolean);

    return NextResponse.json({
      migrationComplete: allExist,
      tables: status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to check migration status", details: error.message },
      { status: 500 }
    );
  }
}

