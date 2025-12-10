# Fix Xcode Errors - Step by Step

## The Errors You're Seeing

The 2 errors and 1 warning are likely because:
1. **PlatoShared package isn't added** - The code uses `import PlatoShared` but Xcode doesn't know where it is
2. **Files might not be in the target** - Xcode needs to know which files to compile

## Step 1: Add the PlatoShared Package

This is the most important step!

1. **In Xcode**, click on **"PlatoiOS"** (the blue project icon) in the left sidebar
2. **Select the "PlatoiOS" target** (under TARGETS, not PROJECT)
3. **Click the "General" tab** (at the top)
4. **Scroll down** to find **"Frameworks, Libraries, and Embedded Content"**
5. **Click the "+" button** (bottom left of that section)
6. **Click "Add Other..."** → **"Add Package Dependency..."**
7. **Click "Add Local..."** (at the bottom)
8. **Navigate to:** `/Users/matt/plato/plato-native/PlatoShared/`
   - You should see `Package.swift` in that folder
9. **Select the `PlatoShared` folder** (or just click "Open")
10. **Click "Add Package"**
11. **In the next screen**, make sure **"PlatoShared"** is checked
12. **Click "Add Package"** again

## Step 2: Verify Files Are in Target

1. **Click on any Swift file** in the left sidebar (like `PlatoiOSApp.swift`)
2. **Look at the right sidebar** (if it's not visible, click the rightmost icon in the top toolbar)
3. **In the "File Inspector"** (first tab), look for **"Target Membership"**
4. **Make sure "PlatoiOS" is checked** ✅
5. **Do this for a few files** to make sure they're all in the target

## Step 3: Clean and Rebuild

After adding the package:

1. **Product → Clean Build Folder** (or press `Shift+Cmd+K`)
2. **Wait for it to finish**
3. **Product → Build** (or press `Cmd+B`)
4. **Check if errors are gone**

## Step 4: Set API URL (If Errors Are Fixed)

Once the build succeeds:

1. **Click "PlatoiOS"** dropdown (next to the play button, top of Xcode)
2. **Click "Edit Scheme..."**
3. **Click "Run"** (left sidebar)
4. **Click "Arguments"** tab
5. **Under "Environment Variables"**, click **"+"**
6. **Add:**
   - **Name:** `PLATO_API_URL`
   - **Value:** `http://localhost:3000`
7. **Click "Close"**

## Common Issues

### "Cannot find 'PlatoShared' in scope"
- The package isn't added yet → Do Step 1

### "No such module 'PlatoShared'"
- The package is added but not linked → Check Step 1, make sure it's added to the target

### Files show errors but they're in the sidebar
- Files might not be in the target → Do Step 2

### Build succeeds but app crashes
- API URL not set → Do Step 4

## After All Steps

You should be able to:
- ✅ Build without errors
- ✅ Run the app in simulator
- ✅ See the login screen

Let me know what errors you see after adding the package!


