"use client";

import { useState, useEffect } from "react";

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className = "" }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [pendingActions, setPendingActions] = useState(0);

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setIsVisible(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
    };

    // Listen for custom app events
    const handleAppOnline = () => {
      setIsOnline(true);
      setIsVisible(false);
    };

    const handleAppOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('app-online', handleAppOnline);
    window.addEventListener('app-offline', handleAppOffline);

    // Check for pending offline actions
    const checkPendingActions = async () => {
      try {
        // This would integrate with IndexedDB to check pending actions
        // For now, simulate with localStorage
        const pending = localStorage.getItem('plato-pending-actions');
        setPendingActions(pending ? JSON.parse(pending).length : 0);
      } catch (error) {
        console.error('Failed to check pending actions:', error);
      }
    };

    checkPendingActions();

    // Check periodically when offline
    const interval = setInterval(() => {
      if (!isOnline) {
        checkPendingActions();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('app-online', handleAppOnline);
      window.removeEventListener('app-offline', handleAppOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  // Don't show if online and no pending actions
  if (isOnline && pendingActions === 0) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${className}`}
    >
      <div
        className={`px-4 py-2 text-center text-sm font-medium ${
          isOnline
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {isOnline ? (
            <>
              <span>🔄</span>
              <span>Syncing {pendingActions} offline actions...</span>
            </>
          ) : (
            <>
              <span>📱</span>
              <span>You're offline. Changes will sync when you're back online.</span>
              {pendingActions > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-700 rounded-full text-xs">
                  {pendingActions}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for checking online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook for pending offline actions
export function usePendingActions() {
  const [pendingActions, setPendingActions] = useState(0);

  useEffect(() => {
    const checkPendingActions = async () => {
      try {
        const pending = localStorage.getItem('plato-pending-actions');
        setPendingActions(pending ? JSON.parse(pending).length : 0);
      } catch (error) {
        console.error('Failed to check pending actions:', error);
      }
    };

    checkPendingActions();

    // Check periodically
    const interval = setInterval(checkPendingActions, 5000);

    return () => clearInterval(interval);
  }, []);

  return pendingActions;
}