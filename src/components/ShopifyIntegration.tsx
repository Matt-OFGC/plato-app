"use client";

export function ShopifyIntegration() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Shopify Integration</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Connect your Shopify store to sync products and manage inventory seamlessly.
        </p>
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Coming Soon
        </div>
      </div>
    </div>
  );
}

