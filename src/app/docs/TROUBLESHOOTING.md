# Troubleshooting Guide: Company Membership Issues

## Common Issues and Solutions

### Issue: "No company found" error

**Symptoms:**
- User sees "No company found" message
- Cannot create recipes or ingredients
- Settings page is blank
- User has an account but no company access

**Root Causes:**
1. User account exists but no membership was created during registration
2. Membership exists but `isActive` is false
3. Database transaction failed partially during registration

**Solutions:**

#### Automatic Fix (Recommended)
The system now automatically repairs orphaned users. Simply refresh the page - the auto-repair will:
- Activate inactive memberships if user has only one company
- Create a company and membership if user has none

#### Manual Fix via SQL

```sql
-- 1. Find your user ID
SELECT id, email FROM "User" WHERE email = 'your-email@example.com';

-- 2. Check your memberships
SELECT * FROM "Membership" WHERE "userId" = YOUR_USER_ID;

-- 3a. If membership exists but isActive is false, activate it:
UPDATE "Membership" SET "isActive" = true WHERE "userId" = YOUR_USER_ID AND "isActive" = false;

-- 3b. If no membership exists, create a company and membership:
-- First create company
INSERT INTO "Company" (name, slug, "businessType", country, "createdAt", "updatedAt")
VALUES ('Your Company Name', 'your-company-slug', 'Bakery', 'United Kingdom', NOW(), NOW())
RETURNING id;

-- Then create membership (replace YOUR_USER_ID and COMPANY_ID)
INSERT INTO "Membership" ("userId", "companyId", role, "isActive", "createdAt", "updatedAt")
VALUES (YOUR_USER_ID, COMPANY_ID, 'ADMIN', true, NOW(), NOW());
```

#### Admin Fix Endpoint

Admins can use the diagnostic endpoint:

```bash
# Check system health
GET /api/health

# Diagnose specific user
POST /api/admin/fix-memberships
{
  "userId": 123,
  "action": "fix"
}
```

### Issue: Sign up fails

**Symptoms:**
- Registration form shows "Sign up failed"
- User account may or may not be created
- No error details shown

**Root Causes:**
1. Database connection issue
2. Transaction rollback (company or membership creation failed)
3. Validation error
4. Duplicate email/slug

**Solutions:**

1. **Check error details**: Look for `errorId` in the error response
2. **Retry registration**: The system is now idempotent - safe to retry
3. **Check logs**: Look for the error ID in server logs
4. **Contact support**: Provide error ID for faster resolution

**Prevention:**
- Registration now uses transactions to ensure atomicity
- Company name is optional (auto-generated from email if not provided)
- Better error messages guide users

### Issue: Settings page is blank

**Symptoms:**
- `/dashboard/business` shows blank page or error
- Cannot update company information

**Root Causes:**
- No active company membership
- Company record missing

**Solutions:**
- Refresh the page (auto-repair will fix it)
- If persists, use admin fix endpoint
- Check browser console for errors

### Issue: Cannot create recipes/ingredients

**Symptoms:**
- Recipe/ingredient creation fails
- Error message about "No company found"

**Root Causes:**
- `getCurrentUserAndCompany()` returns null companyId
- Membership is inactive

**Solutions:**
- Auto-repair should fix this automatically
- Refresh the page
- If persists, check membership status via admin endpoint

## Architecture Decisions

### Why Auto-Repair?

**Problem:** Users were getting stuck with accounts but no company access.

**Solution:** Auto-repair in `getCurrentUserAndCompany()` ensures users always have a company, even if registration partially failed.

**Trade-offs:**
- ✅ Users never get stuck
- ✅ Seamless experience
- ⚠️ May create companies automatically (logged for audit)
- ⚠️ Requires database write on every request if user is orphaned (mitigated by caching)

### Why Transactions?

**Problem:** Registration could partially succeed (user created, company failed, or vice versa).

**Solution:** All registration operations wrapped in transactions.

**Benefits:**
- Atomic operations (all or nothing)
- No orphaned data
- Easier to debug

### Why Optional Company Details?

**Problem:** Users blocked from accessing features if company details incomplete.

**Solution:** Company name auto-generated from email, all other fields optional.

**Benefits:**
- Users can start using the system immediately
- Can complete company details later
- Better onboarding experience

## Support Tools

### Health Check Endpoint

```bash
GET /api/health
```

Returns system health including:
- Database connectivity
- Orphaned users count
- Inactive memberships count
- Overall system status

### Admin Diagnostic Endpoint

```bash
# Get diagnostics for a user
POST /api/admin/fix-memberships
{
  "userId": 123
}

# Fix issues for a user
POST /api/admin/fix-memberships
{
  "userId": 123,
  "action": "fix"
}
```

### SQL Queries for Support

See "Manual Fix via SQL" section above.

## Monitoring

### Key Metrics to Watch

1. **Auto-repair rate**: High rate indicates systemic issue
2. **Registration failure rate**: Should be < 1%
3. **Orphaned users**: Should be 0 (auto-repair fixes)
4. **Inactive memberships**: Should be minimal

### Logging

All auto-repairs are logged with:
- User ID
- Reason code
- Company/membership IDs created
- Timestamp

Search logs for: `Auto-repair` or `Auto-repair successful`

## Prevention

### Best Practices

1. **Always use transactions** for multi-step operations
2. **Set `isActive: true` explicitly** when creating memberships
3. **Clear cache** after membership changes
4. **Monitor health endpoint** regularly
5. **Test registration flow** after deployments

### Code Patterns

```typescript
// ✅ Good: Transaction with explicit isActive
await prisma.$transaction(async (tx) => {
  const company = await tx.company.create({ ... });
  const membership = await tx.membership.create({
    data: {
      userId,
      companyId: company.id,
      role: 'OWNER',
      isActive: true, // Explicit
    },
  });
});

// ❌ Bad: Separate operations, no explicit isActive
const company = await prisma.company.create({ ... });
await prisma.membership.create({ data: { userId, companyId: company.id } });
```

## Contact & Escalation

If issues persist:
1. Check health endpoint: `/api/health`
2. Review logs for error IDs
3. Use admin diagnostic endpoint
4. Contact development team with:
   - User ID or email
   - Error ID (if available)
   - Steps to reproduce
   - Screenshots/logs

---

**Last Updated**: January 2025
**Related Files**: 
- `lib/current.ts` - Auto-repair logic
- `api/register/route.ts` - Registration with transactions
- `api/admin/fix-memberships/route.ts` - Diagnostic endpoint
- `api/health/route.ts` - Health check
