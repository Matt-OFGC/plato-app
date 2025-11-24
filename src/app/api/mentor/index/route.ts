import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/mentor/embeddings";
import { storeEmbedding } from "@/lib/mentor/vector-store";
import { canUseAI } from "@/lib/subscription-simple";
import { logger } from "@/lib/logger";

/**
 * Trigger data indexing for a company
 * This is a background job that indexes business data into vector embeddings
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entityType, entityId } = body;

    // OPTIMIZATION: Get membership and check MVP mode in parallel
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.id,
        isActive: true,
      },
      include: {
        company: true,
      },
    });

    if (!membership || !membership.company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const companyId = membership.company.id;

    // Hide Mentor in MVP mode
    const isMVP = process.env.MVP_MODE === "true" || process.env.NEXT_PUBLIC_MVP_MODE === "true";
    if (isMVP) {
      return NextResponse.json(
        { error: "Mentor AI is not available in MVP mode" },
        { status: 403 }
      );
    }

    // Check if user can use AI (must be ADMIN role AND company must have AI subscription)
    const canUse = await canUseAI(session.id, companyId);
    const isDev = process.env.NODE_ENV !== "production";
    if (!canUse && !isDev) {
      // canUseAI() already checks both role (ADMIN/OWNER) and subscription
      // If it returns false, either role is wrong or subscription is missing
      return NextResponse.json(
        { error: "AI Assistant access requires ADMIN role and an active AI subscription" },
        { status: 403 }
      );
    }

    // Index specific entity type
    if (entityType && entityId) {
      await indexEntity(companyId, entityType, entityId);
      return NextResponse.json({ success: true, message: "Entity indexed" });
    }

    // Index all data for company (background job)
    // This should be done asynchronously in production
    await indexCompanyData(companyId);

    return NextResponse.json({
      success: true,
      message: "Indexing started",
    });
  } catch (error) {
    logger.error("Failed to index data", error, "Mentor/Index");
    return NextResponse.json(
      { error: "Failed to index data" },
      { status: 500 }
    );
  }
}

/**
 * Index a specific entity
 */
async function indexEntity(companyId: number, entityType: string, entityId: number) {
  try {
    let content = "";
    let metadata: Record<string, any> = {};

    if (entityType === "recipe") {
      const recipe = await prisma.recipe.findUnique({
        where: { id: entityId, companyId },
        include: {
          RecipeItem: {
            include: {
              Ingredient: true,
            },
          },
        },
      });

      if (recipe) {
        content = `Recipe: ${recipe.name}\nDescription: ${recipe.description || ""}\nCategory: ${recipe.category || ""}\nFood Cost: ${recipe.actualFoodCost || "N/A"}\nSelling Price: ${recipe.sellingPrice || "N/A"}`;
        metadata = {
          name: recipe.name,
          category: recipe.category,
          foodCost: recipe.actualFoodCost,
          sellingPrice: recipe.sellingPrice,
        };
      }
    } else if (entityType === "ingredient") {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: entityId, companyId },
      });

      if (ingredient) {
        content = `Ingredient: ${ingredient.name}\nSupplier: ${ingredient.supplier || "N/A"}\nPrice: ${ingredient.packPrice} ${ingredient.currency} per ${ingredient.packQuantity} ${ingredient.packUnit}`;
        metadata = {
          name: ingredient.name,
          supplier: ingredient.supplier,
          price: ingredient.packPrice,
          currency: ingredient.currency,
        };
      }
    }

    if (content) {
      const embedding = await generateEmbedding(content);
      await storeEmbedding(companyId, entityType, entityId, content, embedding, metadata);
    }
  } catch (error) {
    logger.error(`Error indexing ${entityType} ${entityId}`, error, "Mentor/Index");
    throw error;
  }
}

/**
 * Index all company data
 */
async function indexCompanyData(companyId: number) {
  try {
    // Index recipes
    const recipes = await prisma.recipe.findMany({
      where: { companyId },
      take: 100, // Limit for performance
    });

    for (const recipe of recipes) {
      await indexEntity(companyId, "recipe", recipe.id);
    }

    // Index ingredients
    const ingredients = await prisma.ingredient.findMany({
      where: { companyId },
      take: 100, // Limit for performance
    });

    for (const ingredient of ingredients) {
      await indexEntity(companyId, "ingredient", ingredient.id);
    }

    // Add more entity types as needed
  } catch (error) {
    logger.error("Error indexing company data", error, "Mentor/Index");
    throw error;
  }
}

