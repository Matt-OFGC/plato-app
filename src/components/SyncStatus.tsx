"use client";

import { useState, useEffect } from "react";
import { useOnlineStatus, usePendingActions } from "./OfflineIndicator";

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function SyncStatus({ className = "", showDetails = false }: SyncStatusProps) {
  const isOnline = useOnlineStatus();
  const pendingActions = usePendingActions();
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Update last sync time when coming online
    if (isOnline && pendingActions === 0) {
      setLastSync(new Date());
    }
  }, [isOnline, pendingActions]);

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    
    try {
      // Trigger manual sync
      const pending = localStorage.getItem('plato-pending-actions');
      if (pending) {
        const actions = JSON.parse(pending);
        
        for (const action of actions) {
          try {
            const response = await fetch(action.url, {
              method: action.method,
              headers: action.headers,
              body: action.body,
            });
            
            if (response.ok) {
              // Remove from pending actions
              const updatedActions = actions.filter((a: any) => a.id !== action.id);
              localStorage.setItem('plato-pending-actions', JSON.stringify(updatedActions));
            }
          } catch (error) {
            console.error('Failed to sync action:', action.id, error);
          }
        }
      }
      
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!showDetails && isOnline && pendingActions === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Icon */}
      <div className="flex items-center gap-1">
        {isOnline ? (
          pendingActions > 0 ? (
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          ) : (
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          )
        ) : (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Status Text */}
      {showDetails && (
        <div className="text-sm text-gray-600">
          {isOnline ? (
            pendingActions > 0 ? (
              <span className="text-yellow-600">
                {pendingActions} pending sync
              </span>
            ) : (
              <span className="text-green-600">
                {lastSync ? `Synced ${formatTime(lastSync)}` : 'All synced'}
              </span>
            )
          ) : (
            <span className="text-red-600">Offline</span>
          )}
        </div>
      )}

      {/* Sync Button */}
      {isOnline && pendingActions > 0 && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}
    </div>
  );
}

// Compact sync status for headers/navbars
export function SyncStatusCompact({ className = "" }: { className?: string }) {
  const isOnline = useOnlineStatus();
  const pendingActions = usePendingActions();

  if (isOnline && pendingActions === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {isOnline ? (
        pendingActions > 0 ? (
          <>
            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-xs text-yellow-600">{pendingActions}</span>
          </>
        ) : (
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        )
      ) : (
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}

// Sync progress indicator
export function SyncProgress({ className = "" }: { className?: string }) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleSyncStart = () => {
      setIsVisible(true);
      setProgress(0);
    };

    const handleSyncProgress = (event: CustomEvent) => {
      setProgress(event.detail.progress);
    };

    const handleSyncComplete = () => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
      }, 1000);
    };

    window.addEventListener('sync-start', handleSyncStart as EventListener);
    window.addEventListener('sync-progress', handleSyncProgress as EventListener);
    window.addEventListener('sync-complete', handleSyncComplete as EventListener);

    return () => {
      window.removeEventListener('sync-start', handleSyncStart as EventListener);
      window.removeEventListener('sync-progress', handleSyncProgress as EventListener);
      window.removeEventListener('sync-complete', handleSyncComplete as EventListener);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 min-w-64 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Syncing...</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="text-xs text-gray-600 mt-1 text-center">
        {progress}% complete
      </div>
    </div>
  );
}

// Utility function to format time
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}