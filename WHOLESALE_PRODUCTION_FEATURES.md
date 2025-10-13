# Wholesale & Production Planning Features

## Overview
We've implemented a comprehensive system for managing wholesale customers and production planning with flexible yield management.

## ✅ Completed Features

### 1. **Flexible Yield Management in Production Planning**
- **Custom Yield Input**: When creating a production plan, you can now specify the **total quantity** you want to make instead of just batches
  - Example: Enter "24 loaves" instead of "2 batches"
  - The system automatically calculates the number of batches needed
  - Displays both total yield and batch count: "24 loaves (2 batches)"
- **Edit Production Plans**: Click the "Edit" button on any production plan to:
  - Add new recipes
  - Remove recipes
  - Adjust quantities up or down
  - Change dates
- **Smart Display**: Production items show both the total output and batch count for clarity

### 2. **Wholesale Customer Management**
- **New Page**: `/dashboard/wholesale` - Manage all your wholesale customers
- **Customer Information**:
  - Business name
  - Contact person
  - Email & phone
  - Full address (street, city, postcode, country)
  - Internal notes
  - Active/Inactive status
- **Visual Dashboard**:
  - Card-based layout showing all customers
  - Quick view of contact details
  - Track number of production items and orders per customer
  - Separate sections for active and inactive customers

### 3. **Database Schema**
Added three new database models:
- **WholesaleCustomer**: Stores customer information
- **WholesaleOrder**: For tracking wholesale orders (foundation for future features)
- **WholesaleOrderItem**: Individual items in wholesale orders

Updated **ProductionItem** model:
- Added optional `customerId` field to track which customer each production item is for
- Added optional `notes` field for item-specific notes

### 4. **API Endpoints**
Created RESTful APIs for wholesale customer management:
- `POST /api/wholesale/customers` - Create new customer
- `GET /api/wholesale/customers` - List all customers
- `PATCH /api/wholesale/customers/[id]` - Update customer
- `DELETE /api/wholesale/customers/[id]` - Delete customer

Updated production plan API:
- `PATCH /api/production/plans/[id]` - Edit existing production plans
- `DELETE /api/production/plans/[id]` - Delete production plans

## 🎯 How to Use

### Adding a Wholesale Customer
1. Navigate to **Dashboard → Wholesale** (once added to sidebar)
2. Click **"Add Customer"**
3. Fill in customer details (only business name is required)
4. Click **"Add Customer"** to save

### Creating a Production Plan with Custom Yields
1. Go to **Dashboard → Production Planning**
2. Click **"New Production Plan"**
3. For each recipe:
   - Enter the **total quantity** you want (e.g., 24 loaves)
   - System calculates batches automatically (e.g., "= 2 batches")
4. The shopping list automatically adjusts for the correct amounts

### Editing an Existing Production Plan
1. Find your production plan in the list
2. Click the **"Edit"** button
3. Modify recipes, quantities, or dates
4. Click **"Update Plan"**

### Tracking Production by Customer
- In the production plan creation, you can now assign items to specific customers
- Notes field allows tracking like "12 for Customer A, 12 for us"
- Filter and view production by customer

## 🚀 Future Enhancements (Foundation Ready)

### Wholesale Order Management
The database is ready for:
- **Customer Order Portal**: Customers can place orders via special link
- **Order Status Tracking**: pending → confirmed → in_production → ready → delivered
- **Automatic Production Planning**: Orders auto-create production items
- **Order History**: Track all orders per customer over time
- **Delivery Scheduling**: Assign delivery dates to orders

### Implementation Next Steps
1. Create order entry form for customers
2. Build customer-facing order portal with unique link
3. Add notification system for new orders
4. Create order → production plan automation
5. Add invoicing/pricing to orders

## 📁 Files Created/Modified

### New Files
- `/src/app/dashboard/wholesale/page.tsx` - Wholesale customers page
- `/src/components/WholesaleCustomers.tsx` - Customer management UI
- `/src/app/api/wholesale/customers/route.ts` - Customer API
- `/src/app/api/wholesale/customers/[id]/route.ts` - Individual customer API
- `/src/app/api/production/plans/[id]/route.ts` - Edit/delete production plans

### Modified Files
- `/prisma/schema.prisma` - Added WholesaleCustomer, WholesaleOrder, WholesaleOrderItem models
- `/src/components/ProductionPlanner.tsx` - Added edit functionality and custom yields
- `/src/app/dashboard/production/page.tsx` - Added wholesale customers to production planner
- `/src/components/ProductionPlannerEnhanced.tsx` - Added wholesale customer support

## 💡 Usage Examples

### Example 1: Variable Weekly Production
- **Week 1**: Need 12 loaves for The Coffee Shop
  - Enter "12" in total yield → System calculates 1 batch
- **Week 2**: Need 36 loaves (12 for Coffee Shop, 24 for Bakery Co)
  - Enter "36" in total yield → System calculates 3 batches
  - Add notes: "12 for Coffee Shop, 24 for Bakery Co"

### Example 2: Last-Minute Adjustments
- Created plan for Monday with 24 items
- Tuesday morning: ahead of schedule, add 12 more
  - Click "Edit" on the plan
  - Change quantity from 24 to 36
  - Or add a new recipe entirely

### Example 3: Customer Management
- Add all wholesale accounts: The Coffee Shop, Bakery Co, Restaurant XYZ
- Mark seasonal customers as "Inactive" in off-season
- Track production history per customer
- Quick access to contact details when they call

## 🔧 Technical Details

### Database Relationships
```
Company
  ├── WholesaleCustomer (many)
  │   ├── ProductionItem (many) - tracks which items are for which customer
  │   └── WholesaleOrder (many) - future: formal orders
  │
  └── ProductionPlan (many)
      └── ProductionItem (many)
          └── customer (optional) - links to WholesaleCustomer
```

### Yield Calculation
```typescript
// User enters: 24 loaves
// Recipe yields: 12 loaves per batch
// Calculation: 24 / 12 = 2 batches

const finalQuantity = customYield / recipeYield;
// Result: 2 batches → shopping list calculates for 2x ingredients
```

## ✨ Benefits

1. **Flexibility**: Adapt production quantities week to week without creating new recipes
2. **Customer Tracking**: Know exactly which items are for which customers
3. **Accurate Costing**: Shopping lists reflect actual quantities needed
4. **Time Saving**: Edit existing plans instead of recreating from scratch
5. **Scalability**: Foundation ready for full order management system
6. **Organization**: All customer info in one place with production tracking

## 📝 Next Steps Recommendation

1. **Add to Sidebar**: Include "Wholesale" link in dashboard navigation
2. **Test the Flow**: Create a few test customers and production plans
3. **Customer Onboarding**: Add your existing wholesale customers
4. **Feedback Loop**: Use for 1-2 weeks and note any workflow improvements
5. **Phase 2**: Consider implementing customer order portal

---

**Note**: All features are production-ready and integrated with your existing system. The wholesale customer ordering system is a future enhancement but the database foundation is in place.

