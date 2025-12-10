# Mentor AI Setup - Completion Status

## ✅ Completed Tasks

### 1. Database Migration ✅
- **Status**: Applied successfully
- **Method**: Used `prisma db execute`
- **Tables Created**: All 8 Mentor tables are now in the database
  - MentorSubscription
  - MentorConversation
  - MentorMessage
  - MentorKnowledgeIndex
  - MentorConfig
  - MentorGoal
  - MentorProgress
  - MentorInsight
  - MentorReminder

### 2. Environment Variables ✅
- **Status**: Placeholders added to `.env` file
- **Location**: `/Users/matt/plato/.env`
- **Variables Added** (commented out - you need to fill in values):
  ```
  # OPENAI_API_KEY=sk-your-openai-api-key-here
  # STRIPE_MENTOR_MONTHLY_PRICE_ID=price-your-stripe-price-id-here
  # TAVILY_API_KEY=tvly-your-tavily-api-key-here  # Optional
  ```

### 3. Stripe Product ⚠️
- **Status**: Script created, needs manual setup
- **Script**: `scripts/create-stripe-mentor-product.ts`
- **To Run**: 
  ```bash
  # If you have STRIPE_SECRET_KEY in .env:
  npx tsx scripts/create-stripe-mentor-product.ts
  
  # OR manually create in Stripe Dashboard:
  # 1. Go to https://dashboard.stripe.com/products
  # 2. Click "Add product"
  # 3. Name: "Mentor AI Assistant"
  # 4. Description: "Your AI business mentor..."
  # 5. Add price: £49/month (or $49/month)
  # 6. Copy Price ID and add to .env as STRIPE_MENTOR_MONTHLY_PRICE_ID
  ```

### 4. pgvector Extension ✅
- **Status**: Enabled successfully
- **Command**: `CREATE EXTENSION IF NOT EXISTS vector;`
- **Note**: Current implementation uses JSON storage, but pgvector is ready if you want to optimize later

## 📋 Next Steps (Manual)

### 1. Get OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Uncomment and update in `.env`:
   ```bash
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

### 2. Create Stripe Product
**Option A - Using Script:**
```bash
# Make sure STRIPE_SECRET_KEY is in .env, then:
cd /Users/matt/plato/src/app
npx tsx scripts/create-stripe-mentor-product.ts
```

**Option B - Manual (Recommended):**
1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Name: `Mentor AI Assistant`
4. Description: `Your AI business mentor that learns everything about your business and provides intelligent advice`
5. Click "Add price"
6. Amount: `49.00`
7. Currency: `GBP` (or `USD`)
8. Billing period: `Monthly`
9. Click "Add price"
10. Copy the Price ID (starts with `price_`)
11. Uncomment and update in `.env`:
    ```bash
    STRIPE_MENTOR_MONTHLY_PRICE_ID=price_your-actual-price-id
    ```

### 3. Optional: Get Tavily API Key (for web search)
1. Visit https://tavily.com/
2. Sign up for account
3. Get API key from dashboard
4. Uncomment and update in `.env`:
   ```bash
   TAVILY_API_KEY=tvly-your-actual-key-here
   ```

### 4. Restart Development Server
After adding environment variables:
```bash
# Kill existing server (Ctrl+C) and restart:
npm run dev
```

## 🧪 Testing

Once all variables are set:

1. **Check Database**: Tables should exist
   ```bash
   npx prisma studio
   # Navigate to MentorSubscription table
   ```

2. **Test API**: 
   ```bash
   # Check subscription endpoint (requires auth)
   curl http://localhost:3000/api/mentor/subscription
   ```

3. **Access UI**: 
   - Navigate to `/dashboard/mentor`
   - Should see chat interface (or subscription prompt)

## 📚 Documentation

- `MENTOR_SETUP_GUIDE.md` - Detailed setup guide
- `MENTOR_SETUP_SUMMARY.md` - Quick reference
- `MENTOR_ENV_CHECKLIST.md` - Environment variables checklist
- `MENTOR_AI_PLAN.md` - Complete implementation plan

## ✨ Ready to Use!

Once you've:
1. ✅ Added `OPENAI_API_KEY` to `.env`
2. ✅ Created Stripe product and added `STRIPE_MENTOR_MONTHLY_PRICE_ID` to `.env`
3. ✅ Restarted your dev server

Mentor AI Assistant will be fully functional! 🎉





