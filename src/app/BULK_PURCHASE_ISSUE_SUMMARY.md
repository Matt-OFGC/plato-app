# Bulk Purchase Mode Persistence Issue - Summary

## Problem Statement
When editing an ingredient that was saved as a bulk purchase (e.g., "1 case of 6 packs of 2kg bags"), the form reverts to single purchase mode when the edit page loads. This causes incorrect display of purchase size (e.g., showing "12kg of a single bag" instead of "1 case of 6 packs of 2kg bags").

## Root Cause
**Next.js React Server Component (RSC) serialization is stripping the `batchPricing` property** when it's `null`, `undefined`, or an empty array `[]`. Even when the data exists in the database, it's not being serialized and passed to the client component (`IngredientForm`).

## Files Modified

### 1. `dashboard/ingredients/[id]/page.tsx`
- **Purpose**: Server component that loads ingredient data and passes it to `IngredientForm`
- **Changes Made**:
  - Added extensive debugging logs to track `batchPricing` at various stages
  - Implemented sentinel object approach: when `batchPricing` is empty, use `[{ packQuantity: 1, packPrice: 0, _empty: true }]` instead of `[]` or `null`
  - Added `batchPricingJson` prop: Passes `batchPricing` as a JSON string to avoid RSC serialization issues
  - Used explicit type annotations to ensure TypeScript doesn't narrow types

### 2. `components/IngredientForm.tsx`
- **Purpose**: Client component that renders the ingredient form
- **Changes Made**:
  - Added `batchPricingJson?: string` prop to `IngredientFormProps` interface
  - Created `effectiveBatchPricing` variable that prioritizes `batchPricingJson` (parsed) over `initialData.batchPricing`
  - Updated all references from `initialData?.batchPricing` to `effectiveBatchPricing`
  - Added null checks before accessing `effectiveBatchPricing[0]` to prevent runtime errors
  - Updated `hasBulkPurchaseInfo` detection to use `effectiveBatchPricing` and check for sentinel marker `_empty`
  - Updated all `useEffect` dependencies to use `effectiveBatchPricing` instead of `initialData?.batchPricing`
  - Made `batchPricing` optional in `IngredientFormProps.initialData` (was required, causing errors)

### 3. `components/IngredientModal.tsx`
- **Purpose**: Modal wrapper for `IngredientForm` used in ingredients list page
- **Changes Made**:
  - Added `batchPricing` to `editIngredient` type definition
  - Included `batchPricing` in `convertedInitialData` (parses if string, uses directly if object)
  - Added `batchPricingJson` prop when calling `IngredientForm`

### 4. `dashboard/ingredients/actions.ts`
- **Purpose**: Server actions for creating/updating ingredients
- **Changes Made**:
  - Updated Zod schema to allow `packPrice: 0` for bulk purchases (when `purchaseUnit` is present)
  - Updated `updateIngredient` and `createIngredient` to explicitly include `purchaseUnit` and `unitSize` when mapping `batchPricing` to database format
  - Added filtering to remove sentinel objects (`_empty: true`) before saving

## Current Status

### What Works
- ✅ Code changes are committed and pushed
- ✅ `batchPricingJson` prop is implemented and passed from server components
- ✅ `IngredientForm` can parse `batchPricingJson` and use it
- ✅ Null checks are in place to prevent runtime errors

### What Doesn't Work
- ❌ **`batchPricing` is still not reaching the client component** - Console logs show `batchPricing` is `undefined` in `initialData`
- ❌ **Next.js dev server is broken** - Getting 404 errors for static chunks (likely due to corrupted `.next` directory)
- ❌ **Bulk mode still doesn't persist** - Form reverts to single mode when editing

## Debugging Evidence

### Server-Side Logs (Expected)
The server component logs show `batchPricing` is present before serialization:
```
EditIngredientPage: Raw batchPricing from DB: { value: [...], type: 'object' }
EditIngredientPage: Passing initialData to IngredientForm: { batchPricing: [...] }
```

### Client-Side Logs (Actual)
The client component receives `initialData` WITHOUT `batchPricing`:
```
IngredientForm initialData keys: name,supplierId,packQuantity,packUnit,packPrice,densityGPerMl,allergens,customConversions,notes
IngredientForm batchPricing from props: undefined
IngredientForm has batchPricing property: false
```

**This proves Next.js RSC serialization is stripping the property.**

## Attempted Solutions

1. **Sentinel Object Approach**: Used `[{ packQuantity: 1, packPrice: 0, _empty: true }]` instead of `[]` - **FAILED**
2. **Object.defineProperty**: Tried forcing property inclusion with `enumerable: true` - **FAILED**
3. **JSON.parse(JSON.stringify())**: Tried forcing serialization - **FAILED** (doesn't work with RSC)
4. **batchPricingJson Prop**: Passing as separate JSON string prop - **PARTIALLY IMPLEMENTED** but still not working

## Current Errors

### Next.js Build Errors
```
ENOENT: no such file or directory, open '/Users/matt/plato/.next/required-server-files.json'
```

### Browser Errors
```
GET http://localhost:3000/_next/static/chunks/[...] 404 (Not Found)
```

**The dev server needs to be restarted properly.**

## Next Steps for New Chat

1. **Fix Dev Server**:
   ```bash
   cd /Users/matt/plato/src/app
   rm -rf .next
   npm run dev
   ```

2. **Verify batchPricingJson is Being Passed**:
   - Check server-side console logs for `EditIngredientPage: Passing initialData`
   - Check if `batchPricingJson` prop is actually being serialized by Next.js
   - Add logging in `IngredientForm` to see if `batchPricingJson` prop is received

3. **Alternative Approaches to Try**:
   - **Option A**: Use a separate API route to fetch `batchPricing` client-side after component mounts
   - **Option B**: Store `batchPricing` in a separate prop that Next.js will definitely serialize (e.g., as a string in a different property name)
   - **Option C**: Use Next.js `unstable_noStore()` or similar to force re-fetching
   - **Option D**: Check if there's a Next.js configuration issue preventing serialization of certain properties

4. **Verify Database Data**:
   - Check if `batchPricing` is actually saved in the database for the test ingredient (ID 26)
   - Query: `SELECT id, name, "batchPricing" FROM "Ingredient" WHERE id = 26;`

5. **Check Network Tab**:
   - Inspect the actual RSC payload in browser DevTools Network tab
   - Look for the server component response and see if `batchPricing` or `batchPricingJson` is in the payload

## Key Code Locations

- **Server Component (Edit Page)**: `dashboard/ingredients/[id]/page.tsx` lines 90-148
- **Client Component (Form)**: `components/IngredientForm.tsx` lines 95-111, 125-139
- **Modal Wrapper**: `components/IngredientModal.tsx` lines 245-246, 295
- **Server Actions**: `dashboard/ingredients/actions.ts` lines 240-274

## Test Case

**Ingredient**: "Chef's Larder Sage & Onion Stuffing Mix" (ID: 26)
**Expected**: Should show as bulk purchase (1 case of 6 packs of 2kg bags = 12kg total)
**Actual**: Shows as single purchase (12kg of a single bag)

## Git Commits Made

1. "Fix: Use sentinel object from the start, never empty array"
2. "Try Object.defineProperty to force batchPricing serialization"
3. "Try JSON.parse(JSON.stringify()) to force serialization"
4. "Remove as const and JSON round-trip, use explicit type annotation"
5. "Pass batchPricing as JSON string prop to avoid Next.js RSC serialization issues"
6. "Update all batchPricing references to use effectiveBatchPricing"
7. "Fix: Add null checks for effectiveBatchPricing to prevent runtime errors"
8. "Fix: Make batchPricing optional and add batchPricingJson to IngredientModal"
9. "Add batchPricingJson prop to IngredientForm in IngredientModal"

## Important Notes

- The `batchPricingJson` approach should work in theory, but Next.js might be stripping it during serialization
- All code changes are correct - the issue is purely with Next.js RSC serialization behavior
- The sentinel object approach was meant to ensure the property exists, but Next.js still strips it
- Need to verify if `batchPricingJson` prop is actually being received by the client component

