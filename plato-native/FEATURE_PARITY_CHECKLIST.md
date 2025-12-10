# iOS/iPadOS/macOS Feature Parity Checklist

This checklist ensures that **every feature** available in the web app is also available and working in the native iOS/iPadOS/macOS apps. The iOS app is the **priority** - all features should work identically.

## ✅ Core Infrastructure

- [x] API endpoints created (`/api/recipes`, `/api/ingredients`)
- [x] Swift services (RecipeService, IngredientService)
- [x] Data models matching backend structure
- [x] Authentication and session management
- [ ] **Real-time sync** - Changes in iOS app immediately reflect in web app

## 📝 Recipe Features

### Basic Recipe Management
- [x] View all recipes (list view)
- [x] View single recipe (detail view)
- [x] Create new recipe
- [x] Edit existing recipe
- [x] Delete recipe
- [ ] **Bulk delete** recipes
- [ ] **Duplicate recipe** functionality

### Recipe Information
- [x] Recipe name
- [x] Description/method
- [x] Category selection
- [x] Yield quantity and unit
- [x] Selling price
- [ ] **Storage options** (dropdown from company's storage options)
- [ ] **Shelf life options** (dropdown from company's shelf life options)
- [x] Image URL (basic)
- [ ] **Image upload** (file picker, not just URL)
- [ ] **Recipe notes** field

### Recipe Ingredients
- [x] Add ingredients to recipe
- [x] Remove ingredients from recipe
- [x] Edit ingredient quantities
- [x] Edit ingredient units
- [x] **Type-ahead search** for ingredients (like web app)
- [ ] **Drag-and-drop reordering** of ingredients
- [ ] **Ingredient sections** (group ingredients by step/section)
- [ ] **Cost per ingredient** display
- [ ] **Total ingredient cost** calculation
- [ ] **Cost per serving** calculation
- [ ] **Cost per slice** (for batch recipes)
- [ ] **Food cost percentage** calculation

### Recipe Steps/Instructions
- [x] Add steps
- [x] Remove steps
- [x] Edit step titles
- [x] Edit step instructions
- [x] Temperature setting
- [x] Duration setting
- [ ] **Timer functionality** (hasTimer flag)
- [ ] **Step-by-step cooking mode** (read-only view)
- [ ] **Reorder steps** (drag-and-drop)

### Recipe Types & Modes
- [ ] **Single recipe mode** vs **Batch mode** toggle
- [ ] **Servings sync** with batch size
- [ ] **Recipe protection** (isProtected flag)
- [ ] **Three view modes**: Whole Recipe, Steps, Edit

### Recipe Cost Analysis
- [ ] **Total recipe cost** calculation
- [ ] **Cost per serving** calculation
- [ ] **Cost per slice** (for batch recipes)
- [ ] **Food cost percentage** (cost/selling price)
- [ ] **Profit margin** calculation
- [ ] **Cost insights modal** (like web app)
- [ ] **Ingredient usage cost** with density conversions

## 🥘 Ingredient Features

### Basic Ingredient Management
- [x] View all ingredients (list view)
- [x] View single ingredient (detail view)
- [x] Create new ingredient
- [x] Edit existing ingredient
- [x] Delete ingredient
- [x] **Search ingredients** (by name, supplier, notes)
- [ ] **Bulk delete** ingredients
- [ ] **Bulk edit** (e.g., change supplier for multiple)
- [ ] **Bulk import** (CSV/Excel)

### Ingredient Information
- [x] Ingredient name
- [x] Supplier (text field)
- [x] Supplier ID (dropdown)
- [x] Pack quantity
- [x] Pack unit (g, kg, ml, l, tsp, tbsp, each, etc.)
- [x] Pack price
- [x] Currency (GBP, USD, EUR)
- [x] Density (g/ml) for conversions
- [x] Notes field
- [ ] **Original unit** display (what user entered vs base unit stored)
- [ ] **Last price update** timestamp
- [ ] **Stale price alerts** (warn if price hasn't been updated in X days)

### Ingredient Allergens
- [x] Allergen selection (checkboxes)
- [x] Common allergens list (Gluten, Dairy, Eggs, Nuts, etc.)
- [x] "Other" allergen option
- [x] Display allergens in list view
- [ ] **Allergen filtering** (filter recipes by allergens)
- [ ] **Allergen aggregation** (show all allergens in a recipe)

### Ingredient Pricing
- [x] Basic pack price
- [ ] **Batch pricing tiers** (different prices for different quantities)
- [ ] **Custom conversions** (custom unit conversions)
- [ ] **Cost per unit** calculation (packPrice / packQuantity)
- [ ] **Price history** tracking
- [ ] **Price change alerts**

### Ingredient Validation
- [x] Prevent duplicate ingredient names (same company)
- [x] Prevent deletion if used in recipes
- [ ] **Warn before deletion** with recipe list
- [ ] **Subscription limits** checking (ingredient count limits)

## 🏢 Company & Settings

### Company Information
- [ ] Company name display
- [ ] Company logo display
- [ ] Business type
- [ ] Country/region

### Storage & Shelf Life Options
- [ ] **View storage options** (company-specific)
- [ ] **Create/edit storage options**
- [ ] **View shelf life options** (company-specific)
- [ ] **Create/edit shelf life options**

### Categories
- [ ] **View recipe categories**
- [ ] **Create/edit categories**
- [ ] **Category colors** (if web app has this)
- [ ] **Category filtering** in recipe list

## 👥 Staff & Users

### Staff Management
- [ ] View staff list
- [ ] Add staff member
- [ ] Edit staff member
- [ ] Delete staff member
- [ ] **PIN assignment** for device login
- [ ] **Role/permission management**

### User Profile
- [x] View user profile
- [x] Email display
- [x] Name display
- [ ] Edit profile
- [ ] Change password
- [ ] **Logout** functionality

## 📊 Analytics & Reporting

### Cost Tracking
- [ ] **Cost trends** over time
- [ ] **Profitability reports**
- [ ] **Ingredient cost changes** tracking
- [ ] **Recipe cost changes** tracking

### Forecasting
- [ ] **Production planning**
- [ ] **Shopping lists**
- [ ] **Ingredient usage forecasting**

## 🔄 Data Sync & Real-time Updates

### Synchronization
- [ ] **Changes sync immediately** between iOS and web
- [ ] **Offline support** with sync when online
- [ ] **Conflict resolution** (if same item edited in both places)
- [ ] **Last updated timestamps** visible

### Real-time Features
- [ ] **Live updates** when data changes (if web app has this)
- [ ] **Notifications** for important changes

## 🎨 UI/UX Parity

### Visual Design
- [x] Card-based layout for recipes
- [x] Similar typography and spacing
- [x] Color scheme matching web app
- [ ] **Dark mode** support
- [ ] **iPad-optimized layouts** (split view, etc.)
- [ ] **macOS-optimized layouts** (menu bar, keyboard shortcuts)

### User Experience
- [x] Search functionality
- [x] Pull-to-refresh
- [ ] **Swipe actions** (swipe to delete, etc.)
- [ ] **Haptic feedback** (iOS)
- [ ] **Keyboard shortcuts** (macOS)
- [ ] **Drag and drop** (iPadOS, macOS)
- [ ] **Context menus** (long press, right click)

## 🐛 Bug Fixes & Edge Cases

### Current Issues
- [ ] **Ingredients view not loading** - FIXED (moved to separate file)
- [ ] **Recipe detail view** - needs to show steps properly
- [ ] **Cost calculations** - not implemented yet
- [ ] **Image upload** - only URL, not file picker
- [ ] **Supplier management** - placeholder only

### Edge Cases
- [ ] Handle empty states gracefully
- [ ] Handle network errors gracefully
- [ ] Handle validation errors from API
- [ ] Handle large datasets (pagination?)
- [ ] Handle special characters in names
- [ ] Handle very long text fields

## 📱 Platform-Specific Features

### iOS/iPadOS
- [ ] **Camera integration** for recipe photos
- [ ] **Share sheet** integration
- [ ] **Widgets** (Home Screen widgets)
- [ ] **Shortcuts** (Siri Shortcuts)
- [ ] **Apple Watch** app (future)

### macOS
- [ ] **Menu bar** integration
- [ ] **Keyboard shortcuts** for all actions
- [ ] **File system** integration
- [ ] **Print** functionality
- [ ] **Export** (PDF, CSV, etc.)

## 🧪 Testing Checklist

### Functionality Testing
- [ ] Create recipe → appears in web app
- [ ] Edit recipe in iOS → changes in web app
- [ ] Delete recipe → removed from web app
- [ ] Create ingredient → appears in web app
- [ ] Edit ingredient → changes in web app
- [ ] Delete ingredient → removed from web app
- [ ] Cost calculations match web app
- [ ] Allergens display correctly
- [ ] Search works identically

### Data Integrity
- [ ] No data loss when syncing
- [ ] No duplicate data created
- [ ] Timestamps are correct
- [ ] Relationships preserved (ingredients in recipes, etc.)

### Performance
- [ ] List views load quickly (< 1 second)
- [ ] Search is responsive
- [ ] Large datasets handled well
- [ ] Images load efficiently

---

## Priority Order (Work Through This)

1. **CRITICAL**: Fix ingredients view loading ✅
2. **CRITICAL**: Cost calculations (ingredient costs, recipe costs, per-serving)
3. **HIGH**: Storage and shelf life options (dropdowns)
4. **HIGH**: Type-ahead ingredient search in recipe editor
5. **HIGH**: Recipe steps/instructions display and editing
6. **MEDIUM**: Batch pricing for ingredients
7. **MEDIUM**: Image upload (file picker)
8. **MEDIUM**: Bulk operations
9. **LOW**: Analytics and reporting
10. **LOW**: Platform-specific features

---

## Notes

- **iOS app is priority** - features should work there first, then ensure web app syncs
- **Test after each feature** - verify changes appear in web app immediately
- **Match web app behavior exactly** - users should not notice differences
- **Document any differences** - if something can't be identical, document why


