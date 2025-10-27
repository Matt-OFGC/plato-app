/**
 * Security utilities for verifying ownership and permissions
 * 
 * This module provides centralized security checks to ensure users can only
 * access resources that belong to their company. This prevents cross-company
 * data access and unauthorized operations.
 */

import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

/**
 * Verifies that a recipe belongs to the user's company
 * @param recipeId - The ID of the recipe to check
 * @param companyId - The company ID to verify against
 * @throws {Error} If recipe doesn't exist or doesn't belong to the company
 */
export async function verifyRecipeOwnership(recipeId: number, companyId: number) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { 
      id: true,
      name: true,
      companyId: true 
    }
  });
  
  if (!recipe) {
    throw new Error("Recipe not found");
  }
  
  if (recipe.companyId !== companyId) {
    throw new Error("Unauthorized: Recipe doesn't belong to your company");
  }
  
  return recipe;
}

/**
 * Verifies that an ingredient belongs to the user's company
 * @param ingredientId - The ID of the ingredient to check
 * @param companyId - The company ID to verify against
 * @throws {Error} If ingredient doesn't exist or doesn't belong to the company
 */
export async function verifyIngredientOwnership(ingredientId: number, companyId: number) {
  const ingredient = await prisma.ingredient.findUnique({
    where: { id: ingredientId },
    select: { 
      id: true,
      name: true,
      companyId: true 
    }
  });
  
  if (!ingredient) {
    throw new Error("Ingredient not found");
  }
  
  if (ingredient.companyId !== companyId) {
    throw new Error("Unauthorized: Ingredient doesn't belong to your company");
  }
  
  return ingredient;
}

/**
 * Verifies that a category belongs to the user's company
 * @param categoryId - The ID of the category to check
 * @param companyId - The company ID to verify against
 * @throws {Error} If category doesn't exist or doesn't belong to the company
 */
export async function verifyCategoryOwnership(categoryId: number, companyId: number) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { 
      id: true,
      name: true,
      companyId: true 
    }
  });
  
  if (!category) {
    throw new Error("Category not found");
  }
  
  if (category.companyId !== companyId) {
    throw new Error("Unauthorized: Category doesn't belong to your company");
  }
  
  return category;
}

/**
 * Verifies that a supplier belongs to the user's company
 * @param supplierId - The ID of the supplier to check
 * @param companyId - The company ID to verify against
 * @throws {Error} If supplier doesn't exist or doesn't belong to the company
 */
export async function verifySupplierOwnership(supplierId: number, companyId: number) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { 
      id: true,
      name: true,
      companyId: true 
    }
  });
  
  if (!supplier) {
    throw new Error("Supplier not found");
  }
  
  if (supplier.companyId !== companyId) {
    throw new Error("Unauthorized: Supplier doesn't belong to your company");
  }
  
  return supplier;
}

/**
 * Gets the current user's company ID and throws an error if none exists
 * @returns The company ID
 * @throws {Error} If user has no company
 */
export async function requireCompanyId(): Promise<number> {
  const { companyId } = await getCurrentUserAndCompany();
  
  if (!companyId) {
    throw new Error("No company associated with your account");
  }
  
  return companyId;
}

/**
 * Verifies that a user has permission to perform an action
 * @param requiredRole - The minimum role required
 * @returns The user's membership information
 * @throws {Error} If user doesn't have sufficient permissions
 */
export async function verifyUserPermissions(requiredRole: 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER') {
  const { user, companyId } = await getCurrentUserAndCompany();
  
  if (!user || !companyId) {
    throw new Error("User not authenticated");
  }
  
  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: {
        userId: user.id,
        companyId: companyId
      }
    },
    select: {
      role: true,
      isActive: true
    }
  });
  
  if (!membership || !membership.isActive) {
    throw new Error("User is not an active member of this company");
  }
  
  const roleHierarchy = {
    'VIEWER': 0,
    'EDITOR': 1,
    'ADMIN': 2,
    'OWNER': 3
  };
  
  if (roleHierarchy[membership.role] < roleHierarchy[requiredRole]) {
    throw new Error(`Insufficient permissions. Required: ${requiredRole}, Current: ${membership.role}`);
  }
  
  return { user, companyId, membership };
}
