# Mentor AI Subscription System Alignment

## ✅ Aligned with New Simplified Subscription System

### Core Access Control
- **Uses `canUseAI()` from `lib/subscription-simple.ts`** ✅
  - This is the single source of truth for AI access
  - Checks both company-level AI subscription AND user role (ADMIN/OWNER)
  - Backward compatible with OWNER role during migration

### Role System
- **Role checks align with new system** ✅
  - `canUseAI()` checks for ADMIN role (with OWNER backward compat)
  - Error messages simplified - no redundant role checks
  - All API routes use `canUseAI()` which handles role validation

### Subscription Model
- **Company-level subscriptions** ✅
  - Uses `MentorSubscription` model (company-scoped)
  - Supports `subscriptionType`: "unlimited" | "capped"
  - Uses `hasAIAccess()` and `getAISubscriptionType()` from `subscription-simple.ts`

### API Routes Updated
1. **`/api/mentor/chat`** ✅
   - Uses `canUseAI()` for access control
   - MVP mode protection
   - Simplified error messages
   - Removed redundant role checks

2. **`/api/mentor/subscription`** ✅
   - Uses `hasAIAccess()` and `getAISubscriptionType()` from new system
   - MVP mode protection
   - Returns subscription type correctly

3. **`/api/mentor/index`** ✅
   - Uses `canUseAI()` for access control
   - MVP mode protection
   - Simplified error messages

### MVP Mode Protection
- **Hidden in MVP mode** ✅
  - Button hidden in nav bar when `MVP_MODE=true` or `NEXT_PUBLIC_MVP_MODE=true`
  - All API routes return 403 in MVP mode
  - Modal checks MVP status

## ⚠️ Areas That May Need Attention (Outside Mentor AI Scope)

### Webhook Handler
- **`api/webhooks/stripe/route.ts`** still uses old feature module system
  - Uses `getModuleFromStripePriceId()` from `stripe-features.ts`
  - According to new system, feature modules should be removed
  - Mentor webhook handling works but uses old pattern
  - **Action**: This should be updated as part of Phase 2 (Core Subscription Logic) in the migration plan

### Legacy Functions (Kept for Backward Compatibility)
- **`lib/mentor/subscription.ts`** still exists
  - Contains `hasMentorAccess()` and `getMentorSubscription()`
  - These are now redundant but kept for backward compatibility
  - Webhook handler still uses `upsertMentorSubscription()` from here
  - **Action**: Can be deprecated after webhook handler is updated

## ✅ What's Working Correctly

1. **Access Control**: Uses `canUseAI()` which checks:
   - Company has active AI subscription
   - User has ADMIN role (or OWNER for backward compat)
   - All in one function - single source of truth ✅

2. **Subscription Status**: Uses new system functions:
   - `hasAIAccess()` - checks company subscription
   - `getAISubscriptionType()` - gets subscription type
   - Both from `subscription-simple.ts` ✅

3. **Error Handling**: Simplified and consistent:
   - Single error message for access denied
   - No redundant role checks
   - Clear messaging ✅

4. **MVP Mode**: Fully protected:
   - Button hidden
   - APIs blocked
   - Modal checks status ✅

## 🔄 Migration Notes

### During Migration
- `canUseAI()` includes backward compatibility for OWNER role
- Old `hasMentorAccess()` still works but is deprecated
- Webhook handler can continue using `upsertMentorSubscription()` until updated

### After Migration Complete
- Remove `lib/mentor/subscription.ts` (or mark as deprecated)
- Update webhook handler to use new subscription system
- Remove OWNER backward compatibility from `canUseAI()`

## ✅ Summary

**Mentor AI is fully aligned with the new simplified subscription system:**
- ✅ Uses `canUseAI()` for access control
- ✅ Uses `hasAIAccess()` and `getAISubscriptionType()` for subscription checks
- ✅ Company-level subscriptions (not user-level)
- ✅ ADMIN role requirement (with OWNER backward compat)
- ✅ MVP mode protection
- ✅ Simplified error handling
- ✅ No breaking changes to existing functionality

**The only remaining item is updating the webhook handler**, which is part of the broader subscription system migration (Phase 2) and not specific to Mentor AI.

