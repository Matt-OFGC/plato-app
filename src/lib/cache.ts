/**
 * React Cache utilities for better performance
 * Uses Next.js 15's built-in caching mechanisms
 */

import { cache } from 'react';
import { prisma } from './prisma';

/**
 * Cached user lookup - prevents duplicate queries in the same render
 */
export const getCachedUser = cache(async (userId: number) => {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
    },
  });
});

/**
 * Cached company lookup with memberships
 */
export const getCachedCompany = cache(async (companyId: number) => {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: {
      memberships: {
        where: { isActive: true },
        select: {
          id: true,
          role: true,
          userId: true,
        },
      },
    },
  });
});

/**
 * Cached ingredients for a company
 */
export const getCachedIngredients = cache(async (companyId: number) => {
  return prisma.ingredient.findMany({
    where: { companyId },
    orderBy: { name: 'asc' },
  });
});

/**
 * Cached recipes for a company (limited to 100 most recent)
 */
export const getCachedRecipes = cache(async (companyId: number, limit = 100) => {
  return prisma.recipe.findMany({
    where: { companyId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: {
      categoryRef: true,
      items: {
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
              packPrice: true,
              packQuantity: true,
              packUnit: true,
              currency: true,
            },
          },
        },
      },
    },
  });
});

/**
 * Helper to create cached queries with custom keys
 */
export function createCachedQuery<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return cache(fn);
}
