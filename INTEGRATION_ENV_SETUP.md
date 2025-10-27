# Integration Environment Variables Setup

## Required Environment Variables

### Base Integration
```bash
ENCRYPTION_SECRET_KEY=your-super-secret-encryption-key-here
```

### Shopify Integration
```bash
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SHOPIFY_REDIRECT_URI=http://localhost:3000/api/integrations/callback/shopify
```

### QuickBooks Integration
```bash
QUICKBOOKS_CLIENT_ID=your-quickbooks-client-id
QUICKBOOKS_CLIENT_SECRET=your-quickbooks-client-secret
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/integrations/callback/quickbooks
```

### Xero Integration
```bash
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
XERO_REDIRECT_URI=http://localhost:3000/api/integrations/callback/xero
```

### Square Integration
```bash
SQUARE_APPLICATION_ID=your-square-application-id
SQUARE_ACCESS_TOKEN=your-square-access-token
SQUARE_LOCATION_ID=your-square-location-id
```

### Stripe Terminal/POS
```bash
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### Google Sheets Integration
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/callback/google
```

### Mailchimp Integration
```bash
MAILCHIMP_API_KEY=your-mailchimp-api-key
MAILCHIMP_DATA_CENTER=your-mailchimp-dc
```

## Setup Instructions

1. Copy `.env.example` to `.env.local`
2. Add the relevant integration credentials
3. Restart your development server

Note: Never commit `.env.local` to version control!
