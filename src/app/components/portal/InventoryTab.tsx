"use client";

import { useEffect, useState } from "react";

type InventoryItem = {
  id: number;
  recipe?: { id: number; name: string; imageUrl?: string | null } | null;
  productionItem?: { id: number; recipe?: { name: string | null } | null } | null;
  deliveryDate: string;
  expiryDate: string;
  originalQuantity: number;
  currentStock: number;
  daysUntilExpiry?: number;
  expiryStatus?: "fresh" | "expiring_soon" | "expired";
};

export function InventoryTab({ token }: { token: string }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/wholesale/portal/${token}/inventory`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load inventory");
        }
        setInventory(data.inventory || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load inventory");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) return <p className="text-sm text-gray-600">Loading inventory...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (!inventory.length) {
    return (
      <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-white text-sm text-gray-700">
        No active inventory items yet. New deliveries will appear here with expiry and current stock.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inventory.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-semibold text-lg">
                {item.recipe?.name || item.productionItem?.recipe?.name || "Product"}
              </h3>
              <p className="text-sm text-gray-600">
                Delivered {new Date(item.deliveryDate).toLocaleDateString()}
              </p>
              <p
                className={`text-sm font-medium ${
                  item.expiryStatus === "fresh"
                    ? "text-emerald-600"
                    : item.expiryStatus === "expiring_soon"
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {item.expiryStatus === "expired"
                  ? "Expired"
                  : `Expires ${new Date(item.expiryDate).toLocaleDateString()}${
                      item.daysUntilExpiry !== undefined ? ` (${item.daysUntilExpiry} days)` : ""
                    }`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{item.currentStock}</div>
              <div className="text-xs text-gray-600">of {item.originalQuantity}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

