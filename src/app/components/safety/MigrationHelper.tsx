"use client";

import { useState, useEffect } from "react";

export function MigrationHelper() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  async function checkMigrationStatus() {
    setChecking(true);
    try {
      // Check if all required tables exist by testing the templates API
      const response = await fetch("/api/safety/templates");
      if (!response.ok) {
        setNeedsMigration(true);
        setChecking(false);
        return;
      }

      // If templates work, check if temperature tables exist by trying a simple query
      // We'll check by trying to create a test record (which will fail if table doesn't exist)
      // Actually, better to just check if the API endpoint exists and responds
      const tempResponse = await fetch("/api/safety/temperatures?date=" + new Date().toISOString().split("T")[0]);
      if (tempResponse.ok) {
        // Both APIs work, migration complete
        setNeedsMigration(false);
      } else {
        // Temperature tables might not exist
        setNeedsMigration(true);
      }
    } catch (err) {
      // If any error, assume migration needed
      setNeedsMigration(true);
    } finally {
      setChecking(false);
    }
  }

  async function runMigration() {
    setRunning(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/safety/migrate", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        const successMessage = data.message || "Migration completed successfully!";
        setResult(successMessage);
        
        // Show results if available
        if (data.results && Array.isArray(data.results)) {
          console.log("Migration results:", data.results);
        }
        
        // Re-check migration status after a delay, then reload
        setTimeout(async () => {
          await checkMigrationStatus();
          // Wait a bit more, then reload regardless (to pick up any changes)
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }, 1500);
      } else {
        const errorMsg = data.error || "Migration failed";
        const details = data.details ? `\n\nDetails: ${data.details}` : "";
        setError(`${errorMsg}${details}`);
        
        // Show full error in console for debugging
        console.error("Migration error:", data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to run migration");
    } finally {
      setRunning(false);
    }
  }

  // Don't show if migration not needed or still checking
  if (!needsMigration || checking) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="text-3xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Database Migration Required
          </h3>
          <p className="text-yellow-800 mb-4">
            The Safety module requires database tables to be created. Click the button below to run the migration automatically.
          </p>
          
          {result && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
              <p className="text-green-800 font-medium">{result}</p>
              {result.includes("successfully") && (
                <p className="text-sm text-green-700 mt-1">Page will reload automatically...</p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
              <p className="text-red-800 font-medium">Error: {error}</p>
              <p className="text-sm text-red-700 mt-2">
                If migration failed, check your browser console or server logs for details.
              </p>
            </div>
          )}

          <button
            onClick={runMigration}
            disabled={running}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              running
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-yellow-500 text-white hover:bg-yellow-600"
            }`}
          >
            {running ? "Running Migration..." : "Run Database Migration"}
          </button>
        </div>
      </div>
    </div>
  );
}

