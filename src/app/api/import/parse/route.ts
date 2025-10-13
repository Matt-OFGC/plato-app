import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import * as XLSX from "xlsx";
import * as Papa from "papaparse";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Increased limits for large files
const MAX_ROWS = 10000; // Support up to 10k rows

interface ParsedData {
  headers: string[];
  rows: any[];
  detectedType: 'ingredients' | 'recipes' | 'unknown';
  suggestedMappings: Record<string, string>;
  sheets?: string[]; // Available sheet names for Excel files
  selectedSheet?: string; // Which sheet was parsed
}

// Smart column detection - maps various possible column names to our standard fields
const INGREDIENT_FIELD_PATTERNS: Record<string, RegExp[]> = {
  name: [/^name$/i, /^ingredient$/i, /^item$/i, /^product$/i, /^ingredientname$/i],
  supplier: [/^supplier$/i, /^vendor$/i, /^wholesaler$/i, /^source$/i, /^suppliername$/i],
  packQuantity: [/^pack\s?quantity$/i, /^quantity$/i, /^qty$/i, /^amount$/i, /^size$/i, /^pack\s?size$/i],
  packUnit: [/^pack\s?unit$/i, /^unit$/i, /^measure$/i, /^uom$/i, /^measurement$/i, /^measurementshort$/i, /^measurementname$/i],
  packPrice: [/^pack\s?price$/i, /^price$/i, /^cost$/i, /^amount$/i, /^unit\s?price$/i],
  currency: [/^currency$/i, /^curr$/i],
  densityGPerMl: [/^density$/i, /^g\/ml$/i, /^density\s?g\s?per\s?ml$/i],
  allergens: [/^allergen(s)?$/i, /^allergy$/i],
  notes: [/^note(s)?$/i, /^comment(s)?$/i, /^description$/i, /^memo$/i],
};

const RECIPE_FIELD_PATTERNS: Record<string, RegExp[]> = {
  name: [/^name$/i, /^recipe$/i, /^title$/i, /^product$/i],
  description: [/^description$/i, /^desc$/i, /^details$/i],
  yieldQuantity: [/^yield\s?quantity$/i, /^yield$/i, /^quantity$/i, /^qty$/i, /^batch\s?size$/i],
  yieldUnit: [/^yield\s?unit$/i, /^unit$/i],
  method: [/^method$/i, /^instructions$/i, /^directions$/i, /^steps$/i, /^procedure$/i],
  bakeTime: [/^bake\s?time$/i, /^time$/i, /^cook\s?time$/i, /^duration$/i],
  bakeTemp: [/^bake\s?temp(erature)?$/i, /^temp(erature)?$/i, /^oven\s?temp$/i],
  category: [/^category$/i, /^type$/i, /^class$/i],
  storage: [/^storage$/i, /^store$/i, /^keep$/i],
  shelfLife: [/^shelf\s?life$/i, /^expiry$/i, /^life$/i],
};

function detectFieldMapping(headers: string[], patterns: Record<string, RegExp[]>): Record<string, string> {
  const mappings: Record<string, string> = {};
  
  for (const [fieldName, regexList] of Object.entries(patterns)) {
    for (const header of headers) {
      for (const regex of regexList) {
        if (regex.test(header)) {
          mappings[fieldName] = header;
          break;
        }
      }
      if (mappings[fieldName]) break;
    }
  }
  
  return mappings;
}

function detectDataType(headers: string[], rows: any[]): 'ingredients' | 'recipes' | 'unknown' {
  const headerStr = headers.join(' ').toLowerCase();
  
  // Score-based detection
  let ingredientScore = 0;
  let recipeScore = 0;
  
  // Check for ingredient-specific fields
  if (/pack\s?price|supplier|vendor|cost/.test(headerStr)) ingredientScore += 2;
  if (/pack\s?quantity|pack\s?size|density/.test(headerStr)) ingredientScore += 2;
  if (/allergen/.test(headerStr)) ingredientScore += 1;
  
  // Check for recipe-specific fields
  if (/yield|batch|method|instruction|step/.test(headerStr)) recipeScore += 2;
  if (/bake\s?time|bake\s?temp|cook/.test(headerStr)) recipeScore += 2;
  if (/category|storage|shelf\s?life/.test(headerStr)) recipeScore += 1;
  
  // Check data patterns
  if (rows.length > 0) {
    const firstRow = rows[0];
    
    // Look for price-like values
    for (const key of Object.keys(firstRow)) {
      const value = String(firstRow[key] || '');
      if (/^\$?\d+(\.\d{2})?$/.test(value) && /price|cost/.test(key.toLowerCase())) {
        ingredientScore += 1;
      }
    }
  }
  
  if (ingredientScore > recipeScore && ingredientScore >= 2) return 'ingredients';
  if (recipeScore > ingredientScore && recipeScore >= 2) return 'recipes';
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const selectedSheet = formData.get("sheet") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    let headers: string[] = [];
    let rows: any[] = [];
    let sheets: string[] | undefined;
    let sheetName: string | undefined;

    // Parse based on file type
    if (fileName.endsWith('.csv')) {
      // Parse CSV using papaparse
      const text = fileBuffer.toString('utf-8');
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      
      rows = result.data as any[];
      headers = result.meta.fields || [];
      
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Parse Excel using xlsx
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      sheets = workbook.SheetNames;
      
      // If no sheet selected, return list of sheets
      if (!selectedSheet) {
        return NextResponse.json({
          sheets,
          requiresSheetSelection: true,
        });
      }
      
      // Validate selected sheet exists
      if (!sheets.includes(selectedSheet)) {
        return NextResponse.json(
          { error: `Sheet "${selectedSheet}" not found in file.` },
          { status: 400 }
        );
      }
      
      sheetName = selectedSheet;
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      
      if (jsonData.length === 0) {
        return NextResponse.json({ error: `Sheet "${sheetName}" is empty` }, { status: 400 });
      }
      
      rows = jsonData;
      headers = Object.keys(jsonData[0] as object);
      
    } else {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload .csv, .xlsx, or .xls files." },
        { status: 400 }
      );
    }

    if (headers.length === 0 || rows.length === 0) {
      return NextResponse.json({ error: "File is empty or invalid" }, { status: 400 });
    }

    // Limit check
    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ 
        error: `File too large. Maximum ${MAX_ROWS} rows supported. Your file has ${rows.length} rows.` 
      }, { status: 400 });
    }

    // Detect data type and suggest mappings
    const detectedType = detectDataType(headers, rows);
    const patterns = detectedType === 'ingredients' ? INGREDIENT_FIELD_PATTERNS : RECIPE_FIELD_PATTERNS;
    const suggestedMappings = detectFieldMapping(headers, patterns);

    const response: ParsedData = {
      headers,
      rows: rows, // Return ALL rows for import (up to MAX_ROWS)
      detectedType,
      suggestedMappings,
      sheets,
      selectedSheet: sheetName,
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse file" },
      { status: 500 }
    );
  }
}

