# Stripe Setup Guide for Plato Bake

## Step-by-Step Instructions

### Step 1: Log into Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. Log in with your Stripe account credentials
3. Make sure you're in the correct mode:
   - **Test mode** for development/testing (toggle in top right)
   - **Live mode** for production (when ready to go live)

### Step 2: Create the Plato Bake Product

1. In the Stripe Dashboard, click **"Products"** in the left sidebar
2. Click the **"+ Add product"** button (top right)
3. Fill in the product details:
   - **Name**: `Plato Bake`
   - **Description**: `Recipe & Production Management for Bakeries`
   - **Images**: (Optional) Upload a logo or image if you have one
   - **Metadata**: (Optional) You can add:
     - `brand`: `plato_bake`
     - `type`: `subscription`
4. Scroll down to **"Pricing"** section
5. Click **"Add pricing"**

### Step 3: Create the Monthly Price

1. In the pricing section, configure:
   - **Price model**: Select **"Standard pricing"**
   - **Price**: Enter `19.99`
   - **Currency**: Select **GBP (£)** (or your preferred currency)
   - **Billing period**: Select **"Monthly"**
   - **Recurring**: Make sure this is checked/enabled
2. Click **"Save product"** (or "Add product" if this is a new product)

### Step 4: Get the Product and Price IDs

After saving, you'll see the product page. You need to copy two IDs:

1. **Product ID**:
   - Look for a field labeled **"Product ID"** or **"ID"**
   - It will look like: `prod_xxxxxxxxxxxxx` (starts with `prod_`)
   - Click the copy icon or select and copy it
   - **Example**: `prod_ABC123XYZ789`

2. **Price ID**:
   - Scroll down to the **"Pricing"** section
   - Find the price you just created (£19.99/month)
   - Look for the **"Price ID"** - it will look like: `price_xxxxxxxxxxxxx` (starts with `price_`)
   - Click the copy icon or select and copy it
   - **Example**: `price_XYZ789ABC123`

### Step 5: Add IDs to Your Environment Variables

1. Open your `.env` file (or create it if it doesn't exist)
   - Location: `/Users/matt/plato/.env` (in the parent directory)
   - Or wherever your project's `.env` file is located

2. Add these two lines (replace with your actual IDs):
   ```env
   STRIPE_PLATO_BAKE_PRODUCT_ID=prod_xxxxxxxxxxxxx
   STRIPE_PLATO_BAKE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
   ```

3. **Important**: 
   - Make sure there are **no spaces** around the `=` sign
   - Don't use quotes around the values
   - Keep the exact format: `prod_` or `price_` prefix included

### Step 6: Verify Your Setup

Let's verify the environment variables are loaded correctly:

1. **Check if variables are set** (run in terminal):
   ```bash
   cd /Users/matt/plato/src/app
   grep STRIPE_PLATO_BAKE .env
   ```

2. **Restart your development server** if it's running:
   - Stop the server (Ctrl+C)
   - Start it again: `npm run dev` or `yarn dev`

### Step 7: Test the Checkout Flow

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test the registration flow**:
   - Visit `http://localhost:3000/bake/register`
   - Register a new test company
   - Verify it gets `brand: plato_bake`

3. **Test the pricing page**:
   - Visit `http://localhost:3000/bake/pricing`
   - Click "Get Started" button
   - This should redirect to Stripe Checkout

4. **Test with Stripe test card**:
   - Use Stripe's test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., `12/34`)
   - Any 3-digit CVC (e.g., `123`)
   - Any postal code (e.g., `12345`)

### Step 8: Verify Webhook Handling

After a successful test checkout:

1. Check your Stripe Dashboard → **"Webhooks"**
2. Make sure webhooks are configured for your endpoint:
   - Endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, etc.

3. Check your application logs to verify:
   - Company brand is set to `plato_bake`
   - Subscription is created correctly
   - User has access to the right features

## Troubleshooting

### Issue: Environment variables not loading

**Solution**:
- Make sure `.env` file is in the correct location
- Restart your development server
- Check for typos in variable names
- Ensure no extra spaces or quotes

### Issue: Checkout not working

**Solution**:
- Verify Stripe keys are set: `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`
- Check browser console for errors
- Verify the price ID matches what's in Stripe
- Make sure you're using test mode keys with test mode products

### Issue: Webhook not receiving events

**Solution**:
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Check webhook endpoint URL is correct
- Verify webhook secret is set: `STRIPE_WEBHOOK_SECRET`
- Check server logs for webhook errors

## Quick Reference

### Environment Variables Needed

```env
# Existing Stripe keys (you should already have these)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# New Plato Bake variables
STRIPE_PLATO_BAKE_PRODUCT_ID=prod_xxxxx
STRIPE_PLATO_BAKE_MONTHLY_PRICE_ID=price_xxxxx
```

### Stripe Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

### Useful Stripe Dashboard Links

- Products: https://dashboard.stripe.com/products
- Prices: https://dashboard.stripe.com/prices
- Webhooks: https://dashboard.stripe.com/webhooks
- Test Mode Toggle: Top right corner of dashboard

## Next Steps After Setup

1. ✅ Test the full flow: Registration → Pricing → Checkout → Dashboard
2. ✅ Verify brand-specific features are working
3. ✅ Test that Teams/Safety sections are hidden for Plato Bake
4. ✅ Verify pink theme colors are applied
5. ✅ When ready for production, repeat steps in **Live mode** and update production `.env`

