# Teams Section - Visual Structure

## 🎯 Header Section Name
**"Teams"** (shown in sidebar navigation)

---

## 📊 Visual Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    TEAMS SECTION                             │
│                  (appContext: "teams")                       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌─────────┐    ┌──────────┐    ┌──────────┐
        │  Team   │    │Schedule  │    │ Training │
        │ /team   │    │/schedule │    │/training │
        └─────────┘    └──────────┘    └──────────┘
              │               │               │
              │               │               │
              ▼               │               │
      ┌───────────────┐      │               │
      │ Team Profiles │      │               │
      │  /team/[id]   │      │               │
      └───────────────┘      │               │
              │               │               │
              ▼               │               │
      ┌───────────────┐      │               │
      │ Cleaning Jobs │      │               │
      │/team/cleaning │      │               │
      └───────────────┘      │               │
                             │               │
                             ▼               ▼
                    ┌─────────────────┐  ┌──────────┐
                    │ Scheduling Tabs │  │ Training │
                    │                 │  │ Modules  │
                    │ • Overview      │  │          │
                    │ • Scheduler ⚡   │  │          │
                    │ • Roster        │  │          │
                    │ • Timesheets    │  │          │
                    │ • Leave         │  │          │
                    └─────────────────┘  └──────────┘
```

---

## 📋 Complete Page List

### Main Navigation Items (3 pages)

1. **Team** → `/dashboard/team`
   - Main team management hub
   - Tabs: Overview, Profiles, Training, Cleaning

2. **Scheduling** → `/dashboard/scheduling`
   - Dedicated scheduling page
   - Tabs: Overview, Scheduler, Roster, Timesheets, Leave

3. **Training** → `/dashboard/training`
   - Training module dashboard
   - Create/edit modules, templates, progress tracking

### Sub-Pages (accessed from main pages)

4. **Team Member Profile** → `/dashboard/team/[id]`
   - Individual team member details
   - Accessed by clicking team member card

5. **Cleaning Jobs** → `/dashboard/team/cleaning`
   - Cleaning job management
   - Accessed from Team page or direct link

---

## 🗂️ What Each Page Contains

### 1️⃣ Team (`/dashboard/team`)
```
┌─────────────────────────────────────┐
│  Team Management                    │
├─────────────────────────────────────┤
│  [Overview] [Profiles] [Training]   │
│          [Cleaning]                 │
├─────────────────────────────────────┤
│  Overview Tab:                      │
│  • Team member count                │
│  • Quick links                      │
│  • Activity feed                    │
│                                     │
│  Profiles Tab:                      │
│  • Grid of team member cards        │
│  • Click → individual profile       │
│                                     │
│  Training Tab:                      │
│  • Link to training dashboard       │
│                                     │
│  Cleaning Tab:                      │
│  • Link to cleaning jobs            │
└─────────────────────────────────────┘
```

### 2️⃣ Scheduling (`/dashboard/scheduling`)
```
┌─────────────────────────────────────┐
│  Scheduling                         │
├─────────────────────────────────────┤
│  [Overview] [Scheduler] [Roster]    │
│      [Timesheets] [Leave]           │
├─────────────────────────────────────┤
│  Overview Tab:                      │
│  • Staff overview stats             │
│                                     │
│  Scheduler Tab:                     │
│  • Modern drag-and-drop scheduler   │
│                                     │
│  Roster Tab:                        │
│  • Classic calendar view            │
│                                     │
│  Timesheets Tab:                    │
│  • Timesheet management             │
│                                     │
│  Leave Tab:                         │
│  • Leave requests                   │
└─────────────────────────────────────┘
```

### 3️⃣ Training (`/dashboard/training`)
```
┌─────────────────────────────────────┐
│  Training Dashboard                 │
├─────────────────────────────────────┤
│  • List of training modules         │
│  • Create new modules               │
│  • Training templates               │
│  • Staff progress tracking          │
│  • Link to recipes                  │
│  • Manager sign-off                 │
└─────────────────────────────────────┘
```

### 4️⃣ Team Member Profile (`/dashboard/team/[id]`)
```
┌─────────────────────────────────────┐
│  [Name] - Team Member Profile       │
├─────────────────────────────────────┤
│  [Overview] [Training] [Cleaning]  │
│  [Production] [Timesheets] [Shifts] │
├─────────────────────────────────────┤
│  Overview: Basic info, contact      │
│  Training: Training records        │
│  Cleaning: Assigned jobs           │
│  Production: Assignments           │
│  Timesheets: Hours worked          │
│  Shifts: Shift history             │
└─────────────────────────────────────┘
```

### 5️⃣ Cleaning Jobs (`/dashboard/team/cleaning`)
```
┌─────────────────────────────────────┐
│  Cleaning Jobs                      │
├─────────────────────────────────────┤
│  • List all cleaning jobs           │
│  • Filter by status                 │
│  • Assign to team members           │
│  • Mark as complete                 │
│  • Link to production plans         │
└─────────────────────────────────────┘
```

---

## ✅ Naming Check

| Item | Name | Status |
|------|------|--------|
| Section Header | "Teams" | ✅ |
| App Context | `teams` | ✅ |
| Main Page 1 | "Team" | ✅ |
| Main Page 2 | "Scheduling" | ✅ |
| Main Page 3 | "Training" | ✅ |
| Sub-page 1 | "Team Member Profile" | ✅ |
| Sub-page 2 | "Cleaning Jobs" | ✅ |

**No conflicts!** ✅

---

## 🎯 User Flow

```
User opens sidebar
    ↓
Clicks "Teams" section
    ↓
Sees 3 main pages:
    ├─ Team
    ├─ Scheduling  
    └─ Training
    ↓
Clicks "Team"
    ↓
Sees tabs: Overview, Profiles, Training, Cleaning
    ↓
Clicks on team member card
    ↓
Goes to individual profile page
    ↓
Sees all tabs: Overview, Training, Cleaning, Production, Timesheets, Shifts
```

---

## 📍 Route Summary

```
/dashboard/team              → Main team management
/dashboard/team/[id]         → Individual team member
/dashboard/team/cleaning      → Cleaning jobs
/dashboard/scheduling        → Scheduling page
/dashboard/training          → Training dashboard
```

All organized under **"Teams"** section! ✅

