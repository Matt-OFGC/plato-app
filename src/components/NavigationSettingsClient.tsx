"use client";

import { useState, useEffect } from "react";
import { NavigationSettings } from "@/components/NavigationSettings";

export function NavigationSettingsClient() {
  const [currentItems, setCurrentItems] = useState<string[]>(["dashboard", "ingredients", "recipes", "recipe-mixer"]);

  // Load current navigation preferences
  useEffect(() => {
    fetch("/api/user/navigation-preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data.navigationItems) {
          setCurrentItems(data.navigationItems);
        }
      })
      .catch(() => {
        // Use defaults if API fails
        setCurrentItems(["dashboard", "ingredients", "recipes", "recipe-mixer"]);
      });
  }, []);

  const handleSave = async (items: string[]) => {
    try {
      const response = await fetch("/api/user/navigation-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ navigationItems: items }),
      });
      if (response.ok) {
        // Refresh the page to update the navigation
        window.location.reload();
      } else {
        console.error("Failed to save navigation preferences");
      }
    } catch (error) {
      console.error("Failed to save navigation preferences:", error);
    }
  };

  return (
    <NavigationSettings 
      currentItems={currentItems}
      onSave={handleSave}
    />
  );
}
