# Teams Section - Complete Structure Map

## 📋 Section Header
**Name:** "Teams" (in sidebar navigation)  
**App Context:** `teams` (used for filtering navigation items)

---

## 🗂️ Page Structure Overview

```
TEAMS SECTION (appContext: "teams")
│
├── 📄 Team Management
│   ├── Route: /dashboard/team
│   ├── Label: "Team"
│   ├── Purpose: Main team management hub
│   └── Contains tabs:
│       ├── Overview (stats, quick actions)
│       ├── Team Profiles (grid of team members)
│       ├── Training (link to training dashboard)
│       └── Cleaning Jobs (link to cleaning page)
│
├── 📄 Individual Team Member Profile
│   ├── Route: /dashboard/team/[id]
│   ├── Purpose: View individual team member details
│   └── Contains tabs:
│       ├── Overview
│       ├── Training (training records)
│       ├── Cleaning Jobs (assigned jobs)
│       ├── Production (production assignments)
│       ├── Timesheets
│       └── Shifts
│
├── 📄 Scheduling
│   ├── Route: /dashboard/scheduling
│   ├── Label: "Scheduling"
│   ├── Purpose: Separate scheduling page (was combined with team)
│   └── Contains tabs:
│       ├── Overview (staff overview stats)
│       ├── Scheduler ⚡ (ModernScheduler - drag & drop)
│       ├── Roster (Classic) (RosterCalendar)
│       ├── Timesheets (TimesheetManagement)
│       └── Leave (LeaveManagement)
│
├── 📄 Training
│   ├── Route: /dashboard/training
│   ├── Label: "Training"
│   ├── Purpose: Training module management
│   └── Features:
│       ├── Training modules list
│       ├── Create/edit training modules
│       ├── Training templates
│       ├── Staff training progress
│       └── Link to recipes
│
└── 📄 Cleaning Jobs
    ├── Route: /dashboard/team/cleaning
    ├── Purpose: Cleaning job management
    └── Features:
        ├── List all cleaning jobs
        ├── Filter by status
        ├── Assign to team members
        └── Mark jobs as complete
```

---

## 📍 Navigation Menu Items (Sidebar)

When "Teams" app is active, these items appear:

1. **Team** (`/dashboard/team`)
   - Icon: Team/users icon
   - Short label: "Team"
   - appContext: `teams`

2. **Scheduling** (`/dashboard/scheduling`)
   - Icon: Clock/calendar icon
   - Short label: "Schedule"
   - appContext: `teams`

3. **Training** (`/dashboard/training`)
   - Icon: Book/education icon
   - Short label: "Training"
   - appContext: `teams`

---

## 🔗 Page Relationships

### Main Entry Points:
- **Team** → Overview of all team management features
- **Scheduling** → Dedicated scheduling page
- **Training** → Training module dashboard

### Sub-pages (no direct nav items):
- `/dashboard/team/[id]` → Accessed by clicking team member card
- `/dashboard/team/cleaning` → Accessed from Team page or profile

### Settings Integration:
- `/dashboard/settings/roles` → Role & permissions management (appContext: `global`)

---

## ✅ Current File Structure

```
dashboard/
├── team/
│   ├── page.tsx                    ✅ Main team management page
│   ├── components/
│   │   └── TeamManagementClient.tsx ✅ Team UI with tabs
│   ├── [id]/
│   │   └── page.tsx                 ✅ Individual team member profile
│   └── cleaning/
│       └── page.tsx                  ✅ Cleaning jobs page
│
├── scheduling/
│   ├── page.tsx                     ✅ Scheduling page
│   └── components/
│       └── SchedulingClient.tsx     ✅ Scheduling UI with tabs
│
├── training/
│   ├── page.tsx                     ✅ Training dashboard
│   └── components/
│       └── TrainingDashboardClient.tsx ✅ Training UI
│
└── settings/
    └── roles/
        ├── page.tsx                 ✅ Role management
        └── components/
            ├── RoleManager.tsx      ✅ Role CRUD UI
            └── PermissionCheckboxes.tsx ✅ Permission checkboxes
```

---

## 🚫 Legacy Pages (Can Be Removed)

These pages exist but should redirect to new structure:

- `/dashboard/staff/page.tsx` → Should redirect to `/dashboard/team`
- `/dashboard/staff/[id]/page.tsx` → Should redirect to `/dashboard/team/[id]`
- `/dashboard/staff/cleaning/page.tsx` → Should redirect to `/dashboard/team/cleaning`

---

## 📝 Feature Breakdown by Page

### 1. Team Management (`/dashboard/team`)
**Purpose:** Central hub for team-related activities

**Tabs:**
- **Overview:** 
  - Team member count
  - Quick links to Scheduling & Training
  - Team activity feed
  
- **Team Profiles:**
  - Grid of team member cards
  - Click to view individual profile
  - Shows role badges
  
- **Training:**
  - Link to training dashboard
  - Overview of training status
  
- **Cleaning Jobs:**
  - Link to cleaning jobs page
  - Quick stats

### 2. Individual Team Member (`/dashboard/team/[id]`)
**Purpose:** Detailed view of one team member

**Tabs:**
- **Overview:** Basic info, contact details
- **Training:** List of training records, completion status
- **Cleaning Jobs:** Assigned cleaning jobs, completion history
- **Production:** Production assignments, job history
- **Timesheets:** Timesheet entries, hours worked
- **Shifts:** Shift history, upcoming shifts

### 3. Scheduling (`/dashboard/scheduling`)
**Purpose:** Separate dedicated scheduling page

**Tabs:**
- **Overview:** Staff overview, quick stats
- **Scheduler:** Modern drag-and-drop scheduler
- **Roster (Classic):** Calendar view roster
- **Timesheets:** Timesheet management
- **Leave:** Leave requests and management

### 4. Training (`/dashboard/training`)
**Purpose:** Training module management

**Features:**
- List of training modules
- Create new training modules
- Training templates (barista, kitchen basics, etc.)
- Staff training progress tracking
- Link training to recipes
- Manager sign-off interface

### 5. Cleaning Jobs (`/dashboard/team/cleaning`)
**Purpose:** Cleaning job assignment and tracking

**Features:**
- List all cleaning jobs
- Filter by status (pending, completed, overdue)
- Assign jobs to team members
- Mark jobs as complete
- Link to production plans
- Track completion history

---

## 🎯 Navigation Flow

```
User clicks "Teams" in sidebar
    ↓
Shows 3 main menu items:
    ├── Team (/dashboard/team)
    ├── Scheduling (/dashboard/scheduling)
    └── Training (/dashboard/training)

From Team page:
    ├── Click team member → /dashboard/team/[id]
    └── Click "Cleaning Jobs" → /dashboard/team/cleaning

From Scheduling page:
    └── Uses existing scheduling components
```

---

## ✅ Naming Consistency Check

**Section Name:** ✅ "Teams" (consistent)
- Navigation header: "Teams"
- App context: `teams`
- No conflicts found

**Page Names:**
- ✅ "Team" - main management page
- ✅ "Scheduling" - scheduling page
- ✅ "Training" - training page
- ✅ "Cleaning Jobs" - sub-page under team

**Routes:**
- ✅ `/dashboard/team` - main team page
- ✅ `/dashboard/team/[id]` - individual profiles
- ✅ `/dashboard/team/cleaning` - cleaning jobs
- ✅ `/dashboard/scheduling` - scheduling
- ✅ `/dashboard/training` - training

**No naming conflicts detected!** ✅

---

## 📋 Summary

The Teams section is cleanly organized with:
- ✅ Clear section name ("Teams")
- ✅ 3 main navigation items (Team, Scheduling, Training)
- ✅ Logical sub-pages (team profiles, cleaning jobs)
- ✅ No naming conflicts
- ✅ All features covered in dedicated pages

Ready for migration! 🚀

