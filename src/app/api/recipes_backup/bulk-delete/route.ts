import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 403 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty IDs array" },
        { status: 400 }
      );
    }

    // Check which recipes are used in production plans or wholesale orders
    const productionItems = await prisma.productionItem.findMany({
      where: { recipeId: { in: ids } },
      select: { recipeId: true },
      distinct: ['recipeId'],
    });

    const wholesaleOrderItems = await prisma.wholesaleOrderItem.findMany({
      where: { recipeId: { in: ids } },
      select: { recipeId: true },
      distinct: ['recipeId'],
    });

    const recipesInUse = new Set([
      ...productionItems.map(item => item.recipeId),
      ...wholesaleOrderItems.map(item => item.recipeId),
    ]);

    // Separate recipes that can be deleted from those in use
    const recipeIdsToDelete = ids.filter(id => !recipesInUse.has(id));
    const recipeIdsInUse = ids.filter(id => recipesInUse.has(id));

    if (recipeIdsToDelete.length === 0) {
      return NextResponse.json(
        { 
          error: "All selected recipes are currently used in production plans or wholesale orders and cannot be deleted",
          recipesInUse: recipeIdsInUse.length,
        },
        { status: 400 }
      );
    }

    // Delete recipes that can be deleted (cascade will handle related records)
    const result = await prisma.recipe.deleteMany({
      where: {
        id: { in: recipeIdsToDelete },
        companyId,
      },
    });

    const message = recipeIdsInUse.length > 0
      ? `Deleted ${result.count} recipe(s). ${recipeIdsInUse.length} recipe(s) could not be deleted because they are used in production plans or orders.`
      : `Successfully deleted ${result.count} recipe(s)`;

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count,
      skippedCount: recipeIdsInUse.length,
      message,
    });
  } catch (error) {
    logger.error("Bulk delete recipes error", error, "RecipesBackup/BulkDelete");
    return NextResponse.json(
      { error: "Failed to delete recipes. Some recipes may be in use." },
      { status: 500 }
    );
  }
}

