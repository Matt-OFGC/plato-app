# Fix: Xcode Wants to Overwrite PlatoiOS Folder

## Quick Solution

When Xcode asks to overwrite, click **"Cancel"**, then do this:

### Step 1: Rename the Existing Folder (Temporarily)

In Terminal, run:
```bash
cd /Users/matt/plato/plato-native
mv PlatoiOS PlatoiOS-source-backup
```

This renames your existing folder so Xcode can create its own.

### Step 2: Create the Xcode Project

1. **Back in Xcode**, click "Create" again
2. Now it will create the `PlatoiOS` folder without conflict
3. Let Xcode create its default files

### Step 3: Move Your Source Files Into the Project

After Xcode creates the project, in Terminal:
```bash
cd /Users/matt/plato/plato-native
# Copy your source files into the Xcode-created folder
cp -r PlatoiOS-source-backup/PlatoiOS/* PlatoiOS/PlatoiOS/
```

### Step 4: Add Files to Xcode Project

1. **In Xcode**, right-click the **"PlatoiOS"** folder (blue project icon)
2. **"Add Files to PlatoiOS..."**
3. Navigate to: `/Users/matt/plato/plato-native/PlatoiOS/PlatoiOS/`
4. Select **ALL** files and folders (`App`, `Views`, etc.)
5. **UNCHECK** "Copy items if needed"
6. **CHECK** "Add to targets: PlatoiOS"
7. Click **"Add"**

### Step 5: Clean Up

Delete the backup (your files are now in the project):
```bash
rm -rf PlatoiOS-source-backup
```

## Alternative: Use a Different Project Name

If you prefer, you can:

1. **In Xcode's "Save As" dialog**, change the project name to `PlatoiOSApp` or `PlatoiOSProject`
2. This will create `PlatoiOSApp.xcodeproj` and `PlatoiOSApp/` folder
3. Then add your existing `PlatoiOS/PlatoiOS/` files to this project

But the first method is cleaner!




