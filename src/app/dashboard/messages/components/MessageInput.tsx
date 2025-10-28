"use client";

import { useState, KeyboardEvent, useEffect, useRef } from "react";

interface MessageInputProps {
  onSend: (content: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function MessageInput({ onSend, onTypingStart, onTypingStop }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  function handleSend() {
    if (message.trim()) {
      onSend(message);
      setMessage("");
      
      // Stop typing when sending
      if (onTypingStop) {
        onTypingStop();
      }
    }
  }

  function handleKeyPress(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setMessage(e.target.value);
    
    // Handle typing indicators
    if (onTypingStart && onTypingStop) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingStart();
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          isTypingRef.current = false;
          onTypingStop();
        }
      }, 1000);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-end space-x-2">
      <textarea
        value={message}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="Type a message... (Shift+Enter for new line)"
        rows={1}
        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
        style={{ maxHeight: "150px" }}
      />

      <button
        onClick={handleSend}
        disabled={!message.trim()}
        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </div>
  );
}
