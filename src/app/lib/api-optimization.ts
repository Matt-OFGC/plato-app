import { NextResponse } from 'next/server';
import { createCachedResponse } from '@/lib/cache-headers';

/**
 * API Response Optimization Utilities
 * Reduces payload sizes and improves response times
 */

// Field selection for common entities
export const RECIPE_FIELDS = {
  basic: {
    id: true,
    name: true,
    yieldQuantity: true,
    yieldUnit: true,
    imageUrl: true,
    category: true,
    createdAt: true,
  },
  withCost: {
    id: true,
    name: true,
    yieldQuantity: true,
    yieldUnit: true,
    imageUrl: true,
    category: true,
    sellingPrice: true,
    actualFoodCost: true,
    createdAt: true,
  },
  full: {
    id: true,
    name: true,
    description: true,
    yieldQuantity: true,
    yieldUnit: true,
    imageUrl: true,
    method: true,
    category: true,
    sellingPrice: true,
    actualFoodCost: true,
    bakeTemp: true,
    bakeTime: true,
    shelfLife: true,
    storage: true,
    createdAt: true,
    updatedAt: true,
  },
};

export const INGREDIENT_FIELDS = {
  basic: {
    id: true,
    name: true,
    packQuantity: true,
    packUnit: true,
    packPrice: true,
    supplier: true,
  },
  withSupplier: {
    id: true,
    name: true,
    packQuantity: true,
    packUnit: true,
    packPrice: true,
    supplier: true,
    supplierRef: {
      select: {
        id: true,
        name: true,
        contactEmail: true,
      },
    },
  },
  full: {
    id: true,
    name: true,
    packQuantity: true,
    packUnit: true,
    packPrice: true,
    currency: true,
    supplier: true,
    densityGPerMl: true,
    allergens: true,
    customConversions: true,
    notes: true,
    lastPriceUpdate: true,
    supplierRef: {
      select: {
        id: true,
        name: true,
        contactEmail: true,
        phone: true,
      },
    },
  },
};

// Pagination utilities
export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export function getPaginationParams(searchParams: URLSearchParams, options: PaginationOptions = {}) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(
    options.maxLimit || 100,
    parseInt(searchParams.get('limit') || String(options.limit || 20))
  );
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}

// Response serialization
export function serializeResponse(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      // Handle Prisma Decimal fields
      if (value && typeof value === 'object' && value.isDecimal) {
        return value.toString();
      }
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    })
  );
}

// Optimized API response builder
export function createOptimizedResponse(
  data: any,
  options: {
    cacheType?: 'static' | 'frequent' | 'dynamic' | 'noCache' | 'user';
    etag?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
    compression?: boolean;
  } = {}
) {
  const serializedData = serializeResponse(data);
  
  let responseData = serializedData;
  
  // Add pagination metadata if provided
  if (options.pagination) {
    responseData = {
      data: serializedData,
      pagination: {
        page: options.pagination.page,
        limit: options.pagination.limit,
        total: options.pagination.total,
        totalPages: Math.ceil(options.pagination.total / options.pagination.limit),
        hasNext: options.pagination.page * options.pagination.limit < options.pagination.total,
        hasPrev: options.pagination.page > 1,
      },
    };
  }
  
  const response = createCachedResponse(
    responseData,
    options.cacheType || 'frequent',
    options.etag
  );
  
  // Add compression hint
  if (options.compression) {
    response.headers.set('Content-Encoding', 'gzip');
  }
  
  return response;
}

// Database query optimization helpers
export function optimizeRecipeQuery(includeItems = false, includeSections = false) {
  const include: any = {};
  
  if (includeItems) {
    include.items = {
      select: {
        id: true,
        quantity: true,
        unit: true,
        note: true,
        ingredient: {
          select: INGREDIENT_FIELDS.basic,
        },
      },
    };
  }
  
  if (includeSections) {
    include.sections = {
      select: {
        id: true,
        title: true,
        description: true,
        method: true,
        order: true,
        bakeTemp: true,
        bakeTime: true,
        hasTimer: true,
        items: includeItems ? undefined : {
          select: {
            id: true,
            quantity: true,
            unit: true,
            note: true,
            ingredient: {
              select: INGREDIENT_FIELDS.basic,
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    };
  }
  
  return { include };
}

// Cost calculation optimization
export function calculateRecipeCosts(recipes: any[]) {
  return recipes.map(recipe => {
    // Calculate total cost from items
    const totalCost = recipe.items?.reduce((sum: number, item: any) => {
      const costPerUnit = item.ingredient?.packPrice && item.ingredient?.packQuantity
        ? Number(item.ingredient.packPrice) / Number(item.ingredient.packQuantity)
        : 0;
      return sum + (Number(item.quantity) * costPerUnit);
    }, 0) || 0;
    
    // Calculate cost per serving
    const yieldQty = Number(recipe.yieldQuantity);
    const costPerServing = yieldQty > 0 ? totalCost / yieldQty : totalCost;
    
    // Calculate COGS percentage
    const cogsPercentage = recipe.sellingPrice && Number(recipe.sellingPrice) > 0
      ? (costPerServing / Number(recipe.sellingPrice)) * 100
      : null;
    
    return {
      ...recipe,
      totalCost,
      costPerServing,
      cogsPercentage,
    };
  });
}

// Batch processing for large datasets
export async function processBatch<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  
  return results;
}

// Memory-efficient data processing
export function* chunkArray<T>(array: T[], chunkSize: number): Generator<T[], void, unknown> {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize);
  }
}

// Response size estimation
export function estimateResponseSize(data: any): number {
  return JSON.stringify(data).length;
}

// Conditional field inclusion based on request
export function getFieldsForRequest(requestedFields: string[], availableFields: any) {
  const fields: any = {};
  
  for (const field of requestedFields) {
    if (availableFields[field]) {
      fields[field] = availableFields[field];
    }
  }
  
  return fields;
}
