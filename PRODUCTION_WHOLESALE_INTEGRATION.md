# Production & Wholesale Integration - Feature Summary

## Overview

The production planning system now seamlessly integrates with wholesale orders, automatically importing customer splits and maintaining sync between orders and production schedules.

## ✨ New Features

### 1. **Auto-Import with Customer Splits**

When you create a production plan from wholesale orders, the system now:
- ✅ Automatically groups orders by customer
- ✅ Pre-fills allocation splits (e.g., "OMH: 12, Old Potting Shed: 8")
- ✅ Calculates how many batches you need
- ✅ Shows you exactly what's allocated vs. what's extra/internal

**Example:**
- OMH orders 12 millionaires
- Old Potting Shed orders 8 millionaires
- Your batch size is 24 millionaires
- System shows: "OMH: 12, OPS: 8, Internal: 4" (4 extra to complete the batch)

### 2. **Orders Sidebar**

A new sidebar shows you:
- 📋 All unplanned orders in your current date range
- 📅 Delivery dates for each order
- ✅ Which orders are already in production plans (green badges)
- 🔄 Quick-add buttons to import individual orders
- 📊 "Import All Unplanned Orders" button

**Toggle the sidebar:** Click "Show/Hide Orders" button at the top

### 3. **Smart Date-Based Matching**

- Orders are matched to production plans by **delivery date**
- Perfect for daily deliveries (like OMH getting deliveries every day)
- When you set production plan dates, it automatically shows relevant orders

### 4. **Refresh from Orders**

Each existing production plan now has a **"Refresh" button** that:
- Checks for new orders added since the plan was created
- Shows how many unplanned orders exist
- Lets you add them to the existing plan
- Maintains all existing allocations

### 5. **Enhanced Allocation Display**

Production items now clearly show:
- 👥 **Customer Splits:** Who gets what (with colored badges)
- 📦 **Internal/Extra:** Quantity not allocated to customers
- 📊 **Visual breakdown:** Easy to see at a glance

### 6. **Easy Batch Adjustment**

When creating plans, you can:
- See the total allocated to customers
- Add extra quantity for internal use
- Adjust batches and see real-time calculations
- Complete batch quantities to match your baking sizes

### 7. **Monday 7am Auto-Generation** (Optional)

Set up automatic weekly production plan generation:
- Runs every Monday at 7am
- Scans all pending/confirmed orders for the week
- Creates a production plan with customer splits pre-filled
- Skips if a plan already exists (won't create duplicates)

See `PRODUCTION_CRON_SETUP.md` for setup instructions.

## 🎯 Workflow

### Your Typical Week:

**Monday Morning (7am):**
1. System automatically creates a production plan from your wholesale orders
2. Plan includes all customer splits (OMH: X, Customer B: Y, etc.)
3. You receive a plan ready to review

**During the Week:**
1. New orders come in
2. Check the Orders Sidebar to see unplanned orders
3. Click "Add to Current Plan" or use the "Refresh" button
4. System adds the new orders with proper splits

**Before Baking:**
1. Review the production plan
2. See exactly what each customer ordered
3. See your internal/extra quantities
4. Adjust batch sizes if needed
5. Mark items complete as you bake

## 📱 How to Use

### Viewing a Production Plan (NEW!)

**The beautiful day-by-day view for working from:**

1. Go to Production Planning page
2. Click the green **"View"** button on any plan
3. See a beautiful tabbed interface:
   - **Overview**: All items at once
   - **Daily tabs**: One tab per day (Mon, Tue, etc.)
   - **Each day shows**: Recipe cards with customer splits, recipe links, sections
4. Click **"Open Recipe"** to view full recipe in new tab
5. Work through the day systematically

**Perfect for:**
- Bakers working in the kitchen
- Daily production execution
- Checking customer allocations
- Quick recipe reference
- Keeping track of what to make when

See `PRODUCTION_VIEW_GUIDE.md` for complete details!

### Creating a New Production Plan

**Method 1: From Wholesale Orders Page**
1. Go to Wholesale Orders
2. Click "Add to Production"
3. System imports all pending/confirmed orders with splits pre-filled

**Method 2: From Production Page**
1. Click "New Production Plan"
2. Set your date range
3. Orders sidebar shows relevant orders
4. Click "Import All Unplanned Orders"

**Method 3: Quick Add Individual Orders**
1. Open the Orders Sidebar (if hidden)
2. See all unplanned orders
3. Click "Add to Current Plan" on specific orders

### Adjusting Allocations

When creating a plan:
1. Expand "Split by Destination" for any recipe
2. See customer allocations (auto-filled from orders)
3. Add more allocations if needed
4. Adjust quantities
5. Add internal use by increasing batch count

### Managing Existing Plans

Each production plan has:
- **Refresh Button:** Pull in new orders
- **Edit Button:** Full edit capabilities
- **Progress Tracker:** See completion status
- **Customer Splits:** Clear visual breakdown

## 🎨 Visual Indicators

- **Blue Badges:** Customer allocations
- **Green Badges:** Internal/Extra quantities
- **Green Checkmarks:** Orders already in production
- **Yellow/Blue Status:** Order status (pending/confirmed)

## 🔧 Technical Details

### API Endpoints

- `GET /api/wholesale/orders/unplanned` - Fetch unplanned orders by date range
- `GET /api/cron/generate-production-plan` - Auto-generate weekly plans

### Database

- Production items store customer allocations
- Allocations link to wholesale customers
- Coverage tracking shows which orders are planned

## 💡 Tips

1. **Set accurate delivery dates** on wholesale orders for best auto-matching
2. **Use the sidebar** to keep track of what's planned vs. unplanned
3. **Refresh existing plans** when new orders come in during the week
4. **Adjust batch quantities** to account for wastage/extras
5. **Check the splits** before baking to ensure you have the right quantities

## 🚀 Benefits

- ⏱️ **Saves Time:** No manual entry of customer splits
- ✅ **Prevents Errors:** Automatic calculation of batch needs
- 📊 **Better Visibility:** See exactly what's for who
- 🔄 **Stays in Sync:** Easy refresh from orders
- 📅 **Perfect for Daily Deliveries:** Date-based matching handles complex schedules

## 🆘 Troubleshooting

**Orders not showing in sidebar:**
- Check the date range matches order delivery dates
- Verify orders are in "pending" or "confirmed" status
- Click the refresh icon to reload

**Allocations not importing:**
- Ensure wholesale orders have proper customer assignments
- Check that recipes match between products and production

**Auto-generation not working:**
- See `PRODUCTION_CRON_SETUP.md` for cron job setup
- Verify `CRON_SECRET` environment variable is set
- Check logs for any errors

## 📚 Related Documentation

- `PRODUCTION_CRON_SETUP.md` - Detailed cron job setup
- Wholesale Orders - How to manage customer orders
- Production Planning - Full production plan guide

---

**Questions or issues?** The system is designed to be flexible - you can still manually create and edit everything as before. The automation just makes it faster!

