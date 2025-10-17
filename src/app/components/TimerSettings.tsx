"use client";

import { useState, useEffect } from "react";

export function TimerSettings() {
  const [settings, setSettings] = useState({
    soundEnabled: true,
    notificationEnabled: true,
    soundVolume: 50,
    notificationDuration: 5,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTimerSettings();
  }, []);

  const loadTimerSettings = async () => {
    try {
      const response = await fetch('/api/user/timer-preferences');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading timer settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTimerSettings = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/timer-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Timer settings saved successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to save timer settings' });
      }
    } catch (error) {
      console.error('Error saving timer settings:', error);
      setMessage({ type: 'error', text: 'Failed to save timer settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'range' ? parseInt(value) : value)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Timer Alert Settings</h3>
        
        <div className="space-y-6">
          {/* Sound Settings */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="soundEnabled"
                checked={settings.soundEnabled}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Enable sound alerts</span>
            </label>
          </div>

          {settings.soundEnabled && (
            <div>
              <label htmlFor="soundVolume" className="block text-sm font-medium text-gray-700 mb-2">
                Sound Volume: {settings.soundVolume}%
              </label>
              <input
                type="range"
                id="soundVolume"
                name="soundVolume"
                min="0"
                max="100"
                value={settings.soundVolume}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Notification Settings */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="notificationEnabled"
                checked={settings.notificationEnabled}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Enable browser notifications</span>
            </label>
          </div>

          {settings.notificationEnabled && (
            <div>
              <label htmlFor="notificationDuration" className="block text-sm font-medium text-gray-700 mb-2">
                Notification Duration: {settings.notificationDuration} seconds
              </label>
              <input
                type="range"
                id="notificationDuration"
                name="notificationDuration"
                min="1"
                max="30"
                value={settings.notificationDuration}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveTimerSettings}
          disabled={isSaving}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Timer Settings'}
        </button>
      </div>
    </div>
  );
}
