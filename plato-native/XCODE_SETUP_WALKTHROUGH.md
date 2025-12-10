# Xcode Setup Walkthrough - Step by Step

## What is Xcode and Why Do We Need It?

**Xcode** is Apple's free app for building iOS, iPad, and Mac apps. Think of it like:
- **Visual Studio Code** for web development
- **Xcode** for Apple app development

We need Xcode to:
1. Create the project files that organize our code
2. Build the apps (turn Swift code into runnable apps)
3. Test the apps on simulators or real devices
4. Prepare apps for the App Store

## Prerequisites

Before we start, make sure you have:
- ✅ A Mac (Xcode only works on Mac)
- ✅ Xcode installed (free from the App Store)
- ✅ Your Next.js backend running (we'll test this)

### Step 1: Install Xcode (if you haven't already)

1. Open the **App Store** on your Mac
2. Search for **"Xcode"**
3. Click **"Get"** or **"Install"** (it's free, but large - about 12GB)
4. Wait for it to download and install
5. Open Xcode from Applications

**First time opening Xcode?**
- It will ask you to install "Command Line Tools" - click **"Install"**
- It will ask you to accept a license - click **"Agree"**
- This might take a few minutes

---

## Part 1: Creating the iOS App Project

### Step 2: Open Xcode and Create New Project

1. **Open Xcode** (you should see a welcome screen)

2. **Click "Create a new Xcode project"** (or File → New → Project)

3. **Choose a template:**
   - At the top, make sure **"iOS"** is selected (not macOS)
   - Click on **"App"** (the icon with a phone)
   - Click **"Next"**

### Step 3: Configure the iOS Project

You'll see a form. Fill it out like this:

**Product Name:** `PlatoiOS`
- This is the name of your app

**Team:** 
- If you see a dropdown, select your Apple ID/team
- If you don't have one, select "None" for now (you can add it later)

**Organization Identifier:** `com.yourcompany`
- Replace "yourcompany" with your name or company
- Example: `com.matt` or `com.plato` or `com.yourname`
- This creates a unique ID like: `com.matt.PlatoiOS`

**Interface:** Select **"SwiftUI"**
- This is the UI framework we're using

**Language:** Select **"Swift"**
- This is the programming language

**Storage:** Select **"None"**
- We'll add Core Data later if needed

**Include Tests:** ✅ Check this box
- This creates test files (good practice)

Click **"Next"**

### Step 4: Save the iOS Project

**⚠️ IMPORTANT:** There's already a `PlatoiOS` folder with source files. Here's what to do:

**If Xcode asks "Do you want to overwrite?" → Click "Cancel"**

Then:

1. **Navigate UP one level** to `/Users/matt/plato/plato-native/`
   - Click the folder icon next to "Save As"
   - Navigate to: `plato` → `plato-native`
   - **Don't go inside the `PlatoiOS` folder!** Stay at the `plato-native` level
   - You should see `PlatoiOS` folder listed (but don't enter it)

2. **Save the project at this level:**
   - The project name should be `PlatoiOS`
   - Xcode will create `PlatoiOS.xcodeproj` in `/Users/matt/plato/plato-native/`
   - This is fine! The project file can be separate from the source folder

3. **Important:** Make sure "Create Git repository" is **UNCHECKED** (unless you want a new git repo)

4. Click **"Create"**

**What happens:**
- Xcode creates `PlatoiOS.xcodeproj` at `/Users/matt/plato/plato-native/PlatoiOS.xcodeproj`
- Your source files are already at `/Users/matt/plato/plato-native/PlatoiOS/PlatoiOS/`
- In the next step, we'll add those existing files to the project

**What just happened?**
- Xcode created a project file: `PlatoiOS.xcodeproj`
- It created some default files we'll replace

---

## Part 2: Setting Up the iOS Project

### Step 5: Add the Shared Package (This is Important!)

The shared package contains all the code that talks to your backend API.

1. **In Xcode, look at the left sidebar** (Project Navigator)
   - You should see "PlatoiOS" at the top

2. **Click on "PlatoiOS"** (the blue project icon at the very top)

3. **In the main area, you'll see tabs:**
   - General, Signing & Capabilities, Build Settings, etc.
   - Make sure **"General"** is selected

4. **Scroll down to "Frameworks, Libraries, and Embedded Content"**
   - You'll see a list (probably empty)

5. **Click the "+" button** below that section

6. **In the popup window:**
   - At the top, click **"Add Other..."**
   - Then click **"Add Package Dependency..."**

7. **In the new window:**
   - At the bottom, click **"Add Local..."**
   - Navigate to: `/Users/matt/plato/plato-native/PlatoShared/`
   - Select the `PlatoShared` folder
   - Click **"Add Package"**

8. **In the next window:**
   - Make sure `PlatoShared` is checked
   - Click **"Add Package"**

**What just happened?**
- Your iOS app can now use all the code in the shared package
- This includes the API client, models, and services

### Step 6: Add Your Source Files

The Swift files are already created, we just need to add them to the Xcode project.

1. **In Xcode's left sidebar**, right-click on **"PlatoiOS"** (the folder, not the project)

2. **Select "Add Files to PlatoiOS..."**

3. **Navigate to:** `/Users/matt/plato/plato-native/PlatoiOS/PlatoiOS/`
   - You should see folders: `App`, `Views`, etc.

4. **Select ALL the folders and files:**
   - Click on `App` folder
   - Hold Shift and click on the last item to select all
   - Or Cmd+A to select all

5. **IMPORTANT - Check these options:**
   - ✅ **"Copy items if needed"** - **UNCHECK THIS** (files are already in place)
   - ✅ **"Create groups"** - Check this
   - ✅ **"Add to targets: PlatoiOS"** - Check this

6. Click **"Add"**

**What just happened?**
- Xcode now knows about all your Swift files
- They're organized in the project navigator

### Step 7: Delete Default Files (if they exist)

Xcode might have created some default files we don't need:

1. **Look in the left sidebar** for:
   - `ContentView.swift` (if it's in the root, not in Views/)
   - `PlatoiOSApp.swift` (if it exists)

2. **If you see duplicates:**
   - Right-click on the default one
   - Select "Delete"
   - Choose "Move to Trash" (not "Remove Reference")

### Step 8: Configure the API URL

We need to tell the app where your backend is running.

1. **At the top of Xcode**, next to the play/stop buttons, you'll see:
   - "PlatoiOS" and a device name (like "iPhone 15 Pro")

2. **Click on "PlatoiOS"** (the scheme selector)

3. **Select "Edit Scheme..."**

4. **In the left sidebar**, click **"Run"**

5. **Click the "Arguments" tab** at the top

6. **Under "Environment Variables"**, click the **"+"** button

7. **Add:**
   - **Name:** `PLATO_API_URL`
   - **Value:** `http://localhost:3000`
   - Click **"Close"**

**What just happened?**
- The app now knows to connect to your local backend
- When you deploy, change this to your production URL

---

## Part 3: Testing the iOS App

### Step 9: Start Your Backend

Before running the app, make sure your Next.js backend is running:

1. **Open Terminal**

2. **Navigate to your project:**
   ```bash
   cd /Users/matt/plato
   ```

3. **Start the backend:**
   ```bash
   npm run dev
   ```

4. **Wait until you see:** "Ready on http://localhost:3000"

5. **Keep this terminal window open** (the backend needs to keep running)

### Step 10: Run the iOS App

1. **Back in Xcode**, at the top, you'll see a device selector
   - It might say "iPhone 15 Pro" or similar

2. **Click on it** and select any iPhone simulator
   - Examples: "iPhone 15", "iPhone 14", etc.
   - Any will work for testing

3. **Click the Play button** (▶️) or press **Cmd+R**

4. **Wait for the app to build and launch**
   - First build might take 1-2 minutes
   - You'll see progress at the top

5. **The simulator will open** and show your app!

**What to expect:**
- You should see a login screen
- Try logging in with your existing account
- If it works, you'll see the dashboard!

---

## Part 4: Creating the macOS App Project

The macOS app setup is very similar to iOS, but let's do it step by step.

### Step 11: Create macOS Project

1. **In Xcode**, go to **File → New → Project**

2. **Choose a template:**
   - At the top, select **"macOS"** (not iOS)
   - Click on **"App"**
   - Click **"Next"**

### Step 12: Configure macOS Project

Fill out the form:

**Product Name:** `PlatoMac`

**Team:** Same as before (or None)

**Organization Identifier:** Same as before (e.g., `com.matt`)

**Interface:** **"SwiftUI"**

**Language:** **"Swift"**

**Storage:** **"None"**

**Include Tests:** ✅ Checked

Click **"Next"**

### Step 13: Save macOS Project

1. **Navigate to:** `/Users/matt/plato/plato-native/PlatoMac/`

2. **Make sure you're INSIDE the `PlatoMac` folder**

3. Click **"Create"**

### Step 14: Add Shared Package to macOS App

**Same as Step 5, but for the macOS project:**

1. Click on **"PlatoMac"** (blue project icon)

2. Go to **"General"** tab

3. Scroll to **"Frameworks, Libraries, and Embedded Content"**

4. Click **"+"** → **"Add Other..."** → **"Add Package Dependency..."**

5. Click **"Add Local..."**

6. Navigate to `/Users/matt/plato/plato-native/PlatoShared/`

7. Click **"Add Package"** → **"Add Package"**

### Step 15: Add Source Files to macOS App

**Same as Step 6, but for macOS:**

1. Right-click **"PlatoMac"** folder in sidebar

2. **"Add Files to PlatoMac..."**

3. Navigate to `/Users/matt/plato/plato-native/PlatoMac/PlatoMac/`

4. Select all files and folders

5. **UNCHECK** "Copy items if needed"
6. **CHECK** "Create groups"
7. **CHECK** "Add to targets: PlatoMac"

8. Click **"Add"**

### Step 16: Configure API URL for macOS

**Same as Step 8:**

1. Click **"PlatoMac"** scheme selector

2. **"Edit Scheme..."**

3. **"Run"** → **"Arguments"** tab

4. Add environment variable:
   - **Name:** `PLATO_API_URL`
   - **Value:** `http://localhost:3000`

### Step 17: Run macOS App

1. **Make sure your backend is still running** (from Step 9)

2. **In Xcode**, select **"My Mac"** as the run destination

3. **Click Play** (▶️) or press **Cmd+R**

4. **The macOS app will launch!**

---

## Troubleshooting

### "Cannot find 'PlatoShared' in scope"
- Make sure you added the shared package (Step 5 or 14)
- Try cleaning: Product → Clean Build Folder (Shift+Cmd+K)
- Try building again

### "API Error: Invalid URL"
- Check that `PLATO_API_URL` is set in scheme settings
- Make sure your backend is running on port 3000

### "HTTP 401: Unauthorized"
- This is normal if you're not logged in
- Try logging in with valid credentials

### Build Errors
- Make sure all source files are added to the target
- Check that Swift files are in the right folders
- Try Product → Clean Build Folder, then rebuild

### Simulator Won't Open
- Go to Xcode → Settings → Platforms
- Download iOS Simulator if needed
- Or select a different simulator

---

## Quick Reference Checklist

**iOS App:**
- [ ] Created iOS project in `PlatoiOS/`
- [ ] Added `PlatoShared` package
- [ ] Added source files from `PlatoiOS/PlatoiOS/`
- [ ] Set `PLATO_API_URL` environment variable
- [ ] Backend is running
- [ ] App runs in simulator

**macOS App:**
- [ ] Created macOS project in `PlatoMac/`
- [ ] Added `PlatoShared` package
- [ ] Added source files from `PlatoMac/PlatoMac/`
- [ ] Set `PLATO_API_URL` environment variable
- [ ] Backend is running
- [ ] App runs on Mac

---

## Next Steps After Setup

Once both apps are running:

1. **Test login** - Try logging in with your account
2. **Browse recipes** - See if recipes load
3. **Check console** - Look for any errors in Xcode's console (bottom panel)
4. **Customize** - Start adding features and customizing the UI

---

## Need Help?

If you get stuck at any step:
1. Check the error message in Xcode (red text)
2. Look at the console output (bottom panel in Xcode)
3. Make sure your backend is running and accessible
4. Verify all files are in the right places

The most common issues are:
- Forgetting to add the shared package
- Not setting the API URL environment variable
- Backend not running
- Files not added to the project

Take it one step at a time, and you'll get there! 🚀

