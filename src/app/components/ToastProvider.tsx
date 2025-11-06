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

// Create context WITHOUT default value - we'll handle it manually
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  try {
    // Try to get context - will be undefined if no provider
    const context = useContext(ToastContext);
    
    // If no context (no provider), return fallback
    if (!context) {
      return { showToast: fallbackShowToast };
    }
    
    return context;
  } catch (error: any) {
    // Catch any errors (including React's development mode errors)
    // and return fallback instead
    console.warn('ToastProvider not found, using fallback:', error?.message);
    return { showToast: fallbackShowToast };
  }
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

