"use client";

import { useState, useEffect } from "react";

interface ScrollHideNavProps {
  children: React.ReactNode;
  className?: string;
  hideOnScroll?: boolean;
  threshold?: number; // Scroll threshold in pixels before hiding
}

/**
 * Navigation component that hides on scroll down and shows on scroll up
 * Useful for floating navigation bars that take up screen space
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

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show if scrolled to top
      if (currentScrollY < threshold) {
        setIsVisible(true);
      } 
      // Hide if scrolling down, show if scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > threshold) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, hideOnScroll, threshold]);

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

