/**
 * Mentor context retrieval
 * Retrieves relevant business context for AI queries
 */

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "./embeddings";
import { searchSimilarContent } from "./vector-store";
import { getMentorConfig } from "./config";
import { logger } from "@/lib/logger";

export interface BusinessContext {
  recipes?: any[];
  ingredients?: any[];
  sales?: any[];
  staff?: any[];
  suppliers?: any[];
  production?: any[];
  analytics?: any[];
}

/**
 * Retrieve relevant business context for a query
 */
export async function retrieveBusinessContext(
  companyId: number,
  query: string,
  limit: number = 10
): Promise<BusinessContext> {
  try {
    // Get company config to see which data sources are enabled
    const config = await getMentorConfig(companyId);
    const dataSources = (config.dataSources as Record<string, boolean>) || {};

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    const context: BusinessContext = {};

    // Retrieve relevant recipes if enabled
    if (dataSources.recipes) {
      const recipeResults = await searchSimilarContent(
        companyId,
        queryEmbedding,
        limit,
        ["recipe"]
      );
      if (recipeResults.length > 0) {
        const recipeIds = recipeResults.map((r) => r.entityId).filter((id): id is number => id !== null);
        if (recipeIds.length > 0) {
          context.recipes = await prisma.recipe.findMany({
            where: {
              id: { in: recipeIds },
              companyId,
            },
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              actualFoodCost: true,
              sellingPrice: true,
              suggestedPrice: true,
              yieldQuantity: true,
              yieldUnit: true,
            },
            take: limit,
          });
        }
      }
    }

    // Retrieve relevant ingredients if enabled
    if (dataSources.ingredients) {
      const ingredientResults = await searchSimilarContent(
        companyId,
        queryEmbedding,
        limit,
        ["ingredient"]
      );
      if (ingredientResults.length > 0) {
        const ingredientIds = ingredientResults.map((r) => r.entityId).filter((id): id is number => id !== null);
        if (ingredientIds.length > 0) {
          context.ingredients = await prisma.ingredient.findMany({
            where: {
              id: { in: ingredientIds },
              companyId,
            },
            select: {
              id: true,
              name: true,
              supplier: true,
              packPrice: true,
              packQuantity: true,
              packUnit: true,
              currency: true,
              lastPriceUpdate: true,
            },
            take: limit,
          });
        }
      }
    }

    // Retrieve relevant sales if enabled
    if (dataSources.sales) {
      const salesResults = await searchSimilarContent(
        companyId,
        queryEmbedding,
        limit,
        ["sales"]
      );
      if (salesResults.length > 0) {
        context.sales = await prisma.salesRecord.findMany({
          where: {
            companyId,
          },
          orderBy: {
            transactionDate: "desc",
          },
          take: limit,
          select: {
            id: true,
            transactionDate: true,
            channel: true,
            recipeId: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            totalRevenue: true,
          },
        });
      }
    }

    // Add more data sources as needed (suppliers, staff, production, analytics)

    return context;
  } catch (error) {
    logger.error("Error retrieving context", error, "Mentor/ContextRetrieval");
    throw error;
  }
}

/**
 * Format context for AI prompt
 */
export function formatContextForPrompt(context: BusinessContext): string {
  const parts: string[] = [];

  if (context.recipes && context.recipes.length > 0) {
    parts.push("## Recipes");
    parts.push(JSON.stringify(context.recipes, null, 2));
  }

  if (context.ingredients && context.ingredients.length > 0) {
    parts.push("## Ingredients");
    parts.push(JSON.stringify(context.ingredients, null, 2));
  }

  if (context.sales && context.sales.length > 0) {
    parts.push("## Sales Records");
    parts.push(JSON.stringify(context.sales, null, 2));
  }

  return parts.join("\n\n");
}

