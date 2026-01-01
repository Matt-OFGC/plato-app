# Fix Email Verification

## Check Vercel Environment Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and verify:

### Required Variables:

1. **`RESEND_API_KEY`**
   - Should be your Resend API key
   - Format: `re_xxxxxxxxxxxxx`
   - If missing, get it from: https://resend.com/api-keys

2. **`RESEND_FROM_EMAIL`**
   - Should be a valid email address
   - Format: `noreply@getplato.uk` OR `Plato <noreply@getplato.uk>`
   - **Must include @ symbol!**
   - If it says `Plato <getplato.uk>` (missing @), fix it!

## Common Issues

### Issue 1: Malformed RESEND_FROM_EMAIL
**Symptom:** Emails fail with "Invalid from field" error

**Fix:**
1. Go to Vercel → Environment Variables
2. Find `RESEND_FROM_EMAIL`
3. Change it to: `noreply@getplato.uk` or `Plato <noreply@getplato.uk>`
4. Make sure it has an `@` symbol!

### Issue 2: Missing RESEND_API_KEY
**Symptom:** Emails fail with "RESEND_API_KEY is not configured"

**Fix:**
1. Go to https://resend.com/api-keys
2. Create or copy your API key
3. Add it to Vercel as `RESEND_API_KEY`

### Issue 3: Domain Not Verified
**Symptom:** Emails fail with domain verification error

**Fix:**
1. Go to https://resend.com/domains
2. Add and verify `getplato.uk` domain
3. Add DNS records as instructed

## Test Email Configuration

After fixing, test by:
1. Try registering a new account
2. Check Vercel logs for email errors
3. Check Resend dashboard for sent emails

## Quick Fix

If `RESEND_FROM_EMAIL` is malformed in Vercel:

1. **Go to Vercel Dashboard**
2. **Settings → Environment Variables**
3. **Find `RESEND_FROM_EMAIL`**
4. **Edit it to:** `noreply@getplato.uk`
5. **Save**
6. **Redeploy** (or wait for next deployment)

The code will automatically format it as `Plato <noreply@getplato.uk>` when sending.



