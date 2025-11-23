# Brand System - How It Works

## Current Behavior

### Brand Assignment
- **Brand is assigned at COMPANY level, not user level**
- When you register via `/bake/register` → Company gets `brand: 'plato_bake'`
- When you register via `/register` → Company gets `brand: 'plato'` (default)
- **Existing companies default to `brand: 'plato'`** - they don't automatically convert

### User Accounts
- **Users can belong to multiple companies** (via memberships)
- Each company has its own brand
- When you log in, you see the brand of your **primary company** (first active membership)
- The theme (pink vs green) is applied based on your company's brand

## How It Currently Works

### Scenario 1: Existing User
- Your existing account → Company has `brand: 'plato'` (green theme)
- You'll see the green Plato theme when logged in
- **To use Plato Bake**, you need to:
  1. Register a NEW company via `/bake/register` 
  2. Or be invited to an existing Plato Bake company

### Scenario 2: New User via Plato Bake
- Register at `/bake/register` → Company gets `brand: 'plato_bake'`
- You'll see the pink Plato Bake theme
- You'll only see: Recipes, Production, Make sections
- Teams and Safety sections are hidden

### Scenario 3: User with Multiple Companies
- User can belong to both a Plato company AND a Plato Bake company
- When logged in, you see the brand of your primary company
- (Future: Could add company switcher to switch between brands)

## Options for Handling Existing Accounts

### Option 1: Keep Current System (Recommended)
- Existing accounts stay as Plato
- Users register new company for Plato Bake if they want it
- **Pros**: Clean separation, no data migration needed
- **Cons**: Users need to create new company

### Option 2: Allow Brand Switching
- Add ability for company owners to switch their brand
- Could add a setting in company settings
- **Pros**: More flexible
- **Cons**: Need to handle feature restrictions, data migration

### Option 3: Auto-Detect Based on Route
- When user logs in via `/bake/login`, show Plato Bake theme
- When user logs in via `/login`, show Plato theme
- **Pros**: Simple, no changes needed
- **Cons**: Confusing - same account, different themes

### Option 4: User-Level Brand Preference
- Allow users to choose which brand they want to see
- Override company brand with user preference
- **Pros**: Most flexible
- **Cons**: Complex, breaks the company-level brand concept

## Recommended Approach

**Keep the current system** where:
1. Brand is company-level (not user-level)
2. Existing companies stay as Plato
3. New companies can choose brand based on registration route
4. Users can belong to multiple companies with different brands

This maintains:
- Clean separation between brands
- No data migration needed
- Clear branding per company
- Ability to have both brands if needed

## Future Enhancements

1. **Company Switcher**: Allow users to switch between their companies (and brands)
2. **Brand Migration Tool**: Allow admins to convert a company from one brand to another
3. **Multi-Brand Dashboard**: Show all companies grouped by brand
4. **Cross-Brand Features**: Share recipes between brands (if needed)

