-- Database Integrity Checks
-- Used by validate-migrations-staging.sh for pre-migration validation
-- All queries must return zero rows for validation to pass

-- ============================================================================
-- REQUIRED TABLE PRESENCE CHECKS
-- ============================================================================
-- These tables MUST exist before migrations can run
-- Missing tables indicate schema drift or wrong migration order

WITH required_tables AS (
  SELECT unnest(ARRAY[
    'Recipe',
    'RecipeItem', 
    'RecipeSection',
    'Ingredient',
    'Category',
    'Company',
    'User',
    'Membership'
  ]) AS table_name
)
SELECT 
  'MISSING_REQUIRED_TABLE' AS check_type,
  rt.table_name AS table_name,
  'Required table is missing' AS issue
FROM required_tables rt
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = rt.table_name
);

-- ============================================================================
-- ORPHAN INTEGRITY CHECKS
-- ============================================================================
-- These must return zero rows - any orphaned references indicate data corruption

-- RecipeItem.recipeId without parent Recipe
SELECT 
  'ORPHAN_RECIPE_ITEM_RECIPE' AS check_type,
  ri.id AS orphan_id,
  ri."recipeId" AS foreign_key_value,
  'RecipeItem references non-existent Recipe' AS issue
FROM "RecipeItem" ri
LEFT JOIN "Recipe" r ON r.id = ri."recipeId"
WHERE r.id IS NULL
LIMIT 20;

-- RecipeItem.ingredientId without parent Ingredient
SELECT 
  'ORPHAN_RECIPE_ITEM_INGREDIENT' AS check_type,
  ri.id AS orphan_id,
  ri."ingredientId" AS foreign_key_value,
  'RecipeItem references non-existent Ingredient' AS issue
FROM "RecipeItem" ri
LEFT JOIN "Ingredient" i ON i.id = ri."ingredientId"
WHERE i.id IS NULL
LIMIT 20;

-- RecipeItem.sectionId without parent RecipeSection (nullable, but if set must exist)
SELECT 
  'ORPHAN_RECIPE_ITEM_SECTION' AS check_type,
  ri.id AS orphan_id,
  ri."sectionId" AS foreign_key_value,
  'RecipeItem references non-existent RecipeSection' AS issue
FROM "RecipeItem" ri
LEFT JOIN "RecipeSection" rs ON rs.id = ri."sectionId"
WHERE ri."sectionId" IS NOT NULL AND rs.id IS NULL
LIMIT 20;

-- RecipeSection.recipeId without parent Recipe
SELECT 
  'ORPHAN_RECIPE_SECTION_RECIPE' AS check_type,
  rs.id AS orphan_id,
  rs."recipeId" AS foreign_key_value,
  'RecipeSection references non-existent Recipe' AS issue
FROM "RecipeSection" rs
LEFT JOIN "Recipe" r ON r.id = rs."recipeId"
WHERE r.id IS NULL
LIMIT 20;

-- Recipe.categoryId without parent Category (nullable, but if set must exist)
SELECT 
  'ORPHAN_RECIPE_CATEGORY' AS check_type,
  r.id AS orphan_id,
  r."categoryId" AS foreign_key_value,
  'Recipe references non-existent Category' AS issue
FROM "Recipe" r
LEFT JOIN "Category" c ON c.id = r."categoryId"
WHERE r."categoryId" IS NOT NULL AND c.id IS NULL
LIMIT 20;

-- Recipe.companyId without parent Company (nullable, but if set must exist)
SELECT 
  'ORPHAN_RECIPE_COMPANY' AS check_type,
  r.id AS orphan_id,
  r."companyId" AS foreign_key_value,
  'Recipe references non-existent Company' AS issue
FROM "Recipe" r
LEFT JOIN "Company" co ON co.id = r."companyId"
WHERE r."companyId" IS NOT NULL AND co.id IS NULL
LIMIT 20;

-- Ingredient.companyId without parent Company (nullable, but if set must exist)
SELECT 
  'ORPHAN_INGREDIENT_COMPANY' AS check_type,
  i.id AS orphan_id,
  i."companyId" AS foreign_key_value,
  'Ingredient references non-existent Company' AS issue
FROM "Ingredient" i
LEFT JOIN "Company" co ON co.id = i."companyId"
WHERE i."companyId" IS NOT NULL AND co.id IS NULL
LIMIT 20;

-- Membership.userId without parent User
SELECT 
  'ORPHAN_MEMBERSHIP_USER' AS check_type,
  m.id AS orphan_id,
  m."userId" AS foreign_key_value,
  'Membership references non-existent User' AS issue
FROM "Membership" m
LEFT JOIN "User" u ON u.id = m."userId"
WHERE u.id IS NULL
LIMIT 20;

-- Membership.companyId without parent Company
SELECT 
  'ORPHAN_MEMBERSHIP_COMPANY' AS check_type,
  m.id AS orphan_id,
  m."companyId" AS foreign_key_value,
  'Membership references non-existent Company' AS issue
FROM "Membership" m
LEFT JOIN "Company" co ON co.id = m."companyId"
WHERE co.id IS NULL
LIMIT 20;

-- ============================================================================
-- DUPLICATE UNIQUE CONSTRAINT VIOLATIONS
-- ============================================================================
-- These check for data that would violate unique constraints being added

-- Duplicate RecipeItem[recipeId, ingredientId] (before constraint is added)
SELECT 
  'DUPLICATE_RECIPE_ITEM' AS check_type,
  ri."recipeId" AS recipe_id,
  ri."ingredientId" AS ingredient_id,
  COUNT(*) AS duplicate_count,
  'Multiple RecipeItems with same recipeId+ingredientId' AS issue
FROM "RecipeItem" ri
GROUP BY ri."recipeId", ri."ingredientId"
HAVING COUNT(*) > 1
LIMIT 20;

-- Duplicate RecipeSection[recipeId, order] (before constraint is added)
SELECT 
  'DUPLICATE_RECIPE_SECTION' AS check_type,
  rs."recipeId" AS recipe_id,
  rs."order" AS order_value,
  COUNT(*) AS duplicate_count,
  'Multiple RecipeSections with same recipeId+order' AS issue
FROM "RecipeSection" rs
GROUP BY rs."recipeId", rs."order"
HAVING COUNT(*) > 1
LIMIT 20;

-- ============================================================================
-- CONSTRAINT VALIDATION STATUS
-- ============================================================================
-- Check for NOT VALID foreign keys that need validation

SELECT 
  'INVALID_FOREIGN_KEY' AS check_type,
  conname AS constraint_name,
  conrelid::regclass::text AS table_name,
  'Foreign key marked NOT VALID and not yet validated' AS issue
FROM pg_constraint
WHERE contype = 'f'
AND convalidated = false;

-- ============================================================================
-- INDEX VALIDATION STATUS
-- ============================================================================
-- Check for invalid or not-ready indexes (from CONCURRENTLY operations)

SELECT 
  'INVALID_INDEX' AS check_type,
  i.relname AS index_name,
  x.indisvalid AS is_valid,
  x.indisready AS is_ready,
  'Index is invalid or not ready' AS issue
FROM pg_index x
JOIN pg_class i ON i.oid = x.indexrelid
WHERE i.relkind = 'i'
AND (x.indisvalid = false OR x.indisready = false);

