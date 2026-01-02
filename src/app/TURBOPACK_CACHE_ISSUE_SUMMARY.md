# Turbopack Cache Issue - Complete Summary

## Problem Description

The application is experiencing a persistent caching issue where Turbopack (Next.js's bundler) is executing old compiled code instead of the current source code. Despite multiple cache clears, code changes, and even a computer restart, the error persists.

### Current Error

```
PrismaClientValidationError: Invalid `prisma.user.findUnique()` invocation:
Unknown field `app` for select statement on model `Company`.
```

The error shows old Prisma query syntax:
- `memberships:` (lowercase) instead of `Membership:` (capitalized)
- `company:` (lowercase) instead of `Company:` (capitalized)  
- `app: true` in select (field was removed from schema)
- `isAdmin: true` in select (not in current code)

### User-Facing Symptom

Users see "Account Setup Required" error page because `getCurrentUserAndCompany()` is failing due to the Prisma query error, causing it to return `companyId: null`.

## Root Cause

The `app` field was removed from the `Company` model in the Prisma schema, and all Prisma queries were updated to use capitalized relation names (`Membership` and `Company` instead of `memberships` and `company`). However, Turbopack is executing a cached/compiled version of the code that still contains the old query structure.

## Files Modified

### 1. `prisma/schema.prisma`
- **Change**: Removed `app` field from `Company` model
- **Status**: ✅ Correct - field is removed

### 2. `lib/current.ts`
- **Changes Made**:
  - Removed `app` field from `Company` interface
  - Changed Prisma queries to use `Membership:` (capitalized) instead of `memberships:`
  - Changed Prisma queries to use `Company:` (capitalized) instead of `company:`
  - Removed `app: true` from all select statements
  - Added cache-busting comments
  - Renamed function `fetchUserAndCompany` → `fetchUserAndCompany_v2` to force recompilation
- **Current State**: ✅ Source code is correct - uses `Membership` and `Company` (capitalized), no `app` field
- **Problem**: Turbopack is executing old compiled version

### 3. `lib/redis.ts`
- **Changes**: Removed `initRedis` and `getCache` functions, added cache-busting comments
- **Status**: ✅ Correct

### 4. Other Files
- Updated fallback role values in wholesale pages (`VIEWER`/`MEMBER` → `EMPLOYEE`)
- Removed `CompanySwitcher` component
- Updated error messages in `CompanyLoadingError.tsx`

## All Attempted Fixes

### Fix 1: Schema and Code Updates
- Removed `app` field from Prisma schema
- Updated all Prisma queries to use capitalized relation names
- Regenerated Prisma client (`npx prisma generate`)

### Fix 2: Cache Clearing
- Cleared `.next` directory
- Cleared `node_modules/.cache`
- Cleared `node_modules/.prisma`
- Cleared TypeScript build info files (`*.tsbuildinfo`)
- Cleared `.turbo` directory

### Fix 3: Cache-Busting Comments
- Added timestamp comments to `lib/current.ts` and `lib/redis.ts`
- Modified query structure to force recompilation
- Added explicit comments about using capitalized names

### Fix 4: Function Renaming
- Renamed `fetchUserAndCompany` → `fetchUserAndCompany_v2` to force Turbopack to see it as new code

### Fix 5: Process Restarts
- Killed all Node.js processes
- Restarted dev server multiple times
- User restarted entire computer

### Fix 6: Browser Cache Clearing
- Hard refresh (`Cmd+Shift+R`)
- Incognito/private window
- Still shows same error (confirms it's server-side, not browser cache)

## Current Code State

### `lib/current.ts` - Key Function (lines 118-151)

```typescript
async function fetchUserAndCompany_v2(userId: number): Promise<CurrentUserAndCompany> {
  try {
    // Cache bust 2025-01-22-4: FORCE RECOMPILE - Using Membership (capitalized), NOT memberships
    const userWithMemberships = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        Membership: {  // ✅ Capitalized
          where: { isActive: true },
          select: {
            id: true,
            companyId: true,
            role: true,
            isActive: true,
            Company: {  // ✅ Capitalized
              select: {
                id: true,
                name: true,
                businessType: true,
                country: true,
                phone: true,
                logoUrl: true
                // NOTE: NO app field - removed from schema
              }
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 1
        }
      }
    });
    // ... rest of function
  }
}
```

### Prisma Schema - Company Model

```prisma
model Company {
  id                    Int                     @id @default(autoincrement())
  createdAt             DateTime                @default(now())
  updatedAt             DateTime
  name                  String
  // ... other fields
  // NO app field - removed
  Membership            Membership[]  // ✅ Capitalized relation name
  // ... other relations
}
```

## Error Stack Trace

The error consistently points to `current.ts:68:33`, but line 68 is:
```typescript
return await fetchUserAndCompany_v2(user.id);
```

The actual Prisma query is in `fetchUserAndCompany_v2` starting at line 122. This confirms Turbopack is executing old compiled code.

## Environment Details

- **OS**: macOS (darwin 25.0.0)
- **Next.js**: Using Turbopack (`--turbopack` flag)
- **Prisma**: v6.19.1
- **Node**: Running via npm scripts
- **Dev Server**: Running on `http://localhost:3000`

## Next.js Config

Located at `/Users/matt/plato/next.config.js`:
- Turbopack is enabled (default behavior)
- Has Turbopack-specific SVG loader config
- No explicit cache configuration

## Verification Steps Taken

1. ✅ Verified source code is correct (uses `Membership` and `Company` capitalized, no `app` field)
2. ✅ Verified Prisma schema is correct (no `app` field on Company)
3. ✅ Verified Prisma client was regenerated
4. ✅ Confirmed error persists even after computer restart
5. ✅ Confirmed error persists in incognito window (rules out browser cache)
6. ✅ Confirmed error is server-side (shows in server logs)

## What's NOT the Problem

- ❌ Browser cache (tested in incognito)
- ❌ User account data (affects all users)
- ❌ Source code (verified correct)
- ❌ Prisma schema (verified correct)
- ❌ Prisma client (regenerated multiple times)

## What IS the Problem

- ✅ Turbopack's in-memory/build cache is executing old compiled code
- ✅ Standard cache clearing methods don't work
- ✅ Function renaming doesn't force recompilation
- ✅ Even computer restart doesn't fix it

## Potential Solutions to Try

### Option 1: Disable Turbopack
Modify `package.json` scripts to remove `--turbopack` flag:
```json
"dev": "next dev"  // instead of "next dev --turbopack"
```

### Option 2: Add Turbopack Cache Config
Add to `next.config.js`:
```javascript
experimental: {
  turbo: {
    resolveAlias: {
      // Force recompilation
    }
  }
}
```

### Option 3: Move/Rename the File
Rename `lib/current.ts` → `lib/current-v2.ts` and update all imports

### Option 4: Add Explicit Cache Invalidation
Add a unique import or require that changes on each restart

### Option 5: Use Webpack Instead
Temporarily switch to Webpack bundler to bypass Turbopack entirely

### Option 6: Check for Multiple Build Outputs
Check if there are multiple `.next` directories or build outputs being used

### Option 7: Check Node Module Cache
Clear `node_modules` entirely and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Option 8: Check for Cached Prisma Client
The Prisma client might be cached. Try:
```bash
rm -rf node_modules/.prisma
rm -rf src/generated/prisma
npx prisma generate
```

## Files to Check

1. `/Users/matt/plato/src/app/lib/current.ts` - Main file with the function
2. `/Users/matt/plato/src/app/prisma/schema.prisma` - Prisma schema
3. `/Users/matt/plato/next.config.js` - Next.js config
4. `/Users/matt/plato/package.json` - Check dev script for Turbopack flag
5. `/Users/matt/plato/src/app/.next/` - Build output (should be cleared)
6. `/Users/matt/plato/.turbo/` - Turbopack cache (should be cleared)

## Current Status

- **Source Code**: ✅ Correct
- **Prisma Schema**: ✅ Correct  
- **Prisma Client**: ✅ Regenerated
- **Caches Cleared**: ✅ Multiple times
- **Server Restarted**: ✅ Multiple times
- **Computer Restarted**: ✅ Once
- **Error Persists**: ❌ Yes - Turbopack still executing old code

## Key Insight

The error message shows code that doesn't exist in the source file:
- Error shows: `memberships: { ... company: { ... app: true } }`
- Source shows: `Membership: { ... Company: { ... } }` (no app field)

This proves Turbopack is executing a cached/compiled version of the code that was compiled before the changes were made.

## Recommended Next Steps

1. **Try disabling Turbopack** - This is the most likely solution
2. **Check for multiple .next directories** - There might be a cached build elsewhere
3. **Check package.json dev script** - Ensure it's not forcing Turbopack
4. **Try Webpack** - As a temporary workaround to verify the code works
5. **Check for build artifacts** - Look for any other compiled outputs

## Contact Information

- User: themarketcafeshrews@gmail.com
- User ID in database: 2
- Workspace: `/Users/matt/plato/src/app`

---

**Last Updated**: 2025-01-22
**Status**: Still broken - Turbopack cache issue persists despite all attempts

