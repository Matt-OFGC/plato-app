# Smart Import System - User Guide

## Overview

The Smart Import system is a powerful feature that allows users to easily import ingredients and recipes from external systems using Excel (.xlsx, .xls) or CSV (.csv) files. This feature includes intelligent column detection, flexible mapping, and robust error handling.

## Key Features

### 🎯 Intelligent Data Detection
- Automatically detects whether your file contains ingredients or recipes
- Smart column mapping with AI-powered suggestions
- Recognizes common column names from various formats

### 📊 Multiple File Format Support
- Excel files (.xlsx, .xls)
- CSV files (.csv)
- Handles various encoding formats

### 🗺️ Flexible Column Mapping
- Visual column mapper
- Pre-filled suggestions based on your data
- Support for optional and required fields
- Clear field descriptions

### ✅ Data Validation & Preview
- Preview first 5 rows before importing
- Real-time validation
- Error reporting with row numbers
- Option to skip duplicates or update existing items

### 📈 Progress Tracking
- Visual progress indicators
- Detailed import results
- Error summary with specific row information

## How to Use

### Step 1: Access the Importer
1. Navigate to the Ingredients or Recipes page
2. Click the **"Smart Import"** button (blue/purple gradient button)

### Step 2: Upload Your File
1. Choose whether you're importing Ingredients or Recipes (auto-detected if possible)
2. Download the template if you need a reference format
3. Drag and drop your file or click to browse
4. Supported formats: `.csv`, `.xlsx`, `.xls`

### Step 3: Map Your Columns
- Review the suggested column mappings
- Adjust any mappings that aren't correct
- Required fields are marked with an asterisk (*)
- Optional fields can be skipped

### Step 4: Configure Import Options
- **Skip Duplicates**: Don't import items that already exist (matches by name)
- **Update Existing**: Update items if they already exist with new data

### Step 5: Preview & Import
- Review the first 5 rows of your data
- Verify the mappings look correct
- Click "Start Import" to begin

### Step 6: Review Results
- See how many items were imported successfully
- Review any errors with specific row numbers
- Option to import more files or close

## Field Mappings

### Ingredients

#### Required Fields
- **Name**: Ingredient name (e.g., "Flour", "Sugar")
- **Pack Quantity**: Numeric value (e.g., 1000, 2.5)
- **Pack Unit**: Unit of measurement (g, kg, ml, l, oz, lb, etc.)
- **Pack Price**: Price per package (e.g., 2.50, 10.99)

#### Optional Fields
- **Supplier**: Supplier or vendor name
- **Currency**: Currency code (default: GBP)
- **Density (g/ml)**: For volume to weight conversion
- **Allergens**: Comma-separated list (e.g., "Gluten, Dairy")
- **Notes**: Additional information

#### Supported Units
Mass: g, kg, mg, lb, oz
Volume: ml, l, tsp, tbsp, cup, floz, pint, quart, gallon
Count: each, slices

### Recipes

#### Required Fields
- **Name**: Recipe name
- **Yield Quantity**: Numeric batch size
- **Yield Unit**: Base unit (g, ml, each, slices)

#### Optional Fields
- **Description**: Recipe description
- **Method**: Cooking instructions
- **Bake Time**: Time in minutes
- **Bake Temperature**: Temperature in °C
- **Category**: Recipe category (auto-created if doesn't exist)
- **Storage**: Storage instructions (auto-created if doesn't exist)
- **Shelf Life**: How long it keeps (auto-created if doesn't exist)

## Tips for Best Results

### 1. Use the Template
Download the template to see the exact format expected. This eliminates guesswork and ensures a smooth import.

### 2. Clean Your Data
- Remove empty rows
- Ensure numbers don't have text characters (except currency symbols which are handled)
- Use consistent unit names

### 3. Column Names
The system recognizes many variations of column names:
- "Name", "Ingredient", "Item", "Product" → all map to Name
- "Price", "Cost", "Unit Price" → all map to Price
- "Qty", "Quantity", "Amount" → all map to Quantity

### 4. Handle Duplicates
- If updating an existing database, use "Update Existing"
- If importing new data only, use "Skip Duplicates"
- The system matches by name (case-insensitive)

### 5. Large Files
- The system can handle up to 1000+ rows
- Preview shows only first 5 rows for performance
- All rows are validated before import

### 6. Error Handling
If import fails:
- Review error messages with specific row numbers
- Common issues:
  - Missing required fields
  - Invalid units
  - Negative or zero quantities
  - Incorrect number formats
- Fix the errors in your file and re-upload

## Common Import Scenarios

### Migrating from Another System
1. Export your data from the old system (usually CSV or Excel)
2. Download our template to see our format
3. Adjust column names or use our flexible mapping
4. Import with "Update Existing" enabled

### Bulk Price Updates
1. Export current ingredients
2. Update prices in Excel
3. Import with "Update Existing" enabled
4. Only price fields will be updated

### One-Time Setup
1. Create your ingredient/recipe list in Excel
2. Use our template format
3. Import all at once
4. Review and fix any errors
5. Continue adding manually as needed

## Technical Details

### File Size Limits
- Maximum file size: Determined by browser (typically 100MB+)
- Recommended: Keep under 10MB for best performance
- For very large datasets, consider splitting into multiple files

### Data Processing
- Client-side file parsing for privacy
- Server-side validation and import
- Atomic transactions (all or nothing for each row)
- Duplicate detection by exact name match per company

### Security
- Files are processed in memory
- No permanent storage of uploaded files
- Company-scoped data (you only see your data)
- Rate limiting on import endpoints

## Troubleshooting

### "Failed to parse file"
- Ensure file is valid CSV or Excel format
- Check that file isn't corrupted
- Try opening in Excel/Sheets first to verify

### "No data provided"
- File might be empty
- First row should contain headers
- Ensure at least one data row exists

### "Invalid unit"
- Check unit spelling
- Use standard abbreviations (g, kg, ml, l, etc.)
- Refer to supported units list above

### "Name is required"
- Every row must have a name
- Name field cannot be empty
- Check your column mapping

## Support

For additional help or to report issues:
- Check the in-app tooltips and help text
- Review error messages for specific guidance
- Contact support if you encounter persistent issues

## Version History

### v1.0 (Current)
- Initial release
- Support for ingredients and recipes
- Excel and CSV parsing
- Intelligent column detection
- Flexible mapping UI
- Duplicate handling
- Comprehensive error reporting

