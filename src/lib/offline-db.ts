/**
 * Offline Database Management
 * Provides IndexedDB wrapper for caching app data locally
 */

interface CachedRecipe {
  id: number;
  name: string;
  yieldQuantity: number;
  yieldUnit: string;
  imageUrl?: string;
  items: any[];
  cachedAt: number;
}

interface CachedIngredient {
  id: number;
  name: string;
  supplier?: string;
  packQuantity: number;
  packUnit: string;
  packPrice: number;
  cachedAt: number;
}

interface CachedProductionPlan {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  items: any[];
  cachedAt: number;
}

const DB_NAME = 'plato-offline-db';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Recipes store
      if (!db.objectStoreNames.contains('recipes')) {
        const recipesStore = db.createObjectStore('recipes', { keyPath: 'id' });
        recipesStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        recipesStore.createIndex('name', 'name', { unique: false });
      }

      // Ingredients store
      if (!db.objectStoreNames.contains('ingredients')) {
        const ingredientsStore = db.createObjectStore('ingredients', { keyPath: 'id' });
        ingredientsStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        ingredientsStore.createIndex('name', 'name', { unique: false });
      }

      // Production plans store
      if (!db.objectStoreNames.contains('productionPlans')) {
        const productionPlansStore = db.createObjectStore('productionPlans', { keyPath: 'id' });
        productionPlansStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        productionPlansStore.createIndex('startDate', 'startDate', { unique: false });
      }
    };
  });
};

/**
 * Cache a recipe for offline access
 */
export const cacheRecipe = async (recipe: any): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction('recipes', 'readwrite');
    const store = transaction.objectStore('recipes');

    const cachedRecipe: CachedRecipe = {
      ...recipe,
      cachedAt: Date.now(),
    };

    await store.put(cachedRecipe);
  } catch (error) {
    console.error('Failed to cache recipe:', error);
  }
};

/**
 * Get a cached recipe by ID
 */
export const getCachedRecipe = async (id: number): Promise<CachedRecipe | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction('recipes', 'readonly');
    const store = transaction.objectStore('recipes');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached recipe:', error);
    return null;
  }
};

/**
 * Get all cached recipes
 */
export const getAllCachedRecipes = async (): Promise<CachedRecipe[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction('recipes', 'readonly');
    const store = transaction.objectStore('recipes');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached recipes:', error);
    return [];
  }
};

/**
 * Cache ingredients for offline access
 */
export const cacheIngredients = async (ingredients: any[]): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction('ingredients', 'readwrite');
    const store = transaction.objectStore('ingredients');

    const now = Date.now();
    for (const ingredient of ingredients) {
      const cachedIngredient: CachedIngredient = {
        ...ingredient,
        cachedAt: now,
      };
      await store.put(cachedIngredient);
    }
  } catch (error) {
    console.error('Failed to cache ingredients:', error);
  }
};

/**
 * Get a cached ingredient by ID
 */
export const getCachedIngredient = async (id: number): Promise<CachedIngredient | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction('ingredients', 'readonly');
    const store = transaction.objectStore('ingredients');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached ingredient:', error);
    return null;
  }
};

/**
 * Get all cached ingredients
 */
export const getAllCachedIngredients = async (): Promise<CachedIngredient[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction('ingredients', 'readonly');
    const store = transaction.objectStore('ingredients');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached ingredients:', error);
    return [];
  }
};

/**
 * Cache a production plan for offline access
 */
export const cacheProductionPlan = async (plan: any): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction('productionPlans', 'readwrite');
    const store = transaction.objectStore('productionPlans');

    const cachedPlan: CachedProductionPlan = {
      ...plan,
      cachedAt: Date.now(),
    };

    await store.put(cachedPlan);
  } catch (error) {
    console.error('Failed to cache production plan:', error);
  }
};

/**
 * Get all cached production plans
 */
export const getAllCachedProductionPlans = async (): Promise<CachedProductionPlan[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction('productionPlans', 'readonly');
    const store = transaction.objectStore('productionPlans');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached production plans:', error);
    return [];
  }
};

/**
 * Clear all cached data
 */
export const clearCache = async (): Promise<void> => {
  try {
    const db = await openDB();
    
    // Clear recipes
    const recipesTx = db.transaction('recipes', 'readwrite');
    await recipesTx.objectStore('recipes').clear();

    // Clear ingredients
    const ingredientsTx = db.transaction('ingredients', 'readwrite');
    await ingredientsTx.objectStore('ingredients').clear();

    // Clear production plans
    const productionPlansTx = db.transaction('productionPlans', 'readwrite');
    await productionPlansTx.objectStore('productionPlans').clear();
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
};

/**
 * Get cache size info
 */
export const getCacheInfo = async (): Promise<{ recipes: number; ingredients: number; productionPlans: number }> => {
  try {
    const [recipes, ingredients, productionPlans] = await Promise.all([
      getAllCachedRecipes(),
      getAllCachedIngredients(),
      getAllCachedProductionPlans(),
    ]);

    return {
      recipes: recipes.length,
      ingredients: ingredients.length,
      productionPlans: productionPlans.length,
    };
  } catch (error) {
    console.error('Failed to get cache info:', error);
    return { recipes: 0, ingredients: 0, productionPlans: 0 };
  }
};
