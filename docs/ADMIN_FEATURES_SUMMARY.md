# Enhanced Admin Dashboard Features

## Overview

The admin dashboard has been significantly enhanced to give you complete control over user accounts, subscriptions, and company management for troubleshooting and customer support.

## Key Features

### 1. User Account Management

#### View All Users
- See all users with search and filter
- View subscription tiers, companies, and activity status
- See admin status and last login times

#### User Details Panel
Click "Details" on any user to expand and see:

**Subscription Management:**
- Upgrade/downgrade to any tier instantly (Starter, Professional, Team, Business)
- No Stripe required - direct database updates
- Perfect for giving free trials or extending subscriptions

**Password Management:**
- Send password reset emails directly from admin panel
- Help customers who are locked out

**Company Memberships:**
- View all companies the user belongs to
- See their role in each company
- View current PIN codes
- Reset PIN codes for team members (device-based login)

### 2. Database Browser

- Browse any table visually
- Search and filter records
- Paginated viewing for large datasets
- No need for database client software

### 3. Activity Logs

- View complete audit trail
- See what actions users performed
- Track changes to entities
- Color-coded by action type (create=green, update=blue, delete=red)

## Common Use Cases

### Issue: Customer can't log in
1. Go to Users tab
2. Search for customer email
3. Click "Details"
4. Click "Send Reset Link" in Password Management section
5. Customer gets reset email instantly

### Issue: Customer needs subscription upgrade
1. Find user in Users tab
2. Click "Details"
3. Click subscription tier button (Professional, Team, or Business)
4. Done - no Stripe involved

### Issue: Team member lost PIN code
1. Find the account owner user
2. Expand Details
3. Find company membership in the list
4. Enter new PIN in the input field
5. Click "Update PIN"
6. Team member can now log in with new PIN

### Issue: Need to investigate user activity
1. Go to Activity Logs tab
2. Filter by user email
3. See all actions they've performed
4. Track down any issues

### Issue: Need to see company data
1. Go to Companies tab
2. View all company information
3. Or use Database Browser to see raw data

## Access

- URL: `/system-admin/dashboard`
- Login required: System admin credentials

## Security

- All actions are logged in Activity Logs
- Admin actions are auditable
- PIN changes require admin credentials
- Password resets send secure tokens

## Analytics Dashboard ✨ NEW!

Navigate to the **Analytics** tab to get deep insights into your application's usage.

### Key Metrics
- **Total Users** and active users (last 30 days)
- **Companies** and active company count
- **Total Recipes** created across all companies
- **Engagement Score** - A calculated metric showing overall platform health

### Visualizations
- **User Signups (30 days)** - Line chart showing daily user growth
- **Daily Logins (7 days)** - Bar chart of active usage
- **Subscription Tiers** - Pie chart of tier distribution
- **Business Types** - Bar chart of your customer segments

### Feature Usage
See which features users are using most:
- Recipe creation
- Ingredient management
- Production planning
- Team collaboration
- And more...

### Top Companies
See which companies are most active:
- Member count
- Recipe count
- Ingredient count

### Recent Activity
Live feed of what's happening in your platform (last 24 hours):
- What actions users took
- Which features they used
- When they did it

### Use Cases for Analytics

**Understanding User Behavior:**
- See which features get used most
- Identify power users
- Find underutilized features

**Business Decisions:**
- Track subscription tier distribution
- See business type trends
- Monitor engagement trends

**Support Planning:**
- Identify inactive users who might need help
- See which companies might need onboarding
- Track feature adoption rates

## Future Enhancements

Possible additions you might want:
- [ ] Bulk user operations
- [ ] Export user data to CSV
- [ ] Email all users feature
- [ ] User impersonation (login as user)
- [ ] Custom notes on user accounts
- [ ] Manual subscription extensions (days/months)
- [ ] Email templates for customer communication
- [ ] Export analytics data to CSV
- [ ] Custom date range for analytics
- [ ] User cohort analysis
- [ ] Retention metrics
