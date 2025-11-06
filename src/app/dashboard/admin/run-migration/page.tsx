"use client";

import { useState } from "react";

export default function RunMigrationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMigration() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/migrate/staff-training", {
        method: "POST",
      });

      const data = await res.json();
      
      // Always set result so we can see what happened
      setResult(data);

      if (res.ok && data.success) {
        // Success
        setError(null);
      } else {
        // Show error message
        setError(data.error || data.message || "Migration failed");
        // Still show result so user can see details
      }
    } catch (err: any) {
      setError(err.message || "Failed to run migration");
      setResult({
        error: err.message,
        details: err.toString()
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Run Staff Training Migration</h1>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <p className="text-gray-600 mb-4">
          This will run the migration to create tables for:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
          <li>Role & RolePermission (custom roles and permissions)</li>
          <li>StaffProfile (staff member profiles)</li>
          <li>TrainingModule, TrainingContent, TrainingRecord (training system)</li>
          <li>CleaningJob (cleaning job assignments)</li>
          <li>ProductionJobAssignment (production job assignments)</li>
        </ul>

        <button
          onClick={runMigration}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Running Migration..." : "Run Migration"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-red-800 mb-2">{error}</p>
          {result?.details && (
            <details className="mt-2">
              <summary className="cursor-pointer text-red-700 font-medium">Show details</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {result && (
        <div className={`border rounded-lg p-4 mb-6 ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : result.results?.errors?.length > 0
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            result.success ? 'text-green-900' : 'text-yellow-900'
          }`}>
            {result.success ? '✅ Migration Results' : '⚠️ Migration Results'}
          </h3>
          <div className={`space-y-2 ${
            result.success ? 'text-green-800' : 'text-yellow-800'
          }`}>
            <p><strong>Total statements:</strong> {result.results?.total || 0}</p>
            <p>✅ <strong>Successful:</strong> {result.results?.successful || 0}</p>
            <p>⚠️ <strong>Skipped (already exists):</strong> {result.results?.skipped || 0}</p>
            {result.results?.errors?.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold text-red-800">❌ Errors: {result.results.errors.length}</p>
                <div className="mt-2 space-y-2">
                  {result.results.errors.map((e: any, i: number) => (
                    <div key={i} className="bg-red-100 p-3 rounded text-sm">
                      <p className="font-medium">Statement {e.statement}:</p>
                      <p className="text-red-900">{e.error}</p>
                      {e.code && <p className="text-xs text-red-700">Code: {e.code}</p>}
                      {e.sql && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs">Show SQL</summary>
                          <pre className="mt-1 p-2 bg-red-200 rounded text-xs overflow-auto">
                            {e.sql}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.successRate && (
              <p className="mt-2"><strong>Success rate:</strong> {result.successRate}</p>
            )}
            {result.nextStep && (
              <p className="mt-4 font-semibold bg-white p-2 rounded">
                Next: {result.nextStep}
              </p>
            )}
            {result.details && !result.success && (
              <div className="mt-4 bg-red-100 p-3 rounded">
                <p className="font-semibold text-red-900">Error Details:</p>
                <p className="text-red-800 text-sm">{result.details}</p>
                {result.code && <p className="text-xs text-red-700 mt-1">Error Code: {result.code}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

