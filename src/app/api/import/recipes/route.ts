import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { z } from "zod";
import { logger } from "@/lib/logger";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const baseUnitEnum = z.enum(["g", "ml", "each", "slices"]);

interface ImportRow {
  name?: string;
  description?: string;
  yieldQuantity?: string | number;
  yieldUnit?: string;
  method?: string;
  bakeTime?: string | number;
  bakeTemp?: string | number;
  category?: string;
  storage?: string;
  shelfLife?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  categoriesCreated: string[];
  storageOptionsCreated: string[];
  shelfLifeOptionsCreated: string[];
  errors: Array<{ row: number; error: string; data: any }>;
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const cleaned = String(value).replace(/[,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function normalizeBaseUnit(unit: string): z.infer<typeof baseUnitEnum> {
  if (!unit) return 'g';
  
  const normalized = unit.toLowerCase().trim();
  const unitMap: Record<string, z.infer<typeof baseUnitEnum>> = {
    'g': 'g', 'gram': 'g', 'grams': 'g',
    'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml', 'millilitre': 'ml', 'millilitres': 'ml',
    'each': 'each', 'ea': 'each', 'unit': 'each', 'units': 'each', 'pc': 'each', 'piece': 'each',
    'slice': 'slices', 'slices': 'slices',
  };
  
  return unitMap[normalized] || 'g';
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
      categoriesCreated: [],
      storageOptionsCreated: [],
      shelfLifeOptionsCreated: [],
      errors: [],
    };

    // Process rows
    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      
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

        const name = String(mappedRow.name).trim();
        
        // Check if recipe already exists
        const existing = await prisma.recipe.findFirst({
          where: {
            name,
            companyId: companyId ?? null,
          },
        });

        if (existing) {
          if (options?.updateExisting) {
            // Update existing recipe (basic fields only, not ingredients)
            const yieldQuantity = parseNumber(mappedRow.yieldQuantity) || 1;
            const yieldUnit = normalizeBaseUnit(String(mappedRow.yieldUnit || 'g'));
            const bakeTime = parseNumber(mappedRow.bakeTime);
            const bakeTemp = parseNumber(mappedRow.bakeTemp);

            // Handle category
            let categoryId = null;
            if (mappedRow.category && String(mappedRow.category).trim()) {
              const categoryName = String(mappedRow.category).trim();
              let category = await prisma.category.findFirst({
                where: {
                  name: categoryName,
                  companyId: companyId ?? null,
                },
              });

              if (!category) {
                category = await prisma.category.create({
                  data: {
                    name: categoryName,
                    companyId: companyId ?? undefined,
                  },
                });
                if (!result.categoriesCreated.includes(categoryName)) {
                  result.categoriesCreated.push(categoryName);
                }
              }
              categoryId = category.id;
            }

            // Handle storage
            let storageId = null;
            if (mappedRow.storage && String(mappedRow.storage).trim()) {
              const storageName = String(mappedRow.storage).trim();
              let storage = await prisma.storageOption.findFirst({
                where: {
                  name: storageName,
                  companyId: companyId ?? null,
                },
              });

              if (!storage) {
                storage = await prisma.storageOption.create({
                  data: {
                    name: storageName,
                    companyId: companyId ?? undefined,
                  },
                });
                if (!result.storageOptionsCreated.includes(storageName)) {
                  result.storageOptionsCreated.push(storageName);
                }
              }
              storageId = storage.id;
            }

            // Handle shelf life
            let shelfLifeId = null;
            if (mappedRow.shelfLife && String(mappedRow.shelfLife).trim()) {
              const shelfLifeName = String(mappedRow.shelfLife).trim();
              let shelfLife = await prisma.shelfLifeOption.findFirst({
                where: {
                  name: shelfLifeName,
                  companyId: companyId ?? null,
                },
              });

              if (!shelfLife) {
                shelfLife = await prisma.shelfLifeOption.create({
                  data: {
                    name: shelfLifeName,
                    companyId: companyId ?? undefined,
                  },
                });
                if (!result.shelfLifeOptionsCreated.includes(shelfLifeName)) {
                  result.shelfLifeOptionsCreated.push(shelfLifeName);
                }
              }
              shelfLifeId = shelfLife.id;
            }

            await prisma.recipe.update({
              where: { id: existing.id },
              data: {
                description: mappedRow.description ? String(mappedRow.description).trim() : null,
                yieldQuantity,
                yieldUnit,
                method: mappedRow.method ? String(mappedRow.method).trim() : null,
                bakeTime: bakeTime || null,
                bakeTemp: bakeTemp || null,
                categoryId,
                storageId,
                shelfLifeId,
              },
            });

            result.imported++;
          } else {
            result.skipped++;
          }
          continue;
        }

        // Parse and validate data
        const yieldQuantity = parseNumber(mappedRow.yieldQuantity);
        if (!yieldQuantity || yieldQuantity <= 0) {
          throw new Error("Invalid yield quantity");
        }

        const yieldUnit = normalizeBaseUnit(String(mappedRow.yieldUnit || 'g'));
        const bakeTime = parseNumber(mappedRow.bakeTime);
        const bakeTemp = parseNumber(mappedRow.bakeTemp);

        // Handle category
        let categoryId = null;
        if (mappedRow.category && String(mappedRow.category).trim()) {
          const categoryName = String(mappedRow.category).trim();
          let category = await prisma.category.findFirst({
            where: {
              name: categoryName,
              companyId: companyId ?? null,
            },
          });

          if (!category) {
            category = await prisma.category.create({
              data: {
                name: categoryName,
                companyId: companyId ?? undefined,
              },
            });
            if (!result.categoriesCreated.includes(categoryName)) {
              result.categoriesCreated.push(categoryName);
            }
          }
          categoryId = category.id;
        }

        // Handle storage
        let storageId = null;
        if (mappedRow.storage && String(mappedRow.storage).trim()) {
          const storageName = String(mappedRow.storage).trim();
          let storage = await prisma.storageOption.findFirst({
            where: {
              name: storageName,
              companyId: companyId ?? null,
            },
          });

          if (!storage) {
            storage = await prisma.storageOption.create({
              data: {
                name: storageName,
                companyId: companyId ?? undefined,
              },
            });
            if (!result.storageOptionsCreated.includes(storageName)) {
              result.storageOptionsCreated.push(storageName);
            }
          }
          storageId = storage.id;
        }

        // Handle shelf life
        let shelfLifeId = null;
        if (mappedRow.shelfLife && String(mappedRow.shelfLife).trim()) {
          const shelfLifeName = String(mappedRow.shelfLife).trim();
          let shelfLife = await prisma.shelfLifeOption.findFirst({
            where: {
              name: shelfLifeName,
              companyId: companyId ?? null,
            },
          });

          if (!shelfLife) {
            shelfLife = await prisma.shelfLifeOption.create({
              data: {
                name: shelfLifeName,
                companyId: companyId ?? undefined,
              },
            });
            if (!result.shelfLifeOptionsCreated.includes(shelfLifeName)) {
              result.shelfLifeOptionsCreated.push(shelfLifeName);
            }
          }
          shelfLifeId = shelfLife.id;
        }

        // Create recipe (without ingredients - those need to be added separately)
        await prisma.recipe.create({
          data: {
            name,
            description: mappedRow.description ? String(mappedRow.description).trim() : null,
            yieldQuantity,
            yieldUnit,
            method: mappedRow.method ? String(mappedRow.method).trim() : null,
            bakeTime: bakeTime || null,
            bakeTemp: bakeTemp || null,
            categoryId,
            storageId,
            shelfLifeId,
            companyId: companyId ?? undefined,
          },
        });

        result.imported++;

      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Unknown error",
          data: rawRow,
        });

        // Stop if too many errors
        if (result.errors.length > 50) {
          result.success = false;
          return NextResponse.json({
            ...result,
            error: "Too many errors. Import stopped.",
          });
        }
      }
    }

    // Add summary message
    let message = `Import completed: ${result.imported} imported, ${result.skipped} skipped`;
    if (result.failed > 0) {
      message += `, ${result.failed} failed`;
    }
    if (result.categoriesCreated.length > 0) {
      message += `. Auto-created ${result.categoriesCreated.length} new categor${result.categoriesCreated.length === 1 ? 'y' : 'ies'}: ${result.categoriesCreated.join(', ')}`;
    }
    if (result.storageOptionsCreated.length > 0) {
      message += `. Auto-created ${result.storageOptionsCreated.length} new storage option${result.storageOptionsCreated.length === 1 ? '' : 's'}: ${result.storageOptionsCreated.join(', ')}`;
    }
    if (result.shelfLifeOptionsCreated.length > 0) {
      message += `. Auto-created ${result.shelfLifeOptionsCreated.length} new shelf life option${result.shelfLifeOptionsCreated.length === 1 ? '' : 's'}: ${result.shelfLifeOptionsCreated.join(', ')}`;
    }

    return NextResponse.json({
      ...result,
      message,
    });

  } catch (error) {
    logger.error("Import error", error, "Import/Recipes");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}

