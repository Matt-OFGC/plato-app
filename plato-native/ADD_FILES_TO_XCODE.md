# Adding Files to Xcode - Step by Step

## The Issue

Xcode might already have `ContentView.swift` and `PlatoiOSApp.swift` in the project (they were created by default). That's why they're not selectable - they're already added!

## Solution: Just Add the Folders

Since the root files are already in Xcode, you only need to add the **folders**:

### What to Select in the File Picker:

1. **Select `App` folder** (click on it)
2. **Select `Views` folder** (click on it)
3. **Don't worry about** `ContentView.swift` or `PlatoiOSApp.swift` - they're already there!

### Steps:

1. In the file picker, navigate to: `/Users/matt/plato/plato-native/PlatoiOS/PlatoiOS/`
2. **Click on `App` folder** (select it)
3. **Hold Cmd key and click on `Views` folder** (to select both)
4. Make sure:
   - ✅ **"Copy items if needed"** is **UNCHECKED**
   - ✅ **"Create groups"** is **CHECKED**
   - ✅ **"Add to targets: PlatoiOS"** is **CHECKED**
5. Click **"Add"**

## After Adding

You should see in Xcode's left sidebar:
- `PlatoiOSApp.swift` (already there)
- `ContentView.swift` (already there)
- `App` folder → `PlatoApp.swift` (newly added)
- `Views` folder → `Auth`, `Dashboard`, `Recipes` (newly added)

## If Root Files Are Missing

If `ContentView.swift` or `PlatoiOSApp.swift` don't appear in Xcode after adding folders:

1. Right-click the `PlatoiOS` folder in Xcode
2. "Add Files to PlatoiOS..."
3. Navigate to `/Users/matt/plato/plato-native/PlatoiOS/PlatoiOS/`
4. Select just `ContentView.swift` and `PlatoiOSApp.swift`
5. **UNCHECK** "Copy items if needed"
6. **CHECK** "Add to targets: PlatoiOS"
7. Click "Add"

## Verify Everything is There

After adding, check Xcode's left sidebar. You should see:
```
PlatoiOS (blue project icon)
├── PlatoiOS (folder)
│   ├── PlatoiOSApp.swift
│   ├── ContentView.swift
│   ├── App
│   │   └── PlatoApp.swift
│   ├── Views
│   │   ├── Auth
│   │   │   ├── LoginView.swift
│   │   │   └── PinLoginView.swift
│   │   ├── Dashboard
│   │   │   └── DashboardView.swift
│   │   └── Recipes
│   │       └── RecipeListView.swift
│   └── Assets.xcassets
├── PlatoiOSTests
└── PlatoiOSUITests
```

If you see this structure, you're good to go! ✅


