# Entity Relationship Diagram (ERD)

**Generated:** 2025-01-XX  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Schema Version:** Latest

## Overview

This document provides a complete ERD of the PostgreSQL database schema. The application uses Prisma ORM with forward-only migrations.

## Stack Information

- **ORM:** Prisma (`@prisma/client`)
- **Migration Tool:** Prisma Migrate
- **Database:** PostgreSQL
- **Schema Location:** `/prisma/schema.prisma`
- **Generated Client:** `/src/generated/prisma/`

## Core Entities

### User Management

```
User (1) ──< (0..*) Membership (0..*) >── (1) Company
```

- **User**: Core user account with authentication
- **Company**: Multi-tenant organization
- **Membership**: Many-to-many relationship with roles (OWNER, ADMIN, EDITOR, VIEWER)

### Recipe System

```
Company (1) ──< (0..*) Recipe (0..*) >── (0..*) RecipeItem (0..*) >── (1) Ingredient
                     │
                     ├──< (0..*) RecipeSection
                     │      └──< (0..*) RecipeItem
                     │
                     ├──< (0..*) RecipeSubRecipe
                     └──< (0..*) RecipeVersion
```

## Complete Table Reference

### 1. User
**Primary Key:** `id` (Int, autoincrement)  
**Unique Constraints:**
- `email` (unique)
- `stripeCustomerId` (unique, nullable)
- `verificationToken` (unique, nullable)

**Indexes:**
- Primary key automatically indexed

**Foreign Keys:**
- None (top-level entity)

**Relationships:**
- One-to-many: `ActivityLog`, `Membership`, `Notification`, `Subscription`, `UserPreference`
- Many-to-many (via Membership): `Company`

**Critical Fields:**
- `email` (String, unique, NOT NULL)
- `passwordHash` (String?, nullable - OAuth users)
- `isAdmin` (Boolean, default: false)
- `subscriptionStatus` (String, default: "free") - **Issue: Should be enum**
- `subscriptionTier` (String, default: "starter") - **Issue: Should be enum**

---

### 2. Company
**Primary Key:** `id` (Int, autoincrement)  
**Unique Constraints:**
- `slug` (unique, nullable)

**Indexes:**
- Primary key automatically indexed

**Foreign Keys:**
- `ownerId` → User.id (nullable, no FK constraint) - **Issue: Missing FK**

**Relationships:**
- One-to-many: All tenant-scoped entities (Recipe, Ingredient, Category, etc.)

**Critical Fields:**
- `name` (String, NOT NULL)
- `slug` (String?, unique, nullable) - Used for public profiles
- `isProfilePublic` (Boolean, default: false)

---

### 3. Membership
**Primary Key:** `id` (Int, autoincrement)  
**Unique Constraints:**
- `[userId, companyId]` (composite unique)

**Indexes:**
- `companyId`
- `userId`
- `[companyId, pin]` (for PIN-based login)

**Foreign Keys:**
- `userId` → User.id (ON DELETE: Cascade)
- `companyId` → Company.id (ON DELETE: Cascade)

**Relationships:**
- Many-to-one: `User`, `Company`
- One-to-many: `LeaveBalance`, `LeaveRequest`, `PayrollLine`, `Shift`, `Timesheet`

**Critical Fields:**
- `role` (MemberRole enum: OWNER, ADMIN, EDITOR, VIEWER)
- `isActive` (Boolean, default: true)
- `pinHash` (String?, nullable) - For device PIN login

---

### 4. Recipe
**Primary Key:** `id` (Int, autoincrement)  
**Unique Constraints:**
- `[name, companyId]` (composite unique)

**Indexes:**
- `companyId`
- `category` (String field, not FK) - **Issue: Should use categoryId**
- `[companyId, name]`
- `[companyId, categoryId]`
- `[companyId, updatedAt]`

**Foreign Keys:**
- `companyId` → Company.id (nullable, no ON DELETE specified) - **Issue: Should cascade**
- `categoryId` → Category.id (nullable)
- `shelfLifeId` → ShelfLifeOption.id (nullable)
- `storageId` → StorageOption.id (nullable)

**Relationships:**
- Many-to-one: `Company`, `Category`, `ShelfLifeOption`, `StorageOption`
- One-to-many: `RecipeItem`, `RecipeSection`, `RecipeSubRecipe`, `RecipeVersion`, `Inventory`, `ProductionHistory`, `SalesRecord`, `CustomerPricing`, `WholesaleOrderItem`, `ShopifyOrderItem`, `ShopifyProductMapping`, `RecipeCollection`, `WholesaleProduct`, `SeasonalTrend`, `RecipeUpdateLog`

**Critical Fields:**
- `name` (String, NOT NULL)
- `yieldQuantity` (Decimal, NOT NULL)
- `yieldUnit` (BaseUnit enum: g, ml, each, slices)
- `category` (String?, nullable) - **Issue: Redundant with categoryId**
- `sellingPrice` (Decimal?, nullable) - **Issue: Should use NUMERIC(12,2) with CHECK constraint**
- `isSubRecipe` (Boolean, default: false)

**Schema Issues:**
- Dual category fields (`category` String + `categoryId` Int) - should use only `categoryId`
- Missing `allergens` field (mentioned in code but not in schema)
- Missing `notes` field (mentioned in code but not in schema)

---

### 5. RecipeItem
**Primary Key:** `id` (Int, autoincrement)  
**Unique Constraints:**
- None - **Issue: Should have composite unique [recipeId, ingredientId] to prevent duplicates**

**Indexes:**
- `recipeId`
- `ingredientId`
- `sectionId`

**Foreign Keys:**
- `recipeId` → Recipe.id (ON DELETE: Cascade)
- `ingredientId` → Ingredient.id
- `sectionId` → RecipeSection.id (nullable)

**Relationships:**
- Many-to-one: `Recipe`, `Ingredient`, `RecipeSection`

**Critical Fields:**
- `quantity` (Decimal, NOT NULL)
- `unit` (Unit enum)
- `note` (String?, nullable)

---

### 6. RecipeSection
**Primary Key:** `id` (Int, autoincrement)  
**Unique Constraints:**
- None - **Issue: Should have unique [recipeId, order]**

**Indexes:**
- `recipeId`
- `[recipeId, order]`

**Foreign Keys:**
- `recipeId` → Recipe.id (ON DELETE: Cascade)

**Relationships:**
- Many-to-one: `Recipe`
- One-to-many: `RecipeItem`

**Critical Fields:**
- `title` (String, NOT NULL)
- `order` (Int, default: 0)
- `hasTimer` (Boolean, default: false)
- `bakeTemp` (Int?, nullable)
- `bakeTime` (Int?, nullable)

---

### 7. Ingredient
**Primary Key:** `id` (Int, autoincrement)  
**Unique Constraints:**
- `[name, companyId]` (composite unique)

**Indexes:**
- `companyId`
- `[companyId, name]`
- `[companyId, lastPriceUpdate]`
- `supplierId`

**Foreign Keys:**
- `companyId` → Company.id (nullable)
- `supplierId` → Supplier.id (nullable)

**Relationships:**
- Many-to-one: `Company`, `Supplier`
- One-to-many: `RecipeItem`, `IngredientPriceHistory`

**Critical Fields:**
- `name` (String, NOT NULL)
- `packQuantity` (Decimal, NOT NULL)
- `packUnit` (BaseUnit enum)
- `packPrice` (Decimal, NOT NULL) - **Issue: Should use NUMERIC(12,2) with CHECK >= 0**
- `currency` (String, default: "GBP") - **Issue: Should be enum or validated**
- `allergens` (String[], default: []) - Array of allergen names

---

### 8. Category
**Primary Key:** `id` (Int, autoincrement)  
**Unique Constraints:**
- `[name, companyId]` (composite unique)

**Indexes:**
- `companyId`
- `[companyId, order]`

**Foreign Keys:**
- `companyId` → Company.id (nullable)

**Relationships:**
- Many-to-one: `Company`
- One-to-many: `Recipe`

**Critical Fields:**
- `name` (String, NOT NULL)
- `order` (Int, default: 0)
- `color` (String?, nullable) - Hex color code

---

### 9. Supplier
**Primary Key:** `id` (Int, autoincrement)  
**Unique Constraints:**
- `[name, companyId]` (composite unique)

**Indexes:**
- `companyId`

**Foreign Keys:**
- `companyId` → Company.id (nullable)

**Relationships:**
- Many-to-one: `Company`
- One-to-many: `Ingredient`

**Critical Fields:**
- `name` (String, NOT NULL)
- `currency` (String?, default: "GBP") - **Issue: Should be enum**

---

### 10. Inventory
**Primary Key:** `id` (Int, autoincrement)  
**Unique Constraints:**
- `[companyId, recipeId]` (composite unique)

**Indexes:**
- `companyId`
- `recipeId`

**Foreign Keys:**
- `companyId` → Company.id (ON DELETE: Cascade)
- `recipeId` → Recipe.id (ON DELETE: Cascade)

**Relationships:**
- Many-to-one: `Company`, `Recipe`
- One-to-many: `InventoryMovement`

**Critical Fields:**
- `quantity` (Decimal, default: 0)
- `unit` (String) - **Issue: Should be Unit enum**

---

## Additional Tables

### Production System
- `ProductionPlan` - Production scheduling
- `ProductionItem` - Items in production plans
- `ProductionItemAllocation` - Allocation to customers
- `ProductionTask` - Task management
- `ProductionHistory` - Historical production records

### Wholesale System
- `WholesaleCustomer` - B2B customers
- `WholesaleOrder` - Orders from wholesale customers
- `WholesaleOrderItem` - Order line items
- `WholesaleProduct` - Product catalog
- `CustomerPricing` - Custom pricing per customer

### E-commerce Integration
- `ShopifyOrder` - Shopify order sync
- `ShopifyOrderItem` - Order items
- `ShopifyProductMapping` - Recipe-to-product mapping

### Analytics & Reporting
- `AnalyticsSnapshot` - Aggregated analytics
- `SalesRecord` - Sales transactions
- `SeasonalTrend` - Seasonal demand patterns
- `CustomReport` - Custom report definitions

### Staff Management
- `Shift` - Staff shifts
- `Timesheet` - Time tracking
- `LeaveRequest` - Leave requests
- `LeaveBalance` - Leave balances
- `ShiftTemplate` - Recurring shift templates

### Payroll
- `PayrollRun` - Payroll periods
- `PayrollLine` - Individual payroll entries
- `PayrollIntegration` - External payroll sync
- `PayrollSyncLog` - Sync history

### Safety & Compliance
- `TaskTemplate` - Safety task templates
- `ScheduledTask` - Scheduled safety tasks
- `TaskInstance` - Task instances
- `TaskCompletion` - Completed tasks
- `ChecklistItemCompletion` - Checklist items
- `TaskPhoto` - Task photos
- `TaskComment` - Task comments
- `TemperatureSensor` - Temperature sensors
- `TemperatureReading` - Sensor readings
- `EquipmentRegister` - Equipment registry
- `EquipmentIssue` - Equipment issues
- `SmartAlert` - System alerts
- `TemplateAppliance` - Template appliances
- `TemperatureRecord` - Manual temperature records
- `DailyTemperatureCheck` - Daily checks

### Labels & Documents
- `LabelTemplate` - Label templates
- `AllergenSheetTemplate` - Allergen sheet templates
- `GeneratedDocument` - Generated PDFs

### System Tables
- `ActivityLog` - Audit log
- `Notification` - User notifications
- `Subscription` - User subscriptions
- `UserPreference` - User preferences
- `Collection` - Recipe collections
- `RecipeCollection` - Collection membership
- `RecipeVersion` - Recipe version history
- `RecipeUpdateLog` - Recipe change log
- `IngredientPriceHistory` - Price tracking
- `IntegrationConfig` - External integrations
- `IntegrationSync` - Sync history
- `ExternalMapping` - External ID mappings
- `WebhookLog` - Webhook logs
- `TeamInvitation` - Team invitations
- `StorageOption` - Storage options
- `ShelfLifeOption` - Shelf life options

## Enums

### BaseUnit
- `g` - Grams
- `ml` - Milliliters
- `each` - Each/Count
- `slices` - Slices

### Unit
- All BaseUnit values plus: `kg`, `mg`, `lb`, `oz`, `l`, `pint`, `quart`, `gallon`, `tsp`, `tbsp`, `cup`, `floz`, `pinch`, `dash`, `large`, `medium`, `small`

### MemberRole
- `OWNER` - Full control
- `ADMIN` - Administrative access
- `EDITOR` - Edit access
- `VIEWER` - Read-only access

## Cardinality Summary

### High Cardinality (Many-to-Many via Junction Tables)
- User ↔ Company (via Membership)
- Recipe ↔ Collection (via RecipeCollection)
- Recipe ↔ Recipe (via RecipeSubRecipe - parent/child)

### One-to-Many Relationships
- Company → All tenant-scoped entities
- Recipe → RecipeItem, RecipeSection, RecipeVersion
- Ingredient → RecipeItem, IngredientPriceHistory
- Category → Recipe
- Supplier → Ingredient

## Index Analysis

### Well-Indexed Tables
- ✅ `Recipe`: Multiple indexes on companyId, categoryId, name combinations
- ✅ `Ingredient`: Indexed on companyId, name, lastPriceUpdate
- ✅ `Membership`: Indexed on userId, companyId, pin
- ✅ `ActivityLog`: Indexed on companyId, userId, createdAt

### Missing Indexes (Identified in audit.md)
- ⚠️ `RecipeItem`: Missing composite unique constraint on [recipeId, ingredientId]
- ⚠️ `RecipeSection`: Missing unique constraint on [recipeId, order]
- ⚠️ `SalesRecord`: Missing covering index for common queries
- ⚠️ `ProductionHistory`: Missing index on [companyId, productionDate, recipeId]

## Foreign Key Gaps

### Missing Foreign Keys
1. `Company.ownerId` → `User.id` (no FK constraint)
2. `ProductionTask.assignedTo` → `User.id` (no FK constraint)
3. `ProductionPlan.createdBy` → `User.id` (no FK constraint)

### Missing ON DELETE Actions
1. `Recipe.companyId` → `Company.id` (should cascade)
2. `Ingredient.companyId` → `Company.id` (should cascade)
3. `Category.companyId` → `Company.id` (should cascade)

## Next Steps

See `audit.md` for detailed findings and `perf_report.md` for performance analysis.


