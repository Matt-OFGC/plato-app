-- Migration: Staff Training Management System
-- Date: 2025-01-16 00:00:00
-- Description: Adds models for staff profiles, training system, cleaning jobs, and granular permissions
-- Priority: HIGH
-- Risk: MEDIUM (New tables, requires data migration for existing roles)

-- Phase 0: Granular Permissions System
-- Custom roles and permissions with checkbox-based access control

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

-- Add roleId to Membership (optional, defaults to legacy role system)
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "roleId" INTEGER;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes for permissions
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
    "estimatedDuration" INTEGER, -- in minutes
    "refreshFrequencyDays" INTEGER, -- how often training needs to be refreshed
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingModule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingModule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TrainingContent" (
    "id" SERIAL PRIMARY KEY,
    "moduleId" INTEGER NOT NULL,
    "type" TEXT NOT NULL, -- 'text', 'image', 'video', 'animation'
    "content" TEXT, -- text content or URL
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB, -- additional metadata for videos, animations, etc.
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingContent_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TrainingRecord" (
    "id" SERIAL PRIMARY KEY,
    "membershipId" INTEGER NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'expired'
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "signedOffBy" INTEGER, -- manager userId
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

-- Many-to-many relationship between TrainingModule and Recipe
CREATE TABLE IF NOT EXISTS "TrainingModuleRecipe" (
    "id" SERIAL PRIMARY KEY,
    "moduleId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingModuleRecipe_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingModuleRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingModuleRecipe_module_recipe_key" UNIQUE ("moduleId", "recipeId")
);

-- Add trainingModuleId to Recipe (optional direct link)
ALTER TABLE "Recipe" ADD COLUMN IF NOT EXISTS "trainingModuleId" INTEGER;
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_trainingModuleId_fkey" FOREIGN KEY ("trainingModuleId") REFERENCES "TrainingModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
    "frequency" TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly', 'as_needed'
    "membershipId" INTEGER, -- assigned to
    "productionPlanId" INTEGER, -- optional link to production plan
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedBy" INTEGER, -- userId
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
    "status" TEXT NOT NULL DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed'
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

-- Enhance ActivityLog for cross-module activity tracking
ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "relatedEntityType" TEXT;
ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "relatedEntityId" INTEGER;

CREATE INDEX IF NOT EXISTS "idx_activity_log_related" ON "ActivityLog"("relatedEntityType", "relatedEntityId");

-- Add activity summary fields to Membership
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3);

-- Post-migration verification
DO $$
BEGIN
    -- Verify tables created
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Role') THEN
        RAISE EXCEPTION 'Role table not created';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'StaffProfile') THEN
        RAISE EXCEPTION 'StaffProfile table not created';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'TrainingModule') THEN
        RAISE EXCEPTION 'TrainingModule table not created';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CleaningJob') THEN
        RAISE EXCEPTION 'CleaningJob table not created';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ProductionJobAssignment') THEN
        RAISE EXCEPTION 'ProductionJobAssignment table not created';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

