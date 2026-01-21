"use client";

import { FormEvent, useEffect, useState } from "react";

type InventoryItem = {
  id: number;
  recipe?: { id: number; name: string; imageUrl?: string | null } | null;
  productionItem?: { id: number; recipe?: { name: string | null } | null } | null;
  currentStock: number;
  stockChecks?: Array<{ id: number }>;
};

type StockCheckPayload = {
  sales: number;
  wastage: number;
  notes?: string;
};

export function StockCheckTab({ token }: { token: string }) {
  const [pending, setPending] = useState<InventoryItem[]>([]);
  const [completed, setCompleted] = useState<InventoryItem[]>([]);
  const [checks, setChecks] = useState<Record<number, StockCheckPayload>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const res = await fetch(`/api/wholesale/portal/${token}/stock-checks`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load stock checks");
        setPending(data.pending || []);
        setCompleted(data.completed || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load stock checks");
      }
    }
    load();
  }, [token]);

  useEffect(() => {
    if (pending.length === 0) return;
    setChecks((prev) => {
      const next = { ...prev };
      pending.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = { sales: 0, wastage: 0 };
        }
      });
      return next;
    });
  }, [pending]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Client-side validation to avoid negative closing
      const invalid = pending.find((item) => {
        const data = checks[item.id] || { sales: 0, wastage: 0 };
        const closing = item.currentStock - (data.sales ?? 0) - (data.wastage ?? 0);
        return closing < 0;
      });
      if (invalid) {
        throw new Error("Sales + wastage cannot exceed current stock.");
      }

      for (const item of pending) {
        const data = checks[item.id] || { sales: 0, wastage: 0 };
        const res = await fetch(`/api/wholesale/portal/${token}/stock-checks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inventoryId: item.id, ...data }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to save stock check.");
        }
      }
      // Refresh lists after submission
      const res = await fetch(`/api/wholesale/portal/${token}/stock-checks`);
      const data = await res.json();
      if (res.ok) {
        setPending(data.pending || []);
        setCompleted(data.completed || []);
        setChecks({});
      } else {
        throw new Error(data.error || "Failed to refresh");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Daily Stock Check</h2>
        <p className="text-sm text-gray-600">
          Pending: {pending.length} · Completed today: {completed.length}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {pending.length === 0 ? (
        <p className="text-sm text-gray-600">No pending stock checks.</p>
      ) : (
        pending.map((item) => {
          const sales = checks[item.id]?.sales ?? 0;
          const wastage = checks[item.id]?.wastage ?? 0;
          const closing = item.currentStock - sales - wastage;

          return (
            <div key={item.id} className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {item.recipe?.name || item.productionItem?.recipe?.name || "Product"}
                  </h3>
                  <p className="text-sm text-gray-600">Opening: {item.currentStock}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Sales</label>
                  <input
                    type="number"
                    min={0}
                    max={item.currentStock}
                    className="w-full p-2 border rounded text-lg"
                    value={sales}
                    onChange={(e) =>
                      setChecks((prev) => ({
                        ...prev,
                        [item.id]: {
                          ...prev[item.id],
                          sales: parseInt(e.target.value || "0", 10),
                          wastage,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Wastage</label>
                  <input
                    type="number"
                    min={0}
                    max={item.currentStock}
                    className="w-full p-2 border rounded text-lg"
                    value={wastage}
                    onChange={(e) =>
                      setChecks((prev) => ({
                        ...prev,
                        [item.id]: {
                          ...prev[item.id],
                          sales,
                          wastage: parseInt(e.target.value || "0", 10),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Closing Stock</label>
                  <div className="text-2xl font-bold">{closing}</div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {pending.length > 0 && (
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Stock Checks"}
        </button>
      )}
    </form>
  );
}

