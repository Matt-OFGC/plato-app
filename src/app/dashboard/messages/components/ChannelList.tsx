"use client";

import { useState } from "react";
import { format } from "date-fns";

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
  messages: Array<{
    content: string;
    createdAt: Date;
    sender: {
      id: number;
      name: string | null;
    };
  }>;
}

interface TeamMember {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface ChannelListProps {
  channels: Channel[];
  selectedChannelId: number | null;
  onSelectChannel: (id: number) => void;
  userId: number;
  companyId: number;
  teamMembers: TeamMember[];
  onChannelCreated: (channel: any) => void;
}

export function ChannelList({
  channels,
  selectedChannelId,
  onSelectChannel,
  userId,
  companyId,
  teamMembers,
  onChannelCreated,
}: ChannelListProps) {
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState<"team" | "project">("team");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateChannel() {
    if (!channelName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/messages/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: channelName,
          type: channelType,
          companyId,
        }),
      });

      if (res.ok) {
        const newChannel = await res.json();
        onChannelCreated(newChannel);
        setShowNewChannelModal(false);
        setChannelName("");
      }
    } catch (error) {
      console.error("Failed to create channel:", error);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-indigo-100">
        <h2 className="font-bold text-gray-900">Channels</h2>
        <button
          onClick={() => setShowNewChannelModal(true)}
          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          title="New Channel"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto">
        {channels.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No channels yet. Create one to get started!
          </div>
        ) : (
          channels.map((channel) => {
            const lastMessage = channel.messages[0];
            const isSelected = channel.id === selectedChannelId;

            return (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel.id)}
                className={`w-full p-4 text-left border-b border-gray-100 hover:bg-indigo-50 transition-colors ${
                  isSelected ? "bg-indigo-100 border-l-4 border-l-indigo-600" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {channel.type === "dm" ? "💬" : "#"}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {channel.name || "Direct Message"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {channel.members.length} members
                  </span>
                </div>

                {lastMessage && (
                  <div className="text-sm text-gray-600 truncate">
                    <span className="font-medium">
                      {lastMessage.sender.name || "Someone"}:
                    </span>{" "}
                    {lastMessage.content}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* New Channel Modal */}
      {showNewChannelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Create Channel
              </h2>
              <button
                onClick={() => setShowNewChannelModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g., general, marketing, project-alpha"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Channel Type
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setChannelType("team")}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      channelType === "team"
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-2xl mb-1">👥</div>
                    <div className="font-semibold">Team</div>
                    <div className="text-xs text-gray-600">
                      Open to all team members
                    </div>
                  </button>

                  <button
                    onClick={() => setChannelType("project")}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      channelType === "project"
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-2xl mb-1">📁</div>
                    <div className="font-semibold">Project</div>
                    <div className="text-xs text-gray-600">
                      For specific projects
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewChannelModal(false)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChannel}
                  disabled={!channelName.trim() || isCreating}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creating..." : "Create Channel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
