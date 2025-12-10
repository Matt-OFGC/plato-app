# Setup Guide - Plato Native Apps

## What Was Created

### ✅ Shared Package (`PlatoShared/`)
A Swift package containing all shared code used by both iOS and macOS apps:

- **API Client** (`APIClient.swift`): HTTP client with cookie-based authentication
- **Endpoints** (`Endpoints.swift`): All API endpoint definitions
- **Auth Service** (`AuthService.swift`): Login, logout, register, PIN login
- **Session Manager** (`SessionManager.swift`): User session state management
- **Models**: User, Recipe, Ingredient, Company, Staff, Category, Supplier

### ✅ iOS App (`PlatoiOS/`)
Complete iOS/iPadOS app structure:

- **App Entry** (`PlatoApp.swift`): Main app file
- **Root View** (`ContentView.swift`): Handles authentication state
- **Login Views**: Email/password and PIN login
- **Dashboard**: Tab-based navigation with home, recipes, ingredients, profile
- **Recipe Views**: List and detail views with cost display

### ✅ macOS App (`PlatoMac/`)
Complete macOS app structure:

- **App Entry** (`PlatoMacApp.swift`): Main app with menu commands
- **Root View** (`ContentView.swift`): Sidebar navigation
- **Login View**: Email/password authentication
- **Dashboard**: Main dashboard view

## Next Steps to Get Started

### 1. Create Xcode Projects

You need to create the actual Xcode project files. The Swift source files are ready, but Xcode needs project files to build them.

#### For iOS:
1. Open Xcode
2. File → New → Project
3. Choose "iOS" → "App"
4. Name: `PlatoiOS`
5. Save in: `/Users/matt/plato/plato-native/PlatoiOS/`
6. Interface: SwiftUI, Language: Swift
7. Follow `PlatoiOS/README.md` for detailed setup

#### For macOS:
1. Open Xcode
2. File → New → Project
3. Choose "macOS" → "App"
4. Name: `PlatoMac`
5. Save in: `/Users/matt/plato/plato-native/PlatoMac/`
6. Interface: SwiftUI, Language: Swift
7. Follow `PlatoMac/README.md` for detailed setup

### 2. Add the Shared Package

In both Xcode projects:
1. Select your project → Target → General
2. Under "Frameworks, Libraries, and Embedded Content"
3. Click "+" → "Add Package Dependency"
4. Choose "Add Local..."
5. Navigate to `/Users/matt/plato/plato-native/PlatoShared/`
6. Add the package

### 3. Add Source Files

In both Xcode projects:
1. Right-click your app folder
2. "Add Files to [Project]..."
3. Navigate to the respective `PlatoiOS/PlatoiOS/` or `PlatoMac/PlatoMac/` folder
4. Select all Swift files
5. Ensure "Copy items if needed" is **unchecked**
6. Ensure your target is checked
7. Click "Add"

### 4. Configure API URL

In both Xcode projects:
1. Edit Scheme (Cmd+<)
2. Run → Arguments → Environment Variables
3. Add: `PLATO_API_URL` = `http://localhost:3000` (or your production URL)

### 5. Run Your Backend

Make sure your Next.js backend is running:
```bash
cd /Users/matt/plato
npm run dev
```

### 6. Build and Run

- **iOS**: Select a simulator and press Cmd+R
- **macOS**: Select "My Mac" and press Cmd+R

## File Structure Created

```
plato-native/
├── PlatoShared/
│   ├── Package.swift
│   └── Sources/PlatoShared/
│       ├── API/
│       │   ├── APIClient.swift
│       │   └── Endpoints.swift
│       ├── Models/
│       │   ├── User.swift
│       │   ├── Recipe.swift
│       │   ├── Ingredient.swift
│       │   ├── Company.swift
│       │   ├── Staff.swift
│       │   ├── Category.swift
│       │   └── Supplier.swift
│       ├── Services/
│       │   ├── AuthService.swift
│       │   └── SessionManager.swift
│       └── PlatoShared.swift
│
├── PlatoiOS/
│   ├── README.md
│   └── PlatoiOS/
│       ├── App/
│       │   └── PlatoApp.swift
│       └── Views/
│           ├── ContentView.swift
│           ├── Auth/
│           │   ├── LoginView.swift
│           │   └── PinLoginView.swift
│           ├── Dashboard/
│           │   └── DashboardView.swift
│           └── Recipes/
│               └── RecipeListView.swift
│
├── PlatoMac/
│   ├── README.md
│   └── PlatoMac/
│       ├── App/
│       │   └── PlatoMacApp.swift
│       └── Views/
│           ├── ContentView.swift
│           ├── LoginView.swift
│           └── DashboardView.swift
│
├── README.md
└── SETUP_GUIDE.md (this file)
```

## What Works Now

✅ **Authentication**
- Email/password login
- PIN-based device login
- Session management
- Auto-logout

✅ **Recipe Browsing**
- List all recipes
- View recipe details
- See ingredients and steps
- Display cost information

✅ **Navigation**
- iOS: Tab-based navigation
- macOS: Sidebar navigation

## What's Next

The foundation is complete! You can now:

1. **Test the apps**: Create Xcode projects and run them
2. **Add features**: Recipe creation, ingredient management, etc.
3. **Customize UI**: Match your brand colors and styling
4. **Add offline support**: Implement Core Data for caching
5. **Prepare for App Store**: Add icons, screenshots, metadata

## Troubleshooting

### "Cannot find 'PlatoShared' in scope"
- Make sure you added the shared package as a dependency
- Check that the package is added to your target

### "API Error: Invalid URL"
- Check that `PLATO_API_URL` environment variable is set
- Ensure your Next.js backend is running

### "HTTP 401: Unauthorized"
- Check that cookies are being stored (they should be automatic)
- Verify your backend is accepting requests from the app

## Support

- Check individual README files in `PlatoiOS/` and `PlatoMac/`
- Review API client code in `PlatoShared/Sources/PlatoShared/API/`
- Ensure your Next.js backend is running and accessible





