-- CreateEnum
CREATE TYPE "BaseUnit" AS ENUM ('g', 'ml', 'each', 'slices');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('g', 'kg', 'mg', 'lb', 'oz', 'ml', 'l', 'pint', 'quart', 'gallon', 'tsp', 'tbsp', 'cup', 'floz', 'each', 'slices');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "supplier" TEXT,
    "supplierId" INTEGER,
    "packQuantity" DECIMAL(65,30) NOT NULL,
    "packUnit" "BaseUnit" NOT NULL,
    "originalUnit" "Unit",
    "packPrice" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "lastPriceUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priceHistory" TEXT,
    "densityGPerMl" DECIMAL(65,30),
    "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "companyId" INTEGER,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "yieldQuantity" DECIMAL(65,30) NOT NULL,
    "yieldUnit" "BaseUnit" NOT NULL,
    "portionsPerBatch" INTEGER,
    "portionSize" DECIMAL(65,30),
    "portionUnit" "BaseUnit",
    "imageUrl" TEXT,
    "method" TEXT,
    "isSubRecipe" BOOLEAN NOT NULL DEFAULT false,
    "bakeTime" INTEGER,
    "bakeTemp" INTEGER,
    "storage" TEXT,
    "storageId" INTEGER,
    "shelfLife" TEXT,
    "shelfLifeId" INTEGER,
    "category" TEXT,
    "categoryId" INTEGER,
    "sellingPrice" DECIMAL(65,30),
    "suggestedPrice" DECIMAL(65,30),
    "actualFoodCost" DECIMAL(65,30),
    "lastPriceUpdate" TIMESTAMP(3),
    "companyId" INTEGER,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" "Unit" NOT NULL,
    "price" DECIMAL(65,30),
    "note" TEXT,
    "sectionId" INTEGER,

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
    "bakeTemp" INTEGER,
    "bakeTime" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,

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
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "stripeCustomerId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'free',
    "subscriptionTier" TEXT NOT NULL DEFAULT 'starter',
    "subscriptionInterval" TEXT NOT NULL DEFAULT 'month',
    "subscriptionEndsAt" TIMESTAMP(3),
    "ingredientCount" INTEGER NOT NULL DEFAULT 0,
    "recipeCount" INTEGER NOT NULL DEFAULT 0,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "businessType" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'United Kingdom',
    "logoUrl" TEXT,
    "isProfilePublic" BOOLEAN NOT NULL DEFAULT false,
    "profileBio" TEXT,
    "showTeam" BOOLEAN NOT NULL DEFAULT false,
    "showContact" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" INTEGER,
    "maxSeats" INTEGER NOT NULL DEFAULT 5,
    "seatsUsed" INTEGER NOT NULL DEFAULT 1,
    "pricePerSeat" DECIMAL(65,30) NOT NULL DEFAULT 5.00,
    "shopifyStoreUrl" TEXT,
    "shopifyAccessToken" TEXT,
    "shopifyApiKey" TEXT,
    "shopifyWebhookSecret" TEXT,
    "shopifyIsConnected" BOOLEAN NOT NULL DEFAULT false,
    "shopifyLastSync" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'VIEWER',
    "invitedBy" INTEGER,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "pin" TEXT,
    "pinHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "targetFoodCost" DECIMAL(65,30) NOT NULL DEFAULT 25.0,
    "maxFoodCost" DECIMAL(65,30) NOT NULL DEFAULT 35.0,
    "navigationItems" JSONB,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
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
    "tier" TEXT NOT NULL DEFAULT 'professional',
    "price" DECIMAL(65,30) NOT NULL DEFAULT 19.00,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "interval" TEXT NOT NULL DEFAULT 'month',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "maxIngredients" INTEGER,
    "maxRecipes" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "TeamInvitation" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'VIEWER',
    "invitedBy" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "RecipeCollection" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipeId" INTEGER NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RecipeCollection_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "Ingredient_companyId_idx" ON "Ingredient"("companyId");

-- CreateIndex
CREATE INDEX "Ingredient_companyId_name_idx" ON "Ingredient"("companyId", "name");

-- CreateIndex
CREATE INDEX "Ingredient_companyId_lastPriceUpdate_idx" ON "Ingredient"("companyId", "lastPriceUpdate");

-- CreateIndex
CREATE INDEX "Ingredient_supplierId_idx" ON "Ingredient"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_companyId_key" ON "Ingredient"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_name_key" ON "Recipe"("name");

-- CreateIndex
CREATE INDEX "Recipe_companyId_idx" ON "Recipe"("companyId");

-- CreateIndex
CREATE INDEX "Recipe_category_idx" ON "Recipe"("category");

-- CreateIndex
CREATE INDEX "Recipe_companyId_name_idx" ON "Recipe"("companyId", "name");

-- CreateIndex
CREATE INDEX "Recipe_companyId_categoryId_idx" ON "Recipe"("companyId", "categoryId");

-- CreateIndex
CREATE INDEX "Recipe_companyId_updatedAt_idx" ON "Recipe"("companyId", "updatedAt");

-- CreateIndex
CREATE INDEX "RecipeItem_recipeId_idx" ON "RecipeItem"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeItem_ingredientId_idx" ON "RecipeItem"("ingredientId");

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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Membership_companyId_idx" ON "Membership"("companyId");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_companyId_pin_idx" ON "Membership"("companyId", "pin");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_companyId_key" ON "Membership"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Category_companyId_idx" ON "Category"("companyId");

-- CreateIndex
CREATE INDEX "Category_companyId_order_idx" ON "Category"("companyId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_companyId_key" ON "Category"("name", "companyId");

-- CreateIndex
CREATE INDEX "ShelfLifeOption_companyId_idx" ON "ShelfLifeOption"("companyId");

-- CreateIndex
CREATE INDEX "ShelfLifeOption_companyId_order_idx" ON "ShelfLifeOption"("companyId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ShelfLifeOption_name_companyId_key" ON "ShelfLifeOption"("name", "companyId");

-- CreateIndex
CREATE INDEX "Supplier_companyId_idx" ON "Supplier"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_companyId_key" ON "Supplier"("name", "companyId");

-- CreateIndex
CREATE INDEX "StorageOption_companyId_idx" ON "StorageOption"("companyId");

-- CreateIndex
CREATE INDEX "StorageOption_companyId_order_idx" ON "StorageOption"("companyId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "StorageOption_name_companyId_key" ON "StorageOption"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_token_key" ON "TeamInvitation"("token");

-- CreateIndex
CREATE INDEX "TeamInvitation_companyId_idx" ON "TeamInvitation"("companyId");

-- CreateIndex
CREATE INDEX "TeamInvitation_email_idx" ON "TeamInvitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_companyId_email_key" ON "TeamInvitation"("companyId", "email");

-- CreateIndex
CREATE INDEX "ProductionPlan_companyId_idx" ON "ProductionPlan"("companyId");

-- CreateIndex
CREATE INDEX "ProductionPlan_startDate_idx" ON "ProductionPlan"("startDate");

-- CreateIndex
CREATE INDEX "ProductionItem_planId_idx" ON "ProductionItem"("planId");

-- CreateIndex
CREATE INDEX "ProductionItem_recipeId_idx" ON "ProductionItem"("recipeId");

-- CreateIndex
CREATE INDEX "ProductionItem_customerId_idx" ON "ProductionItem"("customerId");

-- CreateIndex
CREATE INDEX "ProductionItemAllocation_productionItemId_idx" ON "ProductionItemAllocation"("productionItemId");

-- CreateIndex
CREATE INDEX "ProductionItemAllocation_customerId_idx" ON "ProductionItemAllocation"("customerId");

-- CreateIndex
CREATE INDEX "ProductionTask_planId_idx" ON "ProductionTask"("planId");

-- CreateIndex
CREATE INDEX "ProductionTask_assignedTo_idx" ON "ProductionTask"("assignedTo");

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
CREATE INDEX "WholesaleOrder_customerId_idx" ON "WholesaleOrder"("customerId");

-- CreateIndex
CREATE INDEX "WholesaleOrder_companyId_idx" ON "WholesaleOrder"("companyId");

-- CreateIndex
CREATE INDEX "WholesaleOrder_status_idx" ON "WholesaleOrder"("status");

-- CreateIndex
CREATE INDEX "WholesaleOrder_deliveryDate_idx" ON "WholesaleOrder"("deliveryDate");

-- CreateIndex
CREATE INDEX "WholesaleOrder_isRecurring_idx" ON "WholesaleOrder"("isRecurring");

-- CreateIndex
CREATE INDEX "WholesaleOrder_nextRecurrenceDate_idx" ON "WholesaleOrder"("nextRecurrenceDate");

-- CreateIndex
CREATE INDEX "WholesaleOrder_recurringStatus_idx" ON "WholesaleOrder"("recurringStatus");

-- CreateIndex
CREATE INDEX "WholesaleOrder_parentOrderId_idx" ON "WholesaleOrder"("parentOrderId");

-- CreateIndex
CREATE INDEX "WholesaleOrderItem_orderId_idx" ON "WholesaleOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "WholesaleOrderItem_recipeId_idx" ON "WholesaleOrderItem"("recipeId");

-- CreateIndex
CREATE INDEX "CustomerPricing_customerId_idx" ON "CustomerPricing"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPricing_recipeId_idx" ON "CustomerPricing"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPricing_customerId_recipeId_key" ON "CustomerPricing"("customerId", "recipeId");

-- CreateIndex
CREATE INDEX "WholesaleProduct_companyId_idx" ON "WholesaleProduct"("companyId");

-- CreateIndex
CREATE INDEX "WholesaleProduct_recipeId_idx" ON "WholesaleProduct"("recipeId");

-- CreateIndex
CREATE INDEX "WholesaleProduct_isActive_idx" ON "WholesaleProduct"("isActive");

-- CreateIndex
CREATE INDEX "WholesaleProduct_category_idx" ON "WholesaleProduct"("category");

-- CreateIndex
CREATE INDEX "WholesaleProduct_companyId_isActive_idx" ON "WholesaleProduct"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyOrder_shopifyOrderId_key" ON "ShopifyOrder"("shopifyOrderId");

-- CreateIndex
CREATE INDEX "ShopifyOrder_companyId_idx" ON "ShopifyOrder"("companyId");

-- CreateIndex
CREATE INDEX "ShopifyOrder_shopifyOrderId_idx" ON "ShopifyOrder"("shopifyOrderId");

-- CreateIndex
CREATE INDEX "ShopifyOrder_status_idx" ON "ShopifyOrder"("status");

-- CreateIndex
CREATE INDEX "ShopifyOrder_orderDate_idx" ON "ShopifyOrder"("orderDate");

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
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_companyId_idx" ON "ActivityLog"("companyId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_companyId_createdAt_idx" ON "ActivityLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entity_entityId_idx" ON "ActivityLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "Collection_companyId_idx" ON "Collection"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_name_companyId_key" ON "Collection"("name", "companyId");

-- CreateIndex
CREATE INDEX "RecipeCollection_collectionId_idx" ON "RecipeCollection"("collectionId");

-- CreateIndex
CREATE INDEX "RecipeCollection_recipeId_idx" ON "RecipeCollection"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeCollection_recipeId_collectionId_key" ON "RecipeCollection"("recipeId", "collectionId");

-- CreateIndex
CREATE INDEX "RecipeVersion_recipeId_idx" ON "RecipeVersion"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeVersion_recipeId_version_idx" ON "RecipeVersion"("recipeId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeVersion_recipeId_version_key" ON "RecipeVersion"("recipeId", "version");

-- CreateIndex
CREATE INDEX "Inventory_companyId_idx" ON "Inventory"("companyId");

-- CreateIndex
CREATE INDEX "Inventory_recipeId_idx" ON "Inventory"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_companyId_recipeId_key" ON "Inventory"("companyId", "recipeId");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventoryId_idx" ON "InventoryMovement"("inventoryId");

-- CreateIndex
CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_type_idx" ON "InventoryMovement"("type");

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "StorageOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_shelfLifeId_fkey" FOREIGN KEY ("shelfLifeId") REFERENCES "ShelfLifeOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "RecipeSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSection" ADD CONSTRAINT "RecipeSection_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSubRecipe" ADD CONSTRAINT "RecipeSubRecipe_parentRecipeId_fkey" FOREIGN KEY ("parentRecipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSubRecipe" ADD CONSTRAINT "RecipeSubRecipe_subRecipeId_fkey" FOREIGN KEY ("subRecipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelfLifeOption" ADD CONSTRAINT "ShelfLifeOption_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageOption" ADD CONSTRAINT "StorageOption_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionPlan" ADD CONSTRAINT "ProductionPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionItem" ADD CONSTRAINT "ProductionItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ProductionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionItem" ADD CONSTRAINT "ProductionItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionItem" ADD CONSTRAINT "ProductionItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionItemAllocation" ADD CONSTRAINT "ProductionItemAllocation_productionItemId_fkey" FOREIGN KEY ("productionItemId") REFERENCES "ProductionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionItemAllocation" ADD CONSTRAINT "ProductionItemAllocation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionTask" ADD CONSTRAINT "ProductionTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ProductionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleCustomer" ADD CONSTRAINT "WholesaleCustomer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleOrder" ADD CONSTRAINT "WholesaleOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleOrder" ADD CONSTRAINT "WholesaleOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleOrder" ADD CONSTRAINT "WholesaleOrder_parentOrderId_fkey" FOREIGN KEY ("parentOrderId") REFERENCES "WholesaleOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleOrderItem" ADD CONSTRAINT "WholesaleOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "WholesaleOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleOrderItem" ADD CONSTRAINT "WholesaleOrderItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPricing" ADD CONSTRAINT "CustomerPricing_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPricing" ADD CONSTRAINT "CustomerPricing_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleProduct" ADD CONSTRAINT "WholesaleProduct_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleProduct" ADD CONSTRAINT "WholesaleProduct_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeCollection" ADD CONSTRAINT "RecipeCollection_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeCollection" ADD CONSTRAINT "RecipeCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeVersion" ADD CONSTRAINT "RecipeVersion_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

