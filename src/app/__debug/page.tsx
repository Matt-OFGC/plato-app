"use client";

import { useState, useEffect } from "react";
import { getDebugInfo, BUILD_INFO } from "../lib/buildInfo";

interface RouteInfo {
  path: string;
  file: string;
  type: 'page' | 'layout' | 'component';
}

interface DuplicateInfo {
  name: string;
  files: string[];
  type: 'component' | 'route';
}

export default function DebugPage() {
  const [buildInfo, setBuildInfo] = useState<any>(null);
  const [routeTree, setRouteTree] = useState<RouteInfo[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDebugInfo = async () => {
      try {
        // Get build info
        setBuildInfo(getDebugInfo());

        // Get route tree (simplified for demo)
        const routes: RouteInfo[] = [
          { path: '/', file: 'app/page.tsx', type: 'page' },
          { path: '/dashboard', file: 'app/dashboard/page.tsx', type: 'page' },
          { path: '/dashboard/layout', file: 'app/dashboard/layout.tsx', type: 'layout' },
          { path: '/dashboard/recipes', file: 'app/dashboard/recipes/page.tsx', type: 'page' },
          { path: '/dashboard/business', file: 'app/dashboard/business/page.tsx', type: 'page' },
          { path: '/dashboard/account', file: 'app/dashboard/account/page.tsx', type: 'page' },
          { path: '/dashboard/ingredients', file: 'app/dashboard/ingredients/page.tsx', type: 'page' },
          { path: '/dashboard/team', file: 'app/dashboard/team/page.tsx', type: 'page' },
        ];
        setRouteTree(routes);

        // Check for duplicates (simplified)
        const duplicateComponents: DuplicateInfo[] = [
          {
            name: 'Sidebar',
            files: [
              'src/components/SidebarImproved.tsx',
              'src/app/components/SidebarImproved.tsx (MISSING)'
            ],
            type: 'component'
          },
          {
            name: 'DashboardNavWrapper',
            files: [
              'src/components/DashboardNavWrapper.tsx',
              'src/app/components/DashboardNavWrapper.tsx (MISSING)'
            ],
            type: 'component'
          },
          {
            name: 'Providers',
            files: [
              'src/components/Providers.tsx',
              'src/app/components/Providers.tsx (MISSING)'
            ],
            type: 'component'
          }
        ];
        setDuplicates(duplicateComponents);

        // Get cache info
        const cacheData = {
          serviceWorker: 'navigator' in window ? 'serviceWorker' in navigator : false,
          localStorage: typeof Storage !== 'undefined',
          sessionStorage: typeof Storage !== 'undefined',
          indexedDB: 'indexedDB' in window,
        };
        setCacheInfo(cacheData);

      } catch (error) {
        console.error('Error loading debug info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDebugInfo();
  }, []);

  const clearCaches = async () => {
    try {
      // Clear service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear IndexedDB (simplified)
      if ('indexedDB' in window) {
        // Note: This is a simplified approach. In practice, you'd need to handle each database
        console.log('IndexedDB clear would need specific database handling');
      }

      alert('Caches cleared! Please refresh the page.');
    } catch (error) {
      console.error('Error clearing caches:', error);
      alert('Error clearing caches. Check console for details.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading debug information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔧 Debug Dashboard</h1>
          
          {/* Build Info Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Build Information</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">App Version:</label>
                  <p className="font-mono text-sm">{buildInfo?.appVersion}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Git SHA:</label>
                  <p className="font-mono text-sm">{buildInfo?.gitSha}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Build Time:</label>
                  <p className="font-mono text-sm">{buildInfo?.buildTime}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Environment:</label>
                  <p className="font-mono text-sm">{buildInfo?.nodeEnv}</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(JSON.stringify(buildInfo, null, 2))}
                className="mt-3 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Copy Build Info
              </button>
            </div>
          </div>

          {/* Route Tree Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Route Tree</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="space-y-2">
                {routeTree.map((route, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <span className="font-mono text-sm text-blue-600">{route.path}</span>
                      <span className="ml-2 text-xs text-gray-500">({route.type})</span>
                    </div>
                    <div className="font-mono text-xs text-gray-600">{route.file}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Duplicates Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">⚠️ Component Issues</h2>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="space-y-3">
                {duplicates.map((dup, index) => (
                  <div key={index} className="p-3 bg-white rounded border border-red-200">
                    <div className="font-semibold text-red-800">{dup.name}</div>
                    <div className="text-sm text-red-600 mt-1">
                      {dup.files.map((file, i) => (
                        <div key={i} className={file.includes('MISSING') ? 'text-red-500' : 'text-green-600'}>
                          {file.includes('MISSING') ? '❌' : '✅'} {file}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-100 rounded border border-yellow-300">
                <p className="text-sm text-yellow-800">
                  <strong>Issue Found:</strong> Components are imported from <code>@/components/</code> but exist in <code>src/components/</code> instead of <code>src/app/components/</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Cache Management Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Cache Management</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600">Service Worker</div>
                  <div className={`text-lg ${cacheInfo?.serviceWorker ? 'text-green-600' : 'text-red-600'}`}>
                    {cacheInfo?.serviceWorker ? '✅' : '❌'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600">Local Storage</div>
                  <div className={`text-lg ${cacheInfo?.localStorage ? 'text-green-600' : 'text-red-600'}`}>
                    {cacheInfo?.localStorage ? '✅' : '❌'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600">Session Storage</div>
                  <div className={`text-lg ${cacheInfo?.sessionStorage ? 'text-green-600' : 'text-red-600'}`}>
                    {cacheInfo?.sessionStorage ? '✅' : '❌'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600">IndexedDB</div>
                  <div className={`text-lg ${cacheInfo?.indexedDB ? 'text-green-600' : 'text-red-600'}`}>
                    {cacheInfo?.indexedDB ? '✅' : '❌'}
                  </div>
                </div>
              </div>
              <button
                onClick={clearCaches}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Clear All Caches
              </button>
            </div>
          </div>

          {/* Instructions Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Troubleshooting Instructions</h2>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="space-y-3 text-sm">
                <div>
                  <strong>1. Hard Refresh:</strong> Press <kbd className="bg-gray-200 px-1 rounded">Ctrl+Shift+R</kbd> (Windows/Linux) or <kbd className="bg-gray-200 px-1 rounded">Cmd+Shift+R</kbd> (Mac)
                </div>
                <div>
                  <strong>2. Clear Browser Cache:</strong> Use the "Clear All Caches" button above
                </div>
                <div>
                  <strong>3. Check Build Info:</strong> Verify the build time matches when you made changes
                </div>
                <div>
                  <strong>4. Component Issues:</strong> The missing components need to be moved or imports fixed
                </div>
                <div>
                  <strong>5. HMR Issues:</strong> If Hot Module Replacement isn't working, restart the dev server
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
