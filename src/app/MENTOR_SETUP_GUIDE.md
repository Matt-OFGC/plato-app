# Mentor AI Assistant - Setup Guide

This guide will help you complete the setup for Mentor AI Assistant.

## 1. Database Migration

The migration file has been created at `migrations/20250120000000_add_mentor_models.sql`.

To apply it manually:

```bash
# Connect to your database and run the SQL file
psql $DATABASE_URL -f migrations/20250120000000_add_mentor_models.sql
```

Or if you prefer using Prisma:

```bash
# This will sync the schema (be careful in production)
npx prisma db push
```

## 2. Environment Variables

Add these to your `.env` file (or environment configuration):

### Required:
```bash
# OpenAI API Key - Required for AI chat and embeddings
OPENAI_API_KEY=sk-...

# Stripe Mentor Price ID - Required for subscriptions
STRIPE_MENTOR_MONTHLY_PRICE_ID=price_...
```

### Optional:
```bash
# Tavily API Key - For internet search functionality
TAVILY_API_KEY=tvly-...

# If not set, Mentor will work but won't be able to search the web
```

### Getting API Keys:

#### OpenAI API Key:
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Add to `.env` as `OPENAI_API_KEY`

#### Tavily API Key (Optional):
1. Go to https://tavily.com/
2. Sign up for an account
3. Get your API key from the dashboard
4. Add to `.env` as `TAVILY_API_KEY`

## 3. Stripe Product Setup

### Create the Mentor Product in Stripe:

1. **Log into Stripe Dashboard**: https://dashboard.stripe.com/

2. **Create Product**:
   - Go to Products → Add Product
   - Name: `Mentor AI Assistant`
   - Description: `Your AI business mentor that learns everything about your business and provides intelligent advice`

3. **Add Price**:
   - Click "Add price" on the product
   - Pricing model: `Standard pricing`
   - Price: `£49.00` (or `$49.00` for USD)
   - Billing period: `Monthly`
   - Click "Add price"

4. **Copy Price ID**:
   - After creating the price, copy the Price ID (starts with `price_`)
   - Add to `.env` as `STRIPE_MENTOR_MONTHLY_PRICE_ID`

5. **Configure Webhook** (if not already done):
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy webhook secret and add to `.env` as `STRIPE_WEBHOOK_SECRET`

## 4. Enable pgvector (Optional but Recommended)

pgvector provides better vector search performance. If you're using PostgreSQL (like Neon), you can enable it:

### For Neon (PostgreSQL):
```sql
-- Connect to your database and run:
CREATE EXTENSION IF NOT EXISTS vector;
```

### Update Vector Store Implementation:

Once pgvector is enabled, you can update `lib/mentor/vector-store.ts` to use native vector operations:

```typescript
// Instead of storing embeddings as JSON strings, use vector type:
// In Prisma schema, change:
// embedding String?  // Store vector embedding (JSON or base64)
// To:
// embedding Unsupported("vector(1536)")?  // For OpenAI embeddings

// Then use pgvector operators in queries:
// SELECT * FROM "MentorKnowledgeIndex" 
// ORDER BY embedding <-> $1::vector 
// LIMIT 10;
```

For now, the current implementation works with JSON storage and cosine similarity calculation in application code.

## 5. Testing the Setup

### 1. Test Database Connection:
```bash
npx prisma studio
# Navigate to MentorSubscription table to verify tables exist
```

### 2. Test API Endpoints:
```bash
# Check subscription status (requires authentication)
curl http://localhost:3000/api/mentor/subscription \
  -H "Cookie: your-session-cookie"

# Create a conversation (requires authentication and subscription)
curl -X PUT http://localhost:3000/api/mentor/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"title": "Test Conversation"}'
```

### 3. Test Stripe Integration:
1. Go to `/pricing` page
2. Look for "Mentor AI Assistant" option
3. Click subscribe
4. Complete Stripe checkout
5. Verify webhook creates subscription in database

## 6. Access Mentor

Once everything is set up:

1. **Navigate to**: `/dashboard/mentor`
2. **Subscribe**: If you don't have a subscription, you'll be prompted to subscribe
3. **Start chatting**: Ask Mentor questions about your business!

## Troubleshooting

### "Mentor subscription required" error:
- Check that `STRIPE_MENTOR_MONTHLY_PRICE_ID` is set correctly
- Verify subscription was created in database: `SELECT * FROM "MentorSubscription" WHERE "companyId" = YOUR_COMPANY_ID;`

### "OPENAI_API_KEY not configured" error:
- Verify `.env` file has `OPENAI_API_KEY` set
- Restart your development server after adding env vars
- Check that the key is valid: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Embeddings not working:
- Check OpenAI API key is valid
- Verify you have credits/quota in OpenAI account
- Check API logs for specific error messages

### Web search not working:
- This is optional - Mentor will work without it
- If you want web search, add `TAVILY_API_KEY` to `.env`
- Verify Tavily API key is valid

## Next Steps

After setup is complete:

1. **Index your data**: Visit `/api/mentor/index` (POST) to start indexing your business data
2. **Configure settings**: Go to `/dashboard/mentor/settings` to customize Mentor behavior
3. **Start using**: Begin conversations with Mentor at `/dashboard/mentor`

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all environment variables are set
3. Check database connection and table existence
4. Verify Stripe webhook is receiving events






