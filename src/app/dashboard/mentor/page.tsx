"use client";

import { useState, useEffect } from "react";
import { ChatWindow } from "@/components/mentor/ChatWindow";
import { SuggestedQuestions } from "@/components/mentor/SuggestedQuestions";

export default function MentorPage() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Mentor</h1>
          <p className="text-sm text-gray-500 mt-1">Your AI Business Mentor</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <button
            onClick={createNewConversation}
            className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Conversation
          </button>

          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setConversationId(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  conversationId === conv.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="font-medium text-sm text-gray-900">
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Mentor
              </h2>
              <p className="text-gray-600 mb-6">
                Your AI business mentor is here to help. Start a conversation or
                choose from suggested questions below.
              </p>
              <button
                onClick={createNewConversation}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Conversation
              </button>
              <div className="mt-8">
                <SuggestedQuestions onSelect={(question) => {
                  createNewConversation().then(() => {
                    // Question will be sent after conversation is created
                    setTimeout(() => {
                      // This will be handled by ChatWindow component
                    }, 100);
                  });
                }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}








