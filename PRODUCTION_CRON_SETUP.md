# Production Plan Auto-Generation Setup

This guide explains how to set up automatic weekly production plan generation every Monday at 7am.

## How It Works

The system automatically:
1. Checks all pending/confirmed wholesale orders for the upcoming week
2. Groups items by recipe and customer
3. Creates allocations showing which customer gets what
4. Calculates batch quantities needed
5. Generates a production plan with all the splits pre-filled

## Setup Instructions

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

1. Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-production-plan",
      "schedule": "0 7 * * 1"
    }
  ]
}
```

2. Set environment variable in Vercel:
   - `CRON_SECRET`: A random secret key for authentication

### Option 2: External Cron Service (cron-job.org, EasyCron, etc.)

1. Create a cron job pointing to:
   ```
   GET https://yourdomain.com/api/cron/generate-production-plan
   ```

2. Set schedule to: `0 7 * * 1` (Every Monday at 7am)

3. Add header:
   ```
   Authorization: Bearer YOUR_CRON_SECRET
   ```

### Option 3: GitHub Actions

Create `.github/workflows/generate-production.yml`:

```yaml
name: Generate Weekly Production Plans
on:
  schedule:
    - cron: '0 7 * * 1'  # Every Monday at 7am UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate Production Plans
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://yourdomain.com/api/cron/generate-production-plan
```

## Environment Variables

Add to your `.env.local` or deployment environment:

```bash
CRON_SECRET=your-random-secret-here-use-a-strong-password
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

## Testing

Test the cron job manually:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/generate-production-plan
```

Expected response:
```json
{
  "success": true,
  "timestamp": "2025-10-14T07:00:00.000Z",
  "results": [
    {
      "companyId": 1,
      "companyName": "Your Bakery",
      "status": "success",
      "planId": 123,
      "planName": "Auto-Generated Week Oct 14, 2025",
      "itemsCount": 8,
      "ordersProcessed": 3
    }
  ]
}
```

## Behavior

- **If plan exists**: Skips creation to avoid duplicates
- **If no orders**: Skips creation (no point in empty plans)
- **If orders exist**: Creates plan with customer splits pre-filled
- **Multiple companies**: Processes all companies in your database

## Monitoring

The endpoint returns detailed results for each company:
- `success`: Plan created successfully
- `skipped`: Plan already exists or no orders
- `error`: Something went wrong (check logs)

Set up monitoring/alerts on the endpoint response to get notified if generation fails.

## Customization

Edit `/api/cron/generate-production-plan/route.ts` to:
- Change date range calculation
- Adjust which order statuses to include
- Modify plan naming convention
- Add email notifications when plans are created
- Filter by specific customers or products

## Manual Trigger

Users can still manually create/edit production plans as normal. The auto-generation is just a convenience to pre-populate the week based on orders.

## Timezone Considerations

The cron runs at 7am in whatever timezone your server is in. For UK time (GMT/BST):
- Vercel/GitHub Actions: Use UTC time, so set to `0 7 * * 1` for 7am UTC (which is 7am GMT or 8am BST)
- Adjust if needed: `0 6 * * 1` for 7am BST year-round

## Disable Auto-Generation

To disable, simply remove the cron job configuration. Existing production plans won't be affected.

