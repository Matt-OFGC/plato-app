"use client";

import { useState } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Recipe {
  id: number;
  name: string;
  yieldQuantity: string;
  yieldUnit: string;
  category: string | null;
  categoryId: number | null;
  imageUrl: string | null;
}

interface ProductionItem {
  id: number;
  recipeId: number;
  quantity: number;
  completed: boolean;
  recipe: {
    id: number;
    name: string;
    yieldQuantity: string;
    yieldUnit: string;
  };
}

interface ProductionTask {
  id: number;
  title: string;
  description: string | null;
  assignedTo: number | null;
  dueDate: Date | null;
  completed: boolean;
}

interface ProductionPlan {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  notes: string | null;
  items: ProductionItem[];
  tasks: ProductionTask[];
}

interface TeamMember {
  id: number;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface ProductionPlannerProps {
  recipes: Recipe[];
  productionPlans: ProductionPlan[];
  teamMembers: TeamMember[];
  companyId: number;
}

export function ProductionPlanner({
  recipes,
  productionPlans: initialPlans,
  teamMembers,
  companyId,
}: ProductionPlannerProps) {
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [planName, setPlanName] = useState("");
  const [startDate, setStartDate] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6), "yyyy-MM-dd"));
  const [selectedRecipes, setSelectedRecipes] = useState<{ [key: number]: number }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [plans, setPlans] = useState(initialPlans);
  const [creating, setCreating] = useState(false);
  const [shoppingList, setShoppingList] = useState<any>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function createProductionPlan() {
    if (!planName) return;

    const items = Object.entries(selectedRecipes)
      .filter(([_, qty]) => qty > 0)
      .map(([recipeId, quantity]) => ({
        recipeId: parseInt(recipeId),
        quantity,
      }));

    if (items.length === 0) {
      alert("Please select at least one recipe");
      return;
    }

    setCreating(true);

    try {
      const res = await fetch("/api/production/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planName,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          items,
          companyId,
        }),
      });

      if (res.ok) {
        const newPlan = await res.json();
        setPlans([newPlan, ...plans]);
        setShowCreatePlan(false);
        setPlanName("");
        setSelectedRecipes({});
        setSearchTerm("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create plan");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function toggleItemComplete(planId: number, itemId: number, completed: boolean) {
    try {
      const res = await fetch(`/api/production/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });

      if (res.ok) {
        setPlans(plans.map(plan => {
          if (plan.id === planId) {
            return {
              ...plan,
              items: plan.items.map(item =>
                item.id === itemId ? { ...item, completed: !completed } : item
              ),
            };
          }
          return plan;
        }));
      }
    } catch (error) {
      console.error("Failed to toggle item:", error);
    }
  }

  async function generateShoppingList(planId: number) {
    try {
      const res = await fetch(`/api/production/shopping-list/${planId}`);
      if (res.ok) {
        const data = await res.json();
        setShoppingList(data);
        setShowShoppingList(true);
      } else {
        alert("Failed to generate shopping list");
      }
    } catch (error) {
      console.error("Failed to generate shopping list:", error);
      alert("Network error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Create New Plan Button */}
      <button
        onClick={() => setShowCreatePlan(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Production Plan
      </button>

      {/* Create Plan Modal */}
      <AnimatePresence>
        {showCreatePlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreatePlan(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Create Production Plan</h2>
                <p className="text-gray-600 mt-1">Select recipes and quantities for your bake schedule</p>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Plan Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan Name
                    </label>
                    <input
                      type="text"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      placeholder="e.g., Week 42 Production"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Recipe Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Recipes
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or category..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Recipe Selection */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Select Recipes & Quantities</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredRecipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{recipe.name}</h4>
                          <p className="text-sm text-gray-500">
                            Yields: {recipe.yieldQuantity} {recipe.yieldUnit}
                            {recipe.category && ` • ${recipe.category}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Qty:</label>
                          <input
                            type="number"
                            min="0"
                            value={selectedRecipes[recipe.id] || 0}
                            onChange={(e) =>
                              setSelectedRecipes({
                                ...selectedRecipes,
                                [recipe.id]: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
                <button
                  onClick={() => setShowCreatePlan(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createProductionPlan}
                  disabled={creating || !planName}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Plan"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Production Plans List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Production Plans</h2>
        {plans.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No production plans yet. Create your first one!</p>
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600">
                    {format(new Date(plan.startDate), "MMM d, yyyy")} - {format(new Date(plan.endDate), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => generateShoppingList(plan.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Shopping List
                  </button>
                  <div className="text-sm text-gray-500">
                    {plan.items.filter(i => i.completed).length} / {plan.items.length}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {plan.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleItemComplete(plan.id, item.id, item.completed)}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div className={item.completed ? "line-through text-gray-500" : ""}>
                        <p className="font-medium">{item.recipe.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} batch{item.quantity !== 1 ? "es" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Shopping List Modal */}
      <AnimatePresence>
        {showShoppingList && shoppingList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowShoppingList(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b bg-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Shopping List</h2>
                    <p className="text-gray-600 mt-1">{shoppingList.plan.name}</p>
                  </div>
                  <button
                    onClick={() => setShowShoppingList(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-3">
                  {shoppingList.shoppingList.map((item: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.ingredient.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Need: <span className="font-medium">{parseFloat(item.totalQuantity).toFixed(2)} {item.unit}</span>
                          </p>
                          <p className="text-sm text-blue-600 mt-1">
                            Order: <span className="font-medium">{item.packsNeeded} pack{item.packsNeeded !== 1 ? 's' : ''}</span>
                            {' '}({item.ingredient.packQuantity} {item.ingredient.packUnit} each)
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Used in: {item.recipes.join(", ")}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-gray-900">
                            {item.ingredient.currency === "GBP" ? "£" : "$"}
                            {(parseFloat(item.ingredient.packPrice) * item.packsNeeded).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.ingredient.currency}{item.ingredient.packPrice}/pack
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
                <button
                  onClick={() => setShowShoppingList(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

