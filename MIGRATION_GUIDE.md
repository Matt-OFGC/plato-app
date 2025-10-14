# 4-Tier Subscription Model Migration Guide

## Overview

This guide will help you migrate from the 2-tier (Free/Pro) model to the new 4-tier (Starter/Professional/Team/Business) subscription model.

## Database Migration

### Step 1: Run Prisma Migration

```bash
npx prisma migrate dev --name add_subscription_tiers
```

This will update the database schema to support the new tier structure.

### Step 2: Migrate Existing User Data

Run this SQL to migrate existing users:

```sql
-- Update existing 'free' users to 'starter'
UPDATE "User" 
SET "subscriptionTier" = 'starter' 
WHERE "subscriptionTier" = 'free';

-- Update existing 'pro' users to 'professional' (grandfathered pricing)
UPDATE "User" 
SET "subscriptionTier" = 'professional',
    "subscriptionInterval" = 'month'
WHERE "subscriptionTier" = 'pro';

-- Update existing subscriptions
UPDATE "Subscription"
SET "tier" = 'professional'
WHERE "tier" = 'pro';
```

## Stripe Configuration

### Step 1: Create Products in Stripe Dashboard

Create the following products in your Stripe dashboard:

1. **Professional Plan**
   - Name: Professional
   - Description: Ideal for professional chefs and restaurants
   - Prices:
     - Monthly: £19.00
     - Annual: £180.00 (£15/month)

2. **Team Plan**
   - Name: Team
   - Description: For growing food businesses with teams
   - Prices:
     - Monthly: £59.00
     - Annual: £564.00 (£47/month)

3. **Business Plan**
   - Name: Business
   - Description: For established wholesale operations
   - Prices:
     - Monthly: £149.00
     - Annual: £1,428.00 (£119/month)

4. **Team Additional Seat**
   - Name: Additional Team Seat
   - Description: Extra team member seat
   - Prices:
     - Monthly: £6.00
     - Annual: £60.00 (£5/month)

### Step 2: Add Environment Variables

Add these environment variables to your `.env` file:

```bash
# Professional Tier
STRIPE_PROFESSIONAL_PRODUCT_ID="prod_xxx"
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID="price_xxx"
STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID="price_xxx"

# Team Tier
STRIPE_TEAM_PRODUCT_ID="prod_xxx"
STRIPE_TEAM_MONTHLY_PRICE_ID="price_xxx"
STRIPE_TEAM_ANNUAL_PRICE_ID="price_xxx"

# Team Additional Seats
STRIPE_TEAM_SEAT_PRODUCT_ID="prod_xxx"
STRIPE_TEAM_SEAT_MONTHLY_PRICE_ID="price_xxx"
STRIPE_TEAM_SEAT_ANNUAL_PRICE_ID="price_xxx"

# Business Tier
STRIPE_BUSINESS_PRODUCT_ID="prod_xxx"
STRIPE_BUSINESS_MONTHLY_PRICE_ID="price_xxx"
STRIPE_BUSINESS_ANNUAL_PRICE_ID="price_xxx"
```

Replace `prod_xxx` and `price_xxx` with the actual IDs from Stripe.

## Feature Gating Summary

### Starter (Free)
- 15 ingredients, 5 recipes
- Basic cost calculations
- Single user only
- Community support

### Professional (£19/month)
- Unlimited ingredients & recipes
- PDF export, analytics, inventory tracking
- 1 user included

### Team (£59/month)
- Everything in Professional
- 5 team seats included (£6/month per additional seat)
- Production planning & scheduling
- Device/PIN login

### Business (£149/month)
- Everything in Team
- Unlimited team seats
- Wholesale customer management
- Customer ordering portal
- Advanced analytics

## Testing Checklist

After migration, test the following:

- [ ] Existing free users can still access their recipes (now "Starter" tier)
- [ ] Existing Pro users are mapped to "Professional" tier
- [ ] New users can sign up for free (Starter tier)
- [ ] Users can upgrade from Starter to Professional
- [ ] Users can upgrade from Professional to Team
- [ ] Users can upgrade from Team to Business
- [ ] Team tier users can invite team members (up to 5 included)
- [ ] Team tier users can purchase additional seats
- [ ] Business tier users have unlimited seats
- [ ] Wholesale features are blocked for non-Business users
- [ ] Production features are blocked for non-Team users
- [ ] Annual billing shows 20% discount
- [ ] Upgrade/downgrade flows work correctly
- [ ] Feature gate modals display correctly
- [ ] Webhooks properly update user tiers

## Rollback Plan

If you need to rollback:

1. Revert the database migration:
```bash
npx prisma migrate dev --rollback
```

2. Restore previous code from git:
```bash
git revert HEAD
```

3. Update users back to old tier names:
```sql
UPDATE "User" 
SET "subscriptionTier" = 'free' 
WHERE "subscriptionTier" = 'starter';

UPDATE "User" 
SET "subscriptionTier" = 'pro' 
WHERE "subscriptionTier" IN ('professional', 'team', 'business');
```

## Support

For issues during migration, check:
- Prisma migration logs
- Stripe webhook logs
- Application error logs
- Database constraint violations

