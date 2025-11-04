"use client";

import { useRef, useEffect } from "react";
import { SmartImporter } from "./SmartImporter";

interface SmartImportButtonProps {
  type: 'recipes' | 'ingredients';
}

export function SmartImportButton({ type }: SmartImportButtonProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find and style the SmartImporter button
  useEffect(() => {
    const styleButton = () => {
      if (containerRef.current) {
        const button = containerRef.current.querySelector('button');
        if (button) {
          // Apply compact floating nav styles
          button.className = "bg-purple-600 shadow-lg px-4 py-3 rounded-full hover:bg-purple-700 hover:shadow-xl transition-all duration-200 flex items-center justify-center";
          button.innerHTML = `
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          `;
        }
      }
    };

    // Try multiple times to catch the button after render
    const timeout = setTimeout(styleButton, 100);
    const interval = setInterval(styleButton, 500);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div ref={containerRef} className="inline-block">
      <SmartImporter type={type} />
    </div>
  );
}

