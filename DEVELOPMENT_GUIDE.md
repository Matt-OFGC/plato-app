# Plato - Recipe Management System

A comprehensive recipe management system built with Next.js, Prisma, and PostgreSQL.

## 🏗️ Architecture Overview

This application follows a clean, maintainable architecture designed for scalability and team collaboration.

### Key Features

- **Multi-tenant Architecture**: Each company has isolated data
- **Comprehensive Recipe Management**: Support for basic, advanced, and simplified recipes
- **Security-First Design**: All operations verify company ownership
- **Type-Safe Operations**: Full TypeScript support with Zod validation
- **Database Migrations**: Proper schema management with Prisma
- **Development Tools**: Seeded data and helpful scripts

## 📁 Project Structure

```
src/
├── lib/
│   ├── security.ts              # Centralized security utilities
│   ├── recipes/
│   │   ├── actions.ts           # Unified recipe server actions
│   │   └── validation.ts        # Recipe validation schemas
│   ├── prisma.ts               # Database client
│   └── current.ts              # User/company context
├── components/
│   ├── recipes/                # Recipe-specific components
│   └── ui/                     # Reusable UI components
├── app/
│   ├── dashboard/
│   │   └── recipes/            # Recipe pages
│   └── api/                    # API routes
└── prisma/
    ├── schema.prisma           # Database schema
    ├── seed.ts                 # Development data seeding
    └── migrations/             # Database migrations
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd plato
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and other settings
   ```

3. **Set up the database**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed with test data
   npm run db:seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## 🛠️ Development Workflow

### Database Management

```bash
# Create a new migration
npm run db:migrate

# Reset database and reseed
npm run db:reset

# Just reseed data
npm run db:seed

# Check migration status
npm run db:status

# Open Prisma Studio
npm run studio
```

### Development Scripts

```bash
# Clean development (reset DB + start dev)
npm run dev:clean

# Start dev with seeded data
npm run dev:seed

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Code Organization

#### Security Layer (`lib/security.ts`)

All security checks are centralized here:

```typescript
import { verifyRecipeOwnership, requireCompanyId } from '@/lib/security'

// Verify recipe belongs to user's company
await verifyRecipeOwnership(recipeId, companyId)

// Get company ID (throws if none)
const companyId = await requireCompanyId()
```

#### Recipe Actions (`lib/recipes/actions.ts`)

All recipe operations in one place:

```typescript
import { createBasicRecipe, updateRecipe, deleteRecipe } from '@/lib/recipes/actions'

// Create a recipe
await createBasicRecipe(formData)

// Update a recipe (with security check)
await updateRecipe(recipeId, formData)

// Delete a recipe (with security check)
await deleteRecipe(recipeId)
```

#### Validation (`lib/recipes/validation.ts`)

Centralized validation schemas:

```typescript
import { basicRecipeSchema, type BasicRecipeData } from '@/lib/recipes/validation'

const parsed = basicRecipeSchema.safeParse(data)
if (!parsed.success) {
  throw new Error(`Validation failed: ${parsed.error.issues[0].message}`)
}
```

## 🔒 Security Model

### Company Isolation

- All data is scoped to companies
- Users can only access their company's data
- Cross-company access is prevented at the database level

### Ownership Verification

Every operation that modifies data verifies ownership:

```typescript
// Before updating a recipe
await verifyRecipeOwnership(recipeId, companyId)

// Before updating an ingredient
await verifyIngredientOwnership(ingredientId, companyId)
```

### Permission Levels

- **OWNER**: Full access, can manage team and billing
- **ADMIN**: Full content access, can manage team members
- **EDITOR**: Can create and edit all content
- **VIEWER**: Read-only access

## 🗄️ Database Schema

### Key Models

- **Company**: Multi-tenant isolation
- **User**: Authentication and permissions
- **Membership**: User-company relationships
- **Recipe**: Core recipe data with company scoping
- **Ingredient**: Company-scoped ingredients
- **RecipeItem**: Recipe-ingredient relationships

### Unique Constraints

- `Recipe`: `@@unique([name, companyId])` - Recipe names unique per company
- `Ingredient`: `@@unique([name, companyId])` - Ingredient names unique per company
- `Company`: `slug` is unique globally (not name)

## 🧪 Testing

### Test Data

The seed script creates consistent test data:

- **Test Companies**: Test Bakery, Demo Café
- **Test Users**: admin@testbakery.com, demo@democafe.com
- **Sample Recipes**: Sourdough Bread, Cappuccino
- **Sample Ingredients**: Flour, Yeast, Coffee Beans, etc.

### Test Accounts

```
Email: admin@testbakery.com
Password: password123
Role: Admin

Email: demo@democafe.com  
Password: password123
Role: User
```

## 📝 Best Practices

### Adding New Features

1. **Start with validation**: Create Zod schemas in `lib/recipes/validation.ts`
2. **Add security checks**: Use functions from `lib/security.ts`
3. **Create actions**: Add server actions to `lib/recipes/actions.ts`
4. **Update UI**: Create components in `components/recipes/`
5. **Test thoroughly**: Use seeded data for consistent testing

### Database Changes

1. **Always use migrations**: Never modify schema.prisma without running migrations
2. **Test migrations**: Use `npm run test:db` to test migration changes
3. **Update seed data**: Keep seed.ts in sync with schema changes
4. **Document changes**: Add comments explaining complex migrations

### Code Quality

1. **Type safety**: Use TypeScript types from validation schemas
2. **Error handling**: Always wrap operations in try-catch
3. **Security first**: Verify ownership before any data modification
4. **Consistent patterns**: Follow established patterns for new features

## 🚨 Common Issues

### Migration Drift

If you see "drift detected" errors:

```bash
# Reset and start fresh (loses data)
npm run db:reset

# Or create a new migration to handle drift
npm run db:migrate
```

### Permission Errors

If you get "Unauthorized" errors:

1. Check that the user has a company membership
2. Verify the resource belongs to the user's company
3. Ensure the user has sufficient permissions

### Validation Errors

If validation fails:

1. Check the Zod schema in `lib/recipes/validation.ts`
2. Verify form data matches expected format
3. Add proper error handling in UI components

## 🤝 Contributing

1. Follow the established patterns
2. Add security checks for all new operations
3. Update validation schemas for new data types
4. Test with seeded data
5. Document any new features

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Zod Documentation](https://zod.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
