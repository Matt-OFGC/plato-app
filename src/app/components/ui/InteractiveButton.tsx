'use client';

import { ButtonHTMLAttributes, forwardRef, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface InteractiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  haptic?: boolean;
  ripple?: boolean;
  sound?: boolean;
  // Enhanced feedback options
  pressFeedback?: boolean; // Visual press feedback
  glowEffect?: boolean; // Subtle glow on hover
  bounceEffect?: boolean; // Subtle bounce animation
}

const InteractiveButton = forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "md", 
    loading = false, 
    children, 
    disabled, 
    onClick,
    haptic = true,
    ripple = true,
    sound = false,
    pressFeedback = true,
    glowEffect = true,
    bounceEffect = true,
    ...props 
  }, ref) => {
    const [isPressed, setIsPressed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const rippleIdRef = useRef(0);

    // Enhanced haptic feedback patterns
    const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
      if (!haptic || !('vibrate' in navigator)) return;
      
      const patterns = {
        light: [5], // Very subtle
        medium: [10], // Standard
        heavy: [20, 10, 20] // Strong feedback
      };
      
      navigator.vibrate(patterns[type]);
    };

    // Create enhanced ripple effect
    const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple || !buttonRef.current) return;

      const button = buttonRef.current;
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const newRipple = {
        id: rippleIdRef.current++,
        x,
        y,
      };

      setRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      
      // Instant press feedback
      if (pressFeedback) {
        setIsPressed(true);
        triggerHaptic('light');
      }
      
      // Ripple effect
      createRipple(e);
    };

    const handleMouseUp = () => {
      setIsPressed(false);
    };

    const handleMouseLeave = () => {
      setIsPressed(false);
      setIsHovered(false);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      
      // Stronger haptic feedback on click
      triggerHaptic('medium');
      
      // Click sound (placeholder)
      if (sound) {
        console.log('Click sound would play here');
      }
      
      onClick?.(e);
    };

    // Enhanced base classes with clean design
    const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden select-none";
    
    // Ultra-fast transitions for instant feedback
    const transitionClasses = "transition-all duration-75 ease-out transform";
    
    const variants = {
      // Use brand-aware colors via CSS variables (will automatically adapt to brand)
      primary: "bg-brand-primary text-white hover:opacity-90 active:scale-95 shadow-sm hover:shadow-md focus:ring-brand-primary/50",
      secondary: "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 active:scale-95 shadow-sm hover:shadow-md focus:ring-gray-500/50",
      outline: "border-2 border-neutral-300 bg-transparent text-neutral-700 hover:bg-neutral-50 hover:border-brand-primary hover:text-brand-primary active:scale-95 focus:ring-brand-primary/50",
      ghost: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-brand-primary active:scale-95 focus:ring-brand-primary/50",
      destructive: "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-sm hover:shadow-md focus:ring-red-500/50"
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5 min-h-[32px]",
      md: "px-4 py-2 text-sm gap-2 min-h-[40px]",
      lg: "px-6 py-3 text-base gap-2 min-h-[48px]"
    };

    return (
      <button
        ref={(node) => {
          buttonRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          baseClasses,
          transitionClasses,
          variants[variant],
          sizes[size],
          loading && "cursor-wait",
          // Press feedback
          isPressed && "scale-95 shadow-sm",
          // Hover effects
          !disabled && !loading && "hover:-translate-y-0.5",
          bounceEffect && !disabled && !loading && "hover:animate-subtleBounce",
          className
        )}
        disabled={disabled || loading}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsHovered(true)}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
              backgroundColor: variant === 'primary' 
                ? 'rgba(16, 185, 129, 0.3)' 
                : 'rgba(0, 0, 0, 0.1)',
              animation: 'ripple 0.6s ease-out',
            }}
          />
        ))}

        {/* Loading spinner */}
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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

        {/* Button content */}
        <span className={cn("relative z-10", loading && "opacity-70")}>
          {children}
        </span>

        {/* Reflection highlight on hover */}
        {glowEffect && (
          <div className={cn(
            "absolute inset-0 rounded-lg bg-white/20 transition-opacity duration-200 pointer-events-none",
            isHovered && !disabled && !loading ? "opacity-100" : "opacity-0"
          )} />
        )}

        {/* Press indicator */}
        {pressFeedback && isPressed && (
          <div className="absolute inset-0 rounded-lg bg-black/5 pointer-events-none" />
        )}
      </button>
    );
  }
);

InteractiveButton.displayName = "InteractiveButton";

export { InteractiveButton };
