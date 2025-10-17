"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface ScrollAnimationState {
  isVisible: boolean;
  isScrollingDown: boolean;
  scrollY: number;
  hasScrolled: boolean;
}

interface UseScrollAnimationOptions {
  threshold?: number; // Minimum scroll distance before hiding
  hideDelay?: number; // Delay before hiding when scrolling down
  showDelay?: number; // Delay before showing when scrolling up
  enabled?: boolean; // Enable/disable the animation
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 100,
    hideDelay = 150,
    showDelay = 100,
    enabled = true
  } = options;

  const [state, setState] = useState<ScrollAnimationState>({
    isVisible: true,
    isScrollingDown: false,
    scrollY: 0,
    hasScrolled: false
  });

  const lastScrollY = useRef(0);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);
  const showTimeout = useRef<NodeJS.Timeout | null>(null);
  const ticking = useRef(false);

  const updateScrollState = useCallback(() => {
    if (!enabled) return;

    const currentScrollY = window.scrollY;
    const isScrollingDown = currentScrollY > lastScrollY.current;
    const hasScrolled = currentScrollY > 0;

    setState(prevState => ({
      ...prevState,
      isScrollingDown,
      scrollY: currentScrollY,
      hasScrolled
    }));

    // Clear existing timeouts
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (showTimeout.current) clearTimeout(showTimeout.current);

    // Apple-style behavior:
    // - Always visible at top of page
    // - Hide when scrolling down (after threshold)
    // - Show immediately when scrolling up
    if (currentScrollY <= 0) {
      // At top of page - always show
      setState(prevState => ({ ...prevState, isVisible: true }));
    } else if (isScrollingDown && currentScrollY > threshold) {
      // Scrolling down past threshold - hide after delay
      hideTimeout.current = setTimeout(() => {
        setState(prevState => ({ ...prevState, isVisible: false }));
      }, hideDelay);
    } else if (!isScrollingDown) {
      // Scrolling up - show immediately with slight delay for smoothness
      showTimeout.current = setTimeout(() => {
        setState(prevState => ({ ...prevState, isVisible: true }));
      }, showDelay);
    }

    lastScrollY.current = currentScrollY;
    ticking.current = false;
  }, [enabled, threshold, hideDelay, showDelay]);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateScrollState);
      ticking.current = true;
    }
  }, [updateScrollState]);

  useEffect(() => {
    if (!enabled) return;

    // Add scroll listener with passive: true for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      if (showTimeout.current) clearTimeout(showTimeout.current);
    };
  }, [handleScroll, enabled]);

  // Force show/hide methods for external control
  const forceShow = useCallback(() => {
    setState(prevState => ({ ...prevState, isVisible: true }));
  }, []);

  const forceHide = useCallback(() => {
    setState(prevState => ({ ...prevState, isVisible: false }));
  }, []);

  return {
    ...state,
    forceShow,
    forceHide
  };
}
