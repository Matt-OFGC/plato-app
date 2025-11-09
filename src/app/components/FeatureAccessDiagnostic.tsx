"use client";

import { useState, useEffect } from "react";

export function FeatureAccessDiagnostic() {
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDiagnostic() {
      try {
        const res = await fetch("/api/features/unlock-status");
        const data = await res.json();
        console.log("🔍 DIAGNOSTIC - Full unlock-status response:", data);
        setDiagnostic(data);
      } catch (error) {
        console.error("Diagnostic error:", error);
        setDiagnostic({ error: String(error) });
      } finally {
        setLoading(false);
      }
    }
    fetchDiagnostic();
  }, []);

  if (loading) {
    return <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">Loading diagnostic...</div>;
  }

  return (
    <div className="p-6 bg-white border-2 border-blue-500 rounded-lg shadow-lg max-w-4xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4">Feature Access Diagnostic</h2>
      
      {diagnostic?.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <strong>Error:</strong> {diagnostic.error}
        </div>
      )}

      {diagnostic?.debug && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <pre className="text-xs overflow-auto">{JSON.stringify(diagnostic.debug, null, 2)}</pre>
        </div>
      )}

      {diagnostic?.unlockStatus && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Module Status:</h3>
          {Object.entries(diagnostic.unlockStatus).map(([module, status]: [string, any]) => (
            <div 
              key={module} 
              className={`p-4 rounded border-2 ${
                status.unlocked 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-lg capitalize">{module}</strong>
                  <div className="text-sm mt-1">
                    Status: {status.status || 'null'} | 
                    Unlocked: {status.unlocked ? '✅ YES' : '❌ NO'} | 
                    Trial: {status.isTrial ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded font-bold ${
                  status.unlocked ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {status.unlocked ? 'UNLOCKED' : 'LOCKED'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
        <h3 className="font-bold mb-2">Raw Response:</h3>
        <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(diagnostic, null, 2)}</pre>
      </div>
    </div>
  );
}

