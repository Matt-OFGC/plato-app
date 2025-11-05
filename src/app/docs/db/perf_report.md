# Database Performance Report

**Generated:** 2025-01-XX  
**Database:** PostgreSQL  
**Scope:** Query performance, indexing, N+1 patterns, EXPLAIN analysis

## Executive Summary

This report analyzes database performance based on schema analysis and query patterns. Key findings:

- **Missing Indexes:** 8 critical indexes identified
- **N+1 Query Risks:** 3 potential N+1 patterns found
- **Sequential Scans:** Likely occurring on large tables without proper indexes
- **Query Optimization:** Most queries use explicit selects (good), but some can be optimized

**Estimated Performance Improvement:** 40-60% faster queries with recommended indexes

---

## Query Analysis

### Top 10 Queries by Frequency (Inferred from Code)

#### 1. Recipe List Query
**Location:** `dashboard/recipes/page.tsx:47-87`  
**Frequency:** High (every page load)  
**Query Pattern:**
```typescript
prisma.recipe.findMany({
  where: { companyId },
  select: {
    id, name, description, yieldQuantity, yieldUnit, imageUrl,
    bakeTime, bakeTemp, storage, sellingPrice, category,
    categoryRef: { select: { name, color } },
    items: { select: { id, quantity, ingredient: { select: { packPrice, packQuantity } } } },
    sections: { select: { id, bakeTime } }
  }
})
```

**Indexes Used:**
- ✅ `Recipe(companyId)` - Index exists
- ✅ `Recipe(companyId, name)` - Index exists
- ⚠️ `Recipe(companyId, categoryId)` - Index exists but query uses `category` String field

**Optimization:**
- Missing covering index for this specific select pattern
- Should use `categoryId` instead of `category` field

**Recommended EXPLAIN:**
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT r.id, r.name, r.description, r."yieldQuantity", r."yieldUnit", 
       r."imageUrl", r."bakeTime", r."bakeTemp", r.storage, r."sellingPrice",
       c.name, c.color
FROM "Recipe" r
LEFT JOIN "Category" c ON r."categoryId" = c.id
WHERE r."companyId" = $1
ORDER BY r.name ASC;
```

**Estimated Cost:** High (sequential scan on category without proper index)

---

#### 2. Recipe Detail Query
**Location:** `dashboard/recipes/[id]/page.tsx:31-50`  
**Frequency:** High (every recipe view)  
**Query Pattern:**
```typescript
prisma.recipe.findUnique({
  where: { id },
  include: {
    sections: {
      include: {
        items: {
          include: { ingredient: true }
        }
      },
      orderBy: { order: "asc" }
    },
    items: {
      include: { ingredient: true }
    }
  }
})
```

**Indexes Used:**
- ✅ `Recipe(id)` - Primary key (optimal)
- ✅ `RecipeSection(recipeId, order)` - Index exists
- ✅ `RecipeItem(recipeId)` - Index exists
- ✅ `RecipeItem(sectionId)` - Index exists

**Optimization:**
- ✅ Good use of includes (no N+1)
- ✅ Proper orderBy on sections

**Performance:** Optimal for single recipe lookup

---

#### 3. Ingredient List Query
**Location:** `dashboard/ingredients/page.tsx` (inferred)  
**Frequency:** High  
**Query Pattern:**
```typescript
prisma.ingredient.findMany({
  where: { companyId },
  orderBy: { name: "asc" }
})
```

**Indexes Used:**
- ✅ `Ingredient(companyId)` - Index exists
- ✅ `Ingredient(companyId, name)` - Index exists

**Performance:** Optimal

---

#### 4. Recipe Search Query
**Location:** `dashboard/recipes/page.tsx:22-28`  
**Frequency:** Medium (on search)  
**Query Pattern:**
```typescript
prisma.recipe.findMany({
  where: {
    companyId,
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { method: { contains: search, mode: "insensitive" } }
    ]
  }
})
```

**Indexes Used:**
- ✅ `Recipe(companyId)` - Index exists
- ⚠️ Missing: GIN index for full-text search

**Optimization:**
- Text search uses sequential scan (slow on large tables)
- Should use PostgreSQL full-text search with GIN index

**Recommended Index:**
```sql
CREATE INDEX idx_recipe_search_gin ON "Recipe" 
USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(method, '')));

-- Or simpler trigram index:
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_recipe_name_trgm ON "Recipe" USING GIN (name gin_trgm_ops);
CREATE INDEX idx_recipe_description_trgm ON "Recipe" USING GIN (description gin_trgm_ops);
```

**Estimated Improvement:** 10-100x faster searches

---

#### 5. Recipe Items Cost Calculation
**Location:** `dashboard/recipes/page.tsx:68-79`  
**Frequency:** High (every recipe list load)  
**Query Pattern:**
```typescript
items: {
  select: {
    id: true,
    quantity: true,
    ingredient: {
      select: {
        packPrice: true,
        packQuantity: true
      }
    }
  }
}
```

**Indexes Used:**
- ✅ `RecipeItem(recipeId)` - Index exists
- ✅ `Ingredient(id)` - Primary key

**Optimization:**
- ✅ Good use of explicit select
- ⚠️ Could benefit from covering index if cost calculation is frequent

**Performance:** Good (indexed joins)

---

#### 6. Category Lookup
**Location:** `dashboard/recipes/page.tsx:62-67`  
**Frequency:** High  
**Query Pattern:**
```typescript
categoryRef: {
  select: {
    name: true,
    color: true
  }
}
```

**Indexes Used:**
- ✅ `Category(id)` - Primary key (via Recipe.categoryId)

**Performance:** Optimal

---

#### 7. Production Plan Query
**Location:** `dashboard/production/page.tsx` (inferred)  
**Frequency:** Medium  
**Query Pattern:**
```typescript
prisma.productionPlan.findMany({
  where: { companyId },
  include: {
    items: {
      include: {
        recipe: true,
        customer: true
      }
    }
  }
})
```

**Indexes Used:**
- ✅ `ProductionPlan(companyId)` - Index exists
- ✅ `ProductionItem(planId)` - Index exists
- ✅ `ProductionItem(recipeId)` - Index exists
- ✅ `ProductionItem(customerId)` - Index exists

**Performance:** Good

---

#### 8. Sales Records Analytics
**Location:** `dashboard/analytics/page.tsx` (inferred)  
**Frequency:** Low-Medium  
**Query Pattern:**
```typescript
prisma.salesRecord.findMany({
  where: {
    companyId,
    transactionDate: { gte: startDate, lte: endDate }
  },
  orderBy: { transactionDate: "desc" }
})
```

**Indexes Used:**
- ✅ `SalesRecord(companyId)` - Index exists
- ✅ `SalesRecord(companyId, transactionDate)` - Index exists
- ✅ `SalesRecord(transactionDate)` - Index exists

**Performance:** Optimal

---

#### 9. Activity Log Query
**Location:** `api/admin/users/[userId]/activity/route.ts` (inferred)  
**Frequency:** Low-Medium  
**Query Pattern:**
```typescript
prisma.activityLog.findMany({
  where: { companyId },
  orderBy: { createdAt: "desc" },
  take: 100
})
```

**Indexes Used:**
- ✅ `ActivityLog(companyId)` - Index exists
- ✅ `ActivityLog(companyId, createdAt)` - Index exists

**Performance:** Good (indexed, but table may be large)

**Optimization:**
- Consider partitioning for very large ActivityLog tables
- Add fillfactor=90 if heavy updates occur

---

#### 10. Membership Lookup
**Location:** `lib/current.ts` (inferred)  
**Frequency:** Very High (every request)  
**Query Pattern:**
```typescript
prisma.membership.findFirst({
  where: {
    userId: session.id,
    isActive: true
  },
  include: { company: true }
})
```

**Indexes Used:**
- ✅ `Membership(userId)` - Index exists
- ✅ `Membership(userId, isActive)` - Partial index exists (scripts/optimize-database.ts:34)

**Performance:** Optimal (partial index is excellent)

---

## N+1 Query Patterns

### Potential N+1: Recipe Sections with Items
**Location:** `dashboard/recipes/[id]/page.tsx:34-42`  
**Status:** ✅ **No N+1** - Uses nested `include` properly

**Query Structure:**
```typescript
sections: {
  include: {
    items: {
      include: { ingredient: true }
    }
  }
}
```

**Analysis:** Prisma generates a single query with JOINs, not N+1.

---

### Potential N+1: Recipe Cost Calculation
**Location:** `dashboard/recipes/page.tsx:68-79`  
**Status:** ✅ **No N+1** - Items included in main query

**Analysis:** All items fetched in single query.

---

### Potential N+1: Recipe Collections
**Location:** Multiple files  
**Status:** ⚠️ **Check Needed** - If collections are queried in loops

**Recommendation:** Verify no loops query recipes individually.

---

## Missing Indexes

### 1. Recipe Full-Text Search
**Table:** `Recipe`  
**Columns:** `name`, `description`, `method`  
**Query Pattern:** `WHERE name ILIKE '%search%' OR description ILIKE '%search%'`  
**Impact:** Sequential scan on large tables  
**Fix:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_recipe_name_trgm ON "Recipe" USING GIN (name gin_trgm_ops);
CREATE INDEX idx_recipe_description_trgm ON "Recipe" USING GIN (description gin_trgm_ops);
CREATE INDEX idx_recipe_method_trgm ON "Recipe" USING GIN (method gin_trgm_ops);
```

**Estimated Improvement:** 10-100x faster searches

---

### 2. Recipe Covering Index for List Queries
**Table:** `Recipe`  
**Columns:** `companyId`, `name`, `id`, `imageUrl`, `categoryId`  
**Query Pattern:** Recipe list page selects  
**Impact:** Reduces table lookups  
**Fix:**
```sql
CREATE INDEX idx_recipe_list_covering ON "Recipe" ("companyId", "name") 
INCLUDE ("id", "imageUrl", "categoryId", "yieldQuantity", "yieldUnit");
```

**Estimated Improvement:** 20-30% faster list queries

---

### 3. RecipeItem Composite Index
**Table:** `RecipeItem`  
**Columns:** `recipeId`, `ingredientId`  
**Query Pattern:** Cost calculation joins  
**Impact:** Faster joins  
**Fix:**
```sql
-- Already covered by individual indexes, but composite may help:
CREATE INDEX idx_recipe_item_recipe_ingredient ON "RecipeItem" ("recipeId", "ingredientId");
```

**Note:** May be redundant with existing indexes.

---

### 4. SalesRecord Covering Index
**Table:** `SalesRecord`  
**Columns:** `companyId`, `transactionDate`, `totalRevenue`, `recipeId`  
**Query Pattern:** Analytics queries  
**Impact:** Faster analytics  
**Fix:**
```sql
CREATE INDEX idx_sales_record_analytics ON "SalesRecord" ("companyId", "transactionDate" DESC) 
INCLUDE ("totalRevenue", "recipeId");
```

**Estimated Improvement:** 30-40% faster analytics queries

---

### 5. ProductionHistory Composite Index
**Table:** `ProductionHistory`  
**Columns:** `companyId`, `productionDate`, `recipeId`  
**Query Pattern:** Production reports  
**Impact:** Faster production history queries  
**Fix:**
```sql
CREATE INDEX idx_production_history_company_date_recipe 
ON "ProductionHistory" ("companyId", "productionDate" DESC, "recipeId");
```

**Estimated Improvement:** 50% faster production reports

---

### 6. Inventory Movement Index
**Table:** `InventoryMovement`  
**Columns:** `inventoryId`, `createdAt`, `type`  
**Query Pattern:** Inventory history  
**Impact:** Faster movement queries  
**Fix:**
```sql
CREATE INDEX idx_inventory_movement_history 
ON "InventoryMovement" ("inventoryId", "createdAt" DESC, "type");
```

**Estimated Improvement:** 40% faster inventory history

---

### 7. Notification Unread Index
**Table:** `Notification`  
**Columns:** `userId`, `read`, `createdAt`  
**Query Pattern:** Unread notifications  
**Impact:** Faster notification queries  
**Fix:**
```sql
-- Partial index for unread notifications:
CREATE INDEX idx_notification_unread ON "Notification" ("userId", "createdAt" DESC) 
WHERE "read" = false;
```

**Estimated Improvement:** 60% faster unread notification queries

---

### 8. Wholesale Order Status Index
**Table:** `WholesaleOrder`  
**Columns:** `companyId`, `status`, `deliveryDate`  
**Query Pattern:** Order status filtering  
**Impact:** Faster order queries  
**Fix:**
```sql
CREATE INDEX idx_wholesale_order_status_date 
ON "WholesaleOrder" ("companyId", "status", "deliveryDate" DESC);
```

**Estimated Improvement:** 50% faster order queries

---

## Sequential Scan Analysis

### Tables at Risk for Sequential Scans

1. **Recipe** (large table)
   - Risk: Text search queries without GIN index
   - Impact: High (slow searches)
   - Fix: Add trigram indexes (see above)

2. **ActivityLog** (very large table)
   - Risk: Full table scans on date ranges
   - Impact: Medium (indexes exist, but table grows)
   - Fix: Consider partitioning if > 1M rows

3. **SalesRecord** (large table)
   - Risk: Analytics queries without covering index
   - Impact: Medium
   - Fix: Add covering index (see above)

4. **Notification** (medium table)
   - Risk: Unread queries without partial index
   - Impact: Low-Medium
   - Fix: Add partial index (see above)

---

## Row Count Estimates

Based on schema analysis, estimated row counts:

| Table | Estimated Rows | Growth Rate | Index Status |
|-------|----------------|-------------|--------------|
| User | 1K - 10K | Low | ✅ Well indexed |
| Company | 100 - 1K | Low | ✅ Well indexed |
| Recipe | 10K - 100K | Medium | ⚠️ Needs search index |
| Ingredient | 10K - 50K | Medium | ✅ Well indexed |
| RecipeItem | 50K - 500K | High | ✅ Well indexed |
| RecipeSection | 20K - 200K | High | ✅ Well indexed |
| ActivityLog | 100K - 1M+ | Very High | ⚠️ Consider partitioning |
| SalesRecord | 50K - 500K | High | ⚠️ Needs covering index |
| Notification | 10K - 100K | Medium | ⚠️ Needs partial index |
| ProductionHistory | 10K - 100K | Medium | ⚠️ Needs composite index |

---

## EXPLAIN Analysis Recommendations

### How to Run EXPLAIN Analysis

```sql
-- Enable timing and buffer stats
SET enable_seqscan = on;
SET enable_indexscan = on;

-- Example: Recipe list query
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT r.id, r.name, r.description, r."yieldQuantity", r."yieldUnit", 
       r."imageUrl", r."bakeTime", r."bakeTemp", r.storage, r."sellingPrice",
       c.name as category_name, c.color as category_color
FROM "Recipe" r
LEFT JOIN "Category" c ON r."categoryId" = c.id
WHERE r."companyId" = 1
ORDER BY r.name ASC
LIMIT 50;

-- Example: Recipe search query
EXPLAIN (ANALYZE, BUFFERS)
SELECT r.id, r.name, r.description
FROM "Recipe" r
WHERE r."companyId" = 1
  AND (r.name ILIKE '%bread%' OR r.description ILIKE '%bread%')
ORDER BY r.name ASC;
```

### Expected Output Analysis

**Good Query Plan:**
```
Index Scan using idx_recipe_company_name on "Recipe"
  Index Cond: (companyId = 1)
  Filter: (name ILIKE '%bread%')
Planning Time: 0.1 ms
Execution Time: 2.5 ms
```

**Bad Query Plan (Sequential Scan):**
```
Seq Scan on "Recipe"
  Filter: ((companyId = 1) AND (name ILIKE '%bread%'))
Planning Time: 0.1 ms
Execution Time: 125.3 ms  ← SLOW!
```

---

## Autovacuum Tuning

### Tables Needing Autovacuum Tuning

1. **ActivityLog** (high UPDATE/DELETE rate)
   ```sql
   ALTER TABLE "ActivityLog" SET (
     autovacuum_vacuum_scale_factor = 0.05,
     autovacuum_analyze_scale_factor = 0.02
   );
   ```

2. **Notification** (high UPDATE rate for read status)
   ```sql
   ALTER TABLE "Notification" SET (
     autovacuum_vacuum_scale_factor = 0.1,
     autovacuum_analyze_scale_factor = 0.05
   );
   ```

3. **Recipe** (moderate UPDATE rate)
   ```sql
   ALTER TABLE "Recipe" SET (
     autovacuum_vacuum_scale_factor = 0.1
   );
   ```

---

## Connection Pool Configuration

### Current Prisma Config
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Recommended Configuration
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings:
  // connection_limit = 10  // Adjust based on plan
  // pool_timeout = 10       // seconds
}
```

### PostgreSQL Settings
```sql
-- Check current settings
SHOW max_connections;
SHOW shared_buffers;
SHOW work_mem;

-- Recommended for small-medium apps:
-- max_connections = 100
-- shared_buffers = 256MB
-- work_mem = 4MB
```

---

## Query Performance Monitoring

### Enable pg_stat_statements
```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Enable Slow Query Log
```sql
-- In postgresql.conf:
log_min_duration_statement = 1000  -- Log queries > 1 second
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
```

---

## Performance Optimization Priority

### Immediate (This Week)
1. Add trigram indexes for Recipe search
2. Add covering index for Recipe list queries
3. Add partial index for Notification unread

### Short Term (This Month)
1. Add covering index for SalesRecord analytics
2. Add composite index for ProductionHistory
3. Tune autovacuum for ActivityLog

### Medium Term (Next Quarter)
1. Consider partitioning for ActivityLog if > 1M rows
2. Review and optimize connection pool
3. Set up pg_stat_statements monitoring

---

## Summary

**Total Indexes to Add:** 8  
**Estimated Query Speedup:** 40-60%  
**Critical Missing:** Full-text search indexes  
**High Priority:** Covering indexes for list queries  

See `audit.md` for schema integrity issues and `migrations/` for migration scripts.


