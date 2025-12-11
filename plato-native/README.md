# Plato Native Apps

Native iOS, iPadOS, and macOS applications for the Plato restaurant management system.

## Overview

This directory contains the native Swift/SwiftUI applications that connect to your existing Next.js backend API. The apps are completely separate from your web application and will not affect its operation.

## Project Structure

```
plato-native/
├── PlatoShared/          # Shared Swift package (API client, models, services)
├── PlatoiOS/            # iOS/iPadOS app
├── PlatoMac/            # macOS app
└── README.md            # This file
```

## Quick Start

### 1. Set Up the Shared Package

The `PlatoShared` package contains all the shared code (API client, models, services) used by both iOS and macOS apps. It's already set up and ready to use.

### 2. Create iOS App Project

1. Open Xcode
2. Create a new iOS App project
3. Save it in `PlatoiOS/` directory
4. Follow the setup instructions in `PlatoiOS/README.md`

### 3. Create macOS App Project

1. Open Xcode
2. Create a new macOS App project
3. Save it in `PlatoMac/` directory
4. Follow the setup instructions in `PlatoMac/README.md`

### 4. Configure API URL

Both apps need to know where your Next.js backend is running:

- **Development**: `http://localhost:3000`
- **Production**: Your deployed URL (e.g., `https://yourdomain.com`)

Set this via environment variable `PLATO_API_URL` in your Xcode scheme settings.

## Architecture

### Shared Package (`PlatoShared`)

- **API Client** (`APIClient.swift`): Handles all HTTP requests with cookie-based authentication
- **Endpoints** (`Endpoints.swift`): Defines all API endpoint paths
- **Auth Service** (`AuthService.swift`): Authentication methods (login, logout, register)
- **Session Manager** (`SessionManager.swift`): Manages user session state
- **Models**: Swift structs matching your Prisma schema (User, Recipe, Ingredient, etc.)

### iOS App (`PlatoiOS`)

- SwiftUI-based interface
- Tab-based navigation
- Optimized for iPhone and iPad
- Supports PIN-based device login

### macOS App (`PlatoMac`)

- SwiftUI-based interface
- Sidebar navigation
- Native macOS window management
- Menu bar commands

## Features Implemented

### ✅ Phase 1: Foundation
- [x] Shared Swift package with API client
- [x] Core data models (User, Recipe, Ingredient, Company, Staff, Category, Supplier)
- [x] Authentication service
- [x] Session management
- [x] iOS app structure
- [x] macOS app structure

### 🚧 Phase 2: Core Features (In Progress)
- [x] Login screen
- [x] PIN login
- [x] Dashboard view
- [x] Recipe list view
- [x] Recipe detail view
- [ ] Recipe creation/editing
- [ ] Ingredient management
- [ ] Staff management
- [ ] Wholesale orders

## Development Workflow

1. **Backend**: Your Next.js app continues running normally
2. **Native Apps**: Develop and test native apps independently
3. **API**: Both web and native apps use the same API endpoints
4. **Data**: All apps share the same database via your backend

## Testing

### Local Development

1. Start your Next.js backend: `cd /Users/matt/plato && npm run dev`
2. Set `PLATO_API_URL=http://localhost:3000` in Xcode schemes
3. Run the iOS or macOS app from Xcode

### Production

1. Deploy your Next.js backend
2. Set `PLATO_API_URL` to your production URL
3. Build and archive apps for App Store submission

## Next Steps

1. Complete recipe creation/editing UI
2. Implement ingredient management
3. Add staff management features
4. Implement offline caching with Core Data
5. Add push notifications
6. Prepare for App Store submission

## Important Notes

- **No changes to web app**: Your existing Next.js codebase remains untouched
- **Same backend**: Native apps use your existing API endpoints
- **Parallel development**: You can develop native apps while your web app continues running
- **Shared code**: Common logic is in `PlatoShared` package

## Support

For issues or questions:
1. Check the individual README files in `PlatoiOS/` and `PlatoMac/`
2. Review the API client implementation in `PlatoShared/`
3. Ensure your Next.js backend is running and accessible








