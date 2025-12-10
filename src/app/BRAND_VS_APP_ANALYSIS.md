# Brand vs App Field Analysis

## Current State

### Both Fields Exist in Company Model
- `brand Brand @default(plato)` - Line 178
- `app App @default(plato)` - Line 181

## Usage Analysis

### `app` Field - ACTIVELY USED ✅
**Purpose:** Determines which app/features are available and routing

**Used in:**
- `lib/brand.ts` - Reads `company.app` to get brand (note: uses app field!)
- `lib/app.ts` - Gets app from company
- `lib/current.ts` - Gets app from company  
- `lib/apps/registry.ts` - App configurations (plato vs plato_bake)
- `lib/user-app-subscriptions.ts` - User app access
- `lib/hooks/useAppAwareRoute.ts` - Route detection
- `components/FloatingSidebar.tsx` - App switching
- `api/user/apps/route.ts` - User app access API

**Function:** Controls:
- Which features are visible (recipes, production, teams, safety)
- Which routes are used (`/dashboard` vs `/bake`)
- App-specific theming and configuration

### `brand` Field - BARELY USED ⚠️
**Purpose:** Appears to be for visual branding/theming

**Used in:**
- `globals.css` - CSS classes like `.brand-plato-bake`
- `prisma/schema.prisma` - Field definition with index
- `prisma/migrations/add_brand_field.sql` - Migration file

**NOT Used in:**
- Any actual business logic
- Any API routes
- Any component logic
- Any lib functions (they use `app` instead!)

**Note:** `lib/brand.ts` explicitly says: "Note: Company model uses 'app' field, not 'brand' field"

## The Problem

**They're duplicates!** Both fields store the same information:
- `plato` = main app
- `plato_bake` = bakery app

The codebase uses `app` everywhere, but `brand` exists in the schema with an index.

## Recommendation

### Option 1: Remove `brand` field (Recommended)
**Pros:**
- Eliminates redundancy
- Reduces confusion
- One source of truth (`app`)
- Simpler schema

**Cons:**
- Need to update CSS classes to use `app` instead
- Need to remove migration/index

**Action:**
1. Remove `brand` field from schema
2. Update CSS classes from `.brand-plato-bake` to `.app-plato-bake`
3. Remove index on brand
4. Keep using `app` field everywhere

### Option 2: Keep both but sync them
**Pros:**
- CSS can use semantic "brand" naming
- Code can use "app" naming

**Cons:**
- Redundancy and potential for desync
- More complex
- Two fields doing the same thing

**Action:**
1. Keep both fields
2. Always update both when changing
3. Add validation to ensure they match

### Option 3: Remove `app` field, use `brand` everywhere
**Pros:**
- More semantic naming ("brand" for visual branding)

**Cons:**
- Would require updating all code that uses `app`
- More work
- `app` is already well-established in codebase

## My Recommendation: Option 1

Remove the `brand` field since:
1. Code already uses `app` everywhere
2. `brand` is only used in CSS (easy to update)
3. Eliminates redundancy
4. Simpler schema

The CSS can easily be updated to use `.app-plato-bake` instead of `.brand-plato-bake`.








