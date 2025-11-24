import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { toBase, Unit, BaseUnit } from "@/lib/units";
import { z } from "zod";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const unitEnum = z.enum(["g", "kg", "mg", "lb", "oz", "ml", "l", "tsp", "tbsp", "cup", "floz", "pint", "quart", "gallon", "each", "slices", "pinch", "dash", "large", "medium", "small"]);

interface ImportRow {
  name?: string;
  supplier?: string;
  packQuantity?: string | number;
  packUnit?: string;
  packPrice?: string | number;
  currency?: string;
  densityGPerMl?: string | number;
  allergens?: string;
  notes?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

function parseAllergens(value: string): string[] {
  if (!value) return [];
  return value.split(/[,;|]/).map(a => a.trim()).filter(Boolean);
}

function normalizeUnit(unit: string): Unit | null {
  if (!unit) return null;
  
  // Remove parentheses and extra text: "Kilogram(s)" -> "kilogram"
  const cleaned = unit.toLowerCase().trim().replace(/\(s?\)/g, '').replace(/\s+/g, '');
  
  const unitMap: Record<string, Unit> = {
    'g': 'g', 'gram': 'g', 'grams': 'g',
    'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg', 'kilo': 'kg',
    'mg': 'mg', 'milligram': 'mg', 'milligrams': 'mg',
    'lb': 'lb', 'pound': 'lb', 'pounds': 'lb', 'lbs': 'lb',
    'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
    'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml', 'millilitre': 'ml', 'millilitres': 'ml',
    'l': 'l', 'liter': 'l', 'liters': 'l', 'litre': 'l', 'litres': 'l',
    'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
    'tbsp': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp',
    'cup': 'cup', 'cups': 'cup',
    'floz': 'floz', 'fl oz': 'floz', 'fluid ounce': 'floz', 'fluid ounces': 'floz',
    'pint': 'pint', 'pints': 'pint', 'pt': 'pint',
    'quart': 'quart', 'quarts': 'quart', 'qt': 'quart',
    'gallon': 'gallon', 'gallons': 'gallon', 'gal': 'gallon',
    'each': 'each', 'ea': 'each', 'unit': 'each', 'units': 'each', 'pc': 'each', 'pcs': 'each', 'piece': 'each', 'pieces': 'each',
    'slice': 'slices', 'slices': 'slices', 'slc': 'slices',
  };
  
  return unitMap[cleaned] || null;
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  
  // Remove currency symbols and commas
  const cleaned = String(value).replace(/[$£€¥,]/g, '').trim();
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? null : num;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    
    const body = await req.json();
    const { rows, columnMapping, options } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    // Process rows
    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      let name = ''; // Declare outside try block for error handling
      
      try {
        // Map columns based on user selection
        const mappedRow: ImportRow = {};
        for (const [ourField, theirColumn] of Object.entries(columnMapping as Record<string, string>)) {
          if (theirColumn && rawRow[theirColumn as string] !== undefined) {
            mappedRow[ourField as keyof ImportRow] = rawRow[theirColumn as string];
          }
        }

        // Validate required fields
        if (!mappedRow.name || String(mappedRow.name).trim() === '') {
          throw new Error("Name is required");
        }

        name = String(mappedRow.name).trim();
        
        // Check if ingredient already exists
        const existing = await prisma.ingredient.findFirst({
          where: {
            name,
            companyId: companyId ?? null,
          },
        });

        if (existing) {
          if (options?.updateExisting) {
            // Update existing ingredient
            const packQuantity = parseNumber(mappedRow.packQuantity);
            const packPrice = parseNumber(mappedRow.packPrice);
            const packUnit = normalizeUnit(String(mappedRow.packUnit || 'g'));
            
            if (!packQuantity || !packUnit || packPrice === null) {
              throw new Error("Invalid quantity, unit, or price");
            }

            const densityGPerMl = parseNumber(mappedRow.densityGPerMl);
            const { amount: baseQuantity, base: baseUnit } = toBase(
              packQuantity,
              packUnit,
              densityGPerMl ?? undefined
            );

              await prisma.ingredient.update({
                where: { id: existing.id },
                data: {
                  supplier: mappedRow.supplier ? String(mappedRow.supplier).trim() : null,
                  supplierId: null, // Not supported in import yet
                  packQuantity: baseQuantity,
                  packUnit: baseUnit as BaseUnit,
                  originalUnit: packUnit,
                  packPrice: packPrice,
                  currency: mappedRow.currency ? String(mappedRow.currency).trim() : "GBP",
                  densityGPerMl: densityGPerMl,
                  allergens: parseAllergens(String(mappedRow.allergens || '')),
                  notes: mappedRow.notes ? String(mappedRow.notes).trim() : null,
                  lastPriceUpdate: new Date(),
                },
              });

            result.imported++;
          } else {
            // Skip duplicate
            result.skipped++;
          }
          continue; // Don't try to create
        }

        // Parse and validate data
        const packQuantity = parseNumber(mappedRow.packQuantity);
        const packPrice = parseNumber(mappedRow.packPrice);
        const packUnit = normalizeUnit(String(mappedRow.packUnit || 'g'));
        
        if (!packQuantity || packQuantity <= 0) {
          throw new Error("Invalid pack quantity");
        }
        
        if (packPrice === null || packPrice < 0) {
          throw new Error("Invalid pack price");
        }
        
        if (!packUnit) {
          throw new Error("Invalid or unsupported unit");
        }

        const densityGPerMl = parseNumber(mappedRow.densityGPerMl);

        // Convert to base unit
        const { amount: baseQuantity, base: baseUnit } = toBase(
          packQuantity,
          packUnit,
          densityGPerMl ?? undefined
        );

        // Create ingredient
        await prisma.ingredient.create({
          data: {
            name,
            supplier: mappedRow.supplier ? String(mappedRow.supplier).trim() : null,
            supplierId: null, // Not supported in import yet
            packQuantity: baseQuantity,
            packUnit: baseUnit as BaseUnit,
            originalUnit: packUnit,
            packPrice: packPrice,
            currency: mappedRow.currency ? String(mappedRow.currency).trim() : "GBP",
            densityGPerMl: densityGPerMl,
            allergens: parseAllergens(String(mappedRow.allergens || '')),
            notes: mappedRow.notes ? String(mappedRow.notes).trim() : null,
            companyId: companyId ?? undefined,
          },
        });

        result.imported++;

      } catch (error) {
        result.failed++;
        
        // Better error message
        let errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        // Add ingredient name to error for clarity
        const ingredientInfo = name ? `"${name}"` : 'ingredient';
        errorMessage = `${ingredientInfo}: ${errorMessage}`;
        
        result.errors.push({
          row: i + 1,
          error: errorMessage,
          data: rawRow,
        });

        // Stop if too many errors
        if (result.errors.length > 50) {
          result.success = false;
          return NextResponse.json({
            ...result,
            error: "Too many errors. Import stopped. Please check your data and try again.",
          });
        }
      }
    }

    // Add summary message
    let message = `Import completed: ${result.imported} imported, ${result.skipped} skipped`;
    if (result.failed > 0) {
      message += `, ${result.failed} failed`;
    }

    return NextResponse.json({
      ...result,
      message,
    });

  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.error("Import error", error, "Import/Ingredients");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}

