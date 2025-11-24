"use client";

import { useState, useEffect } from "react";
import { ChatWindow } from "./ChatWindow";
import { SuggestedQuestions } from "./SuggestedQuestions";
// Close icon - using SVG instead of lucide-react

interface MentorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MentorModal({ isOpen, onClose }: MentorModalProps) {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkAccess();
      loadConversations();
    }
  }, [isOpen]);

  const checkAccess = async () => {
    try {
      const response = await fetch("/api/mentor/subscription");
      if (response.ok) {
        const data = await response.json();
        // Hide in MVP mode
        if (data.isMVP) {
          setHasAccess(false);
          return;
        }
        // In dev mode, allow access even without subscription
        const isDev = process.env.NODE_ENV !== "production";
        setHasAccess(data.hasAccess || isDev);
      } else {
        // In dev mode, allow access
        const isDev = process.env.NODE_ENV !== "production";
        setHasAccess(isDev);
      }
    } catch (error) {
      // In dev mode, allow access
      const isDev = process.env.NODE_ENV !== "production";
      setHasAccess(isDev);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/mentor/chat");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        if (data.conversations && data.conversations.length > 0) {
          setConversationId(data.conversations[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch("/api/mentor/chat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversation.id);
        await loadConversations();
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  if (!isOpen) return null;

  // Show subscription prompt if no access (but allow in dev)
  const isDev = process.env.NODE_ENV !== "production";
  if (hasAccess === false && !isDev) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Mentor AI Assistant</h2>
          <p className="text-gray-600 mb-6">
            Subscribe to Mentor to get AI-powered business advice and insights.
          </p>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <a
              href="/pricing"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
            >
              Subscribe
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mentor</h2>
              <p className="text-sm text-gray-500">Your AI Business Mentor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="p-4">
              <button
                onClick={createNewConversation}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + New Conversation
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setConversationId(conv.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      conversationId === conv.id
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-white"
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {conv.title || "Untitled Conversation"}
                    </div>
                    {conv.MentorMessage && conv.MentorMessage.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {conv.MentorMessage[0].content.substring(0, 50)}...
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {conversationId ? (
              <ChatWindow conversationId={conversationId} />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Welcome to Mentor
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your AI business mentor is here to help. Start a conversation or
                    choose from suggested questions below.
                  </p>
                  <button
                    onClick={createNewConversation}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-6"
                  >
                    Start New Conversation
                  </button>
                  <SuggestedQuestions onSelect={(question) => {
                    createNewConversation().then(() => {
                      // Question will be sent after conversation is created
                    });
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

