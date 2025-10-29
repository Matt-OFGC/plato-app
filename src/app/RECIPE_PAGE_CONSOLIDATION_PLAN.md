# Recipe Page Consolidation Plan

## Problem Statement

### Current Issues:
1. **New Recipe Creation Bug**: Recipe is created before sections/items, so if items fail to create, an empty recipe remains in the database
2. **Code Duplication**: Two separate pages/form systems:
   - `/dashboard/recipes/new/page.tsx` - Uses `RecipeCreateForm` component
   - `/dashboard/recipes/[id]/page.tsx` - Uses `RecipeClient` component (the better one)
3. **Maintenance Burden**: Two different codebases doing similar things
4. **User Experience**: Users have to learn two different interfaces

### Current Architecture:

```
┌─────────────────────────────────────────────────┐
│ Recipe List Page (/dashboard/recipes)          │
│ └─ Links to:                                    │
│    ├─ /dashboard/recipes/new (Create Form)     │
│    └─ /dashboard/recipes/[id] (View/Edit)      │
└─────────────────────────────────────────────────┘
```

**Problems:**
- New recipe form (`RecipeCreateForm`) is less polished
- Recipe detail page (`RecipeClient`) is the best-designed page
- Two different save mechanisms
- Error handling is inconsistent

## Proposed Solution: Single Page Architecture

### Goal:
Use the recipe detail page (`/dashboard/recipes/[id]`) as the SINGLE page for:
- ✅ Creating new recipes (`/dashboard/recipes/new`)
- ✅ Viewing recipes (`/dashboard/recipes/[id]`)
- ✅ Editing recipes (`/dashboard/recipes/[id]?edit=true`)

### Benefits:
1. **One Codebase**: Single source of truth for recipe UI
2. **Better UX**: Users see the same interface for create/edit
3. **Easier Maintenance**: One set of components to maintain
4. **Consistent Behavior**: Same validation, same save logic
5. **Fix the Bug**: Use transactions to prevent partial saves

## Implementation Plan

### Phase 1: Fix Current Bug (Quick Fix)
**Priority: HIGH** - Fix before consolidation

**Problem**: `createRecipeUnified` creates recipe before items, causing empty recipes on failure.

**Solution**: Wrap in database transaction:

```typescript
// In actionsSimplified.ts
export async function createRecipeUnified(formData: FormData) {
  return await prisma.$transaction(async (tx) => {
    // Create recipe
    const recipe = await tx.recipe.create({ data: recipeData });
    
    // Create sections/items
    if (useSections) {
      // ... create sections and items
    } else {
      // ... create items
    }
    
    // If anything fails, entire transaction rolls back
    return recipe;
  });
}
```

**Files to Modify:**
- `/Users/matt/plato/src/app/dashboard/recipes/actionsSimplified.ts`

**Estimated Time**: 30 minutes

---

### Phase 2: Route Consolidation

**Make `/dashboard/recipes/[id]` handle both new and existing recipes**

#### Option A: Dynamic Route (Recommended)
**Route**: `/dashboard/recipes/[id]` where `id` can be `"new"` or a number

```typescript
// dashboard/recipes/[id]/page.tsx
export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  
  if (isNew) {
    // Fetch categories, ingredients, etc. for new recipe
    // Pass empty/default recipe data to RecipeClient
    return <RecipeClient recipe={emptyRecipe} isNew={true} />;
  } else {
    // Fetch existing recipe
    const recipe = await prisma.recipe.findUnique({ where: { id: parseInt(id) } });
    return <RecipeClient recipe={recipe} isNew={false} />;
  }
}
```

**Pros:**
- Clean URL structure
- Next.js handles routing naturally
- Easy to navigate

**Cons:**
- Need to ensure "new" doesn't conflict with actual recipe IDs

#### Option B: Query Parameter
**Route**: `/dashboard/recipes/new` → `/dashboard/recipes/[id]?mode=new`

**Pros:**
- No route conflicts
- Easier to detect new vs edit

**Cons:**
- Less clean URLs
- Requires redirect logic

**Recommended: Option A**

---

### Phase 3: Update RecipeClient Component

**Make `RecipeClient` handle both create and edit modes:**

#### Changes Needed:

1. **Add `isNew` prop**:
```typescript
interface Props {
  recipe: RecipeMock | null; // null for new recipes
  isNew: boolean;
  categories: { id: number; name: string }[];
  // ... other props
}
```

2. **Conditional Save Logic**:
```typescript
const handleSave = async () => {
  if (isNew) {
    await createRecipe(formData);
  } else {
    await updateRecipe(recipeId, formData);
  }
};
```

3. **Different Initial State**:
```typescript
// For new recipes, start with empty/default values
const [localIngredients, setLocalIngredients] = useState(
  isNew ? [] : recipe.ingredients
);
```

4. **Update Header**:
```typescript
<RecipeHeader
  title={isNew ? "New Recipe" : recipe.title}
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  // ... start in "edit" mode for new recipes
/>
```

5. **Auto-save or Manual Save**:
- For new recipes: Show save button prominently
- For existing: Keep current auto-save behavior

**Files to Modify:**
- `/Users/matt/plato/src/app/dashboard/recipes/[id]/RecipeClient.tsx`
- `/Users/matt/plato/src/app/dashboard/recipes/[id]/page.tsx`

---

### Phase 4: Update Navigation & Links

**Change all "Create Recipe" links to point to `/dashboard/recipes/new`:**

1. **Recipe List Page**:
```typescript
// dashboard/recipes/page.tsx
<Link href="/dashboard/recipes/new">
  Create Recipe
</Link>
```

2. **App Launcher**:
```typescript
// components/AppLauncher.tsx
<Link href="/dashboard/recipes/new">
  Launch Recipe →
</Link>
```

3. **Other Components**:
- Search for all `/dashboard/recipes/new` references
- Update to use new route

**Files to Update:**
- `/Users/matt/plato/src/app/dashboard/recipes/page.tsx`
- `/Users/matt/plato/src/app/components/AppLauncher.tsx`
- Any other components linking to recipe creation

---

### Phase 5: Migrate Save Actions

**Consolidate save actions to use same logic:**

#### Current State:
- `createRecipeUnified` - Creates recipe
- `saveRecipeChanges` - Updates recipe (in `[id]/actions.ts`)

#### Target State:
- Single `saveRecipe` function that handles both create and update
- Use transactions for safety
- Consistent error handling

```typescript
// dashboard/recipes/[id]/actions.ts
export async function saveRecipe(
  recipeId: number | null, // null = new recipe
  formData: RecipeFormData
) {
  return await prisma.$transaction(async (tx) => {
    let recipe;
    
    if (recipeId === null) {
      // Create new recipe
      recipe = await tx.recipe.create({ data: recipeData });
    } else {
      // Update existing recipe
      recipe = await tx.recipe.update({
        where: { id: recipeId },
        data: recipeData,
      });
      
      // Delete old items/sections
      await tx.recipeItem.deleteMany({ where: { recipeId } });
      await tx.recipeSection.deleteMany({ where: { recipeId } });
    }
    
    // Create new items/sections
    // ... (same logic for both create and update)
    
    return recipe;
  });
}
```

**Files to Modify:**
- `/Users/matt/plato/src/app/dashboard/recipes/[id]/actions.ts`
- Remove or deprecate `/dashboard/recipes/actionsSimplified.ts`

---

### Phase 6: Remove Old Code

**After migration is complete:**

1. **Delete old files**:
   - `/dashboard/recipes/new/page.tsx`
   - `/components/RecipeCreateForm.tsx` (if not used elsewhere)
   - `/dashboard/recipes/actionsSimplified.ts` (after migrating to new actions)

2. **Clean up imports**:
   - Remove unused imports
   - Update any remaining references

3. **Test thoroughly**:
   - Create new recipe
   - Edit existing recipe
   - Save changes
   - Delete recipe
   - All view modes (whole, steps, edit, photos)

---

## Migration Strategy

### Safe Rollout Plan:

1. **Step 1: Fix the Bug** (Phase 1)
   - Quick transaction fix
   - Deploy immediately
   - Test new recipe creation

2. **Step 2: Parallel Implementation** (Phase 2-4)
   - Keep old `/dashboard/recipes/new` route working
   - Add new route `/dashboard/recipes/new` → `/dashboard/recipes/[id]` with `id="new"`
   - Test both routes work
   - Gradually switch links over

3. **Step 3: Full Migration** (Phase 5)
   - Consolidate save actions
   - Update all links
   - Test thoroughly

4. **Step 4: Cleanup** (Phase 6)
   - Remove old code
   - Deploy final version

### Testing Checklist:

- [ ] Create new recipe from recipe list page
- [ ] Create new recipe from app launcher
- [ ] Edit existing recipe
- [ ] Save recipe changes
- [ ] Switch between view modes (whole, steps, edit, photos)
- [ ] Add ingredients
- [ ] Add sections/steps
- [ ] Delete recipe
- [ ] Error handling (missing name, invalid data, etc.)
- [ ] Mobile responsive
- [ ] Performance (page load < 3 seconds)

---

## Technical Considerations

### Database Transactions:
- **Critical**: All recipe operations must be atomic
- Use `prisma.$transaction()` for create/update
- Rollback on any error

### Error Handling:
- Consistent error messages
- Show errors in UI (toast notifications)
- Log errors for debugging
- Never leave partial data in database

### Performance:
- Lazy load recipe data only when needed
- Optimize database queries
- Use React Server Components where possible

### Backward Compatibility:
- Keep old routes working during migration
- Add redirects from old to new routes
- Gradual rollout minimizes risk

---

## Risk Assessment

### Low Risk:
- ✅ Fixing the transaction bug (Phase 1)
- ✅ Adding new route while keeping old one (Phase 2)

### Medium Risk:
- ⚠️ Updating RecipeClient to handle both modes (Phase 3)
- ⚠️ Consolidating save actions (Phase 5)

### High Risk:
- ⚠️ Removing old code (Phase 6) - Must be done after thorough testing

### Mitigation:
- Keep old code until migration is proven
- Feature flag for gradual rollout
- Comprehensive testing before each phase
- Easy rollback plan

---

## Estimated Timeline

- **Phase 1 (Bug Fix)**: 1 hour
- **Phase 2 (Routes)**: 2 hours
- **Phase 3 (Component Updates)**: 4 hours
- **Phase 4 (Navigation)**: 1 hour
- **Phase 5 (Actions)**: 3 hours
- **Phase 6 (Cleanup)**: 1 hour

**Total**: ~12 hours of development + testing time

---

## Success Criteria

1. ✅ New recipes can be created successfully
2. ✅ Existing recipes can be edited
3. ✅ No empty recipes created on error
4. ✅ Single codebase for recipe UI
5. ✅ Consistent user experience
6. ✅ All tests passing
7. ✅ Performance maintained (< 3s page load)

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Approve Phase 1** (bug fix) for immediate implementation
3. **Schedule Phase 2-6** for gradual rollout
4. **Set up testing environment** for validation
5. **Create feature branch** for implementation

---

## Questions to Consider

1. **URL Structure**: Should new recipes be `/recipes/new` or `/recipes/create`?
2. **Auto-save**: Should new recipes auto-save or require manual save?
3. **Draft Mode**: Should unsaved recipes be saved as drafts?
4. **Validation**: When should validation occur (on blur, on save, real-time)?
5. **Undo/Redo**: Should we add undo/redo for recipe edits?

---

**Document Version**: 1.0
**Last Updated**: 2025-01-XX
**Status**: Draft - Awaiting Approval

