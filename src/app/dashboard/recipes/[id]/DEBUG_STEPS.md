# Debug Info for Missing Icons

## Issue
Icons for temperature, duration, and timer not showing in steps view or whole recipe view.

## Expected Behavior
In the InstructionsPanel component (lines 222-250), when `viewMode !== "edit"`, the component should display:
- Temperature badge if `step.temperatureC` is a number
- Duration badge if `step.durationMin` is a number  
- Timer button if `step.hasTimer` is true AND `step.durationMin` exists

## Possible Causes

### 1. Database Schema Missing Fields
The database `sections` table may not have these columns:
- `name` (for step title)
- `temperatureC` (for oven temperature)
- `durationMin` (for cooking duration)
- `hasTimer` (for timer flag)

**Check**: Run `DESCRIBE sections;` or check your Prisma schema

### 2. No Data in Database
Even if the fields exist, they might be NULL for existing recipes.

**Fix**: Manually add some test data to a recipe's sections

### 3. Type Casting Issues
Using `(section as any).temperatureC` might not be working correctly.

## Quick Test
To verify the UI works, temporarily hardcode some test data in page.tsx:

```typescript
steps: recipe.sections.map((section, index) => ({
  id: section.id.toString(),
  title: (section as any).name || `Step ${index + 1}`,
  temperatureC: 180, // TEST: hardcoded temp
  durationMin: 25,   // TEST: hardcoded duration
  hasTimer: true,    // TEST: enable timer
  instructions: section.method ? section.method.split('\n').filter(Boolean) : [],
}))
```

If icons appear with this change, it confirms the database doesn't have the fields populated.

