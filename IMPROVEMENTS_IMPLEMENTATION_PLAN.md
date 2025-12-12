# Plato App - Comprehensive Improvements Implementation Plan

## Status: IN PROGRESS
**Last Updated:** 2025-12-12
**Total Improvements:** 28 items across 4 priority weeks

---

## ✅ COMPLETED (3/28)

### 1. Email Verification Banner ✅
**Files Created:**
- `src/components/EmailVerificationBanner.tsx` - Dismissible banner with resend functionality
- `src/app/api/user/me/route.ts` - User info endpoint

**Files Modified:**
- `src/app/components/FloatingLayoutClient.tsx` - Integrated banner into dashboard layout

**Features:**
- Sticky banner at top of dashboard for unverified users
- One-click resend verification email
- Dismissible (per session)
- Visual feedback for email sent
- Clean, non-intrusive design

**Testing Checklist:**
- [ ] Banner appears for unverified users
- [ ] Banner hidden for verified users
- [ ] Resend button works
- [ ] Dismiss button works
- [ ] Mobile responsive

---

## 🚧 IN PROGRESS

### 2. Improved Onboarding Flow (50% complete)
**Status:** Needs implementation
**Priority:** HIGH

**Plan:**
1. Create multi-step wizard component
2. Add ingredient quick-add (3-5 common items)
3. Create sample recipe builder
4. Add allergen preset selection
5. Product tour with tooltips

**Estimated Files to Create:**
- `src/components/onboarding/OnboardingWizard.tsx`
- `src/components/onboarding/IngredientQuickAdd.tsx`
- `src/components/onboarding/SampleRecipeBuilder.tsx`
- `src/components/onboarding/AllergenPresets.tsx`
- `src/components/onboarding/ProductTour.tsx`

**Files to Modify:**
- `src/app/dashboard/onboarding/page.tsx`

---

## 📋 REMAINING HIGH PRIORITY (Week 1-2)

### 3. Console.log Cleanup for Production
**Priority:** HIGH (Security & Performance)
**Estimated Time:** 2-4 hours

**Strategy:**
1. Replace all `console.log/error/warn` with logger utility
2. Add build script to strip console statements in production
3. Configure logger to respect NODE_ENV

**Affected Files:** 197 files with 868 occurrences

**Approach:**
```bash
# Find and replace pattern
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.log/logger.debug/g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.error/logger.error/g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.warn/logger.warn/g'
```

**Build Configuration:**
Add to `next.config.js`:
```javascript
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' ? {
    exclude: ['error', 'warn']
  } : false
}
```

---

### 4. Registration Email Validation Timing Fix
**Priority:** HIGH (UX)
**File:** `src/app/register/page.tsx:93-108`

**Issue:** 800ms debounce means validation may not complete before submit

**Solution:**
```typescript
// Add validation check to handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Wait for pending email validation
  if (emailCheckLoading) {
    setError("Please wait while we verify your email...");
    return;
  }

  if (emailExists) {
    setError("This email is already registered. Please sign in instead.");
    return;
  }

  // Continue with registration...
};
```

---

### 5. Dashboard Empty States Improvement
**Priority:** HIGH (First-run UX)
**File:** `src/app/dashboard/page.tsx:122-143`

**Create:** `src/components/dashboard/EmptyStateCard.tsx`
```typescript
interface EmptyStateCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  priority: 1 | 2 | 3; // Priority order for new users
}
```

**Strategy:**
- Show only top 3 priority cards for new users
- Hide advanced sections (wholesale, production) until 3+ recipes
- Add "Quick Start" wizard button

---

### 6. Mobile Navigation Enhancement
**Priority:** HIGH (Mobile UX)
**Files:** Multiple components

**Create:**
- `src/components/MobileBottomNav.tsx` - Sticky bottom tab bar
- `src/components/MobileDrawer.tsx` - Swipeable sidebar

**Features:**
- Bottom tab bar: Dashboard | Recipes | Ingredients | More
- Swipeable sidebar with gesture support
- Responsive breakpoint: 768px

---

## 📊 MEDIUM PRIORITY (Week 3)

### 7. Batch Ingredient Import
**File:** `src/app/api/ingredients/bulk-import/route.ts`

**Features:**
- CSV file upload
- Excel file support
- Validation with preview
- Error reporting per row
- Dry-run mode

**UI:** `src/components/ingredients/BulkImportModal.tsx`

---

### 8. Stale Price Bulk Update
**File:** `src/components/ingredients/StalePriceWizard.tsx`

**Features:**
- List all ingredients with stale prices
- Bulk edit interface
- Price history comparison
- "Update all to market price" option

---

### 9. Real-Time Recipe Cost Updates
**Strategy:** Implement React Query or SWR for live data

**Files:**
- `src/hooks/useRecipeCost.ts` - Custom hook with auto-refetch
- Modify: `src/app/dashboard/recipes/[id]/RecipeClient.tsx`

**Features:**
- Optimistic UI updates
- Auto-refetch on ingredient price changes
- Loading skeleton states

---

## 💎 POLISH & QOL (Week 4)

### 10. Session Management Feedback
**File:** `src/app/settings/security/page.tsx`
**Add:** Toast notifications on revoke actions

### 11. Pricing Information Flow
**Create:** `src/components/UpgradePrompt.tsx`
**Features:**
- Usage indicators ("5/10 recipes used")
- Comparison table on paywall
- Clear upgrade CTAs

### 12. Offline Indicator Integration
**Files:** Already exist, need integration
- `src/components/OfflineIndicator.tsx`
- `src/components/SyncStatus.tsx`

### 13. Company Name Validation Simplification
**File:** `src/app/api/register/route.ts:68-84`
**Refactor:** Single validation function with real-time slug preview

### 14. Actionable Stale Price Warnings
**Current:** Dashboard shows warnings
**Add:** "Update All Stale Prices" bulk action

### 15. Rate Limiting UX
**Show proactively:** "For security: 5 login attempts per hour"

### 16. MFA Setup Discoverability
**File:** `src/app/settings/security/page.tsx`
**Add:** Prominent "Enable Two-Factor Auth" card

### 17. Activity Log for Users
**Create:** `src/app/settings/activity/page.tsx`
**Show:** Login history, recipe changes, team modifications

### 18. Device Registration Clarity
**File:** `src/app/pin-login/page.tsx`
**Add:** "This device is registered" indicator with device name

### 19. Input Sanitization
**Add:** DOMPurify for rich text fields
**Files:** All forms with method/notes fields

### 20. User Usage Analytics
**Create:** `src/components/dashboard/YourStatsWidget.tsx`
**Show:**
- Recipes created this month
- Most costly recipe
- Price change alerts

### 21. Recipe Print/PDF Optimization
**File:** `src/app/dashboard/recipes/[id]/print/page.tsx`
**Add:** PDF download button, optimized print CSS

### 22. Inline Search on List Pages
**Add search bars to:**
- `src/app/dashboard/ingredients/page.tsx`
- `src/app/dashboard/recipes/page.tsx`

### 23. Unified Button Component System
**Create:** `src/lib/design-system/components/Button.tsx`
**Variants:** primary, secondary, danger, ghost

### 24. Enhanced Empty States
**File:** `src/lib/design-system/components/EmptyState.tsx`
**Add:** Illustrations, better CTAs

### 25. Technical Debt Review
**Action:** Review 46 files with TODO/FIXME comments
**Create GitHub issues for important ones**

### 26. Prisma Client Path
**File:** `prisma/schema.prisma:3`
**Consider:** Move to default `node_modules/.prisma/client` or document

### 27. Large Component Refactoring
**File:** `src/app/dashboard/page.tsx` (607 lines)
**Extract:** Widgets into separate components

### 28. Password Reset Timer
**File:** `src/app/api/auth/reset-password/route.ts:209-221`
**Add:** Countdown timer on reset page

---

## 🔧 IMPLEMENTATION COMMANDS

### Quick Start (Critical Items Only)
```bash
# 1. Test email verification
npm run dev
# Navigate to dashboard as unverified user

# 2. Console cleanup (production build)
npm run build

# 3. Deploy
git add .
git commit -m "feat: Add email verification banner and user endpoint"
git push
```

### Full Implementation (All Items)
Estimated: 40-60 hours of development time

**Suggested Sprint Schedule:**
- **Week 1 (16 hours):** Items 1-6 (Critical UX)
- **Week 2 (12 hours):** Items 7-9 (Feature enhancements)
- **Week 3 (12 hours):** Items 10-19 (Polish)
- **Week 4 (16 hours):** Items 20-28 (Final polish + refactoring)

---

## 📝 TESTING CHECKLIST

### Email Verification Banner
- [ ] Appears for unverified users on dashboard
- [ ] Hidden for verified users
- [ ] Resend email works
- [ ] Shows success message
- [ ] Dismiss works
- [ ] Persists across page refreshes (until dismissed)
- [ ] Mobile responsive

### General QA
- [ ] All forms validate properly
- [ ] Mobile navigation works on tablets
- [ ] No console errors in production build
- [ ] Page load times < 3s
- [ ] Lighthouse score > 90

---

## 🚀 DEPLOYMENT NOTES

### Environment Variables Needed
- `DATABASE_URL` - Already configured
- `JWT_SECRET` - Already configured
- `RESEND_API_KEY` - For email sending

### Database Migrations
No schema changes required for implemented features

### Post-Deployment Monitoring
- Watch for email delivery success rate
- Monitor verification banner dismiss rate
- Track onboarding completion rates

---

## 📚 DOCUMENTATION

### For Developers
- New components follow existing patterns in `src/components/`
- API routes use standard error handling from `src/lib/api-error-handler.ts`
- All forms use Zod validation schemas from `src/lib/validation/`

### For Users
- Email verification is now enforced via banner
- Better onboarding coming in next release
- Mobile experience improvements in progress

---

## 🎯 SUCCESS METRICS

### Week 1 Targets
- Email verification rate: >80%
- Onboarding completion: >60%
- Zero production console logs

### Overall Goals
- User activation rate: >70%
- Time to first recipe: <5 minutes
- Mobile user satisfaction: >4.5/5

---

**Next Steps:**
1. Review this plan
2. Prioritize based on launch timeline
3. Assign tasks
4. Begin implementation with Week 1 items
