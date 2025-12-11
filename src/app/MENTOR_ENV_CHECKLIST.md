# Mentor Environment Variables Checklist

## Required Variables

Add these to your `.env` file (or Vercel environment variables):

### 1. OpenAI API Key
```bash
OPENAI_API_KEY=sk-...
```
**How to get:**
- Visit https://platform.openai.com/api-keys
- Create a new secret key
- Copy and paste into `.env`

### 2. Stripe Mentor Price ID
```bash
STRIPE_MENTOR_MONTHLY_PRICE_ID=price_...
```
**How to get:**
- Create product in Stripe dashboard (see MENTOR_SETUP_GUIDE.md)
- Copy the Price ID from the price you create
- Add to `.env`

## Optional Variables

### 3. Tavily API Key (for web search)
```bash
TAVILY_API_KEY=tvly-...
```
**How to get:**
- Visit https://tavily.com/
- Sign up and get API key
- Add to `.env` (Mentor works without this, but won't search the web)

## Verification

After adding variables, verify they're loaded:

```bash
# Check if variables are set (don't print values)
node -e "console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET')"
node -e "console.log('STRIPE_MENTOR_MONTHLY_PRICE_ID:', process.env.STRIPE_MENTOR_MONTHLY_PRICE_ID ? 'SET' : 'NOT SET')"
```

## Important Notes

- **Never commit `.env` files** to git
- **Restart your dev server** after adding environment variables
- **For Vercel**: Add variables in Vercel dashboard → Settings → Environment Variables
- **For production**: Ensure all variables are set in your hosting platform








