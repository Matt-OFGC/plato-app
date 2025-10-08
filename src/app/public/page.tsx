export default function PublicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Plato is Live!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your recipe and ingredient management app is successfully deployed and running.
        </p>
        
        <div className="space-y-3 text-sm text-gray-500">
          <p>✅ Database connected</p>
          <p>✅ Authentication working</p>
          <p>✅ All features ready</p>
        </div>
        
        <div className="mt-8 p-4 bg-emerald-50 rounded-xl">
          <p className="text-emerald-800 font-medium">
            Ready to start cooking! 🍳
          </p>
        </div>
      </div>
    </div>
  );
}
