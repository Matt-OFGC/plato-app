"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: number;
  recipeId: number | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  unit: string | null;
  price: string;
  currency: string;
  category: string | null;
  yieldQuantity: string | null;
  yieldUnit: string | null;
  hasCustomPrice?: boolean;
}

interface OrderItem {
  recipeId: number | null;
  productId: number;
  productName: string;
  quantity: number;
  price?: string;
  notes?: string;
}

interface CustomerPortalData {
  customer: {
    id: number;
    name: string;
    companyId: number;
  };
  company: {
    id: number;
    name: string;
    logoUrl: string | null;
  };
  products: Product[];
  recentOrders: any[];
}

export default function CustomerPortalPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CustomerPortalData | null>(null);
  const [cart, setCart] = useState<Map<number, OrderItem>>(new Map());
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("weekly");

  useEffect(() => {
    loadPortalData();
  }, [token]);

  async function loadPortalData() {
    try {
      const res = await fetch(`/api/wholesale/portal/${token}`);
      if (res.ok) {
        const portalData = await res.json();
        setData(portalData);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to load portal");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function addToCart(product: Product) {
    const newCart = new Map(cart);
    const existing = cart.get(product.id);
    if (existing) {
      newCart.set(product.id, { ...existing, quantity: existing.quantity + 1 });
    } else {
      newCart.set(product.id, {
        productId: product.id,
        recipeId: product.recipeId,
        productName: product.name,
        quantity: 1,
        price: product.price,
      });
    }
    setCart(newCart);
  }

  function updateCartQuantity(productId: number, quantity: number) {
    const newCart = new Map(cart);
    const existing = cart.get(productId);
    if (existing) {
      if (quantity <= 0) {
        newCart.delete(productId);
      } else {
        newCart.set(productId, { ...existing, quantity });
      }
      setCart(newCart);
    }
  }

  function removeFromCart(productId: number) {
    const newCart = new Map(cart);
    newCart.delete(productId);
    setCart(newCart);
  }

  async function submitOrder() {
    if (cart.size === 0) {
      alert("Please add items to your order");
      return;
    }

    setSubmitting(true);

    try {
      const items = Array.from(cart.values()).map(item => ({
        recipeId: item.recipeId,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
      }));
      
      const res = await fetch(`/api/wholesale/portal/${token}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryDate: deliveryDate || null,
          notes: orderNotes || null,
          items,
          isRecurring,
          recurringInterval: isRecurring ? recurringInterval : null,
        }),
      });

      if (res.ok) {
        setOrderSuccess(true);
        setCart(new Map());
        setDeliveryDate("");
        setOrderNotes("");
        setTimeout(() => setOrderSuccess(false), 5000);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to submit order");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredProducts = data?.products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const cartTotal = Array.from(cart.values()).reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">{error || "Portal not available"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {data.company.logoUrl && (
                <img
                  src={data.company.logoUrl}
                  alt={data.company.name}
                  className="h-12 w-auto"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{data.company.name}</h1>
                <p className="text-sm text-gray-600">Ordering Portal for {data.customer.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-semibold text-green-800">{cartTotal} items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {orderSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Order submitted successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Available Products</h2>
              
              {/* Search */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-4"
              />

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredRecipes.map((recipe) => (
                  <div key={recipe.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                    {recipe.imageUrl && (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-gray-900 mb-1">{recipe.name}</h3>
                    {recipe.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{recipe.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm">
                        <div className="text-gray-500">
                          {recipe.yieldQuantity} {recipe.yieldUnit}
                          {recipe.category && <span className="ml-2">• {recipe.category}</span>}
                        </div>
                        {recipe.sellingPrice && (
                          <div className="font-semibold text-gray-900 mt-1">
                            £{parseFloat(recipe.sellingPrice).toFixed(2)}
                            {recipe.hasCustomPrice && (
                              <span className="ml-1 text-xs font-normal text-blue-600">(Your Price)</span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => addToCart(recipe)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart & Order Form */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Order</h2>

              {/* Cart Items */}
              {cart.size === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500 text-sm">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {Array.from(cart.values()).map((item) => (
                    <div key={item.recipeId} className="flex items-center justify-between pb-3 border-b">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.recipeName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => updateCartQuantity(item.recipeId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.recipeId, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.recipeId)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Special instructions or notes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <button
                  onClick={submitOrder}
                  disabled={cart.size === 0 || submitting}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

