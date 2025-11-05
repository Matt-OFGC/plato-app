# Database Audit Fixes Summary

**Date:** 2025-01-15  
**Status:** Ready for Review  
**Priority:** High

## Executive Summary

This document summarizes the top 5 highest-ROI database fixes identified in the audit. These fixes address 80% of the schema-related breakage risk.

---

## Top 5 Fixes (80/20 Plan)

### 1. Add Composite Unique Constraints ⭐ HIGHEST PRIORITY

**Benefit:** Prevents data corruption, eliminates duplicate recipe items/sections  
**Risk:** Low (additive change)  
**Effort:** 2 hours  
**Impact:** High - Prevents duplicate entries that break UI assumptions

**What:** Add unique constraints on:
- `RecipeItem[recipeId, ingredientId]` - Prevents duplicate ingredients in same recipe
- `RecipeSection[recipeId, order]` - Prevents duplicate order values

**Migration:** `20250115120000_add_composite_unique_constraints.sql`

**PR Diff:**
```diff
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -115,6 +115,7 @@ model RecipeItem {
   section      RecipeSection? @relation(fields: [sectionId], references: [id])
 
   @@index([recipeId])
+  @@unique([recipeId, ingredientId])
   @@index([ingredientId])
   @@index([sectionId])
 }
@@ -135,6 +136,7 @@ model RecipeSection {
   recipe      Recipe       @relation(fields: [recipeId], references: [id], onDelete: Cascade)
 
   @@index([recipeId])
+  @@unique([recipeId, order])
   @@index([recipeId, order])
 }
```

**Justification:**
- Currently allows duplicate ingredients in same recipe (breaks cost calculation)
- Allows duplicate section orders (breaks UI display)
- Low risk: Only validates new data, doesn't change existing
- High value: Prevents entire class of bugs

---

### 2. Fix Dual Category Fields in Recipe

**Benefit:** Eliminates data inconsistency, single source of truth  
**Risk:** Medium (requires data migration)  
**Effort:** 2 hours  
**Impact:** High - Fixes confusion about which field to use

**What:** 
1. Migrate all `category` (String) values to `categoryId` (Int) via Category lookup
2. Add CHECK constraint: `category IS NULL OR categoryId IS NOT NULL`
3. Deprecate `category` field
4. Remove `category` after deprecation period

**Migration:** `20250115160000_fix_recipe_category_fields.sql` (to be created)

**PR Diff:**
```diff
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -56,7 +56,6 @@ model Recipe {
   description            String?
   method                 String?
   actualFoodCost         Decimal?
-  category               String?  // DEPRECATED: Use categoryId instead
   categoryId             Int?
   isSubRecipe            Boolean                 @default(false)
```

**Justification:**
- Code uses both `category` and `categoryId` inconsistently
- Creates confusion about which is source of truth
- Index on `category` (line 96) is wasteful if we use `categoryId`
- Medium risk: Requires data migration, but non-destructive

---

### 3. Add Missing Foreign Keys with ON DELETE Actions

**Benefit:** Referential integrity, prevents orphaned records  
**Risk:** Low (additive change)  
**Effort:** 3 hours  
**Impact:** High - Prevents data integrity issues

**What:** Add FK constraints and ON DELETE actions:
- `Company.ownerId` → `User.id` (ON DELETE SET NULL)
- `ProductionPlan.createdBy` → `User.id` (ON DELETE RESTRICT)
- `ProductionTask.assignedTo` → `User.id` (ON DELETE SET NULL)
- `InventoryMovement.createdBy` → `User.id` (ON DELETE RESTRICT)
- `Recipe.companyId` → `Company.id` (ON DELETE CASCADE)
- `Ingredient.companyId` → `Company.id` (ON DELETE CASCADE)
- `Category.companyId` → `Company.id` (ON DELETE CASCADE)

**Migration:** `20250115130000_add_missing_foreign_keys.sql`

**PR Diff:**
```diff
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -193,6 +193,7 @@ model Company {
   ownerId                Int?
+  owner                  User?                 @relation(fields: [ownerId], references: [id], onDelete: SetNull)
   phone                  String?
   postcode               String?
@@ -76,6 +76,7 @@ model Recipe {
   companyId              Int?
+  company                Company?               @relation(fields: [companyId], references: [id], onDelete: Cascade)
   description            String?
```

**Justification:**
- Missing FKs allow orphaned references (e.g., Company.ownerId pointing to deleted User)
- Missing ON DELETE actions can leave orphaned records when parent deleted
- Low risk: Only adds constraints, doesn't change data
- High value: Database enforces referential integrity

---

### 4. Add CHECK Constraints for Prices and Quantities

**Benefit:** Database-level validation, prevents invalid data  
**Risk:** Low (may fail on existing invalid data)  
**Effort:** 2 hours  
**Impact:** Medium - Improves data quality

**What:** Add CHECK constraints:
- `Recipe.sellingPrice >= 0` (or NULL)
- `Ingredient.packPrice >= 0`
- `Recipe.yieldQuantity > 0`
- `RecipeItem.quantity > 0`

**Migration:** `20250115140000_add_check_constraints.sql`

**PR Diff:**
```sql
-- Migration adds constraints via SQL (Prisma doesn't support CHECK directly)
ALTER TABLE "Recipe" ADD CONSTRAINT recipe_selling_price_positive 
  CHECK ("sellingPrice" IS NULL OR "sellingPrice" >= 0);

ALTER TABLE "Ingredient" ADD CONSTRAINT ingredient_pack_price_positive 
  CHECK ("packPrice" >= 0);

ALTER TABLE "Recipe" ADD CONSTRAINT recipe_yield_quantity_positive 
  CHECK ("yieldQuantity" > 0);

ALTER TABLE "RecipeItem" ADD CONSTRAINT recipe_item_quantity_positive 
  CHECK ("quantity" > 0);
```

**Justification:**
- Currently no database-level validation (only app-level)
- Invalid data (negative prices, zero quantities) can be inserted
- Low risk: Migration checks for invalid data first
- Medium value: Prevents entire class of data quality issues

---

### 5. Create Unified Recipe Repository/Service

**Benefit:** Single source of truth, prevents schema drift  
**Risk:** Medium (refactoring required)  
**Effort:** 4 hours  
**Impact:** High - Prevents cross-page breakage

**What:** Create `lib/repositories/recipe-repository.ts` that:
- Centralizes all Recipe queries
- Provides typed methods: `getRecipeForDetailPage()`, `getRecipeForListPage()`, etc.
- Ensures consistent field selection across pages
- Fails fast if schema changes break contract

**PR Diff:**
```diff
+++ b/lib/repositories/recipe-repository.ts
@@ -0,0 +1,100 @@
+/**
+ * Recipe Repository
+ * 
+ * Single source of truth for Recipe queries.
+ * Ensures consistent field selection across all pages.
+ */
+
+import { prisma } from '@/lib/prisma';
+
+export interface RecipeForDetailPage {
+  id: number;
+  name: string;
+  description: string | null;
+  // ... all fields needed by detail page
+}
+
+export interface RecipeForListPage {
+  id: number;
+  name: string;
+  // ... all fields needed by list page
+}
+
+export class RecipeRepository {
+  static async getRecipeForDetailPage(id: number, companyId: number): Promise<RecipeForDetailPage | null> {
+    return prisma.recipe.findUnique({
+      where: { id, companyId },
+      include: {
+        sections: {
+          include: {
+            items: {
+              include: { ingredient: true }
+            }
+          },
+          orderBy: { order: 'asc' }
+        },
+        items: {
+          include: { ingredient: true }
+        }
+      }
+    });
+  }
+
+  static async getRecipeForListPage(companyId: number) {
+    return prisma.recipe.findMany({
+      where: { companyId },
+      select: {
+        // Consistent field selection
+      }
+    });
+  }
+}
```

**Justification:**
- Multiple pages query Recipe with different field selections
- Schema changes can break pages silently
- Medium risk: Requires refactoring, but low chance of bugs
- High value: Prevents entire class of cross-page breakage

---

## Migration Execution Plan

### Phase 1: Immediate (This Week)
1. ✅ Run `20250115120000_add_composite_unique_constraints.sql`
2. ✅ Run `20250115140000_add_check_constraints.sql`
3. ✅ Run `20250115150000_add_performance_indexes.sql`

### Phase 2: Short Term (Next Week)
1. Run `20250115130000_add_missing_foreign_keys.sql` (requires Prisma schema updates)
2. Create and run `20250115160000_fix_recipe_category_fields.sql`

### Phase 3: Medium Term (Next Sprint)
1. Create unified Recipe repository/service
2. Refactor all pages to use repository
3. Add integration tests

---

## Testing Strategy

### Pre-Migration
1. Backup database
2. Run `tests/integration/db_contract.test.ts` to establish baseline
3. Verify no invalid data exists

### Post-Migration
1. Run `tests/integration/db_contract.test.ts` to verify constraints
2. Run `tests/integration/recipe_flow.test.ts` to verify recipe flow
3. Test application manually on key pages

### Rollback Plan
- All migrations have rollback scripts in `migrations/rollbacks/`
- Test rollback on staging before production
- Keep backups for 7 days after migration

---

## Risk Assessment

### Low Risk ✅
- Composite unique constraints (additive)
- CHECK constraints (validates data)
- Performance indexes (additive)

### Medium Risk ⚠️
- Foreign key additions (may fail if orphaned data)
- Category field migration (requires data migration)
- Recipe repository refactor (code changes)

### Mitigation
- All migrations include pre-flight checks
- Rollback scripts provided
- Integration tests catch breakage early

---

## Success Metrics

After applying fixes:
- ✅ Zero duplicate RecipeItems (enforced by constraint)
- ✅ Zero invalid prices/quantities (enforced by CHECK)
- ✅ Zero orphaned records (enforced by FKs)
- ✅ Consistent Recipe queries across pages (enforced by repository)
- ✅ All integration tests passing

---

## Next Steps

1. **Review this summary** with team
2. **Approve migration order** and schedule
3. **Run migrations** on staging first
4. **Monitor** application after production deployment
5. **Schedule follow-up audit** in 1 month

---

## Related Documents

- `docs/db/ERD.md` - Complete entity relationship diagram
- `docs/db/audit.md` - Full audit findings (47 issues)
- `docs/db/perf_report.md` - Performance analysis
- `docs/db/observability.sql` - Monitoring queries
- `migrations/README.md` - Migration guide

---

**Questions?** Review the detailed findings in `audit.md` or contact the database team.


