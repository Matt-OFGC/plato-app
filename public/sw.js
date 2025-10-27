// Enhanced Service Worker for Offline-First Experience
const CACHE_NAME = 'plato-v1';
const OFFLINE_CACHE = 'plato-offline-v1';
const API_CACHE = 'plato-api-v1';

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets - cache first
  static: {
    pattern: /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
    strategy: 'cacheFirst',
    ttl: 365 * 24 * 60 * 60 * 1000, // 1 year
  },
  
  // API routes - stale while revalidate
  api: {
    pattern: /^\/api\//,
    strategy: 'staleWhileRevalidate',
    ttl: 5 * 60 * 1000, // 5 minutes
  },
  
  // Dashboard pages - network first with fallback
  pages: {
    pattern: /^\/dashboard\//,
    strategy: 'networkFirst',
    ttl: 60 * 60 * 1000, // 1 hour
  },
  
  // Auth pages - cache first
  auth: {
    pattern: /^\/(login|register|reset-password)/,
    strategy: 'cacheFirst',
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/login',
        '/dashboard',
        '/manifest.json',
        // Add critical CSS and JS files
      ]);
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE && cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Determine cache strategy
  let strategy = 'networkFirst'; // default
  let cacheName = CACHE_NAME;
  let ttl = 60 * 60 * 1000; // 1 hour default
  
  if (CACHE_STRATEGIES.static.pattern.test(pathname)) {
    strategy = CACHE_STRATEGIES.static.strategy;
    ttl = CACHE_STRATEGIES.static.ttl;
  } else if (CACHE_STRATEGIES.api.pattern.test(pathname)) {
    strategy = CACHE_STRATEGIES.api.strategy;
    cacheName = API_CACHE;
    ttl = CACHE_STRATEGIES.api.ttl;
  } else if (CACHE_STRATEGIES.pages.pattern.test(pathname)) {
    strategy = CACHE_STRATEGIES.pages.strategy;
    ttl = CACHE_STRATEGIES.pages.ttl;
  } else if (CACHE_STRATEGIES.auth.pattern.test(pathname)) {
    strategy = CACHE_STRATEGIES.auth.strategy;
    ttl = CACHE_STRATEGIES.auth.ttl;
  }
  
  // Execute strategy
  switch (strategy) {
    case 'cacheFirst':
      return cacheFirst(request, cacheName, ttl);
    case 'networkFirst':
      return networkFirst(request, cacheName, ttl);
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request, cacheName, ttl);
    default:
      return networkFirst(request, cacheName, ttl);
  }
}

// Cache First Strategy
async function cacheFirst(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached && !isExpired(cached, ttl)) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return cached version even if expired
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Network First Strategy
async function networkFirst(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Fallback to cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return cache.match('/offline') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Return cached version immediately if available
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Ignore network errors for background updates
    return null;
  });
  
  if (cached && !isExpired(cached, ttl)) {
    return cached;
  }
  
  // If no cache or expired, wait for network
  const response = await fetchPromise;
  if (response) {
    return response;
  }
  
  // Return expired cache if network fails
  if (cached) {
    return cached;
  }
  
  throw new Error('No cached version available');
}

// Check if cached response is expired
function isExpired(response, ttl) {
  const cachedTime = response.headers.get('sw-cached-time');
  if (!cachedTime) return false;
  
  return Date.now() - parseInt(cachedTime) > ttl;
}

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  switch (event.tag) {
    case 'ingredients-sync':
      event.waitUntil(syncIngredients());
      break;
    case 'recipes-sync':
      event.waitUntil(syncRecipes());
      break;
    case 'general-sync':
      event.waitUntil(syncPendingActions());
      break;
  }
});

// Sync pending ingredients
async function syncIngredients() {
  try {
    const pendingActions = await getPendingActions('ingredients');
    for (const action of pendingActions) {
      await syncAction(action);
    }
  } catch (error) {
    console.error('Failed to sync ingredients:', error);
  }
}

// Sync pending recipes
async function syncRecipes() {
  try {
    const pendingActions = await getPendingActions('recipes');
    for (const action of pendingActions) {
      await syncAction(action);
    }
  } catch (error) {
    console.error('Failed to sync recipes:', error);
  }
}

// Sync all pending actions
async function syncPendingActions() {
  try {
    const pendingActions = await getPendingActions();
    for (const action of pendingActions) {
      await syncAction(action);
    }
  } catch (error) {
    console.error('Failed to sync pending actions:', error);
  }
}

// Get pending actions from IndexedDB
async function getPendingActions(type = null) {
  // This would integrate with your IndexedDB implementation
  // For now, return empty array
  return [];
}

// Sync individual action
async function syncAction(action) {
  try {
    const response = await fetch(action.url, {
      method: action.method,
      headers: action.headers,
      body: action.body,
    });
    
    if (response.ok) {
      // Remove from pending actions
      await removePendingAction(action.id);
    }
  } catch (error) {
    console.error('Failed to sync action:', error);
    throw error;
  }
}

// Remove pending action from IndexedDB
async function removePendingAction(actionId) {
  // This would integrate with your IndexedDB implementation
  console.log('Removing pending action:', actionId);
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.tag,
      data: data.data,
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
