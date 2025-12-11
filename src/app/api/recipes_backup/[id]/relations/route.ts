import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { getRecipeRelations } from "@/lib/services/relationService";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { id } = await params;
    const recipeId = parseInt(id);

    if (isNaN(recipeId)) {
      return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
    }

    const relations = await getRecipeRelations(recipeId);

    return NextResponse.json({ relations });
  } catch (error) {
    logger.error("Get recipe relations error", error, "RecipesBackup/Relations");
    return NextResponse.json(
      { error: "Failed to fetch relations" },
      { status: 500 }
    );
  }
}

// Create a relation between recipe and another entity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { id } = await params;
    const recipeId = parseInt(id);

    if (isNaN(recipeId)) {
      return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
    }

    // Verify recipe belongs to company
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { companyId: true },
    });

    if (!recipe || recipe.companyId !== companyId) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, relatedId } = body;

    if (!type || !relatedId) {
      return NextResponse.json(
        { error: "Type and relatedId required" },
        { status: 400 }
      );
    }

    // Check permission based on relation type
    if (type === "training") {
      const canEdit = await checkPermission(
        session.id,
        companyId,
        "training:edit"
      );
      if (!canEdit) {
        return NextResponse.json(
          { error: "No permission to link training" },
          { status: 403 }
        );
      }

      // Link training module to recipe
      await prisma.trainingModuleRecipe.upsert({
        where: {
          recipeId_moduleId: {
            recipeId,
            moduleId: relatedId,
          },
        },
        create: {
          recipeId,
          moduleId: relatedId,
        },
        update: {},
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported relation type" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Create recipe relation error", error, "RecipesBackup/Relations");
    return NextResponse.json(
      { error: "Failed to create relation" },
      { status: 500 }
    );
  }
}

