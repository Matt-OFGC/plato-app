"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Recipe {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  yieldQuantity: string;
  yieldUnit: string;
  category: string | null;
  sellingPrice: string | null;
}

interface WholesaleProduct {
  id: number;
  recipeId: number | null;
  name: string | null;
  description: string | null;
  unit: string | null;
  price: string;
  currency: string;
  category: string | null;
  isActive: boolean;
  sortOrder: number;
  imageUrl: string | null;
  notes: string | null;
  recipe: Recipe | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WholesaleProductsProps {
  products: WholesaleProduct[];
  recipes: Recipe[];
  companyId: number;
}

export function WholesaleProducts({
  products: initialProducts,
  recipes,
  companyId,
}: WholesaleProductsProps) {
  const [products, setProducts] = useState(initialProducts);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<WholesaleProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");

  // Form state
  const [recipeId, setRecipeId] = useState<number>(0);
  const [customName, setCustomName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [useCustomProduct, setUseCustomProduct] = useState(false);

  function openModal(product?: WholesaleProduct) {
    if (product) {
      setEditingProduct(product);
      setRecipeId(product.recipeId || 0);
      setCustomName(product.name || "");
      setDescription(product.description || "");
      setUnit(product.unit || "");
      setPrice(product.price);
      setCurrency(product.currency);
      setCategory(product.category || "");
      setIsActive(product.isActive);
      setSortOrder(product.sortOrder);
      setImageUrl(product.imageUrl || "");
      setNotes(product.notes || "");
      setUseCustomProduct(!product.recipeId);
    } else {
      setEditingProduct(null);
      setRecipeId(recipes[0]?.id || 0);
      setCustomName("");
      setDescription("");
      setUnit("");
      setPrice("");
      setCurrency("GBP");
      setCategory("");
      setIsActive(true);
      setSortOrder(0);
      setImageUrl("");
      setNotes("");
      setUseCustomProduct(false);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProduct(null);
  }

  // When a recipe is selected, auto-populate fields
  function handleRecipeSelect(selectedRecipeId: number) {
    setRecipeId(selectedRecipeId);
    const recipe = recipes.find((r) => r.id === selectedRecipeId);
    if (recipe) {
      setDescription(recipe.description || "");
      setUnit(`per ${recipe.yieldQuantity} ${recipe.yieldUnit}`);
      setPrice(recipe.sellingPrice || "");
      setCategory(recipe.category || "");
      setImageUrl(recipe.imageUrl || "");
    }
  }

  async function handleSave() {
    if (useCustomProduct && !customName.trim()) {
      alert("Product name is required for custom products");
      return;
    }

    if (!useCustomProduct && recipeId === 0) {
      alert("Please select a recipe");
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    setSaving(true);

    try {
      const url = editingProduct
        ? `/api/wholesale/products/${editingProduct.id}`
        : "/api/wholesale/products";

      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          recipeId: useCustomProduct ? null : recipeId,
          name: useCustomProduct ? customName : null,
          description: description || null,
          unit: unit || null,
          price: parseFloat(price),
          currency,
          category: category || null,
          isActive,
          sortOrder,
          imageUrl: imageUrl || null,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        const product = await res.json();

        if (editingProduct) {
          setProducts(products.map((p) => (p.id === editingProduct.id ? product : p)));
        } else {
          setProducts([product, ...products]);
        }

        closeModal();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save product");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/wholesale/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete product");
      }
    } catch (error) {
      alert("Network error");
    }
  }

  async function toggleActiveStatus(id: number, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/wholesale/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProducts(products.map((p) => (p.id === id ? updated : p)));
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  }

  // Get unique categories
  const categories = Array.from(
    new Set(
      products
        .map((p) => p.category)
        .filter((c) => c !== null)
        .concat(recipes.map((r) => r.category).filter((c) => c !== null))
    )
  ).sort();

  // Filter products
  const filteredProducts = products.filter((product) => {
    if (filterCategory !== "all" && product.category !== filterCategory) {
      return false;
    }
    if (filterActive === "active" && !product.isActive) {
      return false;
    }
    if (filterActive === "inactive" && product.isActive) {
      return false;
    }
    return true;
  });

  const displayName = (product: WholesaleProduct) => {
    return product.name || product.recipe?.name || "Unnamed Product";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>

        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat!}>
                {cat}
              </option>
            ))}
          </select>

          {/* Active Filter */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="all">All Products</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-gray-600">No products yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const img = product.imageUrl || product.recipe?.imageUrl;
            const desc = product.description || product.recipe?.description;

            return (
              <div
                key={product.id}
                className={`bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
                  !product.isActive ? "opacity-60" : ""
                }`}
              >
                {img && (
                  <img src={img} alt={displayName(product)} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">{displayName(product)}</h3>
                    <button
                      onClick={() => toggleActiveStatus(product.id, product.isActive)}
                      className={`flex-shrink-0 ml-2 px-2 py-1 rounded text-xs font-medium ${
                        product.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>

                  {desc && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{desc}</p>}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-semibold text-gray-900">
                        {product.currency === "GBP" ? "£" : product.currency}
                        {parseFloat(product.price).toFixed(2)}
                      </span>
                    </div>
                    {product.unit && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Unit:</span>
                        <span className="text-gray-700">{product.unit}</span>
                      </div>
                    )}
                    {product.category && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Category:</span>
                        <span className="text-gray-700">{product.category}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(product)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h2>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Product Type Toggle */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!useCustomProduct}
                      onChange={() => setUseCustomProduct(false)}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Link to Recipe</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={useCustomProduct}
                      onChange={() => setUseCustomProduct(true)}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Custom Product</span>
                  </label>
                </div>

                {/* Recipe Selection or Custom Name */}
                {!useCustomProduct ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipe <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={recipeId}
                      onChange={(e) => handleRecipeSelect(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value={0}>Select a recipe...</option>
                      {recipes.map((recipe) => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g., Artisan Sourdough Loaf"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Product description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Unit & Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g., per box, per tray"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Cakes, Brownies, Savouries"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Internal Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal notes (not visible to customers)..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Active Status */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Active (visible to customers)
                    </span>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || (!useCustomProduct && recipeId === 0) || (useCustomProduct && !customName.trim()) || !price}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {saving
                    ? editingProduct
                      ? "Updating..."
                      : "Adding..."
                    : editingProduct
                    ? "Update Product"
                    : "Add Product"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

