import { format } from "date-fns";

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

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const senderName = message.sender.name || message.sender.email.split("@")[0];
  const createdAt = typeof message.createdAt === "string"
    ? new Date(message.createdAt)
    : message.createdAt;

  return (
    <div
      className={`flex ${
        isOwnMessage ? "justify-end" : "justify-start"
      } items-start space-x-2`}
    >
      {!isOwnMessage && (
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {senderName[0].toUpperCase()}
        </div>
      )}

      <div className={`max-w-md ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwnMessage && (
          <div className="text-xs font-semibold text-gray-700 mb-1 px-1">
            {senderName}
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white"
              : "bg-gray-100 text-gray-900"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-1 px-1">
          <span className="text-xs text-gray-500">
            {format(createdAt, "h:mm a")}
          </span>
          {message.isEdited && (
            <span className="text-xs text-gray-400 italic">(edited)</span>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-full"
              >
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {isOwnMessage && (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {senderName[0].toUpperCase()}
        </div>
      )}
    </div>
  );
}
