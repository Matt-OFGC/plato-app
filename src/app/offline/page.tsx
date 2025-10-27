'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Offline</h1>
          <p className="text-gray-600">
            It looks like you've lost your internet connection. Don't worry - you can still use Plato!
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">What you can do offline:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• View cached recipes and ingredients</li>
              <li>• Edit existing data (changes sync when online)</li>
              <li>• Create new recipes and ingredients</li>
              <li>• Calculate costs and conversions</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Your changes will sync automatically</h3>
            <p className="text-sm text-blue-700">
              Any changes you make will be saved locally and synced to the server as soon as you're back online.
            </p>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
        
        <div className="mt-6 text-xs text-gray-500">
          <p>Plato works offline thanks to Progressive Web App technology</p>
        </div>
      </div>
    </div>
  );
}
