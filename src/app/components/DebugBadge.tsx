"use client";

import { getBuildInfoString } from "../lib/buildInfo";
import { useState } from "react";

export function DebugBadge() {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const buildInfo = getBuildInfoString();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildInfo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg font-mono">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="hover:bg-gray-700 px-1 py-0.5 rounded transition-colors"
          title="Click to toggle build info"
        >
          {isVisible ? '▼' : '▲'} DEBUG
        </button>
        {isVisible && (
          <div className="mt-1 p-2 bg-gray-800 rounded border border-gray-600 min-w-64">
            <div className="mb-2">
              <div className="text-gray-300 text-xs mb-1">Build Info:</div>
              <div className="text-white text-xs font-mono break-all">
                {buildInfo}
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
