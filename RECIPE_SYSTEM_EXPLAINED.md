# Recipe System - Simple & Powerful

## The Problem You Identified

You're absolutely right - the current system can be confusing because:
1. **Bacon sandwich** (1 serving) is simple
2. **Cake tray** (24 slices) is complex
3. Users shouldn't need a PhD to cost a sandwich!

---

## The Solution: Smart Recipe Types

### 🎯 Two Simple Modes

#### **Mode 1: Single Serving Recipe**
**Use for:** Sandwiches, burgers, drinks, coffees, single portions

**User Experience:**
```
1. Select "Single Serving"
2. Add ingredients:
   - Bacon → 2 slices
   - Butter → 5g
   - Bread → 2 slices
3. Click "Create Recipe"
```

**What Plato Does:**
- ✅ Calculates total cost
- ✅ Shows: "Cost per sandwich: £2.34"
- ✅ That's it! Simple.

**Behind the scenes:**
```javascript
{
  name: "Bacon Sandwich",
  yieldQuantity: 1,
  yieldUnit: "each",
  portionsPerBatch: 1,  // Always 1 for single serving
  items: [...ingredients]
}
```

---

#### **Mode 2: Batch Recipe**
**Use for:** Cakes, soups, large pots, trays

**User Experience:**
```
1. Select "Batch Recipe"
2. Enter: "How many servings does one batch make?" → 24
3. Add ingredients for THE WHOLE BATCH:
   - Flour → 500g
   - Sugar → 400g
   - Eggs → 6 each
   - etc.
4. Click "Create Recipe"
```

**What Plato Does:**
- ✅ Calculates total batch cost: "£12.50"
- ✅ **Automatically** divides: "Cost per slice: £0.52"
- ✅ Shows both numbers clearly!

**Behind the scenes:**
```javascript
{
  name: "Victoria Sponge Cake",
  yieldQuantity: 1,        // 1 whole cake
  yieldUnit: "each",
  portionsPerBatch: 24,    // Cut into 24 slices
  items: [...ingredients]
}
```

---

## Example Workflows

### 🥪 Bacon Sandwich (Simple)

```
Recipe Type: Single Serving ✓
Recipe Name: Bacon Sandwich

Ingredients:
- Bacon     2 slices
- Butter    5g
- Bread     2 slices

Result:
✅ Total Cost: £2.34
✅ Cost per sandwich: £2.34 (same thing!)
```

---

### 🍰 Victoria Sponge Cake (Batch)

```
Recipe Type: Batch Recipe ✓
Recipe Name: Victoria Sponge Cake
How many servings: 24 slices

Ingredients (for whole batch):
- Flour     500g
- Sugar     400g
- Butter    400g
- Eggs      6 each
- Jam       200g
- Cream     300ml

Result:
✅ Total Batch Cost: £12.50
✅ Cost per slice: £0.52 (£12.50 ÷ 24)
```

You can now price each slice at £1.50 and know your profit margin!

---

### 🍲 Soup Pot (Batch)

```
Recipe Type: Batch Recipe ✓
Recipe Name: Tomato Soup
How many servings: 10 bowls

Ingredients (for whole pot):
- Tomatoes  2kg
- Onions    300g
- Stock     1l
- Cream     200ml

Result:
✅ Total Pot Cost: £6.40
✅ Cost per bowl: £0.64 (£6.40 ÷ 10)
```

---

### 🍹 Cocktail (Single)

```
Recipe Type: Single Serving ✓
Recipe Name: Mojito

Ingredients:
- White Rum    50ml
- Lime Juice   25ml
- Sugar Syrup  15ml
- Mint         10g
- Soda Water   100ml

Result:
✅ Total Cost: £1.85
✅ Cost per cocktail: £1.85
```

---

## Why This Works

### ✅ Advantages

**For Users:**
1. **No confusion** - Pick single or batch, that's it
2. **No math** - App does all calculations
3. **Clear results** - See both batch cost AND per-serving cost
4. **Works for everything** - From coffee to wedding cakes

**For the System:**
1. **Same data model** - No database changes needed
2. **Powerful** - Can handle any complexity
3. **Accurate** - Proper cost breakdown
4. **Scalable** - Works for 1 item or 1000 items

---

## Data Flow

### Single Serving
```
Input: 
- 2 slices bacon
- 5g butter  
- 2 slices bread

Processing:
1. Calculate ingredient costs
2. Sum total
3. Set portions = 1

Output:
- Batch cost: £2.34
- Per serving: £2.34 (£2.34 ÷ 1)
```

### Batch Recipe
```
Input:
- 500g flour (whole batch)
- 400g sugar (whole batch)
- etc.
- Servings: 24

Processing:
1. Calculate ingredient costs for whole batch
2. Sum total
3. Divide by 24

Output:
- Batch cost: £12.50
- Per slice: £0.52 (£12.50 ÷ 24)
```

---

## Display in Recipe Card

```
┌─────────────────────────────────────┐
│  Victoria Sponge Cake               │
├─────────────────────────────────────┤
│  Type: Batch Recipe (24 slices)     │
│                                     │
│  Ingredients (whole batch):         │
│  • Flour - 500g                     │
│  • Sugar - 400g                     │
│  • Butter - 400g                    │
│  • Eggs - 6 each                    │
│                                     │
│  💰 Cost Breakdown:                 │
│  ├─ Total Batch: £12.50            │
│  └─ Per Slice: £0.52               │
│                                     │
│  📊 Pricing Guide:                  │
│  Sell at £1.50 per slice            │
│  = 65% profit margin ✅             │
└─────────────────────────────────────┘
```

---

## Benefits for Different Business Types

### 🍞 Bakery
- Cost whole cake tray
- Get price per slice
- Easy pricing decisions

### 🥪 Café
- Cost sandwiches individually
- Or cost prep batches (e.g., 20 sandwiches)
- Flexible!

### 🍲 Restaurant
- Cost large soup pots
- Know cost per bowl
- Adjust portions easily

### 🍹 Bar
- Cost individual cocktails
- Or cost batch mixers
- Both work!

---

## Future Enhancements

### 1. **Sub-Recipes**
Already supported! A cake can include:
- Base Recipe (sponge)
- Filling Recipe (buttercream)
- Total cost = sum of all

### 2. **Scaling**
Want to make 2x or 3x the batch?
- Just multiply servings
- Costs scale automatically

### 3. **Smart Defaults**
- "Slice" → Suggests batch recipe
- "Sandwich" → Suggests single serving
- "Tray" → Suggests batch recipe

---

## Summary

**The Magic:**
1. User picks recipe type (single vs batch)
2. Adds ingredients
3. For batch: enters how many servings
4. App calculates EVERYTHING

**No Confusion:**
- ✅ Sandwich? Single serving. Done.
- ✅ Cake tray? Batch of 24. Done.
- ✅ Always get cost per serving
- ✅ Always get total cost

**It Just Works!** 🎉

---

## Implementation Status

- ✅ Data model already supports this
- ✅ Created simplified form component
- ⏳ Need to integrate into recipe pages
- ⏳ Need to update display components

Want me to implement this new UX flow?

