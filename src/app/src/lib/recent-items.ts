"use client";

const RECENT_ITEMS_KEY = "plato_recent_items";
const MAX_RECENT_ITEMS = 20;

export interface RecentItem {
  id: number;
  type: "recipe" | "ingredient";
  name: string;
  url: string;
  accessedAt: number;
}

export function getRecentItems(): RecentItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    if (!stored) return [];
    
    const items = JSON.parse(stored) as RecentItem[];
    return items.sort((a, b) => b.accessedAt - a.accessedAt).slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
}

export function addRecentItem(item: Omit<RecentItem, "accessedAt">) {
  if (typeof window === "undefined") return;
  
  try {
    const items = getRecentItems();
    
    // Remove existing item if present
    const filtered = items.filter((i) => !(i.id === item.id && i.type === item.type));
    
    // Add new item at the beginning
    const updated = [
      { ...item, accessedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENT_ITEMS);
    
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore errors
  }
}

export function clearRecentItems() {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(RECENT_ITEMS_KEY);
  } catch {
    // Ignore errors
  }
}

export function removeRecentItem(id: number, type: "recipe" | "ingredient") {
  if (typeof window === "undefined") return;
  
  try {
    const items = getRecentItems();
    const filtered = items.filter((i) => !(i.id === id && i.type === type));
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore errors
  }
}

