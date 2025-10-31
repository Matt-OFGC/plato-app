"use client";

import { useState, useEffect } from "react";

interface Preferences {
  defaultServings?: number;
  defaultYieldUnit?: string;
  defaultViewMode?: string;
  autoSave?: boolean;
  showTooltips?: boolean;
  compactMode?: boolean;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
}

export function UserPreferences() {
  const [preferences, setPreferences] = useState<Preferences>({
    defaultServings: 4,
    defaultYieldUnit: "each",
    defaultViewMode: "whole",
    autoSave: true,
    showTooltips: true,
    compactMode: false,
    notificationsEnabled: true,
    emailNotifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/user/app-preferences");
      if (response.ok) {
        const data = await response.json();
        // Check if preferences are stored in navigationItems temporarily
        if (data.preferences) {
          setPreferences({ ...preferences, ...data.preferences });
        } else {
          // Try to get from navigationItems
          const navResponse = await fetch("/api/user/navigation-preferences");
          if (navResponse.ok) {
            const navData = await navResponse.json();
            if (navData.navigationItems?.appPreferences) {
              setPreferences({ ...preferences, ...navData.navigationItems.appPreferences });
            }
          }
        }
      }
      // Also check localStorage as fallback
      const localPrefs = localStorage.getItem('appPreferences');
      if (localPrefs) {
        try {
          const parsed = JSON.parse(localPrefs);
          setPreferences(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          // Ignore parse errors
        }
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
      // Try localStorage as fallback
      const localPrefs = localStorage.getItem('appPreferences');
      if (localPrefs) {
        try {
          const parsed = JSON.parse(localPrefs);
          setPreferences(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          // Ignore parse errors
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updates: Partial<Preferences>) => {
    setSaving(true);
    setSaved(false);
    try {
      const response = await fetch("/api/user/app-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { ...preferences, ...updates } }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences({ ...preferences, ...updates });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
          // Also save to localStorage as backup
          localStorage.setItem('appPreferences', JSON.stringify({ ...preferences, ...updates }));
        } else {
          throw new Error(data.error || "Failed to save");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Failed to save preferences:", error);
      // Try to save to localStorage as fallback
      try {
        localStorage.setItem('appPreferences', JSON.stringify({ ...preferences, ...updates }));
        setPreferences({ ...preferences, ...updates });
        alert("Preferences saved locally (database field not available yet). Your settings will persist in this browser.");
      } catch (localError) {
        alert(`Failed to save preferences: ${error.message || "Unknown error"}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof Preferences, value: any) => {
    savePreferences({ [key]: value });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Save Indicator */}
      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-sm font-medium">
          ✓ Preferences saved successfully
        </div>
      )}

      {/* Recipe Defaults */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Recipe Defaults
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Set default values for new recipes</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Servings
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={preferences.defaultServings || 4}
              onChange={(e) => updatePreference("defaultServings", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Yield Unit
            </label>
            <select
              value={preferences.defaultYieldUnit || "each"}
              onChange={(e) => updatePreference("defaultYieldUnit", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="g">Grams (g)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="each">Each</option>
              <option value="slices">Slices</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default View Mode
            </label>
            <select
              value={preferences.defaultViewMode || "whole"}
              onChange={(e) => updatePreference("defaultViewMode", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="whole">Whole Recipe</option>
              <option value="steps">Step-by-Step</option>
              <option value="ingredients">Ingredients Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Display Preferences */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Display Preferences
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Customize how the app looks and behaves</p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Tooltips</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Display helpful tooltips on hover</p>
            </div>
            <button
              onClick={() => updatePreference("showTooltips", !preferences.showTooltips)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.showTooltips ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.showTooltips ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Compact Mode</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Use more compact spacing throughout the app</p>
            </div>
            <button
              onClick={() => updatePreference("compactMode", !preferences.compactMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.compactMode ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.compactMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Save & Notifications */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Auto-Save & Notifications
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Control automatic saving and notifications</p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-Save</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Automatically save changes as you work</p>
            </div>
            <button
              onClick={() => updatePreference("autoSave", !preferences.autoSave)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.autoSave ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.autoSave ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Browser Notifications</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive browser notifications for timer alerts</p>
            </div>
            <button
              onClick={() => updatePreference("notificationsEnabled", !preferences.notificationsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.notificationsEnabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.notificationsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive email updates about your account</p>
            </div>
            <button
              onClick={() => updatePreference("emailNotifications", !preferences.emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.emailNotifications ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.emailNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          Keyboard Shortcuts
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Useful keyboard shortcuts to speed up your workflow</p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300">Save recipe/ingredient</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
              Cmd/Ctrl + S
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300">Search</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
              Cmd/Ctrl + K
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300">New recipe</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
              Cmd/Ctrl + N
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300">Go to dashboard</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
              Cmd/Ctrl + G
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300">Show shortcuts help</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
              Cmd/Ctrl + ?
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Close modal/panel</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
              Esc
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

