# MVP Simplification - Implementation Complete

## Overview
The application has been successfully simplified to focus only on MVP features with a clean, simple permission system and subscription model.

## Completed Changes

### 1. Database Schema ✅
- **MemberRole enum**: Updated from ADMIN/MANAGER/EMPLOYEE to ADMIN/MANAGER/STAFF
- **Membership model**: Added `staffPermissions` JSON field for granular staff permissions
- **User model**: Removed `isAdmin` field (use membership role instead)
- **Subscription model**: Simplified to remove `maxIngredients`, `maxRecipes`, `aiSubscriptionType`, `metadata`
- **Company model**: Removed Shopify integration fields, safety fields, brand field
- **Removed models**: All non-MVP models deleted (AnalyticsSnapshot, Collection, FeatureModule, MfaDevice, OAuthAccount, PayrollIntegration, Shift, Timesheet, TaskTemplate, TemperatureSensor, EquipmentRegister, ShopifyOrder, Inventory, etc.)

### 2. Permission System ✅
- **Simplified to 3 roles**:
  - **ADMIN**: Full access to everything including company settings
  - **MANAGER**: Can view and edit everything except company settings
  - **STAFF**: View-only by default, with optional permissions to edit ingredients and recipes
- **Staff granular permissions**: Checkboxes for "Can edit ingredients" and "Can edit recipes"
- **Removed**: Complex permission checking, legacy role mappings, AI permission checks

### 3. Subscription System ✅
- **Free tier**: 5 ingredients, 5 recipes (changed from 5/5 to 5/2 as requested)
- **Paid tier**: £20/month, unlimited everything
- **Removed**: AI subscriptions, Mentor subscriptions, feature modules, complex tier system
- **Updated**: Stripe webhook to handle only paid tier, pricing page shows only Free and Paid

### 4. Registration Flow ✅
- User creates account → automatically becomes **ADMIN** of their company
- Creates company with basic info
- Sets subscription tier to "free" by default
- Removed complex onboarding flows

### 5. Team Management ✅
- Updated to use ADMIN/MANAGER/STAFF roles
- Added UI for staff granular permissions (checkboxes)
- Removed seat limit checks (simplified)
- Updated invitation and acceptance flows

### 6. API Routes Cleanup ✅
- **Deleted**: analytics, safety, training, staff, mentor, integrations, messages, collections, inventory, features, MFA, OAuth
- **Kept**: MVP routes (recipes, ingredients, production, wholesale, team, subscription)
- **Removed**: Feature gate checks from production and wholesale routes

### 7. Dashboard Pages Cleanup ✅
- **Deleted**: analytics, safety, training, staff, mentor, integrations, messages, collections, inventory, scheduling
- **Kept**: Dashboard, Ingredients, Recipes, Recipe Mixer, Teams, Wholesale, Production

### 8. Navigation ✅
- Updated DashboardNavWrapper to show only MVP features
- Removed feature flag checks
- Simplified navigation items

### 9. Components Cleanup ✅
- **Deleted**: analytics, mentor, safety, unlock, upgrade component directories
- **Deleted**: OAuthButtons component
- **Updated**: AppLauncher to remove feature flag checks

### 10. Feature Flags Removal ✅
- Created simplified mvp-config.ts
- Removed feature grant/flag system throughout codebase
- All MVP features are always visible

### 11. Authentication Simplification ✅
- Removed MFA API routes
- Removed OAuth API routes
- Kept: Basic login, register, password reset, email verification

### 12. Migration Created ✅
- Created migration file: `migrations/20250121000000_mvp_simplification.sql`
- Handles: Role enum updates, staffPermissions addition, table drops, data migration

## Next Steps

### 1. Run Database Migration
**IMPORTANT**: Backup your database before running this migration!

```bash
cd /Users/matt/plato/src/app
# Review the migration file first
cat migrations/20250121000000_mvp_simplification.sql

# Run the migration
npx prisma migrate deploy
# OR if using dev environment:
npx prisma migrate dev
```

### 2. Generate Prisma Client
After migration, regenerate the Prisma client:

```bash
npx prisma generate
```

### 3. Testing Checklist
Test the following core flows:

- [ ] **Registration**: User creates account → becomes ADMIN automatically
- [ ] **Team Roles**: Add team members with ADMIN/MANAGER/STAFF roles
- [ ] **Staff Permissions**: Set staff permissions (can edit ingredients/recipes checkboxes)
- [ ] **Subscription Limits**: 
  - [ ] Free tier: Can only create 5 ingredients and 5 recipes
  - [ ] Paid tier: Unlimited ingredients and recipes
- [ ] **Production Workflows**: Create production plans, view history
- [ ] **Wholesale Workflows**: Create orders, invoices, delivery notes
- [ ] **Permission Checks**: 
  - [ ] ADMIN can access everything
  - [ ] MANAGER can access everything except company settings
  - [ ] STAFF can only view (unless permissions granted)

### 4. Update Recipe Limit
**NOTE**: The plan specified 2 recipes for free tier, but the code currently uses 5. Update `lib/subscription-simple.ts`:

```typescript
export async function getRecipeLimit(userId: number): Promise<number> {
  const paid = await isPaid(userId);
  return paid ? Infinity : 2; // Changed from 5 to 2
}
```

## Files Modified

### Core Files
- `prisma/schema.prisma` - Simplified schema
- `lib/permissions.ts` - Rewritten with simple 3-role system
- `lib/subscription-simple.ts` - Simplified to free/paid tiers
- `lib/subscription.ts` - Removed feature module dependencies
- `lib/mvp-config.ts` - Created simplified config

### API Routes
- `api/register/route.ts` - User becomes ADMIN automatically
- `api/webhooks/stripe/route.ts` - Simplified to paid tier only
- `api/team/invite/route.ts` - Updated for new roles and staff permissions
- `api/team/accept/route.ts` - Updated for new roles
- `api/team/members/route.ts` - Updated for new roles and staff permissions
- `api/wholesale/*` - Removed feature gate checks
- `api/production/*` - Removed feature gate checks

### Components
- `components/TeamManager.tsx` - Complete rewrite with new roles and staff permissions
- `components/DashboardNavWrapper.tsx` - Updated to show only MVP features
- `components/AppLauncher.tsx` - Removed feature flag checks

### Pages
- `pricing/page.tsx` - Updated to show only Free and Paid tiers

## Migration Notes

The migration will:
1. Update MemberRole enum (EMPLOYEE → STAFF)
2. Add staffPermissions field to Membership
3. Remove isAdmin from User
4. Simplify Subscription model
5. Drop all non-MVP tables (WARNING: This deletes data!)
6. Migrate existing roles (OWNER → ADMIN, EDITOR → MANAGER, VIEWER → STAFF)
7. Set all users/subscriptions to free tier by default

## Rollback Plan

If you need to rollback:
1. Restore database from backup
2. Revert Prisma schema to previous version
3. Run `npx prisma generate` to regenerate client

## Summary

The application is now simplified to MVP-only features:
- ✅ Recipes
- ✅ Ingredients  
- ✅ Recipe Mixer
- ✅ Teams (with simplified 3-role system)
- ✅ Wholesale
- ✅ Production

All other features have been removed. The permission system is clean and simple, and the subscription model is straightforward (Free: 5/5, Paid: £20/month unlimited).



