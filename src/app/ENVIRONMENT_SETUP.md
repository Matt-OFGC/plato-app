# Environment Variables Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Database
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/plato"
```

### Session Secrets
Generate these with: `openssl rand -base64 32`
```bash
SESSION_SECRET="your-session-secret-here"
ADMIN_SESSION_SECRET="your-admin-session-secret-here"
```

### App Configuration
```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Admin Credentials (change in production)
```bash
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="adminpassword"
```

## Optional Environment Variables

### Email Configuration
```bash
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_SERVICE_API_KEY="your-email-service-key"
```

### External Services
```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### AI Services
```bash
OPENAI_API_KEY="sk-..."
```

### Analytics
```bash
GOOGLE_ANALYTICS_ID="G-..."
```

## Setup Instructions

1. Copy the required variables to `.env.local`
2. Generate session secrets using the command above
3. Set up your database connection
4. Restart your development server

## Production Considerations

- Use strong, unique passwords for admin credentials
- Use environment-specific database URLs
- Set NODE_ENV to "production"
- Use secure session secrets
- Configure proper email service for production
