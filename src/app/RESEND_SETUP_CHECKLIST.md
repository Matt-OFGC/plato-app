# Resend Setup Checklist

## ✅ What You've Done
- Fixed `RESEND_FROM_EMAIL` to `noreply@getplato.uk`
- Have `RESEND_API_KEY` configured
- Redeploying

## 🔍 What to Check in Resend

### 1. Domain Verification (IMPORTANT)

If you're using `noreply@getplato.uk`, you need to verify the `getplato.uk` domain in Resend:

1. **Go to Resend Dashboard:** https://resend.com/domains
2. **Check if `getplato.uk` is added:**
   - If YES → Make sure it's verified (green checkmark)
   - If NO → Add it and verify

3. **To Add Domain:**
   - Click "Add Domain"
   - Enter: `getplato.uk`
   - Resend will give you DNS records to add
   - Add them to your domain's DNS settings
   - Wait for verification (can take a few minutes to 24 hours)

### 2. API Key Check

Your API key looks good (`re_hySpCVWa...`). Make sure:
- ✅ It's active (not revoked)
- ✅ It has permission to send emails

### 3. Test After Deployment

Once deployment completes:

1. **Test email endpoint:**
   ```
   https://getplato.uk/api/test-email?email=your-email@example.com
   ```

2. **Try registering** a new account

3. **Check Resend Dashboard:**
   - Go to https://resend.com/emails
   - You should see sent emails there
   - Check for any errors

## Common Issues

### Issue: "Domain not verified"
**Solution:** Add and verify `getplato.uk` domain in Resend

### Issue: "Unauthorized" or "Invalid API key"
**Solution:** Check that `RESEND_API_KEY` is correct and active

### Issue: Emails go to spam
**Solution:** 
- Verify domain with SPF/DKIM records
- Resend will provide these when you add the domain

## Quick Check

After deployment, visit:
```
https://getplato.uk/api/test-email?email=your-email@example.com
```

This will tell you:
- ✅ If email config is correct
- ❌ What error you're getting (if any)

## Summary

**You need to:**
1. ✅ Fix RESEND_FROM_EMAIL (done!)
2. ⚠️ **Verify `getplato.uk` domain in Resend** (check this!)
3. ✅ Wait for deployment
4. ✅ Test

The domain verification is the most important step - without it, Resend won't send emails from `@getplato.uk` addresses.

