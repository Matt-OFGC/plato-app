# Plato Bake Testing Checklist

## ✅ Setup Complete
- [x] Database migration applied
- [x] Stripe product and price IDs configured
- [x] Dev server restarted with clean build

## 🧪 Testing Steps

### 1. Landing Page Test
- [ ] Visit `http://localhost:3000/bake`
- [ ] Verify pink theme colors are visible
- [ ] Check that "Plato Bake" branding is displayed
- [ ] Verify navigation links work (Pricing, Register)

### 2. Registration Flow Test
- [ ] Visit `http://localhost:3000/bake/register`
- [ ] Fill out registration form:
  - Name: Test User
  - Email: test@example.com
  - Password: test123456
  - Company: Test Bakery
  - Business Type: Bakery
- [ ] Submit registration
- [ ] Verify success message
- [ ] Check database: Company should have `brand: plato_bake`

### 3. Dashboard & Theme Test
- [ ] Log in with the test account
- [ ] Verify pink theme colors throughout the dashboard
- [ ] Check welcome message shows "Welcome to Plato Bake"
- [ ] Verify tagline "For bakeries" is displayed

### 4. Feature Visibility Test
- [ ] Check sidebar navigation:
  - ✅ Recipes section should be visible
  - ✅ Production section should be visible
  - ✅ Make section should be visible
  - ❌ Teams section should be HIDDEN
  - ❌ Safety section should be HIDDEN
- [ ] Try accessing `/dashboard/team` directly - should be restricted
- [ ] Try accessing `/dashboard/safety` directly - should be restricted

### 5. Pricing & Checkout Test
- [ ] Visit `http://localhost:3000/bake/pricing`
- [ ] Verify £19.99/month pricing is displayed
- [ ] Click "Get Started" button
- [ ] Should redirect to Stripe Checkout
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete checkout
- [ ] Verify redirect back to dashboard
- [ ] Check subscription is active

### 6. Brand Persistence Test
- [ ] Log out and log back in
- [ ] Verify brand theme persists
- [ ] Verify restricted sections remain hidden
- [ ] Check that brand is saved in database

## 🐛 Common Issues to Check

### Theme Not Applying
- Check browser console for CSS errors
- Verify `BrandThemeProvider` is in layout.tsx
- Check that `.brand-plato-bake` class is on `<html>` element

### Sections Still Visible
- Check unlock status API: `/api/features/unlock-status`
- Verify `brandConfig.features` only includes `recipes`, `production`, `make`
- Check browser console for errors

### Stripe Checkout Not Working
- Verify environment variables are loaded (restart server)
- Check Stripe keys are correct
- Verify product/price IDs match Stripe dashboard

## 📊 Database Verification

Run these queries to verify:

```sql
-- Check brand field exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Company' AND column_name = 'brand';

-- Check test company brand
SELECT id, name, brand 
FROM "Company" 
WHERE name LIKE '%Test%' 
ORDER BY "createdAt" DESC 
LIMIT 5;

-- Check subscription tier
SELECT u.email, u."subscriptionTier", c.name, c.brand
FROM "User" u
JOIN "Membership" m ON m."userId" = u.id
JOIN "Company" c ON c.id = m."companyId"
WHERE u.email = 'test@example.com';
```

## 🎯 Success Criteria

✅ All tests pass
✅ Pink theme visible throughout
✅ Teams/Safety sections hidden
✅ Checkout flow works
✅ Brand persists across sessions
✅ No console errors

