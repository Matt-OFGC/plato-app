"use client";

import { useState, useCallback, useEffect } from "react";
import { Toast, Toast as ToastType } from "./Toast";

interface ToastContainerProps {
  maxToasts?: number;
}

let toastIdCounter = 0;
const toastListeners = new Set<(toast: ToastType) => void>();

export function ToastContainer({ maxToasts = 5 }: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    const handleNewToast = (toast: Omit<ToastType, "id">) => {
      const newToast: ToastType = {
        ...toast,
        id: `toast-${++toastIdCounter}`,
      };

      setToasts((prev) => {
        const updated = [newToast, ...prev].slice(0, maxToasts);
        return updated;
      });
    };

    toastListeners.add(handleNewToast);

    return () => {
      toastListeners.delete(handleNewToast);
    };
  }, [maxToasts]);

  const handleDismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Always render container (even if empty) to ensure listeners are registered
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: "calc(100vw - 2rem)" }}
    >
      {toasts.length > 0 && toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto animate-slide-in-right">
          <Toast toast={toast} onDismiss={handleDismiss} />
        </div>
      ))}
    </div>
  );
}

export function showToast(toast: Omit<ToastType, "id">) {
  toastListeners.forEach((listener) => listener(toast));
}

