"use client";

import { useState, useEffect } from "react";

interface DatabaseStatus {
  status: string;
  database: {
    connected: boolean;
    provider: string;
    responseTime?: string;
    error?: string;
    stats?: {
      users: number;
      recipes: number;
      ingredients: number;
      companies: number;
    };
  };
  environment: {
    nodeEnv: string;
    hasDatabaseUrl: boolean;
    databaseUrlPrefix: string;
  };
  timestamp: string;
}

export function DatabaseErrorDisplay() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const response = await fetch('/api/health/db');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to check database status:', error);
        setStatus({
          status: "error",
          database: {
            connected: false,
            provider: "Unknown",
            error: "Failed to check database status"
          },
          environment: {
            nodeEnv: "unknown",
            hasDatabaseUrl: false,
            databaseUrlPrefix: "unknown"
          },
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    checkDatabase();
  }, []);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-800 font-medium">Checking database connection...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  if (status.status === "healthy") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-green-800 font-medium">Database Connected</h3>
            <p className="text-green-700 text-sm">
              Response time: {status.database.responseTime} | 
              Users: {status.database.stats?.users} | 
              Recipes: {status.database.stats?.recipes}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h3 className="text-red-800 font-medium">Database Connection Failed</h3>
          <p className="text-red-700 text-sm mb-2">
            {status.database.error || "Unable to connect to database"}
          </p>
          
          <div className="text-red-700 text-xs space-y-1">
            <p><strong>Environment:</strong> {status.environment.nodeEnv}</p>
            <p><strong>Database URL:</strong> {status.environment.hasDatabaseUrl ? "Set" : "Missing"}</p>
            {status.environment.hasDatabaseUrl && (
              <p><strong>URL Prefix:</strong> {status.environment.databaseUrlPrefix}</p>
            )}
          </div>

          <div className="mt-3 text-red-700 text-sm">
            <p className="font-medium">Quick Fix:</p>
            <ol className="list-decimal list-inside space-y-1 mt-1">
              <li>Check if <code className="bg-red-100 px-1 rounded">.env</code> file exists in project root</li>
              <li>Verify <code className="bg-red-100 px-1 rounded">DATABASE_URL</code> is set correctly</li>
              <li>Ensure database server is running and accessible</li>
              <li>Run <code className="bg-red-100 px-1 rounded">npx prisma db pull</code> to test connection</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
