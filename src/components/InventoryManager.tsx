"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface Recipe {
  id: number;
  name: string;
  yieldQuantity: string;
  yieldUnit: string;
  category: string | null;
}

interface Movement {
  id: number;
  type: string;
  quantity: string;
  createdAt: Date;
  reason: string | null;
  notes: string | null;
}

interface InventoryItem {
  id: number;
  recipeId: number;
  quantity: string;
  unit: string;
  lowStockThreshold: string | null;
  lastRestocked: Date | null;
  recipe: {
    id: number;
    name: string;
    yieldUnit: string;
    category: string | null;
    imageUrl: string | null;
  };
  movements: Movement[];
}

interface InventoryManagerProps {
  inventory: InventoryItem[];
  recipes: Recipe[];
  companyId: number;
}

export function InventoryManager({
  inventory: initialInventory,
  recipes,
  companyId,
}: InventoryManagerProps) {
  const [inventory, setInventory] = useState(initialInventory);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "adjust">("add");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [selectedRecipe, setSelectedRecipe] = useState<number>(recipes[0]?.id || 0);
  const [quantity, setQuantity] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<"production" | "sale" | "adjustment" | "waste">("adjustment");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(0);

  function openAddModal() {
    setModalType("add");
    setSelectedItem(null);
    setSelectedRecipe(recipes[0]?.id || 0);
    setQuantity(0);
    setAdjustmentType("adjustment");
    setReason("");
    setNotes("");
    setLowStockThreshold(5);
    setShowModal(true);
  }

  function openAdjustModal(item: InventoryItem) {
    setModalType("adjust");
    setSelectedItem(item);
    setSelectedRecipe(item.recipeId);
    setQuantity(0);
    setAdjustmentType("adjustment");
    setReason("");
    setNotes("");
    setShowModal(true);
  }

  async function handleSave() {
    if (quantity === 0 && modalType === "adjust") {
      alert("Please enter a quantity");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          recipeId: selectedRecipe,
          quantity: quantity,
          type: adjustmentType,
          reason,
          notes,
          lowStockThreshold: modalType === "add" ? lowStockThreshold : undefined,
        }),
      });

      if (res.ok) {
        const updatedItem = await res.json();
        
        // Update inventory list
        const existing = inventory.find(i => i.recipeId === selectedRecipe);
        if (existing) {
          setInventory(inventory.map(i => 
            i.recipeId === selectedRecipe ? { 
              ...updatedItem,
              quantity: updatedItem.quantity.toString(),
              lowStockThreshold: updatedItem.lowStockThreshold?.toString() || null,
              recipe: {
                ...updatedItem.recipe,
                yieldQuantity: updatedItem.recipe.yieldQuantity?.toString(),
              },
              movements: updatedItem.movements.map((m: any) => ({
                ...m,
                quantity: m.quantity.toString(),
              })),
            } : i
          ));
        } else {
          setInventory([...inventory, {
            ...updatedItem,
            quantity: updatedItem.quantity.toString(),
            lowStockThreshold: updatedItem.lowStockThreshold?.toString() || null,
            recipe: {
              ...updatedItem.recipe,
              yieldQuantity: updatedItem.recipe.yieldQuantity?.toString(),
            },
            movements: updatedItem.movements.map((m: any) => ({
              ...m,
              quantity: m.quantity.toString(),
            })),
          }]);
        }
        
        setShowModal(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update inventory");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  const lowStockItems = inventory.filter(item => {
    if (!item.lowStockThreshold) return false;
    return parseFloat(item.quantity) <= parseFloat(item.lowStockThreshold);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Inventory Item
        </button>

        {lowStockItems.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium text-red-800">
              {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} low on stock
            </span>
          </div>
        )}
      </div>

      {/* Inventory Grid */}
      {inventory.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-gray-600">No inventory items yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((item) => {
            const isLowStock = item.lowStockThreshold && parseFloat(item.quantity) <= parseFloat(item.lowStockThreshold);
            
            return (
              <div
                key={item.id}
                className={`bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow ${
                  isLowStock ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {item.recipe.imageUrl && (
                    <img
                      src={item.recipe.imageUrl}
                      alt={item.recipe.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.recipe.name}</h3>
                    {item.recipe.category && (
                      <p className="text-xs text-gray-500">{item.recipe.category}</p>
                    )}
                  </div>
                  {isLowStock && (
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {parseFloat(item.quantity)}
                    </span>
                    <span className="text-sm text-gray-600">{item.unit}</span>
                  </div>
                  {item.lowStockThreshold && (
                    <p className="text-xs text-gray-500">
                      Alert threshold: {parseFloat(item.lowStockThreshold)} {item.unit}
                    </p>
                  )}
                  {item.lastRestocked && (
                    <p className="text-xs text-gray-500">
                      Last restocked: {format(new Date(item.lastRestocked), "MMM d, yyyy")}
                    </p>
                  )}
                </div>

                {/* Recent Movements */}
                {item.movements.length > 0 && (
                  <div className="mb-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-1">Recent:</p>
                    <div className="space-y-1">
                      {item.movements.slice(0, 2).map((movement) => (
                        <div key={movement.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 capitalize">{movement.type}</span>
                          <span className={`font-medium ${parseFloat(movement.quantity) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {parseFloat(movement.quantity) > 0 ? '+' : ''}{parseFloat(movement.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => openAdjustModal(item)}
                  className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  Adjust Stock
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Adjust Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  {modalType === "add" ? "Add Inventory Item" : "Adjust Stock"}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipe
                  </label>
                  <select
                    value={selectedRecipe}
                    onChange={(e) => setSelectedRecipe(parseInt(e.target.value))}
                    disabled={modalType === "adjust"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  >
                    {recipes.map(recipe => (
                      <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity {modalType === "adjust" && "(positive to add, negative to subtract)"}
                  </label>
                  <input
                    type="number"
                    value={quantity || ""}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="production">Production (made)</option>
                    <option value="sale">Sale (sold)</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="waste">Waste</option>
                  </select>
                </div>

                {modalType === "add" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Low Stock Alert Threshold
                    </label>
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Weekly production"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

