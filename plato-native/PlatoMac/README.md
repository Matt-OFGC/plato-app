# Plato macOS App

Native macOS app for Plato restaurant management system.

## Setup Instructions

### Prerequisites
- Xcode 15.0 or later
- macOS 14.0 or later
- macOS 14.0+ deployment target

### Creating the Xcode Project

1. Open Xcode
2. Select "File" → "New" → "Project"
3. Choose "macOS" → "App"
4. Configure:
   - Product Name: `PlatoMac`
   - Team: Select your development team
   - Organization Identifier: `com.yourcompany` (or your domain)
   - Interface: SwiftUI
   - Language: Swift
   - Storage: None (or Core Data if you want offline caching)
   - Include Tests: Yes

5. Save the project in `/Users/matt/plato/plato-native/PlatoMac/`

### Adding the Shared Package

1. In Xcode, select your project in the navigator
2. Select your app target
3. Go to "General" tab → "Frameworks, Libraries, and Embedded Content"
4. Click "+" → "Add Other" → "Add Package Dependency"
5. Select "Add Local..."
6. Navigate to `/Users/matt/plato/plato-native/PlatoShared/`
7. Click "Add Package"
8. Ensure `PlatoShared` is added to your target

### Adding Source Files

1. Delete the default `ContentView.swift` if it exists
2. Right-click on your app folder in Xcode
3. Select "Add Files to PlatoMac..."
4. Navigate to `/Users/matt/plato/plato-native/PlatoMac/PlatoMac/`
5. Select all files and folders
6. Ensure "Copy items if needed" is unchecked (files are already in place)
7. Ensure your app target is checked
8. Click "Add"

### Configuration

1. Set the API base URL:
   - Add a new environment variable in your scheme:
     - Edit Scheme → Run → Arguments → Environment Variables
     - Add: `PLATO_API_URL` = `http://localhost:3000` (or your production URL)

2. Update Info.plist:
   - Set minimum macOS version to 14.0
   - Configure app permissions as needed

### Running the App

1. Select "My Mac" as the run destination
2. Press Cmd+R or click Run
3. The app will connect to your Next.js backend API

## Project Structure

```
PlatoMac/
├── PlatoMac/
│   ├── App/
│   │   └── PlatoMacApp.swift       # App entry point with menu commands
│   ├── Views/
│   │   ├── ContentView.swift       # Root view with sidebar navigation
│   │   ├── LoginView.swift         # Email/password login
│   │   └── DashboardView.swift    # Main dashboard
│   └── Info.plist                  # App configuration
└── README.md
```

## Features

- Email/password authentication
- Sidebar navigation
- Native macOS UI with SwiftUI
- Menu bar commands
- Window management

## Next Steps

- Add recipe management views
- Implement ingredient management
- Add staff management
- Implement offline caching with Core Data
- Add keyboard shortcuts
- Implement drag & drop support




