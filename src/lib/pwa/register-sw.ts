// Service Worker registration and management
// Handles registration, updates, and communication with the service worker

interface ServiceWorkerMessage {
  type: string;
  data?: any;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;

  constructor() {
    this.setupEventListeners();
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', this.registration);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              this.showUpdateNotification();
            }
          });
        }
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('Service Worker update triggered');
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) return;

    try {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      console.log('Skip waiting message sent');
    } catch (error) {
      console.error('Failed to skip waiting:', error);
    }
  }

  async cacheUrls(urls: string[]): Promise<void> {
    if (!this.registration || !this.registration.active) return;

    try {
      this.registration.active.postMessage({
        type: 'CACHE_URLS',
        urls,
      });
      console.log('Cache URLs message sent');
    } catch (error) {
      console.error('Failed to cache URLs:', error);
    }
  }

  async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (this.registration) return this.registration;

    try {
      this.registration = await navigator.serviceWorker.getRegistration();
      return this.registration;
    } catch (error) {
      console.error('Failed to get service worker registration:', error);
      return null;
    }
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  isInstalled(): boolean {
    return this.registration !== null;
  }

  isOnline(): boolean {
    return this.isOnline;
  }

  private setupEventListeners(): void {
    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onOffline();
    });

    // Service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });

    // Service worker controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed');
      window.location.reload();
    });
  }

  private onOnline(): void {
    console.log('App is back online');
    
    // Trigger sync of offline actions
    this.syncOfflineActions();
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app-online'));
  }

  private onOffline(): void {
    console.log('App is offline');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app-offline'));
  }

  private async syncOfflineActions(): Promise<void> {
    try {
      // Import offline storage dynamically to avoid circular dependencies
      const { offlineStorage } = await import('./offline-storage');
      
      const actions = await offlineStorage.getOfflineActions();
      console.log(`Syncing ${actions.length} offline actions`);
      
      for (const action of actions) {
        try {
          const response = await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body,
          });
          
          if (response.ok) {
            await offlineStorage.removeOfflineAction(action.id!);
            console.log('Synced offline action:', action.id);
          }
        } catch (error) {
          console.error('Failed to sync offline action:', action.id, error);
        }
      }
    } catch (error) {
      console.error('Failed to sync offline actions:', error);
    }
  }

  private handleServiceWorkerMessage(message: ServiceWorkerMessage): void {
    console.log('Service Worker message received:', message);
    
    switch (message.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', message.data);
        break;
      
      case 'OFFLINE_ACTION_SYNCED':
        console.log('Offline action synced:', message.data);
        break;
      
      case 'PUSH_RECEIVED':
        console.log('Push notification received:', message.data);
        break;
      
      default:
        console.log('Unknown service worker message:', message);
    }
  }

  private showUpdateNotification(): void {
    // Create a simple update notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span>🔄</span>
        <div>
          <div style="font-weight: 600;">Update Available</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">A new version is ready</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.25rem;
          margin-left: auto;
        ">✕</button>
      </div>
      <div style="margin-top: 0.75rem;">
        <button onclick="window.serviceWorkerManager.skipWaiting()" style="
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.875rem;
        ">Update Now</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Auto-register on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    serviceWorkerManager.register();
  });
  
  // Make it available globally for debugging
  (window as any).serviceWorkerManager = serviceWorkerManager;
}

// Utility functions
export async function registerServiceWorker(): Promise<boolean> {
  const registration = await serviceWorkerManager.register();
  return registration !== null;
}

export async function unregisterServiceWorker(): Promise<boolean> {
  return await serviceWorkerManager.unregister();
}

export async function updateServiceWorker(): Promise<void> {
  await serviceWorkerManager.update();
}

export function isServiceWorkerSupported(): boolean {
  return serviceWorkerManager.isSupported();
}

export function isServiceWorkerInstalled(): boolean {
  return serviceWorkerManager.isInstalled();
}

export function isAppOnline(): boolean {
  return serviceWorkerManager.isOnline();
}
