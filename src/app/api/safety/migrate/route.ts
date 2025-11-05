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

    console.log("🌡️ Starting temperature storage migration...");

    const results: string[] = [];

    try {
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

