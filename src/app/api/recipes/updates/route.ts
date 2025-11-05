import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/recipes/updates
 *
 * Query Parameters:
 * - allergen_impact: boolean (default: true) - Filter for allergen-impacting changes only
 * - days: number (default: 30) - Number of days to look back
 * - company_id: number (optional) - Filter by company
 *
 * Returns: Array of recipe update logs with recipe information
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const allergenImpactParam = searchParams.get('allergen_impact');
    const daysParam = searchParams.get('days');
    const companyIdParam = searchParams.get('company_id');

    // Default values
    const allergenImpact = allergenImpactParam !== null
      ? allergenImpactParam === 'true'
      : true;
    const days = daysParam ? parseInt(daysParam, 10) : 30;
    const companyId = companyIdParam ? parseInt(companyIdParam, 10) : undefined;

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Build query filters
    const where: any = {
      updatedAt: {
        gte: dateThreshold
      }
    };

    if (allergenImpact) {
      where.allergenImpact = true;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    // Query update logs with recipe information
    const updateLogs = await prisma.recipeUpdateLog.findMany({
      where,
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            category: true,
            allergens: true,
            dietary_tags: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 100 // Limit to most recent 100 updates
    });

    // Group updates by recipe
    const updatesByRecipe: Record<number, {
      recipe: {
        id: number;
        name: string;
        category: string | null;
        allergens: string[];
        dietary_tags: string[];
        has_recent_changes: boolean;
      };
      updates: Array<{
        id: number;
        updateType: string;
        changedField: string | null;
        oldValue: string | null;
        newValue: string | null;
        allergenImpact: boolean;
        updatedAt: Date;
      }>;
      latestUpdate: Date;
      changeCount: number;
    }> = {};

    updateLogs.forEach(log => {
      if (!updatesByRecipe[log.recipeId]) {
        updatesByRecipe[log.recipeId] = {
          recipe: {
            id: log.recipe.id,
            name: log.recipe.name,
            category: log.recipe.category,
            allergens: Array.isArray(log.recipe.allergens) ? log.recipe.allergens : [],
            dietary_tags: Array.isArray(log.recipe.dietary_tags) ? log.recipe.dietary_tags : [],
            has_recent_changes: true
          },
          updates: [],
          latestUpdate: log.updatedAt,
          changeCount: 0
        };
      }

      updatesByRecipe[log.recipeId].updates.push({
        id: log.id,
        updateType: log.updateType,
        changedField: log.changedField,
        oldValue: log.oldValue,
        newValue: log.newValue,
        allergenImpact: log.allergenImpact,
        updatedAt: log.updatedAt
      });

      updatesByRecipe[log.recipeId].changeCount++;

      // Track latest update
      if (log.updatedAt > updatesByRecipe[log.recipeId].latestUpdate) {
        updatesByRecipe[log.recipeId].latestUpdate = log.updatedAt;
      }
    });

    // Convert to array and sort by latest update
    const groupedUpdates = Object.values(updatesByRecipe).sort(
      (a, b) => b.latestUpdate.getTime() - a.latestUpdate.getTime()
    );

    return NextResponse.json({
      success: true,
      data: groupedUpdates,
      meta: {
        totalRecipesAffected: groupedUpdates.length,
        totalChanges: updateLogs.length,
        dateRange: {
          from: dateThreshold.toISOString(),
          to: new Date().toISOString()
        },
        filters: {
          allergenImpact,
          days,
          companyId
        }
      }
    });

  } catch (error) {
    console.error('Error fetching recipe updates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch recipe updates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
