#!/bin/bash

# Setup script for creating Xcode projects for Plato Native Apps
# This script helps automate the setup process

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PLATO_ROOT="$(dirname "$PROJECT_ROOT")"

echo "🚀 Plato Native Apps Setup"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed or not in PATH"
    echo "Please install Xcode from the App Store"
    exit 1
fi

echo "✅ Xcode found: $(xcodebuild -version | head -n 1)"
echo ""

# Check if we're in the right directory
if [ ! -d "$PROJECT_ROOT/PlatoShared" ]; then
    echo "❌ Error: PlatoShared directory not found"
    echo "Please run this script from plato-native/scripts/"
    exit 1
fi

echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Function to create iOS project
create_ios_project() {
    echo "${YELLOW}Creating iOS project...${NC}"
    
    IOS_DIR="$PROJECT_ROOT/PlatoiOS"
    
    if [ -d "$IOS_DIR/PlatoiOS.xcodeproj" ]; then
        echo "⚠️  iOS project already exists at $IOS_DIR/PlatoiOS.xcodeproj"
        echo "   Skipping iOS project creation"
        return
    fi
    
    echo ""
    echo "📱 iOS Project Setup Instructions:"
    echo "   1. Open Xcode"
    echo "   2. File → New → Project"
    echo "   3. Choose 'iOS' → 'App'"
    echo "   4. Configure:"
    echo "      - Product Name: PlatoiOS"
    echo "      - Team: Select your development team"
    echo "      - Organization Identifier: com.yourcompany (or your domain)"
    echo "      - Interface: SwiftUI"
    echo "      - Language: Swift"
    echo "      - Storage: None"
    echo "   5. Save location: $IOS_DIR/"
    echo ""
    echo "   Then follow the instructions in $IOS_DIR/README.md"
    echo ""
}

# Function to create macOS project
create_macos_project() {
    echo "${YELLOW}Creating macOS project...${NC}"
    
    MAC_DIR="$PROJECT_ROOT/PlatoMac"
    
    if [ -d "$MAC_DIR/PlatoMac.xcodeproj" ]; then
        echo "⚠️  macOS project already exists at $MAC_DIR/PlatoMac.xcodeproj"
        echo "   Skipping macOS project creation"
        return
    fi
    
    echo ""
    echo "💻 macOS Project Setup Instructions:"
    echo "   1. Open Xcode"
    echo "   2. File → New → Project"
    echo "   3. Choose 'macOS' → 'App'"
    echo "   4. Configure:"
    echo "      - Product Name: PlatoMac"
    echo "      - Team: Select your development team"
    echo "      - Organization Identifier: com.yourcompany (or your domain)"
    echo "      - Interface: SwiftUI"
    echo "      - Language: Swift"
    echo "      - Storage: None"
    echo "   5. Save location: $MAC_DIR/"
    echo ""
    echo "   Then follow the instructions in $MAC_DIR/README.md"
    echo ""
}

# Function to verify shared package
verify_shared_package() {
    echo "${YELLOW}Verifying shared package...${NC}"
    
    if [ ! -f "$PROJECT_ROOT/PlatoShared/Package.swift" ]; then
        echo "❌ Package.swift not found"
        return 1
    fi
    
    echo "✅ Package.swift found"
    
    # Check for required source files
    REQUIRED_FILES=(
        "Sources/PlatoShared/API/APIClient.swift"
        "Sources/PlatoShared/API/Endpoints.swift"
        "Sources/PlatoShared/Services/AuthService.swift"
        "Sources/PlatoShared/Models/User.swift"
        "Sources/PlatoShared/Models/Recipe.swift"
    )
    
    MISSING_FILES=()
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$PROJECT_ROOT/PlatoShared/$file" ]; then
            MISSING_FILES+=("$file")
        fi
    done
    
    if [ ${#MISSING_FILES[@]} -eq 0 ]; then
        echo "✅ All required source files found"
        return 0
    else
        echo "❌ Missing files:"
        for file in "${MISSING_FILES[@]}"; do
            echo "   - $file"
        done
        return 1
    fi
}

# Function to check backend
check_backend() {
    echo "${YELLOW}Checking backend connection...${NC}"
    
    BACKEND_URL="${PLATO_API_URL:-http://localhost:3000}"
    
    if curl -s -f "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        echo "✅ Backend is running at $BACKEND_URL"
        return 0
    else
        echo "⚠️  Backend not reachable at $BACKEND_URL"
        echo "   Make sure your Next.js backend is running:"
        echo "   cd $PLATO_ROOT && npm run dev"
        return 1
    fi
}

# Main execution
echo "🔍 Verifying setup..."
echo ""

verify_shared_package
SHARED_OK=$?

echo ""
create_ios_project
echo ""
create_macos_project
echo ""

check_backend
BACKEND_OK=$?

echo ""
echo "=========================="
echo ""

if [ $SHARED_OK -eq 0 ]; then
    echo "${GREEN}✅ Shared package is ready${NC}"
else
    echo "${YELLOW}⚠️  Shared package has issues${NC}"
fi

if [ $BACKEND_OK -eq 0 ]; then
    echo "${GREEN}✅ Backend is accessible${NC}"
else
    echo "${YELLOW}⚠️  Backend is not running${NC}"
fi

echo ""
echo "📚 Next Steps:"
echo "   1. Create Xcode projects (see instructions above)"
echo "   2. Add PlatoShared package to each project"
echo "   3. Add source files to each project"
echo "   4. Set PLATO_API_URL environment variable"
echo "   5. Build and run!"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - $PROJECT_ROOT/SETUP_GUIDE.md"
echo "   - $PROJECT_ROOT/PlatoiOS/README.md"
echo "   - $PROJECT_ROOT/PlatoMac/README.md"
echo ""

