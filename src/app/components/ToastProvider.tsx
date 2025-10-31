"use client";

import { createContext, useContext } from "react";
import { ToastContainer } from "./ToastContainer";
import { showToast as showToastImpl } from "./ToastContainer";
import type { Toast } from "./Toast";

interface ToastContextType {
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'warning',
    options?: {
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => void;
}

// Default fallback function
const fallbackShowToast = (
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info',
  options?: {
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }
) => {
  try {
    showToastImpl({
      message,
      type,
      duration: options?.duration,
      action: options?.action,
    });
  } catch (error) {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
};

const ToastContext = createContext<ToastContextType>({ showToast: fallbackShowToast });

export function useToast() {
  const context = useContext(ToastContext);
  // Always return a valid context (either from provider or fallback)
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    options?: {
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => {
    showToastImpl({
      message,
      type,
      duration: options?.duration,
      action: options?.action,
    });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

