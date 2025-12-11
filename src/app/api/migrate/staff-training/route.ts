import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Embedded migration SQL to avoid path resolution issues
const MIGRATION_SQL = `
-- Migration: Staff Training Management System
-- Date: 2025-01-16 00:00:00

-- Phase 0: Granular Permissions System
CREATE TABLE IF NOT EXISTS "Role" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" INTEGER NOT NULL,
    "isSystemRole" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Role_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RolePermission" (
    "id" SERIAL PRIMARY KEY,
    "roleId" INTEGER NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_roleId_permission_key" UNIQUE ("roleId", "permission")
);

ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "roleId" INTEGER;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Membership_roleId_fkey') THEN
        ALTER TABLE "Membership" ADD CONSTRAINT "Membership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_role_company" ON "Role"("companyId");
CREATE INDEX IF NOT EXISTS "idx_role_permission_role" ON "RolePermission"("roleId");
CREATE INDEX IF NOT EXISTS "idx_membership_role" ON "Membership"("roleId");

-- Phase 1: Staff Profiles
CREATE TABLE IF NOT EXISTS "StaffProfile" (
    "id" SERIAL PRIMARY KEY,
    "membershipId" INTEGER NOT NULL UNIQUE,
    "employmentStartDate" TIMESTAMP(3),
    "position" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "notes" TEXT,
    "performanceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffProfile_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_staff_profile_membership" ON "StaffProfile"("membershipId");

-- Phase 2: Training System
CREATE TABLE IF NOT EXISTS "TrainingModule" (
    "id" SERIAL PRIMARY KEY,
    "companyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "estimatedDuration" INTEGER,
    "refreshFrequencyDays" INTEGER,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingModule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingModule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TrainingContent" (
    "id" SERIAL PRIMARY KEY,
    "moduleId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingContent_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TrainingRecord" (
    "id" SERIAL PRIMARY KEY,
    "membershipId" INTEGER NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "signedOffBy" INTEGER,
    "signedOffAt" TIMESTAMP(3),
    "nextRefreshDate" TIMESTAMP(3),
    "completionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingRecord_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingRecord_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingRecord_signedOffBy_fkey" FOREIGN KEY ("signedOffBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingRecord_membership_module_key" UNIQUE ("membershipId", "moduleId")
);

CREATE TABLE IF NOT EXISTS "TrainingModuleRecipe" (
    "id" SERIAL PRIMARY KEY,
    "moduleId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingModuleRecipe_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingModuleRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingModuleRecipe_module_recipe_key" UNIQUE ("moduleId", "recipeId")
);

ALTER TABLE "Recipe" ADD COLUMN IF NOT EXISTS "trainingModuleId" INTEGER;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Recipe_trainingModuleId_fkey') THEN
        ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_trainingModuleId_fkey" FOREIGN KEY ("trainingModuleId") REFERENCES "TrainingModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_training_module_company" ON "TrainingModule"("companyId");
CREATE INDEX IF NOT EXISTS "idx_training_content_module" ON "TrainingContent"("moduleId", "order");
CREATE INDEX IF NOT EXISTS "idx_training_record_membership" ON "TrainingRecord"("membershipId");
CREATE INDEX IF NOT EXISTS "idx_training_record_module" ON "TrainingRecord"("moduleId");
CREATE INDEX IF NOT EXISTS "idx_training_record_status" ON "TrainingRecord"("status");
CREATE INDEX IF NOT EXISTS "idx_training_module_recipe_module" ON "TrainingModuleRecipe"("moduleId");
CREATE INDEX IF NOT EXISTS "idx_training_module_recipe_recipe" ON "TrainingModuleRecipe"("recipeId");
CREATE INDEX IF NOT EXISTS "idx_recipe_training_module" ON "Recipe"("trainingModuleId");

-- Phase 3: Cleaning Jobs
CREATE TABLE IF NOT EXISTS "CleaningJob" (
    "id" SERIAL PRIMARY KEY,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "membershipId" INTEGER,
    "productionPlanId" INTEGER,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedBy" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CleaningJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CleaningJob_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CleaningJob_productionPlanId_fkey" FOREIGN KEY ("productionPlanId") REFERENCES "ProductionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CleaningJob_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_cleaning_job_company" ON "CleaningJob"("companyId");
CREATE INDEX IF NOT EXISTS "idx_cleaning_job_membership" ON "CleaningJob"("membershipId");
CREATE INDEX IF NOT EXISTS "idx_cleaning_job_production" ON "CleaningJob"("productionPlanId");
CREATE INDEX IF NOT EXISTS "idx_cleaning_job_due_date" ON "CleaningJob"("dueDate");
CREATE INDEX IF NOT EXISTS "idx_cleaning_job_status" ON "CleaningJob"("completedAt");

-- Phase 4: Production Job Assignments
CREATE TABLE IF NOT EXISTS "ProductionJobAssignment" (
    "id" SERIAL PRIMARY KEY,
    "productionItemId" INTEGER NOT NULL,
    "membershipId" INTEGER NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductionJobAssignment_productionItemId_fkey" FOREIGN KEY ("productionItemId") REFERENCES "ProductionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductionJobAssignment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductionJobAssignment_item_membership_date_key" UNIQUE ("productionItemId", "membershipId", "assignedDate")
);

CREATE INDEX IF NOT EXISTS "idx_production_assignment_item" ON "ProductionJobAssignment"("productionItemId");
CREATE INDEX IF NOT EXISTS "idx_production_assignment_membership" ON "ProductionJobAssignment"("membershipId");
CREATE INDEX IF NOT EXISTS "idx_production_assignment_date" ON "ProductionJobAssignment"("assignedDate");
CREATE INDEX IF NOT EXISTS "idx_production_assignment_status" ON "ProductionJobAssignment"("status");

-- Enhance ActivityLog
ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "relatedEntityType" TEXT;
ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "relatedEntityId" INTEGER;
CREATE INDEX IF NOT EXISTS "idx_activity_log_related" ON "ActivityLog"("relatedEntityType", "relatedEntityId");

-- Add activity summary fields to Membership
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3);
`;

export async function POST(request: NextRequest) {
  try {
    // Security: Check for secret or allow in development
    const authHeader = request.headers.get('authorization');
    const secret = process.env.MIGRATION_SECRET || 'dev-secret-change-in-production';
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // In production, require secret. In development, allow without auth for convenience
    if (!isDevelopment) {
      if (!authHeader || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ 
          error: 'Unauthorized',
          message: 'Provide Authorization: Bearer <MIGRATION_SECRET> header'
        }, { status: 401 });
      }
    }

    logger.info('🚀 Starting Staff Training System Migration', null, 'Migrate/StaffTraining');
    
    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.debug('✅ Database connection OK', null, 'Migrate/StaffTraining');
    } catch (dbError: any) {
      logger.error('❌ Database connection failed', dbError, 'Migrate/StaffTraining');
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: dbError.message || 'Cannot connect to database',
        hint: 'Check DATABASE_URL environment variable'
      }, { status: 500 });
    }
    
    // Split SQL into individual statements more carefully
    // Handle DO blocks and multi-line statements
    const statements: string[] = [];
    let currentStatement = '';
    let inDoBlock = false;
    
    const lines = MIGRATION_SQL.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('--')) {
        continue;
      }
      
      currentStatement += line + '\n';
      
      // Check if we're entering a DO block
      if (trimmed.toUpperCase().startsWith('DO $$')) {
        inDoBlock = true;
      }
      
      // Check if we're exiting a DO block
      if (trimmed.toUpperCase().includes('END $$') || trimmed.toUpperCase().includes('END;')) {
        inDoBlock = false;
        if (trimmed.includes(';')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      } else if (!inDoBlock && trimmed.endsWith(';')) {
        // Regular statement ending with semicolon
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    // Filter out empty statements
    const validStatements = statements.filter(s => s.length > 10);

    logger.debug(`📊 Found ${validStatements.length} SQL statements`, null, 'Migrate/StaffTraining');

    const results = {
      total: validStatements.length,
      successful: 0,
      skipped: 0,
      errors: [] as Array<{ statement: number; error: string; sql: string; code?: string }>
    };

    // Execute each statement
    for (let i = 0; i < validStatements.length; i++) {
      const statement = validStatements[i];
      
      try {
        await prisma.$executeRawUnsafe(statement);
        results.successful++;
        logger.debug(`   ✅ Statement ${i + 1}/${validStatements.length} executed`, null, 'Migrate/StaffTraining');
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        const errorCode = error.code;
        
        // Skip if table/index/constraint already exists
        if (
          errorMsg.includes('already exists') ||
          errorCode === '42P07' || // duplicate_table
          errorCode === '42710' || // duplicate_object
          errorCode === '42P16' || // invalid_table_definition
          errorMsg.includes('duplicate key value') ||
          errorMsg.includes('constraint') && errorMsg.includes('already exists') ||
          errorMsg.includes('relation') && errorMsg.includes('already exists')
        ) {
          results.skipped++;
          logger.debug(`   ⚠️  Statement ${i + 1} skipped (already exists)`, null, 'Migrate/StaffTraining');
          continue;
        }
        
        // Log full error details
        logger.error(`   ❌ Error in statement ${i + 1}`, {
          message: errorMsg,
          code: errorCode,
          sql: statement.substring(0, 150)
        }, 'Migrate/StaffTraining');
        
        results.errors.push({
          statement: i + 1,
          error: errorMsg,
          sql: statement.substring(0, 200),
          code: errorCode
        });
      }
    }

    logger.info('✅ Migration completed', { successful: results.successful, skipped: results.skipped, errors: results.errors.length }, 'Migrate/StaffTraining');

    if (results.errors.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Migration completed successfully',
        results,
        nextStep: 'Run: npx prisma generate'
      });
    } else {
      // Return partial success if most statements succeeded
      const successRate = results.successful / results.total;
      return NextResponse.json({ 
        success: successRate > 0.8, // 80% success rate
        message: `Migration completed with ${results.errors.length} error(s)`,
        results,
        successRate: Math.round(successRate * 100) + '%'
      }, { status: successRate > 0.8 ? 200 : 500 });
    }
  } catch (error: any) {
    logger.error('❌ Migration error', error, 'Migrate/StaffTraining');
    
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message || 'Unknown error',
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Staff Training System Migration Endpoint',
    usage: 'POST to /api/migrate/staff-training',
    note: 'In development, no auth required. In production, provide Authorization: Bearer <MIGRATION_SECRET>',
    tables: [
      'Role', 'RolePermission', 'StaffProfile', 
      'TrainingModule', 'TrainingContent', 'TrainingRecord', 'TrainingModuleRecipe',
      'CleaningJob', 'ProductionJobAssignment'
    ]
  });
}
