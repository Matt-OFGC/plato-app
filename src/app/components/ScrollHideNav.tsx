"use client";

import React, { useState, useEffect } from "react";

interface ScrollHideNavProps {
  children: React.ReactNode;
  className?: string;
  hideOnScroll?: boolean;
  threshold?: number; // Scroll threshold in pixels before hiding
}

/**
 * Navigation component that hides on scroll down and shows on scroll up
 * Useful for floating navigation bars that take up screen space
 * This component applies the transform directly to its children
 */
export function ScrollHideNav({ 
  children, 
  className = "",
  hideOnScroll = true,
  threshold = 10
}: ScrollHideNavProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (!hideOnScroll) {
      setIsVisible(true);
      return;
    }

    let ticking = false;
    const scrollableContainer = document.querySelector('[class*="overflow-auto"]') as HTMLElement | null;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Check both window scroll and scrollable container
          const windowScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
          const containerScrollY = scrollableContainer?.scrollTop || 0;
          const currentScrollY = Math.max(windowScrollY, containerScrollY);

          // Show if scrolled to top
          if (currentScrollY < threshold) {
            setIsVisible(true);
            setLastScrollY(currentScrollY);
            ticking = false;
            return;
          } 
          
          // Hide if scrolling down, show if scrolling up
          if (currentScrollY > lastScrollY && currentScrollY > threshold) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY) {
            setIsVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Listen to scroll on window
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also listen to scrollable container if it exists
    if (scrollableContainer) {
      scrollableContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollableContainer) {
        scrollableContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [lastScrollY, hideOnScroll, threshold]);

  // Clone the child and add transform classes directly to it
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: `${(children as React.ReactElement<any>).props.className || ''} transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      } ${className}`.trim()
    });
  }

  return (
    <div
      className={`transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      } ${className}`}
    >
      {children}
    </div>
  );
}

