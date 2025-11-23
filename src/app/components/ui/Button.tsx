"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, children, disabled, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      // Use brand-aware colors via CSS variables (will automatically adapt to brand)
      primary: "bg-brand-primary text-white hover:opacity-90 active:scale-95 shadow-sm hover:shadow-md focus:ring-brand-primary/50",
      secondary: "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 active:scale-95 shadow-sm hover:shadow-md focus:ring-gray-500/50",
      outline: "border-2 border-neutral-300 bg-transparent text-neutral-700 hover:bg-neutral-50 hover:border-brand-primary hover:text-brand-primary active:scale-95 focus:ring-brand-primary/50",
      ghost: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-brand-primary active:scale-95 focus:ring-brand-primary/50",
      destructive: "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-sm hover:shadow-md focus:ring-red-500/50"
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm min-h-[32px]",
      md: "px-4 py-2 text-sm min-h-[40px]",
      lg: "px-6 py-3 text-base min-h-[48px]"
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          loading && "cursor-wait",
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
        {loading && <span className="sr-only">Loading...</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };

