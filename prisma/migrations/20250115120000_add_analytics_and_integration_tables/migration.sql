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

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSnapshot_companyId_period_periodStart_key" ON "AnalyticsSnapshot"("companyId", "period", "periodStart");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_companyId_idx" ON "AnalyticsSnapshot"("companyId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_period_idx" ON "AnalyticsSnapshot"("period");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_periodStart_idx" ON "AnalyticsSnapshot"("periodStart");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_companyId_periodStart_idx" ON "AnalyticsSnapshot"("companyId", "periodStart");

-- CreateIndex
CREATE INDEX "SalesRecord_companyId_idx" ON "SalesRecord"("companyId");

-- CreateIndex
CREATE INDEX "SalesRecord_transactionDate_idx" ON "SalesRecord"("transactionDate");

-- CreateIndex
CREATE INDEX "SalesRecord_recipeId_idx" ON "SalesRecord"("recipeId");

-- CreateIndex
CREATE INDEX "SalesRecord_channel_idx" ON "SalesRecord"("channel");

-- CreateIndex
CREATE INDEX "SalesRecord_companyId_transactionDate_idx" ON "SalesRecord"("companyId", "transactionDate");

-- CreateIndex
CREATE INDEX "SalesRecord_externalId_idx" ON "SalesRecord"("externalId");

-- CreateIndex
CREATE INDEX "ProductionHistory_companyId_idx" ON "ProductionHistory"("companyId");

-- CreateIndex
CREATE INDEX "ProductionHistory_recipeId_idx" ON "ProductionHistory"("recipeId");

-- CreateIndex
CREATE INDEX "ProductionHistory_productionDate_idx" ON "ProductionHistory"("productionDate");

-- CreateIndex
CREATE INDEX "ProductionHistory_companyId_productionDate_idx" ON "ProductionHistory"("companyId", "productionDate");

-- CreateIndex
CREATE INDEX "ProductionHistory_productionPlanId_idx" ON "ProductionHistory"("productionPlanId");

-- CreateIndex
CREATE INDEX "IngredientPriceHistory_ingredientId_idx" ON "IngredientPriceHistory"("ingredientId");

-- CreateIndex
CREATE INDEX "IngredientPriceHistory_createdAt_idx" ON "IngredientPriceHistory"("createdAt");

-- CreateIndex
CREATE INDEX "IngredientPriceHistory_supplierId_idx" ON "IngredientPriceHistory"("supplierId");

-- CreateIndex
CREATE INDEX "IngredientPriceHistory_ingredientId_createdAt_idx" ON "IngredientPriceHistory"("ingredientId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomReport_companyId_idx" ON "CustomReport"("companyId");

-- CreateIndex
CREATE INDEX "CustomReport_createdBy_idx" ON "CustomReport"("createdBy");

-- CreateIndex
CREATE INDEX "CustomReport_isScheduled_idx" ON "CustomReport"("isScheduled");

-- CreateIndex
CREATE UNIQUE INDEX "CustomReport_companyId_name_key" ON "CustomReport"("companyId", "name");

-- CreateIndex
CREATE INDEX "SeasonalTrend_companyId_idx" ON "SeasonalTrend"("companyId");

-- CreateIndex
CREATE INDEX "SeasonalTrend_recipeId_idx" ON "SeasonalTrend"("recipeId");

-- CreateIndex
CREATE INDEX "SeasonalTrend_category_idx" ON "SeasonalTrend"("category");

-- CreateIndex
CREATE INDEX "SeasonalTrend_season_idx" ON "SeasonalTrend"("season");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonalTrend_companyId_recipeId_season_key" ON "SeasonalTrend"("companyId", "recipeId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConfig_companyId_provider_key" ON "IntegrationConfig"("companyId", "provider");

-- CreateIndex
CREATE INDEX "IntegrationConfig_companyId_idx" ON "IntegrationConfig"("companyId");

-- CreateIndex
CREATE INDEX "IntegrationConfig_provider_idx" ON "IntegrationConfig"("provider");

-- CreateIndex
CREATE INDEX "IntegrationConfig_isActive_idx" ON "IntegrationConfig"("isActive");

-- CreateIndex
CREATE INDEX "IntegrationSync_companyId_idx" ON "IntegrationSync"("companyId");

-- CreateIndex
CREATE INDEX "IntegrationSync_integrationId_idx" ON "IntegrationSync"("integrationId");

-- CreateIndex
CREATE INDEX "IntegrationSync_status_idx" ON "IntegrationSync"("status");

-- CreateIndex
CREATE INDEX "IntegrationSync_startedAt_idx" ON "IntegrationSync"("startedAt");

-- CreateIndex
CREATE INDEX "IntegrationSync_companyId_startedAt_idx" ON "IntegrationSync"("companyId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalMapping_integrationId_entityType_internalId_key" ON "ExternalMapping"("integrationId", "entityType", "internalId");

-- CreateIndex
CREATE INDEX "ExternalMapping_companyId_idx" ON "ExternalMapping"("companyId");

-- CreateIndex
CREATE INDEX "ExternalMapping_integrationId_idx" ON "ExternalMapping"("integrationId");

-- CreateIndex
CREATE INDEX "ExternalMapping_entityType_idx" ON "ExternalMapping"("entityType");

-- CreateIndex
CREATE INDEX "ExternalMapping_externalId_idx" ON "ExternalMapping"("externalId");

-- CreateIndex
CREATE INDEX "WebhookLog_companyId_idx" ON "WebhookLog"("companyId");

-- CreateIndex
CREATE INDEX "WebhookLog_integrationId_idx" ON "WebhookLog"("integrationId");

-- CreateIndex
CREATE INDEX "WebhookLog_provider_idx" ON "WebhookLog"("provider");

-- CreateIndex
CREATE INDEX "WebhookLog_eventType_idx" ON "WebhookLog"("eventType");

-- CreateIndex
CREATE INDEX "WebhookLog_status_idx" ON "WebhookLog"("status");

-- CreateIndex
CREATE INDEX "WebhookLog_createdAt_idx" ON "WebhookLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRecord" ADD CONSTRAINT "SalesRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRecord" ADD CONSTRAINT "SalesRecord_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionHistory" ADD CONSTRAINT "ProductionHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionHistory" ADD CONSTRAINT "ProductionHistory_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientPriceHistory" ADD CONSTRAINT "IngredientPriceHistory_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomReport" ADD CONSTRAINT "CustomReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonalTrend" ADD CONSTRAINT "SeasonalTrend_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonalTrend" ADD CONSTRAINT "SeasonalTrend_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConfig" ADD CONSTRAINT "IntegrationConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSync" ADD CONSTRAINT "IntegrationSync_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSync" ADD CONSTRAINT "IntegrationSync_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "IntegrationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalMapping" ADD CONSTRAINT "ExternalMapping_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalMapping" ADD CONSTRAINT "ExternalMapping_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "IntegrationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "IntegrationConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
