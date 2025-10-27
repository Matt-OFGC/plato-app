export function EmptyChat() {
  return (
    <div className="h-full bg-white rounded-xl border-2 border-gray-200 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Select a Channel
        </h3>
        <p className="text-gray-600">
          Choose a channel from the sidebar to start messaging
        </p>
      </div>
    </div>
  );
}
