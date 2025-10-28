"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { 
  socketClient, 
  onSocketEvent, 
  offSocketEvent, 
  sendMessage as socketSendMessage,
  joinChannel,
  leaveChannel,
  startTyping,
  stopTyping
} from "@/lib/socket/client";

interface Message {
  id: number;
  content: string;
  createdAt: Date | string;
  sender: {
    id: number;
    name: string | null;
    email: string;
  };
  isEdited?: boolean;
  reactions?: Array<{ emoji: string; userId: number }>;
}

interface Channel {
  id: number;
  name: string | null;
  type: string;
  members: Array<{
    user: {
      id: number;
      name: string | null;
      email: string;
    };
  }>;
}

interface ChatWindowProps {
  channel: Channel;
  userId: number;
  companyId: number;
}

export function ChatWindow({ channel, userId, companyId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load messages
  useEffect(() => {
    loadMessages();
  }, [channel.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.io event handlers
  useEffect(() => {
    // Join channel when component mounts
    joinChannel(channel.id);

    // Set up event listeners
    const handleNewMessage = (data: any) => {
      if (data.channelId === channel.id) {
        setMessages(prev => [...prev, data]);
      }
    };

    const handleMessageUpdated = (data: any) => {
      if (data.channelId === channel.id) {
        setMessages(prev => 
          prev.map(msg => msg.id === data.id ? data : msg)
        );
      }
    };

    const handleMessageDeleted = (data: any) => {
      if (data.channelId === channel.id) {
        setMessages(prev => 
          prev.filter(msg => msg.id !== data.messageId)
        );
      }
    };

    const handleTypingIndicator = (data: any) => {
      if (data.channelId === channel.id && data.user.id !== userId) {
        if (data.isTyping) {
          setTypingUsers(prev => new Set([...prev, data.user.id]));
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.user.id);
            return newSet;
          });
        }
      }
    };

    const handleUserJoined = (data: any) => {
      if (data.channelId === channel.id) {
        console.log(`${data.user.name} joined the channel`);
      }
    };

    const handleUserLeft = (data: any) => {
      if (data.channelId === channel.id) {
        console.log(`${data.user.name} left the channel`);
      }
    };

    // Register event listeners
    onSocketEvent('message:new', handleNewMessage);
    onSocketEvent('message:updated', handleMessageUpdated);
    onSocketEvent('message:deleted', handleMessageDeleted);
    onSocketEvent('typing:indicator', handleTypingIndicator);
    onSocketEvent('user:joined', handleUserJoined);
    onSocketEvent('user:left', handleUserLeft);

    // Cleanup
    return () => {
      leaveChannel(channel.id);
      offSocketEvent('message:new', handleNewMessage);
      offSocketEvent('message:updated', handleMessageUpdated);
      offSocketEvent('message:deleted', handleMessageDeleted);
      offSocketEvent('typing:indicator', handleTypingIndicator);
      offSocketEvent('user:joined', handleUserJoined);
      offSocketEvent('user:left', handleUserLeft);
    };
  }, [channel.id, userId]);

  async function loadMessages() {
    try {
      const res = await fetch(`/api/messages/channels/${channel.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage(content: string) {
    try {
      // Send via Socket.io for real-time delivery
      socketSendMessage(channel.id, content);
      
      // Also send via API for persistence (fallback)
      const res = await fetch(`/api/messages/channels/${channel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        console.error("Failed to persist message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  function handleTypingStart() {
    if (!isTyping) {
      setIsTyping(true);
      startTyping(channel.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  }

  function handleTypingStop() {
    if (isTyping) {
      setIsTyping(false);
      stopTyping(channel.id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 h-full flex flex-col overflow-hidden">
      {/* Channel Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <span>{channel.type === "dm" ? "💬" : "#"}</span>
              <span>{channel.name || "Direct Message"}</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {channel.members.length} member{channel.members.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Channel Members Preview */}
          <div className="flex -space-x-2">
            {channel.members.slice(0, 5).map((member) => (
              <div
                key={member.user.id}
                className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                title={member.user.name || member.user.email}
              >
                {(member.user.name?.[0] || member.user.email[0]).toUpperCase()}
              </div>
            ))}
            {channel.members.length > 5 && (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-xs font-bold border-2 border-white">
                +{channel.members.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-2">👋</div>
              <p className="text-gray-600">No messages yet. Be the first to say something!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender.id === userId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {typingUsers.size === 1 
                ? 'Someone is typing...' 
                : `${typingUsers.size} people are typing...`
              }
            </span>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <MessageInput 
          onSend={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      </div>
    </div>
  );
}
