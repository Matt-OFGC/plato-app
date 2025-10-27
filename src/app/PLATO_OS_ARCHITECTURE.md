# Plato OS Architecture

## Overview

Plato is designed as a **Hospitality Operating System (OS)** - a modular platform where independent apps work together seamlessly to provide comprehensive hospitality management solutions. Each app functions standalone but shares data and integrates perfectly with others.

## Core Philosophy

### Independence + Integration
- **Independence**: Each app operates as a complete solution for its domain
- **Integration**: Apps share data and work together to create a unified experience
- **Modularity**: Users can access apps based on their subscription tier
- **Scalability**: New apps can be added without disrupting existing functionality

## App Structure

### Core Apps (Always Available)
- **Plato Recipes** - Recipe & ingredient management, costing, and scaling
  - Route: `/dashboard`
  - Tier: Starter (Free)
  - Core functionality for all users

### Premium Apps (Tier-Based)
- **Plato Trade** - Wholesale management, suppliers, and order processing
  - Route: `/dashboard/wholesale`
  - Tier: Professional+
  - Extends Recipes with B2B capabilities

- **Plato Insight** - Analytics, reporting, and business intelligence
  - Route: `/dashboard/analytics`
  - Tier: Professional+
  - Provides data insights across all apps

- **Plato Staff** - Scheduling, timesheets, and leave management
  - Route: `/dashboard/staff`
  - Tier: Team+
  - Manages human resources and operations

## Subscription Tiers

### Starter (Free)
- Plato Recipes only
- Up to 15 ingredients, 5 recipes
- Basic functionality

### Professional (£15-19/month)
- Plato Recipes + Trade + Insight
- Unlimited ingredients and recipes
- Advanced features and integrations

### Team (£47-59/month)
- All Professional features + Staff
- Team collaboration tools
- Production planning

### Business (£159-199/month)
- All features + advanced capabilities
- Custom integrations
- Priority support

## Technical Architecture

### App Switcher
- Vertical dock-style carousel in sidebar
- Shows 3-4 apps at once with smooth scrolling
- Glassmorphism design with emerald accents
- Active app highlighted with glow effect
- Locked apps show upgrade prompts

### Context Management
- `AppContextProvider` tracks active app state
- Persists active app in localStorage
- Auto-detects app from current route
- Provides app switching functionality

### Navigation System
- Navigation items grouped by app context
- Filtered based on active app and user permissions
- Maintains existing navigation preferences
- Backward compatible with current system

### Data Layer
- Shared Prisma schema across all apps
- Apps can reference data from other apps
- Consistent user experience and permissions
- Centralized subscription management

## Development Guidelines

### For AI Agents
When working on Plato features, always consider:

1. **Modular Design**: Features should fit within the app structure
2. **Cross-App Integration**: Consider how features interact with other apps
3. **Tier-Based Access**: Respect subscription limitations
4. **Consistent UX**: Maintain design language across apps
5. **Performance**: Use dynamic imports for app-specific code

### App Development
- Each app should be self-contained but shareable
- Use the app context to determine current app
- Implement tier-based feature gating
- Follow the established design system
- Consider mobile responsiveness

### Adding New Apps
1. Define app in `plato-apps-config.tsx`
2. Create app-specific routes and components
3. Add tier requirements
4. Update navigation config
5. Implement app switcher integration

## File Structure

```
src/
├── lib/
│   └── plato-apps-config.tsx    # App definitions and tier mapping
├── components/
│   ├── AppContextProvider.tsx    # App state management
│   ├── AppSwitcher.tsx          # Main switcher component
│   ├── AppUpgradeModal.tsx      # Upgrade prompts
│   └── icons/
│       └── PlatoAppIcons.tsx    # App-specific icons
└── dashboard/
    ├── layout.tsx               # Includes AppContextProvider
    ├── [app-routes]/            # App-specific pages
    └── ...
```

## Future Considerations

### Planned Apps
- **Plato Inventory** - Advanced inventory management
- **Plato Finance** - Financial tracking and reporting
- **Plato Marketing** - Customer engagement and promotions
- **Plato Compliance** - Health, safety, and regulatory management

### Integration Points
- Third-party POS systems
- Accounting software
- Inventory management systems
- Staff scheduling platforms
- Analytics and reporting tools

## Design Principles

1. **User-Centric**: Each app solves real hospitality problems
2. **Scalable**: Architecture supports growth and new features
3. **Intuitive**: Consistent UX patterns across all apps
4. **Flexible**: Users can choose which apps they need
5. **Integrated**: Apps work together seamlessly

This architecture ensures Plato remains a comprehensive hospitality solution while maintaining simplicity and usability for each individual app.
