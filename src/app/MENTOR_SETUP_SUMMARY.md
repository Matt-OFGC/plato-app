# Mentor AI Setup - Quick Summary

## ✅ Completed

1. ✅ **Database Schema** - All Mentor tables added to Prisma schema
2. ✅ **Migration File** - Created at `migrations/20250120000000_add_mentor_models.sql`
3. ✅ **Service Layer** - All Mentor services implemented
4. ✅ **API Routes** - Chat, subscription, and indexing endpoints created
5. ✅ **UI Components** - Chat interface and settings page built
6. ✅ **Stripe Integration** - Webhook handlers updated

## 🔧 To Do (Manual Steps)

### 1. Run Database Migration
```bash
cd /Users/matt/plato/src/app
# Option A: Apply SQL directly
psql $DATABASE_URL -f migrations/20250120000000_add_mentor_models.sql

# Option B: Use Prisma (if schema drift is resolved)
npx prisma db push
```

### 2. Add Environment Variables
Add to your `.env` file (or Vercel environment variables):

```bash
# Required
OPENAI_API_KEY=sk-your-openai-key-here
STRIPE_MENTOR_MONTHLY_PRICE_ID=price_your-stripe-price-id

# Optional (for web search)
TAVILY_API_KEY=tvly-your-tavily-key-here
```

### 3. Create Stripe Product
1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Name: `Mentor AI Assistant`
4. Add price: £49/month (or $49/month)
5. Copy the Price ID (starts with `price_`)
6. Add to `.env` as `STRIPE_MENTOR_MONTHLY_PRICE_ID`

### 4. Enable pgvector (Optional)
If using PostgreSQL/Neon:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 📝 Files Created

### Database & Schema:
- `prisma/schema.prisma` - Added Mentor models
- `migrations/20250120000000_add_mentor_models.sql` - Migration SQL

### Service Layer (`lib/mentor/`):
- `subscription.ts` - Subscription management
- `config.ts` - Configuration
- `embeddings.ts` - OpenAI embeddings
- `vector-store.ts` - Vector storage
- `context-retrieval.ts` - Business context
- `web-search.ts` - Internet search
- `chat.ts` - Chat handler
- `index.ts` - Exports

### API Routes (`api/mentor/`):
- `chat/route.ts` - Chat endpoints
- `subscription/route.ts` - Subscription status
- `index/route.ts` - Data indexing

### UI Components (`components/mentor/`):
- `ChatWindow.tsx` - Chat interface
- `MessageBubble.tsx` - Message display
- `SuggestedQuestions.tsx` - Prompt suggestions

### Pages (`dashboard/mentor/`):
- `page.tsx` - Main chat page
- `settings/page.tsx` - Settings page

### Integration:
- `lib/stripe-features.ts` - Added Mentor module
- `api/webhooks/stripe/route.ts` - Added Mentor webhook handlers

## 🚀 Testing

Once setup is complete:

1. **Access Mentor**: Navigate to `/dashboard/mentor`
2. **Subscribe**: Complete Stripe checkout
3. **Start Chatting**: Ask Mentor questions about your business
4. **Index Data**: POST to `/api/mentor/index` to index your business data

## 📚 Documentation

See `MENTOR_SETUP_GUIDE.md` for detailed setup instructions.






