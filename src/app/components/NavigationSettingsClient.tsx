"use client";

import { useState, useEffect } from "react";

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  order: number;
}

const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", enabled: true, order: 1 },
  { id: "recipes", label: "Recipes", href: "/dashboard/recipes", enabled: true, order: 2 },
  { id: "ingredients", label: "Ingredients", href: "/dashboard/ingredients", enabled: true, order: 3 },
  { id: "inventory", label: "Inventory", href: "/dashboard/inventory", enabled: true, order: 4 },
  { id: "production", label: "Production", href: "/dashboard/production", enabled: true, order: 5 },
  { id: "wholesale", label: "Wholesale", href: "/dashboard/wholesale", enabled: true, order: 6 },
  { id: "analytics", label: "Analytics", href: "/dashboard/analytics", enabled: true, order: 7 },
  { id: "team", label: "Team", href: "/dashboard/team", enabled: true, order: 8 },
];

export function NavigationSettingsClient() {
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>(DEFAULT_NAVIGATION_ITEMS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadNavigationSettings();
  }, []);

  const loadNavigationSettings = async () => {
    try {
      const response = await fetch('/api/user/navigation-preferences');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.navigationItems && Array.isArray(data.navigationItems)) {
          setNavigationItems(data.navigationItems);
        } else {
          // If no saved preferences, use defaults
          setNavigationItems(DEFAULT_NAVIGATION_ITEMS);
        }
      } else {
        // If API call fails, use defaults
        setNavigationItems(DEFAULT_NAVIGATION_ITEMS);
      }
    } catch (error) {
      console.error('Error loading navigation settings:', error);
      setNavigationItems(DEFAULT_NAVIGATION_ITEMS);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNavigationSettings = async (itemsToSave?: NavigationItem[]) => {
    const items = itemsToSave || navigationItems;
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/navigation-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ navigationItems: items }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Navigation preferences saved successfully!' });
        // Clear the success message after 2 seconds
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: responseData.error || 'Failed to save navigation preferences' });
      }
    } catch (error) {
      console.error('Error saving navigation settings:', error);
      setMessage({ type: 'error', text: 'Failed to save navigation preferences. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleItem = (id: string) => {
    setNavigationItems(prev => {
      const updatedItems = prev.map(item => 
        item.id === id ? { ...item, enabled: !item.enabled } : item
      );
      
      // Auto-save the changes
      setTimeout(() => {
        saveNavigationSettings(updatedItems);
      }, 100);
      
      return updatedItems;
    });
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    setNavigationItems(prev => {
      const items = [...prev];
      const currentIndex = items.findIndex(item => item.id === id);
      
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex < 0 || newIndex >= items.length) return prev;
      
      // Swap items
      [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];
      
      // Update order values
      const updatedItems = items.map((item, index) => ({ ...item, order: index + 1 }));
      
      // Auto-save the changes
      setTimeout(() => {
        saveNavigationSettings(updatedItems);
      }, 100);
      
      return updatedItems;
    });
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Navigation Items</h3>
        <p className="text-sm text-gray-600 mb-6">
          Drag and drop to reorder items, or use the arrow buttons. Toggle items on/off to show/hide them in your navigation.
        </p>

        <div className="space-y-3">
          {navigationItems
            .sort((a, b) => a.order - b.order)
            .map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-4">
                <div className="flex flex-col space-y-1">
                  <button
                    type="button"
                    onClick={() => moveItem(item.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(item.id, 'down')}
                    disabled={index === navigationItems.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`nav-${item.id}`}
                    checked={item.enabled}
                    onChange={() => toggleItem(item.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`nav-${item.id}`} className="text-sm font-medium text-gray-900">
                    {item.label}
                  </label>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Order: {item.order}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => saveNavigationSettings()}
          disabled={isSaving}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Navigation Preferences'}
        </button>
      </div>
    </div>
  );
}
