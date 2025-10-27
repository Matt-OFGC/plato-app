"use client";

import { useState } from "react";
import { AppHeader } from "@/lib/design-system";
import { ChannelList } from "./components/ChannelList";
import { ChatWindow } from "./components/ChatWindow";
import { EmptyChat } from "./components/EmptyChat";

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
      email: string;
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

interface MessagingPageClientProps {
  userId: number;
  companyId: number;
  channels: Channel[];
  teamMembers: TeamMember[];
}

export default function MessagingPageClient({
  userId,
  companyId,
  channels: initialChannels,
  teamMembers,
}: MessagingPageClientProps) {
  const [channels, setChannels] = useState(initialChannels);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    initialChannels[0]?.id ?? null
  );

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header */}
      <AppHeader
        app="messaging"
        title="Team Chat"
        description="Collaborate with your team in real-time"
        icon="💬"
      />

      {/* Main Content */}
      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Sidebar - Channel List */}
        <div className="w-80 flex-shrink-0">
          <ChannelList
            channels={channels}
            selectedChannelId={selectedChannelId}
            onSelectChannel={setSelectedChannelId}
            userId={userId}
            companyId={companyId}
            teamMembers={teamMembers}
            onChannelCreated={(newChannel) => {
              setChannels([newChannel, ...channels]);
              setSelectedChannelId(newChannel.id);
            }}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1">
          {selectedChannel ? (
            <ChatWindow
              channel={selectedChannel}
              userId={userId}
              companyId={companyId}
            />
          ) : (
            <EmptyChat />
          )}
        </div>
      </div>
    </div>
  );
}
