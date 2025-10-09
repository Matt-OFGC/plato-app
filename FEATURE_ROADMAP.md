# 🎯 Plato Feature Roadmap
**Focus:** Best-in-class Recipe & Ingredient Management

---

## ✅ What You Already Have (Excellent Foundation)

**Recipe Management:**
- ✅ Recipe sections & methods
- ✅ Sub-recipes (recipes within recipes)
- ✅ Automatic cost calculation
- ✅ Yield management
- ✅ Recipe images
- ✅ Bake time/temp tracking
- ✅ Categories, shelf life, storage options

**Ingredient Management:**
- ✅ Supplier relationships
- ✅ Multi-unit support (weight, volume, each)
- ✅ Automatic unit conversion
- ✅ Density tracking (g/ml)
- ✅ Allergen tracking
- ✅ Pack pricing

**Team & Business:**
- ✅ Multi-user teams with roles
- ✅ Subscription management
- ✅ Team billing with seat-based pricing

---

## 🚀 HIGH-IMPACT Features (Should Add Soon)

These are the "no-brainer" features that will make users love you and solve real daily pain points.

---

### 1. **📊 Price Change Alerts & History**
**Problem:** Ingredient prices change constantly. Users don't know which recipes are now unprofitable.

**Solution:**
```
When user updates ingredient price:
- Show "Price changed by 23% - This affects 12 recipes"
- Highlight recipes that are now below target margin
- Track price history with dates
- "Undo" button if it was a mistake
```

**User Value:** 🔥🔥🔥🔥🔥  
**Implementation:** Medium (2-3 days)

**Database Addition:**
```prisma
model IngredientPriceHistory {
  id            Int        @id @default(autoincrement())
  createdAt     DateTime   @default(now())
  
  ingredient    Ingredient @relation(fields: [ingredientId], references: [id])
  ingredientId  Int
  
  oldPrice      Decimal
  newPrice      Decimal
  packQuantity  Decimal
  packUnit      BaseUnit
  
  changedBy     Int        // User ID
  reason        String?    // "Supplier increase", "Sale", etc.
  
  @@index([ingredientId, createdAt])
}
```

**UI Mock:**
```
┌─────────────────────────────────────┐
│ 🔔 Price Alert                      │
│                                     │
│ Flour (Strong White) changed:       │
│ £12.50 → £15.20 (+21.6%)           │
│                                     │
│ This affects 8 recipes:             │
│ • Sourdough Loaf (margin: 42% → 38%)│
│ • White Bloomer (margin: 38% → 34%) │
│ • Ciabatta (margin: 40% → 36%)     │
│                                     │
│ [View All Recipes]  [Update Prices] │
└─────────────────────────────────────┘
```

---

### 2. **🔄 Bulk Price Update**
**Problem:** Supplier sends new price list with 50 items. Updating one-by-one takes forever.

**Solution:**
```
CSV/Excel Import for Price Updates:
- Upload supplier price list
- Auto-match by ingredient name
- Review changes before applying
- Apply all or select specific items
- Track who made the bulk update
```

**User Value:** 🔥🔥🔥🔥🔥  
**Implementation:** Medium (3-4 days)

**UI Flow:**
```
Step 1: Upload CSV
Step 2: Match Columns
  ┌────────────────────────┐
  │ CSV Column → Plato     │
  │ "Product"  → Name      │
  │ "Price"    → Pack Price│
  │ "Size"     → Pack Qty  │
  └────────────────────────┘

Step 3: Review Changes (show side-by-side)
  Ingredient       Current    New      Change
  ─────────────────────────────────────────
  Butter           £4.20   → £4.95    +17.9%
  Flour (Strong)   £12.50  → £15.20   +21.6%
  Sugar (Caster)   £1.80   → £1.85    +2.8%

Step 4: Confirm & Apply
  [✓] Update 23 ingredients
  [ ] Send email notification to team
  [ ] Flag recipes with margin drops >5%
```

---

### 3. **📱 Quick Recipe Cost Check (Mobile-Optimized)**
**Problem:** User is at supplier, sees an ingredient on sale, wants to know if they should buy it.

**Solution:**
```
Simple mobile view:
"What if this ingredient cost £X?"

Shows:
- Current recipe costs
- New recipe costs
- Potential savings
- Which recipes use it most
```

**User Value:** 🔥🔥🔥🔥  
**Implementation:** Easy (1-2 days)

**UI Mock:**
```
┌─────────────────────────┐
│ Quick Cost Check        │
│                         │
│ Ingredient: Butter      │
│ Current: £4.20 / 500g   │
│                         │
│ New Price: £3.50 / 500g │
│           (17% cheaper) │
│                         │
│ Impact:                 │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│ Croissants              │
│ £0.45 → £0.39 (-13%)   │
│                         │
│ Shortbread              │
│ £0.32 → £0.28 (-12%)   │
│                         │
│ Potential Monthly Save: │
│ £87.50                  │
│                         │
│ [Update Price Now]      │
└─────────────────────────┘
```

---

### 4. **📦 Ingredient Low Stock Warnings**
**Problem:** Users run out of ingredients before ordering, disrupting production.

**Solution:**
```
Add to Ingredient model:
- currentStockLevel (optional)
- minStockLevel (alert threshold)
- reorderQuantity (suggested order amount)
- lastOrderedDate

Features:
- Weekly production planner
- "Will I have enough?" calculator
- Automatic reorder suggestions
```

**User Value:** 🔥🔥🔥🔥  
**Implementation:** Medium (2-3 days)

**Database Addition:**
```prisma
model Ingredient {
  // ... existing fields
  
  // Stock management (optional, but powerful)
  currentStock      Decimal?  // Current amount in inventory
  minStockLevel     Decimal?  // Alert when below this
  maxStockLevel     Decimal?  // For warehouse management
  reorderPoint      Decimal?  // Auto-suggest reorder
  reorderQuantity   Decimal?  // How much to order
  stockUnit         BaseUnit? // Unit for stock tracking
  lastOrderedDate   DateTime?
  lastStockUpdate   DateTime?
  
  stockHistory      StockTransaction[]
}

model StockTransaction {
  id            Int        @id @default(autoincrement())
  createdAt     DateTime   @default(now())
  
  ingredient    Ingredient @relation(fields: [ingredientId], references: [id])
  ingredientId  Int
  
  type          String     // "purchase", "usage", "waste", "adjustment"
  quantity      Decimal    // Positive or negative
  unit          BaseUnit
  
  reason        String?
  reference     String?    // Recipe ID or PO number
  updatedBy     Int        // User ID
  
  @@index([ingredientId, createdAt])
}
```

**UI Mock:**
```
┌─────────────────────────────────────┐
│ 🚨 Low Stock Alerts (3)             │
│                                     │
│ Flour (Strong White)                │
│ Current: 5kg | Min: 10kg            │
│ Used in 12 recipes this week        │
│ [Order 25kg from Premium Flour Co.] │
│                                     │
│ Butter (Salted)                     │
│ Current: 2kg | Min: 5kg             │
│ Next delivery: Monday               │
│ [Skip - Delivery coming]            │
│                                     │
│ Sugar (Caster)                      │
│ Current: 1kg | Min: 3kg             │
│ [Add to Shopping List]              │
└─────────────────────────────────────┘
```

---

### 5. **📅 Production Planner**
**Problem:** "How much of each ingredient do I need to make this week's menu?"

**Solution:**
```
Weekly Production View:
- Select recipes + quantities
- Shows total ingredient needs
- Compares to current stock
- Generates shopping list
- Calculates total cost
```

**User Value:** 🔥🔥🔥🔥🔥  
**Implementation:** Medium-High (4-5 days)

**UI Mock:**
```
┌─────────────────────────────────────────────┐
│ This Week's Production Plan                 │
│                                             │
│ Monday:                                     │
│  50x Croissants                             │
│  30x Pain au Chocolat                       │
│  20x Almond Croissants                      │
│                                             │
│ Tuesday:                                    │
│  60x Sourdough Loaves                       │
│  40x Ciabatta                               │
│                                             │
│ Total Ingredients Needed:                   │
│ ─────────────────────────────────────────── │
│ Flour (Strong)    45kg   [✓ In Stock]      │
│ Butter           12kg   [⚠️ Need 7kg more] │
│ Eggs             15 dozen [✓ In Stock]      │
│ Chocolate        3kg    [❌ Out of stock]   │
│                                             │
│ Total Cost: £287.50                         │
│                                             │
│ [Generate Shopping List] [Add to Calendar]  │
└─────────────────────────────────────────────┘
```

**Database Addition:**
```prisma
model ProductionPlan {
  id            Int        @id @default(autoincrement())
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  
  name          String     // "Week 23 Production"
  startDate     DateTime
  endDate       DateTime
  
  company       Company    @relation(fields: [companyId], references: [id])
  companyId     Int
  
  items         ProductionPlanItem[]
  status        String     @default("draft") // draft, confirmed, completed
  
  @@index([companyId, startDate])
}

model ProductionPlanItem {
  id            Int              @id @default(autoincrement())
  
  plan          ProductionPlan   @relation(fields: [planId], references: [id])
  planId        Int
  
  recipe        Recipe           @relation(fields: [recipeId], references: [id])
  recipeId      Int
  
  quantity      Int              // How many to make
  scheduledDate DateTime
  notes         String?
  
  @@index([planId])
}
```

---

### 6. **🏷️ Recipe Labels & Smart Filters**
**Problem:** Users have 200+ recipes. Finding "gluten-free breakfast items" is painful.

**Solution:**
```
Add Tags to Recipes:
- Dietary: Vegan, Gluten-Free, Dairy-Free, etc.
- Meal Type: Breakfast, Lunch, Dinner, Snack
- Complexity: Easy, Medium, Advanced
- Season: Summer, Winter, Christmas, Easter
- Custom tags

Smart Filters:
- Multi-tag selection
- Profit margin ranges
- Cost per serving ranges
- Prep time ranges
```

**User Value:** 🔥🔥🔉  
**Implementation:** Medium (2-3 days)

**Database Addition:**
```prisma
model RecipeTag {
  id          Int      @id @default(autoincrement())
  createdAt   DateTime @default(now())
  
  name        String
  type        String   // "dietary", "meal", "season", "custom"
  color       String?
  icon        String?
  
  company     Company? @relation(fields: [companyId], references: [id])
  companyId   Int?
  
  recipes     Recipe[]
  
  @@unique([name, companyId, type])
  @@index([companyId])
}
```

**UI Mock:**
```
┌─────────────────────────────────────┐
│ Recipes (89)                        │
│                                     │
│ Filters:                            │
│ [✓] Vegan  [✓] Breakfast  [ ] Easy │
│ [ ] Gluten-Free  [ ] High Profit   │
│                                     │
│ Sort by: [Profit Margin ▼]         │
│                                     │
│ Results: 12 recipes                 │
│ ─────────────────────────────────── │
│ Vegan Banana Bread  🌱 🍞          │
│ Cost: £0.45 | Margin: 68%          │
│                                     │
│ Overnight Oats  🌱 ☀️              │
│ Cost: £0.32 | Margin: 72%          │
└─────────────────────────────────────┘
```

---

### 7. **💰 Target Margin Alerts**
**Problem:** Users don't know which recipes are profitable until they check manually.

**Solution:**
```
Add to Recipe:
- targetMargin (e.g., 65%)
- minMargin (e.g., 55%)
- suggestedPrice (auto-calculated)
- currentPrice (what they actually charge)

Features:
- Dashboard showing "below target" recipes
- Automatic price suggestions
- Margin tracking over time
```

**User Value:** 🔥🔥🔥🔥🔥  
**Implementation:** Easy (1-2 days)

**Database Addition:**
```prisma
model Recipe {
  // ... existing fields
  
  // Pricing & margins
  targetMargin      Decimal?  @default(65.0) // Target profit margin %
  minMargin         Decimal?  @default(55.0) // Minimum acceptable margin
  currentPrice      Decimal?  // What they actually charge
  suggestedPrice    Decimal?  // Auto-calculated from target margin
  lastPriceUpdate   DateTime?
  
  // Profitability tracking
  profitabilityStatus String? @default("unknown") // "good", "warning", "poor", "unknown"
}
```

**UI Mock:**
```
┌─────────────────────────────────────┐
│ ⚠️ Margin Alerts (5 recipes)        │
│                                     │
│ Sourdough Loaf                      │
│ Cost: £1.45 | Selling: £3.50       │
│ Margin: 58.6% (Target: 65%)        │
│ Suggested: £4.14                    │
│ [Update Price]                      │
│                                     │
│ Almond Croissant                    │
│ Cost: £0.82 | Selling: £2.20       │
│ Margin: 62.7% (Target: 65%)        │
│ Suggested: £2.34                    │
│ [Update Price]                      │
└─────────────────────────────────────┘
```

---

### 8. **🔍 Ingredient Substitution Suggestions**
**Problem:** "We're out of butter. What can we use instead? How will it affect cost?"

**Solution:**
```
Add Substitution Groups:
- Fats: Butter, Margarine, Oil
- Sugars: Caster, Granulated, Brown
- Flours: Plain, Self-Raising, Bread

Features:
- "Find substitute" button on ingredients
- Shows cost impact
- Notes about quality/taste differences
```

**User Value:** 🔥🔥🔥  
**Implementation:** Medium (2-3 days)

**Database Addition:**
```prisma
model IngredientSubstitution {
  id                Int        @id @default(autoincrement())
  createdAt         DateTime   @default(now())
  
  ingredient        Ingredient @relation("Original", fields: [ingredientId], references: [id])
  ingredientId      Int
  
  substitute        Ingredient @relation("Substitute", fields: [substituteId], references: [id])
  substituteId      Int
  
  ratio             Decimal    @default(1.0) // 1:1 ratio, or adjust (e.g., 0.8 for oil vs butter)
  notes             String?    // "Slightly different texture"
  qualityImpact     String?    // "minimal", "moderate", "significant"
  
  company           Company?   @relation(fields: [companyId], references: [id])
  companyId         Int?
  
  @@unique([ingredientId, substituteId])
  @@index([companyId])
}
```

---

### 9. **📊 Recipe Performance Dashboard**
**Problem:** "Which recipes are actually making us money?"

**Solution:**
```
Analytics Dashboard showing:
- Most profitable recipes (by margin %)
- Highest revenue recipes (by total value)
- Most expensive recipes
- Recipes using expensive ingredients
- Trend over time (as prices change)
```

**User Value:** 🔥🔥🔥🔥  
**Implementation:** Medium (3-4 days)

**UI Mock:**
```
┌─────────────────────────────────────────────┐
│ Recipe Performance (Last 30 Days)           │
│                                             │
│ 📊 Top 5 by Profit Margin:                  │
│  1. Overnight Oats        72.3%  (↑2.1%)   │
│  2. Granola Bars          68.9%  (↓1.2%)   │
│  3. Victoria Sponge       67.5%  (→)       │
│  4. Brownies              65.2%  (↑0.8%)   │
│  5. Scones                63.1%  (↓0.5%)   │
│                                             │
│ 💰 Top 5 by Revenue Impact:                 │
│  1. Sourdough Loaf        £2,340  (↑12%)   │
│  2. Croissants            £1,890  (↑8%)    │
│  3. Almond Croissant      £1,560  (↑5%)    │
│                                             │
│ ⚠️ Needs Attention:                         │
│  • Pain au Chocolat (margin dropped 8%)    │
│  • Ciabatta (cost increased 15%)           │
└─────────────────────────────────────────────┘
```

---

### 10. **🖨️ Print-Friendly Recipe Cards**
**Problem:** Kitchen staff need physical recipe cards, not a laptop in the kitchen.

**Solution:**
```
Print View Options:
- Kitchen format (large text, ingredient list)
- Cost sheet (for pricing/ordering)
- Allergen label (for display)
- Batch scaling (make 2x, 5x, 10x)
```

**User Value:** 🔥🔥🔥🔥  
**Implementation:** Easy (1-2 days)

**Print Formats:**
```
KITCHEN CARD (A5):
┌─────────────────────────────────┐
│ SOURDOUGH LOAF                  │
│ Yield: 2 loaves (800g each)     │
│                                 │
│ INGREDIENTS:                    │
│ □ Strong White Flour    1000g   │
│ □ Water                  650ml  │
│ □ Sourdough Starter      200g   │
│ □ Sea Salt               20g    │
│                                 │
│ METHOD:                         │
│ 1. Autolyse 30 mins             │
│ 2. Add starter & salt...        │
│                                 │
│ BAKE: 230°C | 45 mins          │
│ STORAGE: Room temp | 3 days     │
└─────────────────────────────────┘

COST SHEET (A4):
┌─────────────────────────────────┐
│ SOURDOUGH LOAF - Costing        │
│                                 │
│ Ingredient        Qty    Cost   │
│ ─────────────────────────────── │
│ Strong Flour     1000g  £1.20   │
│ Water             650ml  £0.00  │
│ Starter           200g   £0.18  │
│ Salt              20g    £0.02  │
│                          ─────  │
│ TOTAL COST:              £1.40  │
│ Cost per loaf:           £0.70  │
│                                 │
│ Suggested Price: £4.20 (67%)    │
│ Target Margin: 65%              │
└─────────────────────────────────┘
```

---

## 🎯 MEDIUM-PRIORITY Features

These are nice-to-have features that add polish but aren't critical for core functionality.

---

### 11. **📸 Ingredient Photo Gallery**
Allow users to upload photos of ingredients/packaging for easy team reference.

**User Value:** 🔥🔥  
**Implementation:** Easy (1 day)

---

### 12. **🔔 Expiry Date Tracking**
Track expiry dates for perishable ingredients and get alerts.

**User Value:** 🔥🔥🔥  
**Implementation:** Medium (2 days)

---

### 13. **📝 Shopping List Generator**
One-click shopping list from production plan or selected recipes.

**User Value:** 🔥🔥🔥🔥  
**Implementation:** Easy (1-2 days)

---

### 14. **💱 Multi-Currency Support**
For businesses buying from international suppliers.

**User Value:** 🔥🔥  
**Implementation:** Medium (2-3 days)

---

### 15. **🌡️ Seasonal Pricing**
Track ingredient prices by season (e.g., strawberries in summer vs winter).

**User Value:** 🔥🔥  
**Implementation:** Medium (2 days)

---

### 16. **📧 Email Reports**
Weekly email with cost changes, margin alerts, and performance summary.

**User Value:** 🔥🔥🔥  
**Implementation:** Medium (3 days)

---

### 17. **🔗 Supplier Portal Link**
Quick links to supplier ordering portals from ingredient page.

**User Value:** 🔥🔥  
**Implementation:** Easy (1 day)

---

### 18. **📱 Mobile App (PWA)**
Progressive Web App for offline access and better mobile experience.

**User Value:** 🔥🔥🔥🔥  
**Implementation:** High (2-3 weeks)

---

### 19. **🔄 Recipe Versioning**
Track changes to recipes over time. "View version history" and rollback.

**User Value:** 🔥🔥🔥  
**Implementation:** Medium-High (4-5 days)

---

### 20. **🎨 Custom Branding**
Let Pro users add their logo/colors for printed materials.

**User Value:** 🔥  
**Implementation:** Easy (1-2 days)

---

## ❌ Features to AVOID (Stay Focused!)

These are tempting but would dilute your core value proposition:

1. **❌ Inventory Management** - Too complex, many dedicated tools exist
2. **❌ POS Integration** - Different problem space
3. **❌ Staff Scheduling** - Not recipe/ingredient related
4. **❌ Social Media Scheduler** - Totally different product
5. **❌ Customer CRM** - Out of scope
6. **❌ Accounting/Invoicing** - Use QuickBooks/Xero
7. **❌ Online Ordering** - Too complex, many solutions
8. **❌ Table Reservations** - Different problem

---

## 📋 Recommended Implementation Order

### **Phase 1: Quick Wins (Month 1-2)**
These add huge value with minimal complexity:

1. **Target Margin Alerts** (1-2 days) - Immediate value
2. **Print-Friendly Recipe Cards** (1-2 days) - Kitchen essential
3. **Recipe Labels & Filters** (2-3 days) - Usability boost
4. **Quick Cost Check** (1-2 days) - Mobile-friendly win

**Total:** ~2 weeks of development
**Impact:** 🔥🔥🔥🔥🔥

---

### **Phase 2: Game-Changers (Month 3-4)**
These are your competitive advantages:

1. **Price Change Alerts & History** (2-3 days) - Unique feature
2. **Bulk Price Update** (3-4 days) - Massive time saver
3. **Production Planner** (4-5 days) - High-value workflow
4. **Recipe Performance Dashboard** (3-4 days) - Business insights

**Total:** ~3 weeks of development
**Impact:** 🔥🔥🔥🔥🔥

---

### **Phase 3: Professional Polish (Month 5-6)**
These make you look enterprise-ready:

1. **Ingredient Stock Warnings** (2-3 days) - Professional feature
2. **Shopping List Generator** (1-2 days) - Practical tool
3. **Email Reports** (3 days) - Automated insights
4. **Ingredient Substitutions** (2-3 days) - Smart feature

**Total:** ~2 weeks of development
**Impact:** 🔥🔥🔥🔥

---

## 💡 Feature Validation Strategy

**Before building ANY feature, ask:**

1. **Does it make recipe costing faster/easier?** ✅
2. **Does it make ingredient management simpler?** ✅
3. **Would Matt use this daily in his cafés?** ✅
4. **Can we build it in <1 week?** ✅
5. **Will users pay for this?** ✅

If not all YES, deprioritize or cut it.

---

## 🎯 The Golden Rule

> **"We're the best recipe costing tool for food businesses, not a generic restaurant management system."**

Stay focused. Do one thing exceptionally well. Add features that make that one thing even better.

---

## 📊 Success Metrics

Track these to know if features are working:

**User Engagement:**
- % of users who set target margins
- % of users who use production planner
- % of users who upload price lists
- Average recipes per user

**Business Impact:**
- Free to Pro conversion rate
- Feature usage in Pro vs Free
- User retention after 30/60/90 days
- Support tickets per feature

**User Feedback:**
- "What feature saved you the most time?"
- "What's missing that would make you upgrade?"
- NPS score after each major feature

---

## 🚀 Next Steps

**This Week:**
1. Review this roadmap
2. Pick 1-2 Phase 1 features
3. Create detailed specs
4. Build & ship!

**This Month:**
1. Ship all Phase 1 features
2. Get user feedback
3. Validate with real customers
4. Adjust Phase 2 priorities

**This Quarter:**
1. Complete Phase 1 & 2
2. Achieve product-market fit
3. Build case studies
4. Prepare for scaling

---

**Remember:** Every feature should make someone say:

> "Oh my god, this saves me SO much time!"

That's how you build a product people love AND pay for. 🎯

---

**Questions? Priorities to discuss? Let me know!**

