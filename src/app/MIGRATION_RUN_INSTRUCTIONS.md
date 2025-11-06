# Migration Run Instructions

## ✅ Pages Reorganized

### New Structure:
- **Team** (`/dashboard/team`) - Team management, profiles, training overview, cleaning jobs
- **Scheduling** (`/dashboard/scheduling`) - Separate page for scheduling with tabs:
  - Overview
  - Scheduler (ModernScheduler component)
  - Roster (Classic)
  - Timesheets
  - Leave
- **Training** (`/dashboard/training`) - Training module management

### Navigation Updated:
- "Staff" renamed to "Team" 
- "Staff & Scheduling" split into separate "Team" and "Scheduling" menu items
- All links updated to use `/dashboard/team` instead of `/dashboard/staff`

## 🚀 Run Migration

### Option 1: Using the Bash Script (Recommended if psql is available)
```bash
cd /Users/matt/plato/src/app
./scripts/run-staff-training-migration-direct.sh
```

### Option 2: Using the TypeScript Script
```bash
cd /Users/matt/plato/src/app
# Make sure DATABASE_URL is set in your environment
export DATABASE_URL="your-database-url"
npx tsx scripts/run-staff-training-migration.ts
```

### Option 3: Direct psql Command
```bash
cd /Users/matt/plato/src/app
psql $DATABASE_URL -f migrations/20250116000000_staff_training_system.sql
```

### Option 4: Using Prisma Migrate (if schema is updated)
```bash
cd /Users/matt/plato/src/app
npx prisma migrate dev --name staff_training_system
```

## 📝 After Migration

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Verify Tables:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'Role', 
     'RolePermission', 
     'StaffProfile', 
     'TrainingModule', 
     'TrainingContent', 
     'TrainingRecord', 
     'TrainingModuleRecipe',
     'CleaningJob', 
     'ProductionJobAssignment'
   );
   ```

3. **Initialize Default Roles (Optional):**
   - Go to `/dashboard/settings/roles`
   - Create default roles manually, or
   - Create a script to initialize for all companies

## 📍 New Page Structure

### Team Management (`/dashboard/team`)
- Overview - Team stats and quick actions
- Team Profiles - Grid of team members (links to individual profiles)
- Training - Link to training dashboard
- Cleaning Jobs - Link to cleaning jobs page

### Individual Team Member (`/dashboard/team/[id]`)
- Overview tab
- Training tab - Shows training records
- Cleaning Jobs tab - Shows assigned cleaning jobs
- Production tab - Shows production assignments
- Timesheets tab - Shows timesheet history

### Scheduling (`/dashboard/scheduling`)
- Overview - Staff overview stats
- Scheduler - ModernScheduler component (drag-and-drop)
- Roster (Classic) - RosterCalendar component
- Timesheets - TimesheetManagement component
- Leave - LeaveManagement component

### Training (`/dashboard/training`)
- Training module dashboard
- Create/edit training modules
- View training progress

### Cleaning Jobs (`/dashboard/team/cleaning`)
- List all cleaning jobs
- Filter by status
- Assign and complete jobs

## ✅ All Links Updated

All internal links have been updated:
- `/dashboard/staff` → `/dashboard/team`
- `/dashboard/staff/[id]` → `/dashboard/team/[id]`
- `/dashboard/staff/cleaning` → `/dashboard/team/cleaning`
- New: `/dashboard/scheduling` (separate scheduling page)

The old `/dashboard/staff` page still exists for backward compatibility but redirects to `/dashboard/team`.

