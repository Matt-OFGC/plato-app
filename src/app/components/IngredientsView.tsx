"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/currency";
import { Unit, BaseUnit, fromBase } from "@/lib/units";
import { formatLastUpdate, checkPriceStatus, getPriceStatusColorClass } from "@/lib/priceTracking";

interface Ingredient {
  id: number;
  name: string;
  supplier: string | null;
  supplierRef: { name: string; contactName: string | null; minimumOrder: number | null } | null;
  packQuantity: number;
  packUnit: string;
  originalUnit: string | null;
  packPrice: number;
  currency: string;
  densityGPerMl: number | null;
  lastPriceUpdate: Date | null;
  purchaseQuantity?: number | null;
  purchaseUnit?: string | null;
  packCount?: number | null;
}

interface IngredientsViewProps {
  ingredients: Ingredient[];
  deleteIngredient: (id: number) => Promise<void>; // Server action
  onEdit?: (ingredient: Ingredient) => void; // Callback for editing
  onNew?: () => void; // Callback for creating new ingredient
  selectedIds?: Set<number>;
  onSelect?: (id: number) => void;
  onSelectAll?: () => void;
  isSelecting?: boolean;
}

export function IngredientsView({ ingredients, deleteIngredient, onEdit, onNew, selectedIds = new Set(), onSelect, onSelectAll, isSelecting = false }: IngredientsViewProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [columnPrefs, setColumnPrefs] = useState<Record<string, { width: number; visible: boolean }>>({});
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [resizing, setResizing] = useState<{ key: string; startX: number; startWidth: number } | null>(null);

  const defaultColumns: { key: string; label: string; width: number; visible: boolean; min: number; max: number; fixed?: boolean }[] = [
    { key: "name", label: "Name", width: 280, visible: true, min: 180, max: 420, fixed: true },
    { key: "supplier", label: "Supplier", width: 180, visible: true, min: 140, max: 320 },
    { key: "allergens", label: "Allergens", width: 180, visible: true, min: 140, max: 320 },
    { key: "packCount", label: "Pack Count", width: 110, visible: true, min: 90, max: 180 },
    { key: "packSize", label: "Pack Size", width: 140, visible: true, min: 110, max: 220 },
    { key: "purchaseSize", label: "Purchase Size", width: 150, visible: true, min: 120, max: 240 },
    { key: "perUnitCost", label: "Per-Unit Cost", width: 140, visible: true, min: 120, max: 240 },
    { key: "price", label: "Price", width: 120, visible: true, min: 100, max: 200 },
    { key: "lastUpdated", label: "Last Updated", width: 150, visible: true, min: 130, max: 220 },
    { key: "actions", label: "Actions", width: 150, visible: true, min: 130, max: 220, fixed: true },
  ];

  const normalizePrefs = (incoming?: Record<string, { width?: number; visible?: boolean }>) => {
    const prefs: Record<string, { width: number; visible: boolean }> = {};
    defaultColumns.forEach((col) => {
      const current = incoming?.[col.key];
      const width = current?.width && current.width > 0 ? current.width : col.width;
      prefs[col.key] = {
        width: Math.min(Math.max(width, col.min), col.max),
        visible: current?.visible ?? col.visible,
      };
    });
    return prefs;
  };

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        // try server
        const res = await fetch("/api/user/app-preferences");
        if (res.ok) {
          const data = await res.json();
          const fromServer = data?.preferences?.ingredientsTable as Record<string, { width?: number; visible?: boolean }> | undefined;
          if (fromServer) {
            setColumnPrefs(normalizePrefs(fromServer));
            setIsLoadingPrefs(false);
            return;
          }
        }
      } catch (e) {
        // ignore, fall back
      }
      // fallback localStorage
      try {
        const cached = localStorage.getItem("ingredientsTablePrefs");
        if (cached) {
          const parsed = JSON.parse(cached);
          setColumnPrefs(normalizePrefs(parsed));
          setIsLoadingPrefs(false);
          return;
        }
      } catch {
        // ignore
      }
      setColumnPrefs(normalizePrefs());
      setIsLoadingPrefs(false);
    };
    loadPrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistPrefs = async (nextPrefs: Record<string, { width: number; visible: boolean }>) => {
    setIsSavingPrefs(true);
    try {
      localStorage.setItem("ingredientsTablePrefs", JSON.stringify(nextPrefs));
      // fire and forget server save
      fetch("/api/user/app-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: {
            ingredientsTable: nextPrefs,
          },
        }),
      }).catch(() => {});
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleResizeStart = (key: string, startX: number) => {
    const current = columnPrefs[key] || { width: defaultColumns.find((c) => c.key === key)?.width || 150, visible: true };
    setResizing({ key, startX, startWidth: current.width });
  };

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - resizing.startX;
      const meta = defaultColumns.find((c) => c.key === resizing.key);
      const min = meta?.min ?? 100;
      const max = meta?.max ?? 400;
      const nextWidth = Math.min(Math.max(resizing.startWidth + delta, min), max);
      setColumnPrefs((prev) => {
        const next = { ...prev, [resizing.key]: { ...(prev[resizing.key] || { visible: true, width: nextWidth }), width: nextWidth } };
        persistPrefs(next);
        return next;
      });
    };
    const onUp = () => setResizing(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizing, defaultColumns, columnPrefs]);

  const toggleColumn = (key: string) => {
    const meta = defaultColumns.find((c) => c.key === key);
    if (meta?.fixed) return; // don't allow hiding required cols
    setColumnPrefs((prev) => {
      const next = {
        ...prev,
        [key]: {
          width: prev[key]?.width ?? meta?.width ?? 150,
          visible: !(prev[key]?.visible ?? meta?.visible ?? true),
        },
      };
      persistPrefs(next);
      return next;
    });
  };

  const visibleColumns = defaultColumns.filter((col) => (columnPrefs[col.key]?.visible ?? col.visible));

  if (isLoadingPrefs) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-sm text-gray-500 shadow-sm">
        Loading table layout…
      </div>
    );
  }

  const formatPerUnitCost = (value: number, currency: string) => {
    const fractionDigits = value < 0.1 ? 4 : 2;
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  };

  const formatQuantity = (value: number, unit: string) => {
    let qty = value;
    let u = unit;
    if (unit === "mg" && qty >= 1000) {
      qty = qty / 1000;
      u = "g";
    } else if (unit === "g" && qty >= 1000) {
      qty = qty / 1000;
      u = "kg";
    } else if (unit === "kg" && qty < 1) {
      qty = qty * 1000;
      u = "g";
    } else if (unit === "ml" && qty >= 1000) {
      qty = qty / 1000;
      u = "l";
    } else if (unit === "l" && qty < 1) {
      qty = qty * 1000;
      u = "ml";
    }
    const formatted =
      Math.abs(qty - Math.round(qty)) < 1e-6 ? Math.round(qty).toString() : qty.toFixed(2).replace(/\.?0+$/, "");
    return `${formatted} ${u}`;
  };

  if (ingredients.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-[var(--secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No ingredients yet</h3>
        <p className="text-[var(--muted-foreground)] mb-6">Get started by adding your first ingredient</p>
        <button 
          onClick={() => onNew?.()}
          className="btn-primary"
        >
          Add First Ingredient
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-600">
          Showing {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <details className="w-full">
              <summary className="list-none cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-emerald-50/80 bg-white/80 backdrop-blur-sm text-gray-800 hover:text-emerald-700 hover:bg-white shadow-sm px-3.5 py-2 transition-colors">
                Columns
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200/80 p-3 z-20">
                <p className="text-xs text-gray-500 mb-2">Show / hide columns</p>
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {defaultColumns.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={columnPrefs[col.key]?.visible ?? col.visible}
                        disabled={col.fixed}
                        onChange={() => toggleColumn(col.key)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                      />
                      <span className={col.fixed ? "text-gray-400" : ""}>{col.label}{col.fixed ? " (fixed)" : ""}</span>
                    </label>
                  ))}
                </div>
              </div>
            </details>
          </div>
          {isSavingPrefs && <span className="text-xs text-gray-400">Saving…</span>}
        </div>
      </div>

      {/* List view only */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto mobile-table-wrapper">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isSelecting && (
                    <th className="px-2 lg:px-3 xl:px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === ingredients.length && ingredients.length > 0}
                        onChange={onSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                  )}
                  {defaultColumns.map((col) => {
                    if (!(columnPrefs[col.key]?.visible ?? col.visible)) return null;
                    const width = columnPrefs[col.key]?.width ?? col.width;
                    const showDivider = col.key === "lastUpdated" || col.key === "actions";
                    return (
                      <th
                        key={col.key}
                        style={{ width }}
                        className={`px-2 lg:px-3 xl:px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${showDivider ? "border-l border-gray-200/80" : ""} relative`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{col.label}</span>
                          {!col.fixed && (
                            <span className="text-[10px] text-gray-400">⋮</span>
                          )}
                        </div>
                        {!col.fixed && (
                          <div
                            className="absolute right-0 top-0 h-full w-3 cursor-col-resize select-none"
                            onMouseDown={(e) => handleResizeStart(col.key, e.clientX)}
                            style={{ opacity: 0, transition: "opacity 150ms" }}
                            onMouseEnter={(e) => { (e.currentTarget.style.opacity = "1"); }}
                            onMouseLeave={(e) => { (e.currentTarget.style.opacity = "0"); }}
                          >
                            <span className="block h-full w-px bg-emerald-200"></span>
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ingredients.map((ing) => {
                  // Per-unit (pack size) = total purchase size / pack count
                  const displayUnit = ing.packUnit || 'each';
                  const displayQuantity = ing.packCount && ing.packCount > 0
                    ? Number(ing.packQuantity) / ing.packCount
                    : Number(ing.packQuantity);
                  const priceStatus = checkPriceStatus(ing.lastPriceUpdate || new Date());
                  const perUnitCost = Number(ing.packQuantity) > 0 ? ing.packPrice / Number(ing.packQuantity) : null;
                  const colorClass = getPriceStatusColorClass(priceStatus.status);
                  
                  return (
                    <tr key={ing.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(ing.id) ? 'bg-emerald-50' : ''}`}>
                      {isSelecting && (
                        <td className="px-2 lg:px-3 xl:px-4 py-2.5 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(ing.id)}
                            onChange={() => onSelect?.(ing.id)}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                      )}
                      {defaultColumns.map((col) => {
                        if (!(columnPrefs[col.key]?.visible ?? col.visible)) return null;
                        const width = columnPrefs[col.key]?.width ?? col.width;
                        const showDivider = col.key === "lastUpdated" || col.key === "actions";
                        if (col.key === "name") {
                          return (
                            <td key={col.key} style={{ width }} className="px-2 lg:px-3 xl:px-4 py-2.5 whitespace-nowrap">
                              <button 
                                onClick={() => onEdit?.(ing)}
                                className="text-sm font-medium text-gray-900 hover:text-emerald-600 text-left mobile-touch-target"
                              >
                                {ing.name}
                              </button>
                            </td>
                          );
                        }
                        if (col.key === "supplier") {
                          return (
                            <td key={col.key} style={{ width }} className="hidden xl:table-cell px-2 lg:px-3 xl:px-4 py-2.5 whitespace-nowrap text-sm text-gray-600">
                              {ing.supplierRef?.name || ing.supplier || '-'}
                            </td>
                          );
                        }
                        if (col.key === "allergens") {
                          return (
                            <td key={col.key} style={{ width }} className="hidden xl:table-cell px-2 lg:px-3 xl:px-4 py-2.5 text-sm">
                              {ing.allergens && ing.allergens.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {ing.allergens.slice(0, 3).map((allergen, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                                    >
                                      {allergen}
                                    </span>
                                  ))}
                                  {ing.allergens.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      +{ing.allergens.length - 3}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        }
                        if (col.key === "packCount") {
                          return (
                            <td key={col.key} style={{ width }} className="px-2 lg:px-3 xl:px-4 py-2.5 whitespace-nowrap text-sm text-gray-900">
                              {ing.packCount ? ing.packCount : '-'}
                            </td>
                          );
                        }
                        if (col.key === "packSize") {
                          return (
                            <td key={col.key} style={{ width }} className="px-2 lg:px-3 xl:px-4 py-2.5 whitespace-nowrap text-sm text-gray-900">
                              {formatQuantity(displayQuantity, displayUnit)}
                            </td>
                          );
                        }
                        if (col.key === "purchaseSize") {
                          const hasPurchase = ing.purchaseQuantity && ing.purchaseUnit;
                          return (
                            <td key={col.key} style={{ width }} className="px-2 lg:px-3 xl:px-4 py-2.5 whitespace-nowrap text-sm text-gray-900">
                              {hasPurchase
                                ? formatQuantity(Number(ing.purchaseQuantity), ing.purchaseUnit as string)
                                : '-'}
                            </td>
                          );
                        }
                        if (col.key === "perUnitCost") {
                          return (
                            <td key={col.key} style={{ width }} className="px-2 lg:px-3 xl:px-4 py-2.5 whitespace-nowrap text-sm text-gray-900">
                              {perUnitCost !== null ? formatPerUnitCost(perUnitCost, ing.currency) : '-'}
                            </td>
                          );
                        }
                        if (col.key === "price") {
                          return (
                            <td key={col.key} style={{ width }} className="px-2 lg:px-3 xl:px-4 py-2.5 whitespace-nowrap text-sm font-semibold text-emerald-600">
                              {formatCurrency(Number(ing.packPrice), ing.currency)}
                            </td>
                          );
                        }
                        if (col.key === "lastUpdated") {
                          return (
                            <td key={col.key} style={{ width }} className={`hidden lg:table-cell px-2 lg:px-3 xl:px-4 py-2.5 whitespace-nowrap ${showDivider ? "border-l border-gray-200/80" : ""}`}>
                              <span className={`text-xs px-2 py-1 rounded-full ${colorClass.replace('border', 'border-0')}`}>
                                {formatLastUpdate(ing.lastPriceUpdate || new Date())}
                              </span>
                            </td>
                          );
                        }
                        if (col.key === "actions") {
                          return (
                            <td key={col.key} style={{ width }} className={`px-2 lg:px-3 xl:px-4 py-2.5 whitespace-nowrap text-right text-sm font-medium ${showDivider ? "border-l border-gray-200/80" : ""}`}>
                              <button
                                onClick={() => onEdit?.(ing)}
                                className="inline-flex items-center gap-1 rounded-xl border border-emerald-100 bg-white/70 backdrop-blur-sm text-emerald-700 hover:text-emerald-800 hover:bg-white shadow-sm px-3 py-1.5 mr-2 lg:mr-3 transition-colors duration-150 mobile-touch-target"
                              >
                                Edit
                              </button>
                              <button 
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                  if (!confirm("Delete this ingredient? This cannot be undone.")) return;
                                  startTransition(async () => {
                                    try {
                                      await deleteIngredient(ing.id);
                                      router.refresh();
                                    } catch (error: any) {
                                      alert(error.message || "Failed to delete ingredient");
                                    }
                                  });
                                }}
                                className="inline-flex items-center gap-1 rounded-xl border border-red-100 bg-white/70 backdrop-blur-sm text-red-600 hover:text-red-700 hover:bg-white shadow-sm px-3 py-1.5 disabled:opacity-50 transition-colors duration-150 mobile-touch-target"
                              >
                                {isPending ? 'Deleting…' : 'Delete'}
                              </button>
                            </td>
                          );
                        }
                        return null;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
    </>
  );
}

