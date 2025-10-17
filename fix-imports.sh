#!/bin/bash

# Fix import paths from @/components/ to @/components/ (which now resolves to src/app/components/)

echo "🔧 Fixing import paths..."

# Find all files with @/components/ imports and fix them
find src/app -name "*.tsx" -o -name "*.ts" | while read file; do
    if grep -q "@/components/" "$file"; then
        echo "Fixing imports in: $file"
        # Replace @/components/ with @/components/ (which now resolves correctly)
        # This is actually correct now since @/components/ resolves to src/app/components/
        # The issue might be that the components are importing each other with @/components/
        # when they should use relative paths since they're in the same directory
        
        # For components in the same directory, use relative imports
        if [[ "$file" == "src/app/components/"* ]]; then
            sed -i '' 's|@/components/|./|g' "$file"
        fi
    fi
done

echo "✅ Import paths fixed!"
