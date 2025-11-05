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
      // Try to fetch templates - if it fails with table error, migration needed
      const response = await fetch("/api/safety/templates");
      if (response.ok) {
        // Check if we got an error about missing tables
        const data = await response.json();
        // If templates API works, check temperature tables
        try {
          const tempResponse = await fetch("/api/safety/temperatures?date=" + new Date().toISOString().split("T")[0]);
          if (tempResponse.ok) {
            setNeedsMigration(false);
          } else {
            setNeedsMigration(true);
          }
        } catch {
          setNeedsMigration(true);
        }
      } else {
        setNeedsMigration(true);
      }
    } catch (err) {
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
        setResult(data.message || "Migration completed successfully!");
        setNeedsMigration(false);
        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(data.error || "Migration failed");
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
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
              <p className="text-red-800 font-medium">Error: {error}</p>
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

