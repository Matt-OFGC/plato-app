# Stripe Integration Setup Guide

## Overview
This guide will help you set up Stripe subscriptions for your application. Stripe handles payment processing, subscription management, and webhooks to keep your database in sync.

## Step 1: Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com) and create an account
2. Complete the onboarding process
3. Get your API keys from the Dashboard → Developers → API keys

## Step 2: Create Products and Prices in Stripe

You need to create subscription products and prices in Stripe Dashboard:

### Required Products:

1. **Professional Plan**
   - Create a product named "Professional"
   - Create recurring prices (monthly and yearly)
   - Note the Product ID and Price IDs

2. **Team Plan**
   - Create a product named "Team"
   - Create recurring prices (monthly and yearly)
   - Note the Product ID and Price IDs

3. **Business Plan**
   - Create a product named "Business"
   - Create recurring prices (monthly and yearly)
   - Note the Product ID and Price IDs

4. **Additional Seat Product** (optional, for seat-based billing)
   - Create a product named "Additional Seat"
   - Create recurring price
   - Note the Product ID and Price ID

### How to Create Products:

1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Fill in:
   - Name: e.g., "Professional"
   - Description: (optional)
   - Pricing model: "Recurring"
   - Price: e.g., $19/month or $190/year
   - Billing period: Monthly or Yearly
4. Save and note the Product ID (starts with `prod_`)
5. Note the Price ID (starts with `price_`)

## Step 3: Set Up Environment Variables

Add these to your `.env` file (or `.env.local`):

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...                    # Your Stripe Secret Key (test mode)
STRIPE_PUBLISHABLE_KEY=pk_test_...              # Your Stripe Publishable Key (test mode)

# Stripe Webhook Secret (see Step 4)
STRIPE_WEBHOOK_SECRET=whsec_...                 # Webhook signing secret

# Stripe Product IDs (based on your stripe.ts config)
STRIPE_PROFESSIONAL_PRODUCT_ID=prod_...         # Professional product ID
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_...  # Professional monthly price ID
STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_...   # Professional yearly price ID

STRIPE_TEAM_PRODUCT_ID=prod_...                 # Team product ID
STRIPE_TEAM_MONTHLY_PRICE_ID=price_...          # Team monthly price ID
STRIPE_TEAM_ANNUAL_PRICE_ID=price_...           # Team yearly price ID

STRIPE_BUSINESS_PRODUCT_ID=prod_...             # Business product ID
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...      # Business monthly price ID
STRIPE_BUSINESS_ANNUAL_PRICE_ID=price_...       # Business yearly price ID

# Optional: Additional Seat Product (for seat-based billing)
STRIPE_TEAM_SEAT_PRODUCT_ID=prod_...            # Team seat product ID
STRIPE_TEAM_SEAT_MONTHLY_PRICE_ID=price_...     # Team seat monthly price ID
STRIPE_TEAM_SEAT_ANNUAL_PRICE_ID=price_...      # Team seat yearly price ID
```

## Step 4: Set Up Webhooks

Webhooks allow Stripe to notify your app when subscriptions change (payment succeeded, canceled, etc.).

### For Local Development:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add it to `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### For Production:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the "Signing secret" and add it to your production environment variables

## Step 5: Verify Setup

1. **Test Stripe Connection:**
   Visit: `http://localhost:3000/api/test-stripe`
   - Should show `stripeConnection: true`
   - Should list your products

2. **Test Webhook Configuration:**
   Visit: `http://localhost:3000/api/test-webhook`
   - Should show all configuration as `true`

3. **Test Checkout Flow:**
   - Try creating a checkout session
   - Complete a test payment
   - Check if webhook receives the event

## Step 6: Test Mode vs Live Mode

### Test Mode (Development)
- Use test API keys (start with `sk_test_` and `pk_test_`)
- Use test card numbers: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- Webhooks use Stripe CLI for local development

### Live Mode (Production)
- Use live API keys (start with `sk_live_` and `pk_live_`)
- Use real credit cards
- Set up production webhook endpoint
- Update all environment variables

## Common Issues & Solutions

### Issue: "Missing signature" error
**Solution:** Make sure `STRIPE_WEBHOOK_SECRET` is set and matches your webhook endpoint secret

### Issue: "Invalid signature" error
**Solution:** 
- For local: Make sure Stripe CLI is running and forwarding to correct port
- For production: Verify webhook URL is correct and secret matches

### Issue: Subscription not updating in database
**Solution:**
- Check webhook is receiving events (Stripe Dashboard → Webhooks → View logs)
- Check server logs for webhook handler errors
- Verify webhook endpoint is accessible

### Issue: Can't find products/prices
**Solution:**
- Verify Product IDs and Price IDs in `.env` match Stripe Dashboard
- Check you're using correct mode (test vs live keys)

## Security Notes

1. **Never commit `.env` file** - Keep secrets out of version control
2. **Use environment variables** - Don't hardcode API keys
3. **Verify webhook signatures** - Always verify Stripe webhook signatures
4. **Use HTTPS in production** - Webhooks require HTTPS endpoints

## Next Steps

Once Stripe is set up:
1. Test subscription creation flow
2. Test subscription upgrades/downgrades
3. Test subscription cancellations
4. Monitor webhook events in Stripe Dashboard
5. Set up error alerts for failed webhooks

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Stripe Test Cards: https://stripe.com/docs/testing

