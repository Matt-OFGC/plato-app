# Verify Xcode Setup is Correct

## What You Should See in Xcode's Left Sidebar

Your project structure should look like this:

```
PlatoiOS (blue project icon)
├── PlatoiOS (folder)
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
│   ├── ContentView.swift
│   ├── PlatoiOSApp.swift
│   └── Assets.xcassets
├── PlatoiOSTests
└── PlatoiOSUITests
```

## Check if Files Are Actually Added

1. **Click on `PlatoiOSApp.swift`** in the sidebar
   - Does it open and show code?
   - Does it have `@main struct PlatoiOSApp`?

2. **Click on `App/PlatoApp.swift`**
   - Does it open?
   - Does it have `struct PlatoApp`?

3. **Click on `Views/Auth/LoginView.swift`**
   - Does it open?
   - Does it show the login form code?

## If Files Are Missing or Show Errors

If you see red errors in Xcode (like "Cannot find 'PlatoShared' in scope"), that's normal - we need to add the shared package next!

## Next Step: Add the Shared Package

Since the files are already in Xcode, the next step is to add the `PlatoShared` package so the code can use it.

1. Click on **"PlatoiOS"** (blue project icon) in the left sidebar
2. Select the **"PlatoiOS"** target (under TARGETS)
3. Click the **"General"** tab
4. Scroll down to **"Frameworks, Libraries, and Embedded Content"**
5. Click the **"+"** button
6. Click **"Add Other..."** → **"Add Package Dependency..."**
7. Click **"Add Local..."**
8. Navigate to: `/Users/matt/plato/plato-native/PlatoShared/`
9. Select the `PlatoShared` folder
10. Click **"Add Package"**
11. Make sure `PlatoShared` is checked
12. Click **"Add Package"**

## After Adding the Package

The red errors should disappear! Then we'll set the API URL and you can run the app.




