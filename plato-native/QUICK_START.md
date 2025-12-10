# Quick Start Guide - The Simplest Path

If the detailed walkthrough feels overwhelming, here's the absolute simplest way to get started:

## The 3-Step Process

### Step 1: Open Xcode and Create iOS Project

1. Open **Xcode**
2. **File → New → Project**
3. Choose **iOS → App → Next**
4. Fill in:
   - Name: `PlatoiOS`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Click **Next**
5. Save in: `/Users/matt/plato/plato-native/PlatoiOS/`
6. Click **Create**

### Step 2: Add the Shared Package

1. Click **"PlatoiOS"** (blue icon, top of left sidebar)
2. Click **"General"** tab
3. Scroll to **"Frameworks, Libraries, and Embedded Content"**
4. Click **"+"** button
5. Click **"Add Other..."** → **"Add Package Dependency..."**
6. Click **"Add Local..."**
7. Go to: `/Users/matt/plato/plato-native/PlatoShared/`
8. Click **"Add Package"** → **"Add Package"**

### Step 3: Add Your Code Files

1. Right-click **"PlatoiOS"** folder (in left sidebar)
2. Click **"Add Files to PlatoiOS..."**
3. Go to: `/Users/matt/plato/plato-native/PlatoiOS/PlatoiOS/`
4. Select **ALL** files and folders
5. **UNCHECK** "Copy items if needed"
6. **CHECK** "Add to targets: PlatoiOS"
7. Click **"Add"**

### Step 4: Set API URL

1. Click **"PlatoiOS"** dropdown (next to play button, top of Xcode)
2. Click **"Edit Scheme..."**
3. Click **"Run"** (left sidebar)
4. Click **"Arguments"** tab
5. Under "Environment Variables", click **"+"**
6. Add:
   - Name: `PLATO_API_URL`
   - Value: `http://localhost:3000`
7. Click **"Close"**

### Step 5: Run It!

1. Make sure your backend is running: `cd /Users/matt/plato && npm run dev`
2. In Xcode, select an iPhone simulator (top bar)
3. Click the **Play button** (▶️) or press **Cmd+R**
4. Wait for it to build and launch
5. You should see the login screen!

---

## That's It!

If you see the login screen, you're done! 🎉

The app is now connected to your backend and ready to use.

For the macOS app, repeat the same steps but:
- Choose **macOS → App** instead of iOS
- Save in `PlatoMac/` folder
- Add files from `PlatoMac/PlatoMac/`

---

## Visual Guide

Here's what you're looking for in Xcode:

```
Xcode Window:
┌─────────────────────────────────────────┐
│ [▶️ Play] [PlatoiOS ▼] [iPhone 15 Pro] │  ← Top toolbar
├─────────────────────────────────────────┤
│                                         │
│  Left Sidebar:                          │
│  📁 PlatoiOS (blue icon) ← Click this   │
│     📁 PlatoiOS                         │
│        📁 App                            │
│        📁 Views                          │
│                                         │
│  Main Area:                              │
│  [General] [Signing] [Build Settings]   │
│                                         │
│  Scroll down to find:                   │
│  "Frameworks, Libraries..."             │
│  [+ button] ← Click this                │
│                                         │
└─────────────────────────────────────────┘
```

---

## Common Mistakes to Avoid

❌ **Don't** create the project in the wrong folder
✅ **Do** create it inside `/Users/matt/plato/plato-native/PlatoiOS/`

❌ **Don't** check "Copy items if needed" when adding files
✅ **Do** uncheck it (files are already there)

❌ **Don't** forget to add the shared package
✅ **Do** add it before adding source files

❌ **Don't** forget to set the API URL
✅ **Do** set it in Edit Scheme → Run → Arguments

---

## Still Stuck?

1. **Take a screenshot** of the error
2. **Check Xcode's console** (bottom panel) for error messages
3. **Make sure backend is running**: `npm run dev` in terminal
4. **Try cleaning**: Product → Clean Build Folder (Shift+Cmd+K)

The most important thing: **Don't rush!** Take it one step at a time. Each step is simple, but skipping steps causes problems.


