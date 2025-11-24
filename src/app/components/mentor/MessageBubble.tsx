"use client";

interface MessageBubbleProps {
  message: {
    id: number;
    role: "user" | "assistant";
    content: string;
    createdAt: Date | string;
    metadata?: any;
  };
}

// Simple markdown-like formatting helper
function formatContent(content: string): string {
  // Convert markdown-style formatting to HTML-like structure
  // Bold: **text** -> <strong>text</strong>
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code class='bg-gray-100 px-1 py-0.5 rounded'>$1</code>");
  
  // Convert line breaks
  formatted = formatted.replace(/\n/g, "<br />");
  
  return formatted;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-2xl rounded-lg p-4 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-white border border-gray-200 text-gray-900"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
            {message.metadata?.dataSourcesUsed && message.metadata.dataSourcesUsed.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Sources: {message.metadata.dataSourcesUsed.join(", ")}
                </p>
              </div>
            )}
          </div>
        )}
        <p className={`text-xs mt-2 ${isUser ? "text-blue-100" : "text-gray-500"}`}>
          {new Date(message.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

