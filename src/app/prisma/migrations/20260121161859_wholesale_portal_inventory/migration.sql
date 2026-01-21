-- CreateEnum
CREATE TYPE "App" AS ENUM ('plato', 'plato_bake');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('ACTIVE', 'SOLD_OUT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SummaryPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "BaseUnit" AS ENUM ('g', 'ml', 'each', 'slices');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('g', 'kg', 'mg', 'lb', 'oz', 'ml', 'l', 'pint', 'quart', 'gallon', 'tsp', 'tbsp', 'cup', 'floz', 'each', 'slices', 'pinch', 'dash', 'large', 'medium', 'small');

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER,
    "entityName" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllergenSheetTemplate" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER,
    "templateName" TEXT NOT NULL,
    "templateType" TEXT NOT NULL DEFAULT 'custom',
    "sheetStyle" TEXT NOT NULL DEFAULT 'full_detail',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "headingColor" TEXT NOT NULL DEFAULT '#2D3142',
    "warningColor" TEXT NOT NULL DEFAULT '#FF6B6B',
    "headingFont" TEXT NOT NULL DEFAULT 'Poppins',
    "headingSize" INTEGER NOT NULL DEFAULT 24,
    "bodyFont" TEXT NOT NULL DEFAULT 'Poppins',
    "bodySize" INTEGER NOT NULL DEFAULT 11,
    "pageMarginsMm" DECIMAL(65,30) NOT NULL DEFAULT 15.0,
    "showFullIngredients" BOOLEAN NOT NULL DEFAULT true,
    "showAllergenList" BOOLEAN NOT NULL DEFAULT true,
    "showDietarySuitability" BOOLEAN NOT NULL DEFAULT true,
    "showStorageInfo" BOOLEAN NOT NULL DEFAULT true,
    "showWeight" BOOLEAN NOT NULL DEFAULT true,
    "showBestBefore" BOOLEAN NOT NULL DEFAULT true,
    "showCompanyDetails" BOOLEAN NOT NULL DEFAULT true,
    "showContactInfo" BOOLEAN NOT NULL DEFAULT true,
    "showLastUpdated" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER,

    CONSTRAINT "AllergenSheetTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalCosts" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grossProfit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grossMargin" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "recipesProduced" INTEGER NOT NULL DEFAULT 0,
    "totalBatches" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ingredientsUsed" INTEGER NOT NULL DEFAULT 0,
    "avgIngredientCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "avgFoodCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "topRecipe" TEXT,
    "topCategory" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "companyId" INTEGER,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItemCompletion" (
    "id" SERIAL NOT NULL,
    "taskCompletionId" INTEGER NOT NULL,
    "itemText" TEXT NOT NULL,
    "itemOrder" INTEGER NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT true,
    "temperatureValue" DECIMAL(5,2),
    "temperatureUnit" VARCHAR(10),
    "notes" TEXT,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checklistItemId" INTEGER,
    "isCompleted" BOOLEAN DEFAULT false,

    CONSTRAINT "ChecklistItemCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "companyId" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "businessType" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'United Kingdom',
    "email" TEXT,
    "isProfilePublic" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "maxSeats" INTEGER NOT NULL DEFAULT 5,
    "ownerId" INTEGER,
    "phone" TEXT,
    "postcode" TEXT,
    "pricePerSeat" DECIMAL(65,30) NOT NULL DEFAULT 5.00,
    "profileBio" TEXT,
    "seatsUsed" INTEGER NOT NULL DEFAULT 1,
    "shopifyAccessToken" TEXT,
    "shopifyApiKey" TEXT,
    "shopifyIsConnected" BOOLEAN NOT NULL DEFAULT false,
    "shopifyLastSync" TIMESTAMP(3),
    "shopifyStoreUrl" TEXT,
    "shopifyWebhookSecret" TEXT,
    "showContact" BOOLEAN NOT NULL DEFAULT true,
    "showTeam" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT,
    "website" TEXT,
    "safety_enabled" BOOLEAN DEFAULT true,
    "data_retention_days" INTEGER DEFAULT 730,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomReport" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "filters" JSONB,
    "grouping" JSONB,
    "dateRange" JSONB,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleFrequency" TEXT,
    "scheduleTime" TEXT,
    "exportFormats" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emailRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),

    CONSTRAINT "CustomReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPricing" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'each',
    "notes" TEXT,

    CONSTRAINT "CustomerPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyTemperatureCheck" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "checkDate" DATE NOT NULL,
    "checkPeriod" VARCHAR(10) NOT NULL,
    "checkType" VARCHAR(100) NOT NULL,
    "temperature" DECIMAL(5,2),
    "unit" VARCHAR(10) NOT NULL DEFAULT 'celsius',
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedBy" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyTemperatureCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentIssue" (
    "id" SERIAL NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "issueDescription" TEXT NOT NULL,
    "severity" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'open',
    "reportedBy" INTEGER NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" INTEGER,
    "resolutionNotes" TEXT,

    CONSTRAINT "EquipmentIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentRegister" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "siteId" INTEGER,
    "equipmentName" VARCHAR(255) NOT NULL,
    "equipmentCategory" VARCHAR(100),
    "location" VARCHAR(255),
    "qrCode" VARCHAR(100),
    "lastServiceDate" DATE,
    "nextServiceDate" DATE,
    "warrantyExpiry" DATE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'good',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalMapping" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "integrationId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "internalId" INTEGER NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalData" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ExternalMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureModule" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "moduleName" TEXT NOT NULL,
    "stripeSubscriptionItemId" TEXT,
    "stripePriceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),

    CONSTRAINT "FeatureModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "templateId" INTEGER,
    "products" JSONB NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "sheetsPrinted" INTEGER,
    "pdfFilePath" TEXT,
    "fileSizeBytes" INTEGER,
    "generatedBy" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "supplier" TEXT,
    "packQuantity" DECIMAL(65,30) NOT NULL,
    "packUnit" "BaseUnit" NOT NULL,
    "packPrice" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "densityGPerMl" DECIMAL(65,30),
    "notes" TEXT,
    "companyId" INTEGER,
    "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastPriceUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalUnit" "Unit",
    "priceHistory" TEXT,
    "supplierId" INTEGER,
    "customConversions" TEXT,
    "batchPricing" JSONB,
    "servingsPerPack" INTEGER,
    "servingUnit" TEXT,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientPriceHistory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingredientId" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "packQuantity" DECIMAL(65,30) NOT NULL,
    "packUnit" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "previousPrice" DECIMAL(65,30),
    "supplierId" INTEGER,
    "supplierName" TEXT,
    "notes" TEXT,
    "source" TEXT,

    CONSTRAINT "IngredientPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConfig" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credentials" JSONB NOT NULL,
    "authType" TEXT NOT NULL,
    "settings" JSONB,
    "mappings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastError" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "syncFrequency" TEXT,

    CONSTRAINT "IntegrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSync" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL,
    "integrationId" INTEGER NOT NULL,
    "syncType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "errors" JSONB,
    "warnings" JSONB,
    "trigger" TEXT,
    "metadata" JSONB,

    CONSTRAINT "IntegrationSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "lowStockThreshold" DECIMAL(65,30),
    "lastRestocked" TIMESTAMP(3),

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inventoryId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "productionItemId" INTEGER,
    "orderId" INTEGER,
    "reason" TEXT,
    "notes" TEXT,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabelTemplate" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER,
    "templateName" TEXT NOT NULL,
    "templateType" TEXT NOT NULL DEFAULT 'custom',
    "backgroundColor" TEXT NOT NULL DEFAULT '#E8E4DC',
    "textColor" TEXT NOT NULL DEFAULT '#6D7C6F',
    "accentColor" TEXT,
    "productFont" TEXT NOT NULL DEFAULT 'Poppins',
    "productFontWeight" TEXT NOT NULL DEFAULT 'Bold',
    "productFontSize" INTEGER NOT NULL DEFAULT 48,
    "subtitleFont" TEXT NOT NULL DEFAULT 'Poppins',
    "subtitleFontWeight" TEXT NOT NULL DEFAULT 'SemiBold',
    "subtitleFontSize" INTEGER NOT NULL DEFAULT 18,
    "bodyFont" TEXT NOT NULL DEFAULT 'Poppins',
    "bodyFontWeight" TEXT NOT NULL DEFAULT 'Regular',
    "bodyFontSize" INTEGER NOT NULL DEFAULT 10,
    "alignment" TEXT NOT NULL DEFAULT 'center',
    "textTransform" TEXT NOT NULL DEFAULT 'uppercase',
    "spacingStyle" TEXT NOT NULL DEFAULT 'normal',
    "marginMm" DECIMAL(65,30) NOT NULL DEFAULT 2.0,
    "widthMm" DECIMAL(65,30) NOT NULL DEFAULT 65.0,
    "heightMm" DECIMAL(65,30) NOT NULL DEFAULT 38.0,
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "showAllergens" BOOLEAN NOT NULL DEFAULT true,
    "showDietaryTags" BOOLEAN NOT NULL DEFAULT true,
    "showDate" BOOLEAN NOT NULL DEFAULT true,
    "showWeight" BOOLEAN NOT NULL DEFAULT false,
    "showCompanyName" BOOLEAN NOT NULL DEFAULT false,
    "showStorageInfo" BOOLEAN NOT NULL DEFAULT false,
    "showBarcode" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER,

    CONSTRAINT "LabelTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveBalance" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "membershipId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "leaveType" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "accrualRate" DECIMAL(65,30),
    "accrualPeriod" TEXT NOT NULL DEFAULT 'month',
    "year" INTEGER NOT NULL,
    "totalAccrued" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalTaken" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "membershipId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isFullDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pin" TEXT,
    "pinHash" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "MemberRole" NOT NULL DEFAULT 'EMPLOYEE',
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "employmentType" TEXT,
    "endDate" TIMESTAMP(3),
    "hourlyRate" DECIMAL(65,30),
    "niCategory" TEXT,
    "payFrequency" TEXT,
    "pensionOptIn" BOOLEAN NOT NULL DEFAULT false,
    "pensionRate" DECIMAL(65,30),
    "salary" DECIMAL(65,30),
    "startDate" TIMESTAMP(3),
    "taxCode" TEXT,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaDevice" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "secret" TEXT,
    "credentialId" TEXT,
    "publicKey" TEXT,
    "phoneNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollIntegration" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "config" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "oauthState" TEXT,
    "redirectUri" TEXT,

    CONSTRAINT "PayrollIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollLine" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payrollRunId" INTEGER NOT NULL,
    "membershipId" INTEGER NOT NULL,
    "hoursWorked" DECIMAL(65,30) NOT NULL,
    "overtimeHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "hourlyRate" DECIMAL(65,30) NOT NULL,
    "grossPay" DECIMAL(65,30) NOT NULL,
    "taxDeduction" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "niDeduction" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pensionAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(65,30) NOT NULL,
    "breakdown" JSONB,

    CONSTRAINT "PayrollLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "payDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "totalGross" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalTax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalNI" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalPension" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "paymentMethod" TEXT,
    "externalId" TEXT,
    "syncedToExternal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollSyncLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "integrationId" INTEGER NOT NULL,
    "payrollRunId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "recordsExported" INTEGER NOT NULL DEFAULT 0,
    "recordsImported" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "syncMetadata" JSONB,

    CONSTRAINT "PayrollSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionHistory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "productionDate" TIMESTAMP(3) NOT NULL,
    "quantityProduced" DECIMAL(65,30) NOT NULL,
    "actualCost" DECIMAL(65,30),
    "productionPlanId" INTEGER,
    "batchNumber" TEXT,
    "wasteAmount" DECIMAL(65,30) DEFAULT 0,
    "productionTime" INTEGER,
    "efficiency" DECIMAL(65,30),
    "producedBy" INTEGER,
    "notes" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ProductionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionItem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "quantity" DECIMAL(65,30) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "ProductionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionItemAllocation" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productionItemId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "destination" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ProductionItemAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionPlan" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "companyId" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "ProductionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionTask" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" INTEGER,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "yieldQuantity" DECIMAL(65,30) NOT NULL,
    "yieldUnit" "BaseUnit" NOT NULL,
    "imageUrl" TEXT,
    "companyId" INTEGER,
    "description" TEXT,
    "method" TEXT,
    "actualFoodCost" DECIMAL(65,30),
    "bakeTemp" INTEGER,
    "bakeTime" INTEGER,
    "category" TEXT,
    "categoryId" INTEGER,
    "isSubRecipe" BOOLEAN NOT NULL DEFAULT false,
    "lastPriceUpdate" TIMESTAMP(3),
    "portionSize" DECIMAL(65,30),
    "portionUnit" "BaseUnit",
    "portionsPerBatch" INTEGER,
    "sellingPrice" DECIMAL(65,30),
    "wholesalePrice" DECIMAL(65,30),
    "shelfLife" TEXT,
    "shelfLifeId" INTEGER,
    "shelfLifeDays" INTEGER,
    "storage" TEXT,
    "storageId" INTEGER,
    "suggestedPrice" DECIMAL(65,30),

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerInventory" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "productionItemId" INTEGER,
    "recipeId" INTEGER,
    "orderId" INTEGER NOT NULL,
    "batchId" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "originalQuantity" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockCheck" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "checkDate" TIMESTAMP(3) NOT NULL,
    "openingStock" INTEGER NOT NULL,
    "sales" INTEGER NOT NULL DEFAULT 0,
    "wastage" INTEGER NOT NULL DEFAULT 0,
    "closingStock" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesSummary" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "productionItemId" INTEGER,
    "recipeId" INTEGER,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "periodType" "SummaryPeriod" NOT NULL,
    "totalDelivered" INTEGER NOT NULL,
    "totalSold" INTEGER NOT NULL,
    "totalWasted" INTEGER NOT NULL,
    "sellThroughRate" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomInventoryItem" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "shelfLifeDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomItemCheck" (
    "id" SERIAL NOT NULL,
    "customItemId" INTEGER NOT NULL,
    "checkDate" TIMESTAMP(3) NOT NULL,
    "openingStock" INTEGER NOT NULL,
    "sales" INTEGER NOT NULL DEFAULT 0,
    "wastage" INTEGER NOT NULL DEFAULT 0,
    "closingStock" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomItemCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeCollection" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipeId" INTEGER NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RecipeCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" "Unit" NOT NULL,
    "note" TEXT,
    "sectionId" INTEGER,
    "price" DECIMAL(65,30),

    CONSTRAINT "RecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeSection" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "method" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "bakeTemp" INTEGER,
    "bakeTime" INTEGER,
    "hasTimer" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RecipeSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeSubRecipe" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentRecipeId" INTEGER NOT NULL,
    "subRecipeId" INTEGER NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" "Unit" NOT NULL,
    "note" TEXT,

    CONSTRAINT "RecipeSubRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeUpdateLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipeId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "updateType" TEXT NOT NULL,
    "changedField" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "allergenImpact" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeUpdateLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeVersion" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipeId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" INTEGER NOT NULL,
    "changeNote" TEXT,
    "totalCost" DECIMAL(65,30),
    "sellingPrice" DECIMAL(65,30),
    "foodCostPct" DECIMAL(65,30),

    CONSTRAINT "RecipeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesRecord" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "recipeId" INTEGER,
    "productName" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalRevenue" DECIMAL(65,30) NOT NULL,
    "customerId" INTEGER,
    "customerName" TEXT,
    "orderId" INTEGER,
    "notes" TEXT,
    "externalId" TEXT,
    "externalSource" TEXT,

    CONSTRAINT "SalesRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledTask" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "siteId" INTEGER,
    "templateId" INTEGER NOT NULL,
    "assignedTo" INTEGER,
    "scheduleType" VARCHAR(50) NOT NULL,
    "scheduleTime" TIME(6),
    "scheduleDays" JSONB,
    "timeWindow" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeWindowStart" TIME(6),
    "timeWindowEnd" TIME(6),
    "enforceTimeWindow" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScheduledTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonalTrend" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "recipeId" INTEGER,
    "category" TEXT,
    "season" TEXT NOT NULL,
    "month" INTEGER,
    "demandMultiplier" DECIMAL(65,30) NOT NULL,
    "confidence" DECIMAL(65,30) NOT NULL,
    "dataPoints" INTEGER NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SeasonalTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShelfLifeOption" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "companyId" INTEGER,

    CONSTRAINT "ShelfLifeOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "membershipId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "breakDuration" INTEGER NOT NULL DEFAULT 0,
    "shiftType" TEXT NOT NULL DEFAULT 'general',
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "productionPlanId" INTEGER,
    "notes" TEXT,
    "confirmedBy" INTEGER,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftTemplate" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dayOfWeek" INTEGER,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakDuration" INTEGER NOT NULL DEFAULT 0,
    "shiftType" TEXT NOT NULL DEFAULT 'general',
    "location" TEXT,
    "defaultRole" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ShiftTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyOrder" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "shopifyOrderNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "orderDate" TIMESTAMP(3) NOT NULL,
    "fulfillmentStatus" TEXT,
    "financialStatus" TEXT,
    "shippingAddress" JSONB,
    "deliveryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "shopifyData" JSONB NOT NULL,

    CONSTRAINT "ShopifyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyOrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "recipeId" INTEGER,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyVariantId" TEXT,
    "productTitle" TEXT NOT NULL,
    "variantTitle" TEXT,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "addedToProduction" BOOLEAN NOT NULL DEFAULT false,
    "productionItemId" INTEGER,

    CONSTRAINT "ShopifyOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyProductMapping" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyVariantId" TEXT,
    "productTitle" TEXT NOT NULL,
    "variantTitle" TEXT,
    "sku" TEXT,
    "quantityMultiplier" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ShopifyProductMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartAlert" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "alertType" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "actionRequired" VARCHAR(255),
    "relatedEntityType" VARCHAR(50),
    "relatedEntityId" INTEGER,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageOption" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "companyId" INTEGER,

    CONSTRAINT "StorageOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "tier" TEXT NOT NULL DEFAULT 'paid',
    "price" DECIMAL(65,30) NOT NULL DEFAULT 19.00,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "interval" TEXT NOT NULL DEFAULT 'month',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "maxIngredients" INTEGER,
    "maxRecipes" INTEGER,
    "aiSubscriptionType" TEXT,
    "metadata" JSONB,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "deliveryDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deliveryNotes" TEXT,
    "accountLogin" TEXT,
    "accountPassword" TEXT,
    "accountNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "country" TEXT,
    "currency" TEXT DEFAULT 'GBP',
    "paymentTerms" TEXT,
    "minimumOrder" DECIMAL(65,30),
    "companyId" INTEGER,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" SERIAL NOT NULL,
    "taskInstanceId" INTEGER,
    "taskCompletionId" INTEGER,
    "companyId" INTEGER NOT NULL,
    "commentText" TEXT NOT NULL,
    "mentionedUsers" JSONB,
    "createdBy" INTEGER NOT NULL,
    "createdByName" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCompletion" (
    "id" SERIAL NOT NULL,
    "taskInstanceId" INTEGER,
    "companyId" INTEGER NOT NULL,
    "siteId" INTEGER,
    "templateId" INTEGER NOT NULL,
    "completedBy" INTEGER NOT NULL,
    "completedByName" VARCHAR(255) NOT NULL,
    "completedByRole" VARCHAR(50) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completionDate" DATE NOT NULL,
    "pinVerified" BOOLEAN NOT NULL DEFAULT true,
    "deviceId" VARCHAR(255),
    "ipAddress" INET,
    "taskName" VARCHAR(255) NOT NULL,
    "taskCategory" VARCHAR(100) NOT NULL,
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "status" VARCHAR(50) NOT NULL,
    "flagReason" TEXT,
    "priorityLevel" VARCHAR(50),
    "checklistItemsTotal" INTEGER NOT NULL,
    "checklistItemsCompleted" INTEGER NOT NULL,
    "photosCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskInstance" (
    "id" SERIAL NOT NULL,
    "scheduledTaskId" INTEGER,
    "companyId" INTEGER NOT NULL,
    "siteId" INTEGER,
    "templateId" INTEGER NOT NULL,
    "assignedTo" INTEGER,
    "dueDate" DATE NOT NULL,
    "dueTime" TIME(6),
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "priority" VARCHAR(50) NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskPhoto" (
    "id" SERIAL NOT NULL,
    "taskCompletionId" INTEGER NOT NULL,
    "checklistItemId" INTEGER,
    "companyId" INTEGER NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileSize" INTEGER,
    "mimeType" VARCHAR(100),
    "isBeforePhoto" BOOLEAN NOT NULL DEFAULT false,
    "uploadedBy" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thumbnailPath" VARCHAR(500),

    CONSTRAINT "TaskPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "emoji" VARCHAR(10),
    "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvitation" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'EMPLOYEE',
    "invitedBy" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemperatureReading" (
    "id" SERIAL NOT NULL,
    "sensorId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "temperatureValue" DECIMAL(5,2) NOT NULL,
    "temperatureUnit" VARCHAR(10) NOT NULL DEFAULT 'celsius',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOutOfRange" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TemperatureReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemperatureRecord" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "templateId" INTEGER,
    "taskInstanceId" INTEGER,
    "applianceName" VARCHAR(255) NOT NULL,
    "applianceType" VARCHAR(50) NOT NULL,
    "recordType" VARCHAR(50) NOT NULL DEFAULT 'fridge_freezer',
    "temperature" DECIMAL(5,2) NOT NULL,
    "unit" VARCHAR(10) NOT NULL DEFAULT 'celsius',
    "checkPeriod" VARCHAR(10),
    "location" VARCHAR(255),
    "notes" TEXT,
    "recordedBy" INTEGER,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemperatureRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemperatureSensor" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "siteId" INTEGER,
    "sensorName" VARCHAR(255) NOT NULL,
    "sensorType" VARCHAR(100),
    "location" VARCHAR(255),
    "targetTemperature" DECIMAL(5,2),
    "minThreshold" DECIMAL(5,2),
    "maxThreshold" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastReadingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemperatureSensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateAppliance" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "applianceName" VARCHAR(255) NOT NULL,
    "applianceType" VARCHAR(50) NOT NULL DEFAULT 'fridge',
    "location" VARCHAR(255),
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateAppliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateChecklistItem" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "itemText" TEXT NOT NULL,
    "itemOrder" INTEGER NOT NULL,
    "requiresPhoto" BOOLEAN NOT NULL DEFAULT false,
    "requiresTemperature" BOOLEAN NOT NULL DEFAULT false,
    "requiresNotes" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timesheet" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "membershipId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "clockInAt" TIMESTAMP(3) NOT NULL,
    "clockOutAt" TIMESTAMP(3),
    "breakStart" TIMESTAMP(3),
    "breakEnd" TIMESTAMP(3),
    "totalHours" DECIMAL(65,30),
    "breakHours" DECIMAL(65,30) DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "shiftId" INTEGER,
    "clockInLocation" TEXT,
    "clockOutLocation" TEXT,
    "clockInIp" TEXT,
    "clockOutIp" TEXT,
    "adjustmentHours" DECIMAL(65,30) DEFAULT 0,
    "adjustmentReason" TEXT,
    "notes" TEXT,

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "ingredientCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "recipeCount" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "subscriptionEndsAt" TIMESTAMP(3),
    "subscriptionInterval" TEXT NOT NULL DEFAULT 'month',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'free',
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiresAt" TIMESTAMP(3),
    "resetPasswordToken" TEXT,
    "resetPasswordTokenExpiresAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "maxFoodCost" DECIMAL(65,30) NOT NULL DEFAULT 35.0,
    "navigationItems" JSONB,
    "targetFoodCost" DECIMAL(65,30) NOT NULL DEFAULT 25.0,
    "timerSettings" JSONB,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL,
    "integrationId" INTEGER,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "webhookId" TEXT,
    "method" TEXT NOT NULL,
    "headers" JSONB,
    "body" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleCustomer" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "portalToken" TEXT,
    "portalShortCode" TEXT,
    "portalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "openingHours" JSONB,
    "deliveryDays" TEXT[],
    "preferredDeliveryTime" TEXT,
    "paymentTerms" TEXT,
    "creditLimit" DECIMAL(65,30),
    "taxId" TEXT,
    "accountManager" TEXT,
    "specialInstructions" TEXT,
    "orderFrequency" TEXT,
    "lastOrderDate" TIMESTAMP(3),
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "outstandingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "WholesaleCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleOrder" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "orderNumber" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringInterval" TEXT,
    "recurringIntervalDays" INTEGER,
    "recurringEndDate" TIMESTAMP(3),
    "nextRecurrenceDate" TIMESTAMP(3),
    "recurringStatus" TEXT,
    "parentOrderId" INTEGER,

    CONSTRAINT "WholesaleOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleOrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(65,30),
    "notes" TEXT,

    CONSTRAINT "WholesaleOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleProduct" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "recipeId" INTEGER,
    "name" TEXT,
    "description" TEXT,
    "unit" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "notes" TEXT,

    CONSTRAINT "WholesaleProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleInvoice" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" INTEGER,
    "customerId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "paidDate" TIMESTAMP(3),
    "paidAmount" DECIMAL(65,30),
    "notes" TEXT,
    "pdfUrl" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),

    CONSTRAINT "WholesaleInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleDeliveryNote" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deliveryNoteNumber" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "deliveredBy" TEXT,
    "signature" TEXT,
    "notes" TEXT,
    "pdfUrl" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),

    CONSTRAINT "WholesaleDeliveryNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesalePayment" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "WholesalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAppSubscription" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "app" "App" NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserAppSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorSubscription" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "subscriptionType" TEXT NOT NULL DEFAULT 'unlimited',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MentorSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorConversation" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MentorConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorMessage" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "tokensUsed" INTEGER,

    CONSTRAINT "MentorMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorKnowledgeIndex" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER,
    "embedding" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "lastIndexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorKnowledgeIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorConfig" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dataSources" JSONB,
    "piiMaskingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "piiMaskingRules" JSONB,
    "conversationRetention" INTEGER NOT NULL DEFAULT 90,
    "enableInternetSearch" BOOLEAN NOT NULL DEFAULT true,
    "enableProactiveAlerts" BOOLEAN NOT NULL DEFAULT true,
    "preferences" JSONB,

    CONSTRAINT "MentorConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorGoal" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" DECIMAL(65,30),
    "currentValue" DECIMAL(65,30) DEFAULT 0,
    "unit" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "category" TEXT,

    CONSTRAINT "MentorGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorProgress" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goalId" INTEGER NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "MentorProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorInsight" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL,
    "insightType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "relatedEntityType" TEXT,
    "relatedEntityId" INTEGER,

    CONSTRAINT "MentorInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorReminder" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reminderType" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringRule" TEXT,
    "metadata" JSONB,

    CONSTRAINT "MentorReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_companyId_createdAt_idx" ON "ActivityLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_companyId_idx" ON "ActivityLog"("companyId");

-- CreateIndex
CREATE INDEX "ActivityLog_entity_entityId_idx" ON "ActivityLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "AllergenSheetTemplate_companyId_idx" ON "AllergenSheetTemplate"("companyId");

-- CreateIndex
CREATE INDEX "AllergenSheetTemplate_companyId_isSystemTemplate_idx" ON "AllergenSheetTemplate"("companyId", "isSystemTemplate");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_companyId_idx" ON "AnalyticsSnapshot"("companyId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_companyId_periodStart_idx" ON "AnalyticsSnapshot"("companyId", "periodStart");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_periodStart_idx" ON "AnalyticsSnapshot"("periodStart");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_period_idx" ON "AnalyticsSnapshot"("period");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSnapshot_companyId_period_periodStart_key" ON "AnalyticsSnapshot"("companyId", "period", "periodStart");

-- CreateIndex
CREATE INDEX "Category_companyId_idx" ON "Category"("companyId");

-- CreateIndex
CREATE INDEX "Category_companyId_order_idx" ON "Category"("companyId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_companyId_key" ON "Category"("name", "companyId");

-- CreateIndex
CREATE INDEX "Collection_companyId_idx" ON "Collection"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_name_companyId_key" ON "Collection"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "CustomReport_companyId_idx" ON "CustomReport"("companyId");

-- CreateIndex
CREATE INDEX "CustomReport_createdBy_idx" ON "CustomReport"("createdBy");

-- CreateIndex
CREATE INDEX "CustomReport_isScheduled_idx" ON "CustomReport"("isScheduled");

-- CreateIndex
CREATE UNIQUE INDEX "CustomReport_companyId_name_key" ON "CustomReport"("companyId", "name");

-- CreateIndex
CREATE INDEX "CustomerPricing_customerId_idx" ON "CustomerPricing"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPricing_recipeId_idx" ON "CustomerPricing"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPricing_customerId_recipeId_key" ON "CustomerPricing"("customerId", "recipeId");

-- CreateIndex
CREATE INDEX "DailyTemperatureCheck_companyId_checkDate_checkPeriod_idx" ON "DailyTemperatureCheck"("companyId", "checkDate" DESC, "checkPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "DailyTemperatureCheck_companyId_checkDate_checkPeriod_check_key" ON "DailyTemperatureCheck"("companyId", "checkDate", "checkPeriod", "checkType");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentRegister_qrCode_key" ON "EquipmentRegister"("qrCode");

-- CreateIndex
CREATE INDEX "ExternalMapping_companyId_idx" ON "ExternalMapping"("companyId");

-- CreateIndex
CREATE INDEX "ExternalMapping_entityType_idx" ON "ExternalMapping"("entityType");

-- CreateIndex
CREATE INDEX "ExternalMapping_externalId_idx" ON "ExternalMapping"("externalId");

-- CreateIndex
CREATE INDEX "ExternalMapping_integrationId_idx" ON "ExternalMapping"("integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalMapping_integrationId_entityType_internalId_key" ON "ExternalMapping"("integrationId", "entityType", "internalId");

-- CreateIndex
CREATE INDEX "FeatureModule_moduleName_idx" ON "FeatureModule"("moduleName");

-- CreateIndex
CREATE INDEX "FeatureModule_status_idx" ON "FeatureModule"("status");

-- CreateIndex
CREATE INDEX "FeatureModule_userId_idx" ON "FeatureModule"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureModule_userId_moduleName_key" ON "FeatureModule"("userId", "moduleName");

-- CreateIndex
CREATE INDEX "GeneratedDocument_companyId_documentType_generatedAt_idx" ON "GeneratedDocument"("companyId", "documentType", "generatedAt");

-- CreateIndex
CREATE INDEX "GeneratedDocument_companyId_idx" ON "GeneratedDocument"("companyId");

-- CreateIndex
CREATE INDEX "Ingredient_companyId_idx" ON "Ingredient"("companyId");

-- CreateIndex
CREATE INDEX "Ingredient_companyId_lastPriceUpdate_idx" ON "Ingredient"("companyId", "lastPriceUpdate");

-- CreateIndex
CREATE INDEX "Ingredient_companyId_name_idx" ON "Ingredient"("companyId", "name");

-- CreateIndex
CREATE INDEX "Ingredient_supplierId_idx" ON "Ingredient"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_companyId_key" ON "Ingredient"("name", "companyId");

-- CreateIndex
CREATE INDEX "IngredientPriceHistory_createdAt_idx" ON "IngredientPriceHistory"("createdAt");

-- CreateIndex
CREATE INDEX "IngredientPriceHistory_ingredientId_createdAt_idx" ON "IngredientPriceHistory"("ingredientId", "createdAt");

-- CreateIndex
CREATE INDEX "IngredientPriceHistory_ingredientId_idx" ON "IngredientPriceHistory"("ingredientId");

-- CreateIndex
CREATE INDEX "IngredientPriceHistory_supplierId_idx" ON "IngredientPriceHistory"("supplierId");

-- CreateIndex
CREATE INDEX "IntegrationConfig_companyId_idx" ON "IntegrationConfig"("companyId");

-- CreateIndex
CREATE INDEX "IntegrationConfig_isActive_idx" ON "IntegrationConfig"("isActive");

-- CreateIndex
CREATE INDEX "IntegrationConfig_provider_idx" ON "IntegrationConfig"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConfig_companyId_provider_key" ON "IntegrationConfig"("companyId", "provider");

-- CreateIndex
CREATE INDEX "IntegrationSync_companyId_idx" ON "IntegrationSync"("companyId");

-- CreateIndex
CREATE INDEX "IntegrationSync_companyId_startedAt_idx" ON "IntegrationSync"("companyId", "startedAt");

-- CreateIndex
CREATE INDEX "IntegrationSync_integrationId_idx" ON "IntegrationSync"("integrationId");

-- CreateIndex
CREATE INDEX "IntegrationSync_startedAt_idx" ON "IntegrationSync"("startedAt");

-- CreateIndex
CREATE INDEX "IntegrationSync_status_idx" ON "IntegrationSync"("status");

-- CreateIndex
CREATE INDEX "Inventory_companyId_idx" ON "Inventory"("companyId");

-- CreateIndex
CREATE INDEX "Inventory_recipeId_idx" ON "Inventory"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_companyId_recipeId_key" ON "Inventory"("companyId", "recipeId");

-- CreateIndex
CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventoryId_idx" ON "InventoryMovement"("inventoryId");

-- CreateIndex
CREATE INDEX "InventoryMovement_type_idx" ON "InventoryMovement"("type");

-- CreateIndex
CREATE INDEX "LabelTemplate_companyId_idx" ON "LabelTemplate"("companyId");

-- CreateIndex
CREATE INDEX "LabelTemplate_companyId_isSystemTemplate_idx" ON "LabelTemplate"("companyId", "isSystemTemplate");

-- CreateIndex
CREATE INDEX "LeaveBalance_companyId_idx" ON "LeaveBalance"("companyId");

-- CreateIndex
CREATE INDEX "LeaveBalance_membershipId_idx" ON "LeaveBalance"("membershipId");

-- CreateIndex
CREATE INDEX "LeaveBalance_year_idx" ON "LeaveBalance"("year");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_membershipId_leaveType_year_key" ON "LeaveBalance"("membershipId", "leaveType", "year");

-- CreateIndex
CREATE INDEX "LeaveRequest_companyId_idx" ON "LeaveRequest"("companyId");

-- CreateIndex
CREATE INDEX "LeaveRequest_companyId_startDate_idx" ON "LeaveRequest"("companyId", "startDate");

-- CreateIndex
CREATE INDEX "LeaveRequest_membershipId_idx" ON "LeaveRequest"("membershipId");

-- CreateIndex
CREATE INDEX "LeaveRequest_startDate_idx" ON "LeaveRequest"("startDate");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE INDEX "Membership_companyId_idx" ON "Membership"("companyId");

-- CreateIndex
CREATE INDEX "Membership_companyId_pin_idx" ON "Membership"("companyId", "pin");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_companyId_key" ON "Membership"("userId", "companyId");

-- CreateIndex
CREATE INDEX "MfaDevice_userId_idx" ON "MfaDevice"("userId");

-- CreateIndex
CREATE INDEX "MfaDevice_userId_type_idx" ON "MfaDevice"("userId", "type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "OAuthAccount_provider_providerId_idx" ON "OAuthAccount"("provider", "providerId");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerId_key" ON "OAuthAccount"("provider", "providerId");

-- CreateIndex
CREATE INDEX "PayrollIntegration_companyId_idx" ON "PayrollIntegration"("companyId");

-- CreateIndex
CREATE INDEX "PayrollIntegration_isActive_idx" ON "PayrollIntegration"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollIntegration_companyId_provider_key" ON "PayrollIntegration"("companyId", "provider");

-- CreateIndex
CREATE INDEX "PayrollLine_membershipId_idx" ON "PayrollLine"("membershipId");

-- CreateIndex
CREATE INDEX "PayrollLine_payrollRunId_idx" ON "PayrollLine"("payrollRunId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollLine_payrollRunId_membershipId_key" ON "PayrollLine"("payrollRunId", "membershipId");

-- CreateIndex
CREATE INDEX "PayrollRun_companyId_idx" ON "PayrollRun"("companyId");

-- CreateIndex
CREATE INDEX "PayrollRun_companyId_periodStart_idx" ON "PayrollRun"("companyId", "periodStart");

-- CreateIndex
CREATE INDEX "PayrollRun_periodStart_idx" ON "PayrollRun"("periodStart");

-- CreateIndex
CREATE INDEX "PayrollRun_status_idx" ON "PayrollRun"("status");

-- CreateIndex
CREATE INDEX "PayrollSyncLog_createdAt_idx" ON "PayrollSyncLog"("createdAt");

-- CreateIndex
CREATE INDEX "PayrollSyncLog_integrationId_idx" ON "PayrollSyncLog"("integrationId");

-- CreateIndex
CREATE INDEX "PayrollSyncLog_payrollRunId_idx" ON "PayrollSyncLog"("payrollRunId");

-- CreateIndex
CREATE INDEX "ProductionHistory_companyId_idx" ON "ProductionHistory"("companyId");

-- CreateIndex
CREATE INDEX "ProductionHistory_companyId_productionDate_idx" ON "ProductionHistory"("companyId", "productionDate");

-- CreateIndex
CREATE INDEX "ProductionHistory_productionDate_idx" ON "ProductionHistory"("productionDate");

-- CreateIndex
CREATE INDEX "ProductionHistory_productionPlanId_idx" ON "ProductionHistory"("productionPlanId");

-- CreateIndex
CREATE INDEX "ProductionHistory_recipeId_idx" ON "ProductionHistory"("recipeId");

-- CreateIndex
CREATE INDEX "ProductionItem_customerId_idx" ON "ProductionItem"("customerId");

-- CreateIndex
CREATE INDEX "ProductionItem_planId_idx" ON "ProductionItem"("planId");

-- CreateIndex
CREATE INDEX "ProductionItem_recipeId_idx" ON "ProductionItem"("recipeId");

-- CreateIndex
CREATE INDEX "ProductionItemAllocation_customerId_idx" ON "ProductionItemAllocation"("customerId");

-- CreateIndex
CREATE INDEX "ProductionItemAllocation_productionItemId_idx" ON "ProductionItemAllocation"("productionItemId");

-- CreateIndex
CREATE INDEX "ProductionPlan_companyId_idx" ON "ProductionPlan"("companyId");

-- CreateIndex
CREATE INDEX "ProductionPlan_startDate_idx" ON "ProductionPlan"("startDate");

-- CreateIndex
CREATE INDEX "ProductionTask_assignedTo_idx" ON "ProductionTask"("assignedTo");

-- CreateIndex
CREATE INDEX "ProductionTask_planId_idx" ON "ProductionTask"("planId");

-- CreateIndex
CREATE INDEX "Recipe_category_idx" ON "Recipe"("category");

-- CreateIndex
CREATE INDEX "Recipe_companyId_categoryId_idx" ON "Recipe"("companyId", "categoryId");

-- CreateIndex
CREATE INDEX "Recipe_companyId_idx" ON "Recipe"("companyId");

-- CreateIndex
CREATE INDEX "Recipe_companyId_name_idx" ON "Recipe"("companyId", "name");

-- CreateIndex
CREATE INDEX "Recipe_companyId_updatedAt_idx" ON "Recipe"("companyId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_name_companyId_key" ON "Recipe"("name", "companyId");

-- CreateIndex
CREATE INDEX "CustomerInventory_customerId_status_idx" ON "CustomerInventory"("customerId", "status");

-- CreateIndex
CREATE INDEX "CustomerInventory_expiryDate_idx" ON "CustomerInventory"("expiryDate");

-- CreateIndex
CREATE INDEX "StockCheck_customerId_checkDate_idx" ON "StockCheck"("customerId", "checkDate");

-- CreateIndex
CREATE UNIQUE INDEX "StockCheck_inventoryId_checkDate_key" ON "StockCheck"("inventoryId", "checkDate");

-- CreateIndex
CREATE INDEX "SalesSummary_customerId_periodStart_idx" ON "SalesSummary"("customerId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "SalesSummary_customerId_recipeId_periodStart_periodType_key" ON "SalesSummary"("customerId", "recipeId", "periodStart", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "CustomItemCheck_customItemId_checkDate_key" ON "CustomItemCheck"("customItemId", "checkDate");

-- CreateIndex
CREATE INDEX "RecipeCollection_collectionId_idx" ON "RecipeCollection"("collectionId");

-- CreateIndex
CREATE INDEX "RecipeCollection_recipeId_idx" ON "RecipeCollection"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeCollection_recipeId_collectionId_key" ON "RecipeCollection"("recipeId", "collectionId");

-- CreateIndex
CREATE INDEX "RecipeItem_ingredientId_idx" ON "RecipeItem"("ingredientId");

-- CreateIndex
CREATE INDEX "RecipeItem_recipeId_idx" ON "RecipeItem"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeItem_sectionId_idx" ON "RecipeItem"("sectionId");

-- CreateIndex
CREATE INDEX "RecipeSection_recipeId_idx" ON "RecipeSection"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeSection_recipeId_order_idx" ON "RecipeSection"("recipeId", "order");

-- CreateIndex
CREATE INDEX "RecipeSubRecipe_parentRecipeId_idx" ON "RecipeSubRecipe"("parentRecipeId");

-- CreateIndex
CREATE INDEX "RecipeSubRecipe_subRecipeId_idx" ON "RecipeSubRecipe"("subRecipeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeSubRecipe_parentRecipeId_subRecipeId_key" ON "RecipeSubRecipe"("parentRecipeId", "subRecipeId");

-- CreateIndex
CREATE INDEX "RecipeUpdateLog_companyId_allergenImpact_updatedAt_idx" ON "RecipeUpdateLog"("companyId", "allergenImpact", "updatedAt");

-- CreateIndex
CREATE INDEX "RecipeUpdateLog_companyId_idx" ON "RecipeUpdateLog"("companyId");

-- CreateIndex
CREATE INDEX "RecipeUpdateLog_recipeId_idx" ON "RecipeUpdateLog"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeVersion_recipeId_idx" ON "RecipeVersion"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeVersion_recipeId_version_idx" ON "RecipeVersion"("recipeId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeVersion_recipeId_version_key" ON "RecipeVersion"("recipeId", "version");

-- CreateIndex
CREATE INDEX "SalesRecord_channel_idx" ON "SalesRecord"("channel");

-- CreateIndex
CREATE INDEX "SalesRecord_companyId_idx" ON "SalesRecord"("companyId");

-- CreateIndex
CREATE INDEX "SalesRecord_companyId_transactionDate_idx" ON "SalesRecord"("companyId", "transactionDate");

-- CreateIndex
CREATE INDEX "SalesRecord_externalId_idx" ON "SalesRecord"("externalId");

-- CreateIndex
CREATE INDEX "SalesRecord_recipeId_idx" ON "SalesRecord"("recipeId");

-- CreateIndex
CREATE INDEX "SalesRecord_transactionDate_idx" ON "SalesRecord"("transactionDate");

-- CreateIndex
CREATE INDEX "ScheduledTask_companyId_isActive_idx" ON "ScheduledTask"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "SeasonalTrend_category_idx" ON "SeasonalTrend"("category");

-- CreateIndex
CREATE INDEX "SeasonalTrend_companyId_idx" ON "SeasonalTrend"("companyId");

-- CreateIndex
CREATE INDEX "SeasonalTrend_recipeId_idx" ON "SeasonalTrend"("recipeId");

-- CreateIndex
CREATE INDEX "SeasonalTrend_season_idx" ON "SeasonalTrend"("season");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonalTrend_companyId_recipeId_season_key" ON "SeasonalTrend"("companyId", "recipeId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_refreshToken_idx" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_revokedAt_idx" ON "Session"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "ShelfLifeOption_companyId_idx" ON "ShelfLifeOption"("companyId");

-- CreateIndex
CREATE INDEX "ShelfLifeOption_companyId_order_idx" ON "ShelfLifeOption"("companyId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ShelfLifeOption_name_companyId_key" ON "ShelfLifeOption"("name", "companyId");

-- CreateIndex
CREATE INDEX "Shift_companyId_date_idx" ON "Shift"("companyId", "date");

-- CreateIndex
CREATE INDEX "Shift_companyId_idx" ON "Shift"("companyId");

-- CreateIndex
CREATE INDEX "Shift_date_idx" ON "Shift"("date");

-- CreateIndex
CREATE INDEX "Shift_membershipId_idx" ON "Shift"("membershipId");

-- CreateIndex
CREATE INDEX "Shift_status_idx" ON "Shift"("status");

-- CreateIndex
CREATE INDEX "ShiftTemplate_companyId_idx" ON "ShiftTemplate"("companyId");

-- CreateIndex
CREATE INDEX "ShiftTemplate_isActive_idx" ON "ShiftTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyOrder_shopifyOrderId_key" ON "ShopifyOrder"("shopifyOrderId");

-- CreateIndex
CREATE INDEX "ShopifyOrder_companyId_idx" ON "ShopifyOrder"("companyId");

-- CreateIndex
CREATE INDEX "ShopifyOrder_orderDate_idx" ON "ShopifyOrder"("orderDate");

-- CreateIndex
CREATE INDEX "ShopifyOrder_shopifyOrderId_idx" ON "ShopifyOrder"("shopifyOrderId");

-- CreateIndex
CREATE INDEX "ShopifyOrder_status_idx" ON "ShopifyOrder"("status");

-- CreateIndex
CREATE INDEX "ShopifyOrderItem_orderId_idx" ON "ShopifyOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "ShopifyOrderItem_recipeId_idx" ON "ShopifyOrderItem"("recipeId");

-- CreateIndex
CREATE INDEX "ShopifyOrderItem_shopifyProductId_idx" ON "ShopifyOrderItem"("shopifyProductId");

-- CreateIndex
CREATE INDEX "ShopifyProductMapping_companyId_idx" ON "ShopifyProductMapping"("companyId");

-- CreateIndex
CREATE INDEX "ShopifyProductMapping_recipeId_idx" ON "ShopifyProductMapping"("recipeId");

-- CreateIndex
CREATE INDEX "ShopifyProductMapping_shopifyProductId_idx" ON "ShopifyProductMapping"("shopifyProductId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyProductMapping_companyId_shopifyProductId_shopifyVar_key" ON "ShopifyProductMapping"("companyId", "shopifyProductId", "shopifyVariantId");

-- CreateIndex
CREATE INDEX "SmartAlert_companyId_isDismissed_createdAt_idx" ON "SmartAlert"("companyId", "isDismissed", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "StorageOption_companyId_idx" ON "StorageOption"("companyId");

-- CreateIndex
CREATE INDEX "StorageOption_companyId_order_idx" ON "StorageOption"("companyId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "StorageOption_name_companyId_key" ON "StorageOption"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Supplier_companyId_idx" ON "Supplier"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_companyId_key" ON "Supplier"("name", "companyId");

-- CreateIndex
CREATE INDEX "TaskComment_taskInstanceId_createdAt_idx" ON "TaskComment"("taskInstanceId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TaskCompletion_taskInstanceId_key" ON "TaskCompletion"("taskInstanceId");

-- CreateIndex
CREATE INDEX "TaskCompletion_companyId_completionDate_idx" ON "TaskCompletion"("companyId", "completionDate" DESC);

-- CreateIndex
CREATE INDEX "TaskCompletion_companyId_status_completionDate_idx" ON "TaskCompletion"("companyId", "status", "completionDate" DESC);

-- CreateIndex
CREATE INDEX "TaskCompletion_completedBy_completionDate_idx" ON "TaskCompletion"("completedBy", "completionDate" DESC);

-- CreateIndex
CREATE INDEX "TaskInstance_companyId_dueDate_idx" ON "TaskInstance"("companyId", "dueDate" DESC);

-- CreateIndex
CREATE INDEX "TaskPhoto_taskCompletionId_idx" ON "TaskPhoto"("taskCompletionId");

-- CreateIndex
CREATE INDEX "TaskTemplate_companyId_category_isActive_idx" ON "TaskTemplate"("companyId", "category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_token_key" ON "TeamInvitation"("token");

-- CreateIndex
CREATE INDEX "TeamInvitation_companyId_idx" ON "TeamInvitation"("companyId");

-- CreateIndex
CREATE INDEX "TeamInvitation_email_idx" ON "TeamInvitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_companyId_email_key" ON "TeamInvitation"("companyId", "email");

-- CreateIndex
CREATE INDEX "TemperatureReading_companyId_recordedAt_idx" ON "TemperatureReading"("companyId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "TemperatureReading_sensorId_recordedAt_idx" ON "TemperatureReading"("sensorId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "TemperatureRecord_applianceName_recordedAt_idx" ON "TemperatureRecord"("applianceName", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "TemperatureRecord_companyId_recordedAt_idx" ON "TemperatureRecord"("companyId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "TemperatureRecord_templateId_recordedAt_idx" ON "TemperatureRecord"("templateId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "TemplateAppliance_templateId_companyId_isActive_idx" ON "TemplateAppliance"("templateId", "companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateAppliance_templateId_applianceName_companyId_key" ON "TemplateAppliance"("templateId", "applianceName", "companyId");

-- CreateIndex
CREATE INDEX "Timesheet_clockInAt_idx" ON "Timesheet"("clockInAt");

-- CreateIndex
CREATE INDEX "Timesheet_companyId_clockInAt_idx" ON "Timesheet"("companyId", "clockInAt");

-- CreateIndex
CREATE INDEX "Timesheet_companyId_idx" ON "Timesheet"("companyId");

-- CreateIndex
CREATE INDEX "Timesheet_membershipId_idx" ON "Timesheet"("membershipId");

-- CreateIndex
CREATE INDEX "Timesheet_shiftId_idx" ON "Timesheet"("shiftId");

-- CreateIndex
CREATE INDEX "Timesheet_status_idx" ON "Timesheet"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "WebhookLog_companyId_idx" ON "WebhookLog"("companyId");

-- CreateIndex
CREATE INDEX "WebhookLog_createdAt_idx" ON "WebhookLog"("createdAt");

-- CreateIndex
CREATE INDEX "WebhookLog_eventType_idx" ON "WebhookLog"("eventType");

-- CreateIndex
CREATE INDEX "WebhookLog_integrationId_idx" ON "WebhookLog"("integrationId");

-- CreateIndex
CREATE INDEX "WebhookLog_provider_idx" ON "WebhookLog"("provider");

-- CreateIndex
CREATE INDEX "WebhookLog_status_idx" ON "WebhookLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WholesaleCustomer_portalToken_key" ON "WholesaleCustomer"("portalToken");

-- CreateIndex
CREATE UNIQUE INDEX "WholesaleCustomer_portalShortCode_key" ON "WholesaleCustomer"("portalShortCode");

-- CreateIndex
CREATE INDEX "WholesaleCustomer_companyId_idx" ON "WholesaleCustomer"("companyId");

-- CreateIndex
CREATE INDEX "WholesaleCustomer_isActive_idx" ON "WholesaleCustomer"("isActive");

-- CreateIndex
CREATE INDEX "WholesaleCustomer_portalToken_idx" ON "WholesaleCustomer"("portalToken");

-- CreateIndex
CREATE INDEX "WholesaleOrder_companyId_idx" ON "WholesaleOrder"("companyId");

-- CreateIndex
CREATE INDEX "WholesaleOrder_customerId_idx" ON "WholesaleOrder"("customerId");

-- CreateIndex
CREATE INDEX "WholesaleOrder_deliveryDate_idx" ON "WholesaleOrder"("deliveryDate");

-- CreateIndex
CREATE INDEX "WholesaleOrder_isRecurring_idx" ON "WholesaleOrder"("isRecurring");

-- CreateIndex
CREATE INDEX "WholesaleOrder_nextRecurrenceDate_idx" ON "WholesaleOrder"("nextRecurrenceDate");

-- CreateIndex
CREATE INDEX "WholesaleOrder_parentOrderId_idx" ON "WholesaleOrder"("parentOrderId");

-- CreateIndex
CREATE INDEX "WholesaleOrder_recurringStatus_idx" ON "WholesaleOrder"("recurringStatus");

-- CreateIndex
CREATE INDEX "WholesaleOrder_status_idx" ON "WholesaleOrder"("status");

-- CreateIndex
CREATE INDEX "WholesaleOrderItem_orderId_idx" ON "WholesaleOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "WholesaleOrderItem_recipeId_idx" ON "WholesaleOrderItem"("recipeId");

-- CreateIndex
CREATE INDEX "WholesaleProduct_category_idx" ON "WholesaleProduct"("category");

-- CreateIndex
CREATE INDEX "WholesaleProduct_companyId_idx" ON "WholesaleProduct"("companyId");

-- CreateIndex
CREATE INDEX "WholesaleProduct_companyId_isActive_idx" ON "WholesaleProduct"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "WholesaleProduct_isActive_idx" ON "WholesaleProduct"("isActive");

-- CreateIndex
CREATE INDEX "WholesaleProduct_recipeId_idx" ON "WholesaleProduct"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "WholesaleInvoice_invoiceNumber_key" ON "WholesaleInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "WholesaleInvoice_customerId_idx" ON "WholesaleInvoice"("customerId");

-- CreateIndex
CREATE INDEX "WholesaleInvoice_companyId_idx" ON "WholesaleInvoice"("companyId");

-- CreateIndex
CREATE INDEX "WholesaleInvoice_orderId_idx" ON "WholesaleInvoice"("orderId");

-- CreateIndex
CREATE INDEX "WholesaleInvoice_status_idx" ON "WholesaleInvoice"("status");

-- CreateIndex
CREATE INDEX "WholesaleInvoice_dueDate_idx" ON "WholesaleInvoice"("dueDate");

-- CreateIndex
CREATE INDEX "WholesaleInvoice_invoiceNumber_idx" ON "WholesaleInvoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WholesaleDeliveryNote_deliveryNoteNumber_key" ON "WholesaleDeliveryNote"("deliveryNoteNumber");

-- CreateIndex
CREATE INDEX "WholesaleDeliveryNote_customerId_idx" ON "WholesaleDeliveryNote"("customerId");

-- CreateIndex
CREATE INDEX "WholesaleDeliveryNote_companyId_idx" ON "WholesaleDeliveryNote"("companyId");

-- CreateIndex
CREATE INDEX "WholesaleDeliveryNote_orderId_idx" ON "WholesaleDeliveryNote"("orderId");

-- CreateIndex
CREATE INDEX "WholesalePayment_invoiceId_idx" ON "WholesalePayment"("invoiceId");

-- CreateIndex
CREATE INDEX "WholesalePayment_customerId_idx" ON "WholesalePayment"("customerId");

-- CreateIndex
CREATE INDEX "WholesalePayment_companyId_idx" ON "WholesalePayment"("companyId");

-- CreateIndex
CREATE INDEX "WholesalePayment_paymentDate_idx" ON "WholesalePayment"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "UserAppSubscription_stripeSubscriptionId_key" ON "UserAppSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "UserAppSubscription_userId_idx" ON "UserAppSubscription"("userId");

-- CreateIndex
CREATE INDEX "UserAppSubscription_userId_status_idx" ON "UserAppSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "UserAppSubscription_app_idx" ON "UserAppSubscription"("app");

-- CreateIndex
CREATE UNIQUE INDEX "UserAppSubscription_userId_app_key" ON "UserAppSubscription"("userId", "app");

-- CreateIndex
CREATE UNIQUE INDEX "MentorSubscription_stripeSubscriptionId_key" ON "MentorSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "MentorSubscription_userId_idx" ON "MentorSubscription"("userId");

-- CreateIndex
CREATE INDEX "MentorSubscription_companyId_idx" ON "MentorSubscription"("companyId");

-- CreateIndex
CREATE INDEX "MentorSubscription_userId_status_idx" ON "MentorSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "MentorSubscription_status_idx" ON "MentorSubscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MentorSubscription_userId_companyId_key" ON "MentorSubscription"("userId", "companyId");

-- CreateIndex
CREATE INDEX "MentorConversation_companyId_idx" ON "MentorConversation"("companyId");

-- CreateIndex
CREATE INDEX "MentorConversation_userId_idx" ON "MentorConversation"("userId");

-- CreateIndex
CREATE INDEX "MentorConversation_companyId_createdAt_idx" ON "MentorConversation"("companyId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MentorConversation_companyId_isArchived_idx" ON "MentorConversation"("companyId", "isArchived");

-- CreateIndex
CREATE INDEX "MentorMessage_conversationId_idx" ON "MentorMessage"("conversationId");

-- CreateIndex
CREATE INDEX "MentorMessage_conversationId_createdAt_idx" ON "MentorMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "MentorKnowledgeIndex_companyId_idx" ON "MentorKnowledgeIndex"("companyId");

-- CreateIndex
CREATE INDEX "MentorKnowledgeIndex_companyId_entityType_idx" ON "MentorKnowledgeIndex"("companyId", "entityType");

-- CreateIndex
CREATE INDEX "MentorKnowledgeIndex_entityType_entityId_idx" ON "MentorKnowledgeIndex"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "MentorKnowledgeIndex_lastIndexedAt_idx" ON "MentorKnowledgeIndex"("lastIndexedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MentorKnowledgeIndex_companyId_entityType_entityId_key" ON "MentorKnowledgeIndex"("companyId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorConfig_companyId_key" ON "MentorConfig"("companyId");

-- CreateIndex
CREATE INDEX "MentorConfig_companyId_idx" ON "MentorConfig"("companyId");

-- CreateIndex
CREATE INDEX "MentorGoal_companyId_idx" ON "MentorGoal"("companyId");

-- CreateIndex
CREATE INDEX "MentorGoal_userId_idx" ON "MentorGoal"("userId");

-- CreateIndex
CREATE INDEX "MentorGoal_companyId_status_idx" ON "MentorGoal"("companyId", "status");

-- CreateIndex
CREATE INDEX "MentorGoal_companyId_createdAt_idx" ON "MentorGoal"("companyId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MentorProgress_goalId_idx" ON "MentorProgress"("goalId");

-- CreateIndex
CREATE INDEX "MentorProgress_goalId_createdAt_idx" ON "MentorProgress"("goalId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MentorInsight_companyId_idx" ON "MentorInsight"("companyId");

-- CreateIndex
CREATE INDEX "MentorInsight_companyId_isRead_isDismissed_idx" ON "MentorInsight"("companyId", "isRead", "isDismissed");

-- CreateIndex
CREATE INDEX "MentorInsight_companyId_createdAt_idx" ON "MentorInsight"("companyId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MentorInsight_insightType_idx" ON "MentorInsight"("insightType");

-- CreateIndex
CREATE INDEX "MentorReminder_companyId_idx" ON "MentorReminder"("companyId");

-- CreateIndex
CREATE INDEX "MentorReminder_companyId_dueDate_idx" ON "MentorReminder"("companyId", "dueDate");

-- CreateIndex
CREATE INDEX "MentorReminder_companyId_isCompleted_idx" ON "MentorReminder"("companyId", "isCompleted");

-- CreateIndex
CREATE INDEX "MentorReminder_userId_idx" ON "MentorReminder"("userId");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllergenSheetTemplate" ADD CONSTRAINT "AllergenSheetTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItemCompletion" ADD CONSTRAINT "ChecklistItemCompletion_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "TemplateChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItemCompletion" ADD CONSTRAINT "ChecklistItemCompletion_taskCompletionId_fkey" FOREIGN KEY ("taskCompletionId") REFERENCES "TaskCompletion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomReport" ADD CONSTRAINT "CustomReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPricing" ADD CONSTRAINT "CustomerPricing_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPricing" ADD CONSTRAINT "CustomerPricing_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTemperatureCheck" ADD CONSTRAINT "DailyTemperatureCheck_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTemperatureCheck" ADD CONSTRAINT "DailyTemperatureCheck_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentIssue" ADD CONSTRAINT "EquipmentIssue_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentIssue" ADD CONSTRAINT "EquipmentIssue_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "EquipmentRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentIssue" ADD CONSTRAINT "EquipmentIssue_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentIssue" ADD CONSTRAINT "EquipmentIssue_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentRegister" ADD CONSTRAINT "EquipmentRegister_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalMapping" ADD CONSTRAINT "ExternalMapping_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalMapping" ADD CONSTRAINT "ExternalMapping_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "IntegrationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureModule" ADD CONSTRAINT "FeatureModule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientPriceHistory" ADD CONSTRAINT "IngredientPriceHistory_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConfig" ADD CONSTRAINT "IntegrationConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSync" ADD CONSTRAINT "IntegrationSync_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSync" ADD CONSTRAINT "IntegrationSync_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "IntegrationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelTemplate" ADD CONSTRAINT "LabelTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaDevice" ADD CONSTRAINT "MfaDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollIntegration" ADD CONSTRAINT "PayrollIntegration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollLine" ADD CONSTRAINT "PayrollLine_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollLine" ADD CONSTRAINT "PayrollLine_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSyncLog" ADD CONSTRAINT "PayrollSyncLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "PayrollIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSyncLog" ADD CONSTRAINT "PayrollSyncLog_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionHistory" ADD CONSTRAINT "ProductionHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionHistory" ADD CONSTRAINT "ProductionHistory_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionItem" ADD CONSTRAINT "ProductionItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionItem" ADD CONSTRAINT "ProductionItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ProductionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionItem" ADD CONSTRAINT "ProductionItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionItemAllocation" ADD CONSTRAINT "ProductionItemAllocation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionItemAllocation" ADD CONSTRAINT "ProductionItemAllocation_productionItemId_fkey" FOREIGN KEY ("productionItemId") REFERENCES "ProductionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionPlan" ADD CONSTRAINT "ProductionPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionTask" ADD CONSTRAINT "ProductionTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ProductionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_shelfLifeId_fkey" FOREIGN KEY ("shelfLifeId") REFERENCES "ShelfLifeOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "StorageOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInventory" ADD CONSTRAINT "CustomerInventory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInventory" ADD CONSTRAINT "CustomerInventory_productionItemId_fkey" FOREIGN KEY ("productionItemId") REFERENCES "ProductionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInventory" ADD CONSTRAINT "CustomerInventory_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInventory" ADD CONSTRAINT "CustomerInventory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "WholesaleOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCheck" ADD CONSTRAINT "StockCheck_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCheck" ADD CONSTRAINT "StockCheck_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "CustomerInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesSummary" ADD CONSTRAINT "SalesSummary_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesSummary" ADD CONSTRAINT "SalesSummary_productionItemId_fkey" FOREIGN KEY ("productionItemId") REFERENCES "ProductionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesSummary" ADD CONSTRAINT "SalesSummary_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomInventoryItem" ADD CONSTRAINT "CustomInventoryItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomItemCheck" ADD CONSTRAINT "CustomItemCheck_customItemId_fkey" FOREIGN KEY ("customItemId") REFERENCES "CustomInventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeCollection" ADD CONSTRAINT "RecipeCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeCollection" ADD CONSTRAINT "RecipeCollection_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "RecipeSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSection" ADD CONSTRAINT "RecipeSection_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSubRecipe" ADD CONSTRAINT "RecipeSubRecipe_parentRecipeId_fkey" FOREIGN KEY ("parentRecipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSubRecipe" ADD CONSTRAINT "RecipeSubRecipe_subRecipeId_fkey" FOREIGN KEY ("subRecipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeUpdateLog" ADD CONSTRAINT "RecipeUpdateLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeUpdateLog" ADD CONSTRAINT "RecipeUpdateLog_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeVersion" ADD CONSTRAINT "RecipeVersion_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRecord" ADD CONSTRAINT "SalesRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRecord" ADD CONSTRAINT "SalesRecord_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonalTrend" ADD CONSTRAINT "SeasonalTrend_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonalTrend" ADD CONSTRAINT "SeasonalTrend_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelfLifeOption" ADD CONSTRAINT "ShelfLifeOption_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftTemplate" ADD CONSTRAINT "ShiftTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyOrder" ADD CONSTRAINT "ShopifyOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyOrderItem" ADD CONSTRAINT "ShopifyOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShopifyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyOrderItem" ADD CONSTRAINT "ShopifyOrderItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyProductMapping" ADD CONSTRAINT "ShopifyProductMapping_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyProductMapping" ADD CONSTRAINT "ShopifyProductMapping_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartAlert" ADD CONSTRAINT "SmartAlert_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageOption" ADD CONSTRAINT "StorageOption_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskCompletionId_fkey" FOREIGN KEY ("taskCompletionId") REFERENCES "TaskCompletion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskInstanceId_fkey" FOREIGN KEY ("taskInstanceId") REFERENCES "TaskInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskInstanceId_fkey" FOREIGN KEY ("taskInstanceId") REFERENCES "TaskInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_scheduledTaskId_fkey" FOREIGN KEY ("scheduledTaskId") REFERENCES "ScheduledTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPhoto" ADD CONSTRAINT "TaskPhoto_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItemCompletion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPhoto" ADD CONSTRAINT "TaskPhoto_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPhoto" ADD CONSTRAINT "TaskPhoto_taskCompletionId_fkey" FOREIGN KEY ("taskCompletionId") REFERENCES "TaskCompletion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPhoto" ADD CONSTRAINT "TaskPhoto_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureReading" ADD CONSTRAINT "TemperatureReading_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureReading" ADD CONSTRAINT "TemperatureReading_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "TemperatureSensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureRecord" ADD CONSTRAINT "TemperatureRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureRecord" ADD CONSTRAINT "TemperatureRecord_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureRecord" ADD CONSTRAINT "TemperatureRecord_taskInstanceId_fkey" FOREIGN KEY ("taskInstanceId") REFERENCES "TaskInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureRecord" ADD CONSTRAINT "TemperatureRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureSensor" ADD CONSTRAINT "TemperatureSensor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateAppliance" ADD CONSTRAINT "TemplateAppliance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateAppliance" ADD CONSTRAINT "TemplateAppliance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateChecklistItem" ADD CONSTRAINT "TemplateChecklistItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "IntegrationConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleCustomer" ADD CONSTRAINT "WholesaleCustomer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleOrder" ADD CONSTRAINT "WholesaleOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleOrder" ADD CONSTRAINT "WholesaleOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleOrder" ADD CONSTRAINT "WholesaleOrder_parentOrderId_fkey" FOREIGN KEY ("parentOrderId") REFERENCES "WholesaleOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleOrderItem" ADD CONSTRAINT "WholesaleOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "WholesaleOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleOrderItem" ADD CONSTRAINT "WholesaleOrderItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleProduct" ADD CONSTRAINT "WholesaleProduct_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleProduct" ADD CONSTRAINT "WholesaleProduct_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleInvoice" ADD CONSTRAINT "WholesaleInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleInvoice" ADD CONSTRAINT "WholesaleInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleInvoice" ADD CONSTRAINT "WholesaleInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "WholesaleOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleDeliveryNote" ADD CONSTRAINT "WholesaleDeliveryNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleDeliveryNote" ADD CONSTRAINT "WholesaleDeliveryNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleDeliveryNote" ADD CONSTRAINT "WholesaleDeliveryNote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "WholesaleOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesalePayment" ADD CONSTRAINT "WholesalePayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesalePayment" ADD CONSTRAINT "WholesalePayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesalePayment" ADD CONSTRAINT "WholesalePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "WholesaleInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesalePayment" ADD CONSTRAINT "WholesalePayment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAppSubscription" ADD CONSTRAINT "UserAppSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSubscription" ADD CONSTRAINT "MentorSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSubscription" ADD CONSTRAINT "MentorSubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorConversation" ADD CONSTRAINT "MentorConversation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorConversation" ADD CONSTRAINT "MentorConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorMessage" ADD CONSTRAINT "MentorMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "MentorConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorKnowledgeIndex" ADD CONSTRAINT "MentorKnowledgeIndex_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorConfig" ADD CONSTRAINT "MentorConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorGoal" ADD CONSTRAINT "MentorGoal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorGoal" ADD CONSTRAINT "MentorGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProgress" ADD CONSTRAINT "MentorProgress_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "MentorGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorInsight" ADD CONSTRAINT "MentorInsight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorReminder" ADD CONSTRAINT "MentorReminder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorReminder" ADD CONSTRAINT "MentorReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
