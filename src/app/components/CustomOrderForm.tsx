"use client";

import { useState } from "react";
import { format } from "date-fns";

interface Customer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface Product {
  id: number;
  recipeId: number | null;
  name: string;
  description?: string | null;
  price: string;
  imageUrl?: string | null;
  category?: string | null;
}

interface CustomOrderFormProps {
  companyId: number;
  customers: Customer[];
  products: Product[];
  defaultDeliveryDate?: Date;
  onOrderCreated?: (order: any) => void;
  onClose?: () => void;
}

export function CustomOrderForm({
  companyId,
  customers,
  products,
  defaultDeliveryDate,
  onOrderCreated,
  onClose,
}: CustomOrderFormProps) {
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"customer" | "items" | "details">("customer");
  
  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postcode: "",
  });

  // Order details
  const [deliveryDate, setDeliveryDate] = useState(
    defaultDeliveryDate ? format(defaultDeliveryDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [deliveryTime, setDeliveryTime] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Order items
  const [orderItems, setOrderItems] = useState<Map<number, { quantity: number; notes: string }>>(new Map());
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  function addProduct(productId: number) {
    const current = orderItems.get(productId) || { quantity: 1, notes: "" };
    setOrderItems(new Map(orderItems).set(productId, current));
  }

  function updateQuantity(productId: number, quantity: number) {
    const current = orderItems.get(productId);
    if (current) {
      setOrderItems(new Map(orderItems).set(productId, { ...current, quantity }));
    }
  }

  function updateItemNotes(productId: number, notes: string) {
    const current = orderItems.get(productId);
    if (current) {
      setOrderItems(new Map(orderItems).set(productId, { ...current, notes }));
    }
  }

  function removeProduct(productId: number) {
    const newMap = new Map(orderItems);
    newMap.delete(productId);
    setOrderItems(newMap);
  }

  async function createCustomer() {
    if (!newCustomer.name.trim()) {
      alert("Please enter a customer name");
      return;
    }

    try {
      const res = await fetch("/api/wholesale/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          name: newCustomer.name,
          email: newCustomer.email || null,
          phone: newCustomer.phone || null,
          address: newCustomer.address || null,
          city: newCustomer.city || null,
          postcode: newCustomer.postcode || null,
          isActive: true,
        }),
      });

      if (res.ok) {
        const customer = await res.json();
        setSelectedCustomerId(customer.id);
        setIsNewCustomer(false);
        setStep("items");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create customer");
      }
    } catch (error) {
      alert("Network error");
    }
  }

  async function handleSave() {
    if (selectedCustomerId === 0) {
      alert("Please select or create a customer");
      return;
    }

    if (orderItems.size === 0) {
      alert("Please add at least one item");
      return;
    }

    setSaving(true);
    try {
      const items = Array.from(orderItems.entries()).map(([productId, data]) => {
        const product = products.find(p => p.id === productId);
        return {
          recipeId: product?.recipeId || productId,
          quantity: data.quantity,
          price: product?.price || null,
          notes: data.notes || null,
        };
      });

      const res = await fetch("/api/wholesale/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          companyId,
          deliveryDate: deliveryDate || null,
          status: "pending",
          notes: orderNotes || null,
          items,
        }),
      });

      if (res.ok) {
        const order = await res.json();
        if (onOrderCreated) {
          onOrderCreated(order);
        }
        if (onClose) {
          onClose();
        }
        alert("Order created successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create order");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  const totalAmount = Array.from(orderItems.entries()).reduce((sum, [productId, data]) => {
    const product = products.find(p => p.id === productId);
    return sum + (product ? parseFloat(product.price) * data.quantity : 0);
  }, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step === "customer" ? "text-green-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "customer" ? "bg-green-600 text-white" : "bg-gray-200"}`}>
              1
            </div>
            <span className="ml-2 font-medium">Customer</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${step !== "customer" ? "bg-green-600" : "bg-gray-200"}`} />
          <div className={`flex items-center ${step === "items" ? "text-green-600" : step === "details" ? "text-green-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "items" || step === "details" ? "bg-green-600 text-white" : "bg-gray-200"}`}>
              2
            </div>
            <span className="ml-2 font-medium">Items</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${step === "details" ? "bg-green-600" : "bg-gray-200"}`} />
          <div className={`flex items-center ${step === "details" ? "text-green-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "details" ? "bg-green-600 text-white" : "bg-gray-200"}`}>
              3
            </div>
            <span className="ml-2 font-medium">Details</span>
          </div>
        </div>
      </div>

      {/* Step 1: Customer Selection */}
      {step === "customer" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Customer</h2>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setIsNewCustomer(false)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                !isNewCustomer ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              Existing Customer
            </button>
            <button
              onClick={() => setIsNewCustomer(true)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isNewCustomer ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              New Customer
            </button>
          </div>

          {!isNewCustomer ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Customer
              </label>
              <select
                value={selectedCustomerId || ""}
                onChange={(e) => setSelectedCustomerId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Choose a customer...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.email ? `(${customer.email})` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                  <input
                    type="text"
                    value={newCustomer.postcode}
                    onChange={(e) => setNewCustomer({ ...newCustomer, postcode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => {
                if (isNewCustomer) {
                  createCustomer();
                } else if (selectedCustomerId) {
                  setStep("items");
                } else {
                  alert("Please select a customer");
                }
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Next: Add Items
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Items */}
      {step === "items" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Items</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Products
            </label>
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search by name or category..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className={`p-3 border rounded-lg ${
                  orderItems.has(product.id) ? "border-green-500 bg-green-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-gray-500 mt-1">{product.description}</div>
                    )}
                    <div className="text-sm font-semibold text-green-600 mt-1">
                      £{parseFloat(product.price).toFixed(2)}
                    </div>
                  </div>
                </div>
                {orderItems.has(product.id) ? (
                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-sm text-gray-700">Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      value={orderItems.get(product.id)?.quantity || 1}
                      onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addProduct(product.id)}
                    className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    Add to Order
                  </button>
                )}
              </div>
            ))}
          </div>

          {orderItems.size > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
              <div className="space-y-2">
                {Array.from(orderItems.entries()).map(([productId, data]) => {
                  const product = products.find(p => p.id === productId);
                  return (
                    <div key={productId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{product?.name}</div>
                        <div className="text-sm text-gray-500">
                          £{product ? parseFloat(product.price).toFixed(2) : "0.00"} × {data.quantity}
                        </div>
                      </div>
                      <div className="font-semibold text-gray-900">
                        £{product ? (parseFloat(product.price) * data.quantity).toFixed(2) : "0.00"}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-green-600">£{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setStep("customer")}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => {
                if (orderItems.size > 0) {
                  setStep("details");
                } else {
                  alert("Please add at least one item");
                }
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Next: Order Details
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Details */}
      {step === "details" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Delivery Time
              </label>
              <input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Instructions
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
              placeholder="Any special delivery instructions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Notes
            </label>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes about this order..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setStep("items")}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? "Creating Order..." : "Create Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
