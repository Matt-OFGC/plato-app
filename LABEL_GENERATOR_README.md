# Label Generator System - Implementation Documentation

## Overview

The Label Generator system allows Plato users to create, customize, and print professional product labels and allergen information sheets. This system integrates seamlessly with the existing Plato design system and recipe database.

## Features Implemented

### Part 1 (Initial Setup)
✅ Database schema with 4 new tables
✅ Navigation integration with "Make" section in sidebar
✅ Basic route structure
✅ 5 system label templates seeded
✅ 3 allergen sheet templates seeded

### Part 3 (This Implementation)
✅ Recipe Selector with multi-select and quantities
✅ Template Library with system and custom templates
✅ Shared components (LabelCanvas, ColorPicker)
✅ Complete API endpoints for templates
✅ Generated documents API
✅ Full TypeScript support
✅ Plato glass morphism design system integration

## Database Schema

### Tables Created

1. **LabelTemplate** - Stores label designs and templates
2. **AllergenSheetTemplate** - Stores allergen sheet templates
3. **GeneratedDocument** - History of all generated labels/sheets
4. **RecipeUpdateLog** - Tracks recipe changes affecting allergens

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── labels/
│   │   │   └── templates/
│   │   │       ├── route.ts                    # GET/POST templates
│   │   │       └── [id]/
│   │   │           ├── route.ts                # GET/PUT/DELETE template
│   │   │           ├── duplicate/route.ts      # Duplicate template
│   │   │           └── set-default/route.ts    # Set default template
│   │   └── generated-documents/
│   │       └── route.ts                        # GET/POST document history
│   │
│   ├── components/
│   │   └── labels/
│   │       ├── sales-labels/
│   │       │   ├── RecipeSelectorView.tsx      # Multi-select recipes
│   │       │   └── TemplateLibraryView.tsx     # Browse templates
│   │       └── shared/
│   │           ├── LabelCanvas.tsx             # Render label preview
│   │           └── ColorPicker.tsx             # Color selection modal
│   │
│   └── dashboard/
│       └── make/
│           └── labels/
│               ├── sales/
│               │   └── page.tsx                # Sales labels main page
│               └── allergen-sheets/
                    └── page.tsx                # Allergen sheets page
```

## API Endpoints

### Templates

#### GET /api/labels/templates
Get all label templates (system + custom)
```json
Response: Array of templates with all styling properties
```

#### POST /api/labels/templates
Create a new custom template
```json
Request body: {
  "templateName": "My Custom Template",
  "backgroundColor": "#FFFFFF",
  "textColor": "#000000",
  ...
}
```

#### GET /api/labels/templates/[id]
Get a specific template by ID

#### PUT /api/labels/templates/[id]
Update an existing template

#### DELETE /api/labels/templates/[id]
Delete a template (only custom templates)

#### POST /api/labels/templates/[id]/duplicate
Create a copy of an existing template

#### POST /api/labels/templates/[id]/set-default
Set a template as the default for the company

### Generated Documents

#### GET /api/generated-documents?type=label&days=7
Get document generation history
- Query params:
  - `type`: 'label' or 'allergen_sheet'
  - `days`: Number of days to look back (default: 7)

#### POST /api/generated-documents
Save a new generated document record

## Components

### RecipeSelectorView
Multi-select interface for choosing recipes with quantity controls.

**Features:**
- Search and filter recipes
- Select/deselect with checkboxes
- Quantity selector (10, 21, 42, 63, 84, 105 labels)
- Category filtering
- Real-time summary (products, labels, sheets needed)
- Select all / Clear all buttons

### TemplateLibraryView
Browse and manage label templates.

**Features:**
- Display 5 system templates
- Show custom user templates
- Template preview with actual styling
- Duplicate any template
- Delete custom templates
- Set default template
- Create new template button

### LabelCanvas
Renders a label with full styling support.

**Props:**
- `template`: Template object with all styling
- `data`: Label data (product name, price, allergens, etc.)
- `scale`: Optional scale factor for preview

**Features:**
- Respects all template settings (colors, fonts, alignment)
- Text transform (uppercase, titlecase, lowercase)
- Spacing control (compact, normal, generous)
- Conditional field display
- Responsive to template dimensions

### ColorPicker
Modal color picker with presets.

**Features:**
- 60+ preset colors organized by category
- HTML5 color input for custom colors
- Hex code input field
- Live preview
- Apply/Cancel actions

## System Templates

Five professional templates are seeded automatically:

1. **Butler's Classic** - Cream background, sage text (#E8E4DC, #6D7C6F)
2. **Modern Minimal** - Clean black & white (High contrast)
3. **Traditional Bakery** - Warm, classic feel
4. **Bold & Bright** - Colorful, modern design
5. **Elegant Script** - Refined, sophisticated styling

## Usage Flow

### For Users:

1. **Navigate** → Open sidebar → Click "Make" → "Sales Labels"
2. **Choose Template** → Browse system or custom templates
3. **Select Products** → Multi-select recipes, set quantities
4. **Preview** → Review label sheet layout (Coming soon)
5. **Print** → Generate PDF and print (Coming soon)
6. **History** → View past generations (Coming soon)

### For Developers:

```typescript
// Fetch templates
const response = await fetch('/api/labels/templates');
const templates = await response.json();

// Create a template
await fetch('/api/labels/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(templateData)
});

// Use LabelCanvas component
<LabelCanvas
  template={template}
  data={{
    productName: 'Brownie',
    price: 3.50,
    allergens: ['Gluten', 'Eggs'],
    dietaryTags: ['vegan'],
    bestBefore: '12/12/2024'
  }}
  scale={1}
/>
```

## Still To Implement

### High Priority
- [ ] Preview View with full sheet layout
- [ ] PDF generation using jsPDF
- [ ] History View with download functionality
- [ ] Design Studio with live customization
- [ ] Allergen Sheets complete system
- [ ] Recipe Update Log tracking

### Medium Priority
- [ ] Barcode/QR code support
- [ ] Batch operations (print multiple days)
- [ ] Template sharing between users
- [ ] Print queue management

### Low Priority
- [ ] Email labels as PDF
- [ ] Custom label sizes
- [ ] Image upload for labels
- [ ] Advanced typography controls

## Authentication Integration

Currently, the APIs use placeholder values for:
- `companyId` - Hardcoded as `null` or `1`
- `userId` - Hardcoded as `1`

**TODO:** Replace with actual session-based authentication:
```typescript
// Example integration
const session = await getServerSession();
const companyId = session.user.companyId;
const userId = session.user.id;
```

## Testing Checklist

### Database
- [x] Migration runs successfully
- [x] All tables created
- [x] System templates seeded
- [ ] Constraints working (foreign keys, unique)

### Navigation
- [x] "Make" section appears in sidebar
- [x] Sales Labels and Allergen Sheets routes work
- [x] Active state highlights correctly

### Templates API
- [x] GET returns all templates
- [x] POST creates custom template
- [x] Duplicate works
- [ ] Set default updates correctly
- [ ] Delete only allows custom templates

### Components
- [x] RecipeSelectorView loads recipes
- [x] Multi-select works
- [x] Quantity selector updates
- [x] TemplateLibraryView displays templates
- [x] LabelCanvas renders correctly
- [x] ColorPicker shows and applies colors

### UI/UX
- [x] Plato design system consistency
- [x] Glass morphism styling
- [x] Responsive layouts
- [x] Loading states
- [x] Error handling

## Performance Considerations

1. **Large Recipe Lists**: Implement pagination or virtual scrolling if > 100 recipes
2. **Template Previews**: Consider lazy loading for many custom templates
3. **PDF Generation**: Use web workers for large batches
4. **Image Optimization**: Compress recipe images before displaying

## Browser Compatibility

Tested on:
- Chrome/Edge (Chromium) - ✅ Full support
- Firefox - ✅ Full support
- Safari - ⚠️ Backdrop filter may need prefixes

## Deployment Notes

1. Run database migration: `npx prisma migrate deploy`
2. Verify seed data: Check LabelTemplate table has 5 system templates
3. Build application: `npm run build`
4. Environment variables: Ensure `DATABASE_URL` is set

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database migration completed
3. Ensure Prisma client is generated
4. Check API routes are accessible

---

**Last Updated:** 2025-11-05
**Version:** 1.0.0 (Part 3)
**Status:** Core functionality complete, preview/PDF/allergen sheets pending
