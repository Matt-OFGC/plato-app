// IndexedDB wrapper for offline data storage and sync queue
// Handles caching of recipes, ingredients, staff, and wholesale data

interface OfflineAction {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  retryCount: number;
}

interface CachedData {
  id: string;
  data: any;
  timestamp: number;
  version: number;
}

class OfflineStorage {
  private dbName = 'plato-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('recipes')) {
          db.createObjectStore('recipes', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('ingredients')) {
          db.createObjectStore('ingredients', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('staff')) {
          db.createObjectStore('staff', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('wholesale')) {
          db.createObjectStore('wholesale', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('offline-actions')) {
          db.createObjectStore('offline-actions', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('sync-queue')) {
          db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Generic cache methods
  async cacheData(storeName: string, data: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Clear existing data
    await store.clear();
    
    // Add new data
    for (const item of data) {
      await store.add({
        id: item.id,
        data: item,
        timestamp: Date.now(),
        version: 1,
      });
    }
  }

  async getCachedData(storeName: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result.map((item: CachedData) => item.data);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedItem(storeName: string, id: string): Promise<any | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        resolve(request.result ? request.result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateCachedItem(storeName: string, id: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    await store.put({
      id,
      data,
      timestamp: Date.now(),
      version: 1,
    });
  }

  async deleteCachedItem(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    await store.delete(id);
  }

  // Offline actions queue
  async queueOfflineAction(action: Omit<OfflineAction, 'id'>): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['offline-actions'], 'readwrite');
    const store = transaction.objectStore('offline-actions');
    
    await store.add({
      ...action,
      timestamp: Date.now(),
      retryCount: 0,
    });
  }

  async getOfflineActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['offline-actions'], 'readonly');
    const store = transaction.objectStore('offline-actions');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeOfflineAction(id: number): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['offline-actions'], 'readwrite');
    const store = transaction.objectStore('offline-actions');
    
    await store.delete(id);
  }

  // Sync queue for domain events
  async queueDomainEvent(eventType: string, payload: any, companyId: number): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');
    
    await store.add({
      eventType,
      payload,
      companyId,
      timestamp: Date.now(),
      retryCount: 0,
    });
  }

  async getQueuedDomainEvents(): Promise<any[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['sync-queue'], 'readonly');
    const store = transaction.objectStore('sync-queue');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeQueuedDomainEvent(id: number): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');
    
    await store.delete(id);
  }

  // Cache management
  async clearCache(storeName?: string): Promise<void> {
    if (!this.db) await this.init();
    
    if (storeName) {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.clear();
    } else {
      // Clear all stores
      const storeNames = Array.from(this.db!.objectStoreNames);
      const transaction = this.db!.transaction(storeNames, 'readwrite');
      
      for (const name of storeNames) {
        await transaction.objectStore(name).clear();
      }
    }
  }

  async getCacheSize(): Promise<Record<string, number>> {
    if (!this.db) await this.init();
    
    const storeNames = Array.from(this.db!.objectStoreNames);
    const sizes: Record<string, number> = {};
    
    for (const storeName of storeNames) {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      sizes[storeName] = await new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    
    return sizes;
  }

  // Specific data methods
  async cacheRecipes(recipes: any[]): Promise<void> {
    await this.cacheData('recipes', recipes);
  }

  async getCachedRecipes(): Promise<any[]> {
    return await this.getCachedData('recipes');
  }

  async cacheIngredients(ingredients: any[]): Promise<void> {
    await this.cacheData('ingredients', ingredients);
  }

  async getCachedIngredients(): Promise<any[]> {
    return await this.getCachedData('ingredients');
  }

  async cacheStaff(staff: any[]): Promise<void> {
    await this.cacheData('staff', staff);
  }

  async getCachedStaff(): Promise<any[]> {
    return await this.getCachedData('staff');
  }

  async cacheWholesaleData(data: any[]): Promise<void> {
    await this.cacheData('wholesale', data);
  }

  async getCachedWholesaleData(): Promise<any[]> {
    return await this.getCachedData('wholesale');
  }

  async cacheMessages(messages: any[]): Promise<void> {
    await this.cacheData('messages', messages);
  }

  async getCachedMessages(): Promise<any[]> {
    return await this.getCachedData('messages');
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

// Helper functions for common operations
export async function cacheAppData(data: {
  recipes?: any[];
  ingredients?: any[];
  staff?: any[];
  wholesale?: any[];
  messages?: any[];
}): Promise<void> {
  const promises: Promise<void>[] = [];
  
  if (data.recipes) {
    promises.push(offlineStorage.cacheRecipes(data.recipes));
  }
  
  if (data.ingredients) {
    promises.push(offlineStorage.cacheIngredients(data.ingredients));
  }
  
  if (data.staff) {
    promises.push(offlineStorage.cacheStaff(data.staff));
  }
  
  if (data.wholesale) {
    promises.push(offlineStorage.cacheWholesaleData(data.wholesale));
  }
  
  if (data.messages) {
    promises.push(offlineStorage.cacheMessages(data.messages));
  }
  
  await Promise.all(promises);
}

export async function getCachedAppData(): Promise<{
  recipes: any[];
  ingredients: any[];
  staff: any[];
  wholesale: any[];
  messages: any[];
}> {
  const [recipes, ingredients, staff, wholesale, messages] = await Promise.all([
    offlineStorage.getCachedRecipes(),
    offlineStorage.getCachedIngredients(),
    offlineStorage.getCachedStaff(),
    offlineStorage.getCachedWholesaleData(),
    offlineStorage.getCachedMessages(),
  ]);
  
  return {
    recipes,
    ingredients,
    staff,
    wholesale,
    messages,
  };
}

// Offline action helpers
export async function queueOfflineAction(
  url: string,
  method: string,
  headers: Record<string, string> = {},
  body?: string
): Promise<void> {
  await offlineStorage.queueOfflineAction({
    url,
    method,
    headers,
    body,
    timestamp: Date.now(),
    retryCount: 0,
  });
}

// Domain event helpers
export async function queueDomainEvent(
  eventType: string,
  payload: any,
  companyId: number
): Promise<void> {
  await offlineStorage.queueDomainEvent(eventType, payload, companyId);
}
