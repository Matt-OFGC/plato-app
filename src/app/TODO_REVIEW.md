# TODO Comments Review

## Summary
Found 25+ TODO comments across the codebase. Here's a prioritized review:

## High Priority (Should Address Soon)

### 1. OAuth State Parameter (`api/auth/oauth/[provider]/callback/route.ts`)
```typescript
// TODO: Store app in OAuth state parameter for better detection
```
**Impact**: Better OAuth flow reliability
**Effort**: Low
**Status**: Can be addressed when improving OAuth

### 2. App Preferences Schema (`api/user/app-preferences/route.ts`)
```typescript
// TODO: Add appPreferences field to schema and run migration
```
**Impact**: Missing feature implementation
**Effort**: Medium (requires migration)
**Status**: Needs schema update

## Medium Priority (Nice to Have)

### 3. Recipe Dietary Tags (`api/recipes_backup/route.ts`)
```typescript
// dietary_tags: [], // TODO: Calculate dietary tags based on allergens
has_recent_changes: false, // TODO: Track recipe changes
```
**Impact**: Enhanced recipe metadata
**Effort**: Medium
**Status**: Feature enhancement

### 4. Mentor AI Embeddings (`lib/mentor/embeddings.ts`)
```typescript
// TODO: Implement OpenAI embeddings API call
```
**Impact**: Core feature incomplete
**Effort**: High
**Status**: Already partially implemented, may need completion

### 5. Vector Store Search (`lib/mentor/vector-store.ts`)
```typescript
// TODO: Implement proper pgvector cosine similarity search
```
**Impact**: Better AI search
**Effort**: High
**Status**: May already be implemented, needs verification

## Low Priority (Future Enhancements)

### 6. Payroll Integrations (`api/staff/payroll/sync/route.ts`)
Multiple TODOs for Sage, Xero, QuickBooks, BrightPay integrations
**Impact**: Feature expansion
**Effort**: Very High
**Status**: Future feature work

### 7. Training Permissions (`dashboard/training/page.tsx`)
```typescript
// TODO: Re-enable strict permission check once roles are fully configured
```
**Impact**: Security improvement
**Effort**: Low
**Status**: Waiting on role configuration

## Recommendations

1. **Quick Wins**: Address OAuth state parameter and training permissions (low effort)
2. **Schema Updates**: Plan migration for appPreferences field
3. **Feature Completion**: Verify Mentor AI embeddings/vector search implementation status
4. **Future Work**: Payroll integrations are large features, plan separately

## Notes

- Many TODOs are for future features or enhancements
- Some TODOs may already be implemented but comments not removed
- Review each TODO in context before addressing

