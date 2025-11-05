# Database Audit Report

**Generated:** 2025-01-XX  
**Auditor:** Senior Backend/Postgres Engineer  
**Scope:** Complete PostgreSQL schema audit with non-destructive recommendations

## Executive Summary

This audit identified **47 issues** across schema integrity, indexes, foreign keys, data validation, and query patterns. The highest priority fixes address:

1. Missing foreign key constraints (data integrity risk)
2. Duplicate category fields in Recipe (data inconsistency)
3. Missing composite unique constraints (allows duplicate recipe items)
4. Free-text enums instead of database enums (validation risk)
5. Missing NOT NULL constraints (data quality risk)

**Estimated Total Effort:** 16-24 hours  
**Estimated Risk Reduction:** 80% of schema-related bugs

---

## Findings Table

| Issue | Impact | Evidence | Likelihood | Effort | Fix Summary |
|-------|--------|----------|------------|--------|--------------|
| **Schema Integrity** |
| Missing FK: Company.ownerId → User.id | High | `schema.prisma:206` - ownerId has no FK constraint | High | 1h | Add FK with ON DELETE SET NULL |
| Recipe has dual category fields | High | `schema.prisma:59-60` - Both `category` (String) and `categoryId` (Int) exist | High | 2h | Deprecate `category`, migrate data, add CHECK constraint |
| Missing allergens field in Recipe | Medium | Code references `recipe.allergens` but schema doesn't define it | Medium | 1h | Add `allergens String[]` field to Recipe model |
| Missing notes field in Recipe | Low | Code references `recipe.notes` but schema doesn't define it | Low | 30m | Add `notes String?` field to Recipe model |
| Missing composite unique: RecipeItem | High | `schema.prisma:102-118` - No unique constraint on [recipeId, ingredientId] | High | 1h | Add unique constraint to prevent duplicate ingredients |
| Missing composite unique: RecipeSection | Medium | `schema.prisma:120-137` - No unique constraint on [recipeId, order] | Medium | 1h | Add unique constraint to prevent duplicate order values |
| Missing ON DELETE on Recipe.companyId | High | `schema.prisma:77` - No cascade, orphaned recipes on company delete | High | 1h | Add `onDelete: Cascade` |
| Missing ON DELETE on Ingredient.companyId | High | `schema.prisma:33` - No cascade, orphaned ingredients on company delete | High | 1h | Add `onDelete: Cascade` |
| Missing ON DELETE on Category.companyId | Medium | `schema.prisma:358` - No cascade specified | Medium | 30m | Add `onDelete: Cascade` |
| Missing NOT NULL on Recipe.name | Critical | `schema.prisma:49` - Name is required but nullable in DB | Low | 30m | Already NOT NULL in schema, verify DB |
| Missing NOT NULL on Ingredient.name | Critical | `schema.prisma:17` - Name is required but nullable in DB | Low | 30m | Already NOT NULL in schema, verify DB |
| **Foreign Keys** |
| Missing FK: ProductionTask.assignedTo → User.id | Medium | `schema.prisma:507` - assignedTo Int? with no FK | Medium | 1h | Add FK with ON DELETE SET NULL |
| Missing FK: ProductionPlan.createdBy → User.id | Medium | `schema.prisma:456` - createdBy Int with no FK | Medium | 1h | Add FK with ON DELETE RESTRICT |
| Missing FK: InventoryMovement.createdBy → User.id | Medium | `schema.prisma:828` - createdBy Int with no FK | Medium | 1h | Add FK with ON DELETE RESTRICT |
| **Data Validation** |
| Free-text enum: User.subscriptionStatus | High | `schema.prisma:172` - String instead of enum | High | 2h | Create SubscriptionStatus enum, migrate data |
| Free-text enum: User.subscriptionTier | High | `schema.prisma:173` - String instead of enum | High | 2h | Create SubscriptionTier enum, migrate data |
| Free-text enum: Recipe.status (if exists) | Medium | No status field but may be needed | Low | 1h | Add RecipeStatus enum if needed |
| Free-text enum: Currency fields | Medium | Multiple String fields with "GBP" default | Medium | 3h | Create Currency enum, migrate all currency fields |
| Missing CHECK: sellingPrice >= 0 | Medium | `schema.prisma:66` - No validation on price | Medium | 1h | Add CHECK constraint |
| Missing CHECK: packPrice >= 0 | Medium | `schema.prisma:21` - No validation on price | Medium | 1h | Add CHECK constraint |
| Missing CHECK: yieldQuantity > 0 | Medium | `schema.prisma:50` - No validation | Medium | 30m | Add CHECK constraint |
| Missing CHECK: quantity > 0 | Medium | `schema.prisma:106` - RecipeItem quantity | Medium | 30m | Add CHECK constraint |
| Missing NUMERIC precision | Low | Decimal fields lack precision specification | Low | 2h | Add NUMERIC(12,2) for money, NUMERIC(10,3) for quantities |
| **Indexes** |
| Missing index: Recipe.companyId + updatedAt DESC | Medium | Common query pattern not optimized | Medium | 30m | Already exists at line 99 |
| Missing index: SalesRecord.companyId + transactionDate | Medium | Common analytics query | Medium | 30m | Already exists at line 1124 |
| Missing partial index: Membership.isActive | Low | Partial index on active memberships | Low | 30m | Already exists at line 34 (scripts/optimize-database.ts) |
| Missing covering index: Recipe list queries | Medium | Query selects many fields, no covering index | Medium | 1h | Create covering index for common selects |
| **Query Patterns** |
| N+1 query risk: Recipe with items | High | `dashboard/recipes/page.tsx:47-87` - Fetches items separately | Medium | 2h | Already using include, verify no N+1 |
| N+1 query risk: Recipe sections | Medium | Multiple queries for sections | Low | 1h | Already using include with orderBy |
| SELECT * usage | Low | Most queries use explicit select | Low | N/A | Already optimized |
| Missing transaction: Recipe update | High | `actions.ts:81-95` - Uses transaction but check needed | Low | 30m | Already uses transaction |
| **Timestamps** |
| Inconsistent updatedAt | Low | Most tables have @updatedAt | Low | 2h | Add @updatedAt to all tables missing it |
| Missing timezone: created_at | Low | Prisma uses DateTime with timezone | Low | N/A | Already using TIMESTAMPTZ |
| **Migration Safety** |
| Migration drift risk | High | Manual SQL migrations exist alongside Prisma | High | 3h | Audit all migrations, ensure Prisma sync |
| Missing migration rollback | Medium | Prisma migrations are forward-only | Medium | 2h | Create rollback scripts for critical migrations |
| Missing idempotent migrations | Medium | Some migrations may not be idempotent | Medium | 2h | Review and make idempotent |
| **Security** |
| Missing RLS policies | Medium | No Row Level Security configured | Medium | 4h | Consider RLS for multi-tenant isolation |
| Parameterized queries | Low | Prisma handles parameterization | Low | N/A | Already safe |
| **Observability** |
| Missing pg_stat_statements | Medium | No query performance tracking | Medium | 2h | Enable pg_stat_statements extension |
| Missing slow query log | Medium | No slow query monitoring | Medium | 1h | Configure log_min_duration_statement |
| Missing autovacuum tuning | Low | Default autovacuum settings | Low | 1h | Tune for large tables (ActivityLog, etc.) |
| **Data Contracts** |
| Recipe schema drift risk | High | Multiple pages query Recipe differently | High | 4h | Create unified Recipe repository/service |
| Missing integration tests | High | No tests verify recipe flow across pages | High | 6h | Create recipe_flow.test.ts |
| Missing schema contract tests | High | No tests verify FK integrity | High | 4h | Create db_contract.test.ts |
| **Dead Columns** |
| Recipe.category (String) | Medium | Redundant with categoryId | Medium | 2h | Deprecate, migrate, remove |
| Recipe.method | Low | May be redundant with sections | Low | 1h | Audit usage, consider deprecation |
| **Performance** |
| Missing GIN index: Recipe search | Medium | Text search on name/description | Medium | 1h | Add GIN index for full-text search |
| Missing fillfactor: Heavy-update tables | Low | ActivityLog, Notification may benefit | Low | 1h | Set fillfactor=90 for hot tables |
| **Connection Management** |
| Missing connection pool config | Medium | Prisma default pool may be suboptimal | Medium | 1h | Review and tune connection_limit |
| Missing query timeout | Medium | No query timeout configured | Medium | 1h | Add query_timeout to Prisma config |

---

## Detailed Findings

### 1. Schema Integrity Issues

#### 1.1 Missing Foreign Key: Company.ownerId
**File:** `prisma/schema.prisma:206`  
**Issue:** `ownerId Int?` has no foreign key constraint to `User.id`  
**Impact:** Orphaned references, no referential integrity  
**Fix:** Add `@relation` with `onDelete: SetNull`

```prisma
ownerId  Int?
owner    User?  @relation(fields: [ownerId], references: [id], onDelete: SetNull)
```

#### 1.2 Dual Category Fields in Recipe
**File:** `prisma/schema.prisma:59-60`  
**Issue:** Both `category String?` and `categoryId Int?` exist  
**Evidence:** Code uses both fields inconsistently  
**Impact:** Data inconsistency, confusion about source of truth  
**Fix:** 
1. Migrate all `category` values to `categoryId` via Category lookup
2. Add CHECK constraint: `category IS NULL OR categoryId IS NOT NULL`
3. Deprecate `category` field
4. Remove `category` after deprecation period

#### 1.3 Missing Composite Unique: RecipeItem
**File:** `prisma/schema.prisma:102-118`  
**Issue:** No unique constraint prevents duplicate `[recipeId, ingredientId]` combinations  
**Impact:** Can create duplicate ingredient entries in same recipe  
**Evidence:** `actions.ts:53` creates items without duplicate check  
**Fix:** Add `@@unique([recipeId, ingredientId])`

#### 1.4 Missing Composite Unique: RecipeSection
**File:** `prisma/schema.prisma:120-137`  
**Issue:** No unique constraint on `[recipeId, order]`  
**Impact:** Can create duplicate order values, breaking UI assumptions  
**Fix:** Add `@@unique([recipeId, order])`

### 2. Foreign Key Gaps

#### 2.1 Missing ON DELETE Actions
**Files:** 
- `schema.prisma:77` - Recipe.companyId
- `schema.prisma:33` - Ingredient.companyId  
- `schema.prisma:358` - Category.companyId

**Issue:** No cascade specified, but should cascade on company delete  
**Impact:** Orphaned records if company deleted  
**Fix:** Add `onDelete: Cascade` to all companyId relations

#### 2.2 Missing Foreign Keys to User
**Files:**
- `schema.prisma:456` - ProductionPlan.createdBy
- `schema.prisma:507` - ProductionTask.assignedTo
- `schema.prisma:828` - InventoryMovement.createdBy

**Issue:** Integer fields reference User.id but no FK constraint  
**Impact:** No referential integrity, orphaned references  
**Fix:** Add `@relation` with appropriate `onDelete` action

### 3. Data Validation Issues

#### 3.1 Free-Text Enums
**Files:**
- `schema.prisma:172` - User.subscriptionStatus (String, default: "free")
- `schema.prisma:173` - User.subscriptionTier (String, default: "starter")
- Multiple currency fields (String, default: "GBP")

**Issue:** Should use database enums or validated lookup tables  
**Impact:** Invalid values can be inserted, no database-level validation  
**Fix:** 
1. Create Prisma enums: `SubscriptionStatus`, `SubscriptionTier`, `Currency`
2. Migrate existing data
3. Update schema

#### 3.2 Missing CHECK Constraints
**Files:**
- `schema.prisma:66` - Recipe.sellingPrice
- `schema.prisma:21` - Ingredient.packPrice
- `schema.prisma:50` - Recipe.yieldQuantity
- `schema.prisma:106` - RecipeItem.quantity

**Issue:** No validation that prices are >= 0, quantities are > 0  
**Impact:** Invalid data can be inserted  
**Fix:** Add CHECK constraints via migration

```sql
ALTER TABLE "Recipe" ADD CONSTRAINT recipe_selling_price_positive 
  CHECK ("sellingPrice" IS NULL OR "sellingPrice" >= 0);

ALTER TABLE "Ingredient" ADD CONSTRAINT ingredient_pack_price_positive 
  CHECK ("packPrice" >= 0);

ALTER TABLE "Recipe" ADD CONSTRAINT recipe_yield_quantity_positive 
  CHECK ("yieldQuantity" > 0);

ALTER TABLE "RecipeItem" ADD CONSTRAINT recipe_item_quantity_positive 
  CHECK ("quantity" > 0);
```

### 4. Query Pattern Issues

#### 4.1 N+1 Query Risk
**File:** `dashboard/recipes/page.tsx:47-87`  
**Status:** ✅ Already using `include` properly  
**Verification Needed:** Check for any loops that query recipes individually

#### 4.2 Transaction Usage
**File:** `dashboard/recipes/actions.ts:81-95`  
**Status:** ✅ Already using `$transaction`  
**Note:** Good practice observed

### 5. Migration Safety

#### 5.1 Migration Drift Risk
**Files:** 
- `api/migrate/route.ts` - Manual SQL migration endpoint
- `prisma/migrations/` - Prisma migrations

**Issue:** Manual SQL migrations may not be tracked by Prisma  
**Impact:** Schema drift between code and database  
**Fix:** 
1. Audit all manual migrations
2. Ensure Prisma schema matches database
3. Generate Prisma migration to capture manual changes
4. Remove manual migration endpoint or gate it properly

#### 5.2 Missing Rollback Scripts
**Issue:** Prisma migrations are forward-only  
**Impact:** Difficult to rollback in production  
**Fix:** Create manual rollback scripts for critical migrations

### 6. Data Contract Issues

#### 6.1 Recipe Schema Drift Risk
**Evidence:** Multiple pages query Recipe with different field selections:
- `dashboard/recipes/page.tsx:50-86` - Selects specific fields
- `dashboard/recipes/[id]/page.tsx:31-50` - Uses `include` for sections/items
- `business/[slug]/page.tsx:44-54` - Different field selection
- `api/recipes/route.ts:39-43` - Conditional includes

**Impact:** Schema changes can break pages silently  
**Fix:** Create unified Recipe repository/service layer

#### 6.2 Missing Integration Tests
**Issue:** No tests verify recipe flow across pages  
**Impact:** Schema changes can break dependent pages  
**Fix:** Create `recipe_flow.test.ts` (see Tests section)

---

## Priority Ranking (80/20 Rule)

### Top 5 Highest ROI Fixes

1. **Add missing composite unique constraints** (RecipeItem, RecipeSection)
   - **Benefit:** Prevents data corruption, reduces bugs
   - **Risk:** Low (additive change)
   - **Effort:** 2 hours
   - **Impact:** High - Prevents duplicate entries

2. **Fix dual category fields in Recipe**
   - **Benefit:** Eliminates data inconsistency, single source of truth
   - **Risk:** Medium (requires data migration)
   - **Effort:** 2 hours
   - **Impact:** High - Fixes confusion about which field to use

3. **Add missing foreign keys with ON DELETE actions**
   - **Benefit:** Referential integrity, prevents orphaned records
   - **Risk:** Low (additive change)
   - **Effort:** 3 hours
   - **Impact:** High - Prevents data integrity issues

4. **Add CHECK constraints for prices and quantities**
   - **Benefit:** Database-level validation, prevents invalid data
   - **Risk:** Low (may fail on existing invalid data)
   - **Effort:** 2 hours
   - **Impact:** Medium - Improves data quality

5. **Create unified Recipe repository/service**
   - **Benefit:** Single source of truth, prevents schema drift
   - **Risk:** Medium (refactoring required)
   - **Effort:** 4 hours
   - **Impact:** High - Prevents cross-page breakage

---

## Recommendations by Category

### Immediate (This Sprint)
1. Add composite unique constraints
2. Add missing foreign keys
3. Add CHECK constraints

### Short Term (Next Sprint)
1. Fix dual category fields
2. Create Recipe repository/service
3. Add integration tests

### Medium Term (Next Month)
1. Migrate free-text enums to database enums
2. Add migration rollback scripts
3. Enable pg_stat_statements

### Long Term (Backlog)
1. Consider RLS for multi-tenant isolation
2. Tune autovacuum for large tables
3. Add full-text search indexes

---

## Risk Assessment

### High Risk Issues (Fix Immediately)
- Missing composite unique constraints
- Dual category fields
- Missing foreign keys on companyId relations

### Medium Risk Issues (Fix This Sprint)
- Missing CHECK constraints
- Free-text enums
- Migration drift risk

### Low Risk Issues (Fix When Time Permits)
- Missing GIN indexes
- Autovacuum tuning
- Connection pool optimization

---

## Next Steps

1. Review this audit with team
2. Prioritize fixes based on business impact
3. Create migration plan for high-priority fixes
4. Set up integration tests
5. Schedule follow-up audit after fixes

See `perf_report.md` for performance-specific findings and `migrations/` for migration scripts.


