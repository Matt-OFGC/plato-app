"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WholesaleCustomer {
  id: number;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  notes: string | null;
  isActive: boolean;
  portalToken: string | null;
  portalEnabled: boolean;
  _count: {
    productionItems: number;
    orders: number;
  };
}

interface WholesaleCustomersProps {
  customers: WholesaleCustomer[];
  companyId: number;
}

export function WholesaleCustomers({
  customers: initialCustomers,
  companyId,
}: WholesaleCustomersProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<WholesaleCustomer | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<WholesaleCustomer | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [portalUrl, setPortalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  
  // Form state
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  function openModal(customer?: WholesaleCustomer) {
    if (customer) {
      setEditingCustomer(customer);
      setName(customer.name);
      setContactName(customer.contactName || "");
      setEmail(customer.email || "");
      setPhone(customer.phone || "");
      setAddress(customer.address || "");
      setCity(customer.city || "");
      setPostcode(customer.postcode || "");
      setCountry(customer.country || "United Kingdom");
      setNotes(customer.notes || "");
      setIsActive(customer.isActive);
    } else {
      setEditingCustomer(null);
      setName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setCity("");
      setPostcode("");
      setCountry("United Kingdom");
      setNotes("");
      setIsActive(true);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCustomer(null);
  }

  async function handleSave() {
    if (!name.trim()) {
      alert("Customer name is required");
      return;
    }

    setSaving(true);

    try {
      const url = editingCustomer
        ? `/api/wholesale/customers/${editingCustomer.id}`
        : "/api/wholesale/customers";
      
      const method = editingCustomer ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contactName: contactName || null,
          email: email || null,
          phone: phone || null,
          address: address || null,
          city: city || null,
          postcode: postcode || null,
          country: country || null,
          notes: notes || null,
          isActive,
          companyId,
        }),
      });

      if (res.ok) {
        const customer = await res.json();
        
        if (editingCustomer) {
          setCustomers(customers.map(c => c.id === editingCustomer.id ? customer : c));
        } else {
          setCustomers([customer, ...customers]);
        }
        
        closeModal();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save customer");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this customer? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/wholesale/customers/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCustomers(customers.filter(c => c.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete customer");
      }
    } catch (error) {
      alert("Network error");
    }
  }

  async function generatePortalToken(customer: WholesaleCustomer) {
    setSelectedCustomer(customer);
    setGeneratingToken(true);

    try {
      const res = await fetch("/api/wholesale/portal/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setPortalUrl(data.portalUrl);
        setShortUrl(data.shortUrl);
        setCustomers(customers.map(c => 
          c.id === customer.id ? { ...c, portalToken: data.token, portalEnabled: true } : c
        ));
        setShowPortalModal(true);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to generate portal token");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setGeneratingToken(false);
    }
  }

  function copyPortalUrl(url: string) {
    navigator.clipboard.writeText(url);
    alert("URL copied to clipboard!");
  }

  function viewOrders(customerId: number) {
    window.location.href = `/dashboard/wholesale/orders?customerId=${customerId}`;
  }

  const activeCustomers = customers.filter(c => c.isActive);
  const inactiveCustomers = customers.filter(c => !c.isActive);

  return (
    <div className="space-y-6">
      {/* Add Customer Button */}
      <button
        onClick={() => openModal()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Customer
      </button>

      {/* Active Customers */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Active Customers</h2>
        {activeCustomers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No active customers yet. Add your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCustomers.map((customer) => (
              <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                    {customer.contactName && (
                      <p className="text-sm text-gray-600">{customer.contactName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(customer)}
                      className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.city && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{customer.city}{customer.postcode && `, ${customer.postcode}`}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{customer._count.productionItems} production items</span>
                    <span>{customer._count.orders} orders</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => viewOrders(customer.id)}
                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors font-medium"
                    >
                      Orders
                    </button>
                    <button
                      onClick={() => window.location.href = `/dashboard/wholesale/customers/${customer.id}/pricing`}
                      className="px-3 py-1.5 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 transition-colors font-medium"
                    >
                      Pricing
                    </button>
                    {customer.portalEnabled && customer.portalToken ? (
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setPortalUrl(`${window.location.origin}/wholesale/portal/${customer.portalToken}`);
                          setShowPortalModal(true);
                        }}
                        className="col-span-2 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors font-medium"
                      >
                        Portal Link
                      </button>
                    ) : (
                      <button
                        onClick={() => generatePortalToken(customer)}
                        disabled={generatingToken}
                        className="col-span-2 px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors font-medium disabled:opacity-50"
                      >
                        {generatingToken ? "Generating..." : "Enable Portal"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inactive Customers */}
      {inactiveCustomers.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Inactive Customers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {inactiveCustomers.map((customer) => (
              <div key={customer.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-700">{customer.name}</h3>
                    {customer.contactName && (
                      <p className="text-sm text-gray-500">{customer.contactName}</p>
                    )}
                  </div>
                  <button
                    onClick={() => openModal(customer)}
                    className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Modal */}
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
                  {editingCustomer ? "Edit Customer" : "Add Customer"}
                </h2>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., The Coffee Shop"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g., John Smith"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="orders@coffeeshop.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01234 567890"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main Street"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="London"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postcode
                    </label>
                    <input
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      placeholder="SW1A 1AA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Internal notes about this customer..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Active Customer</span>
                    </label>
                  </div>
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
                  disabled={saving || !name.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? (editingCustomer ? "Updating..." : "Adding...") : (editingCustomer ? "Update Customer" : "Add Customer")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portal Link Modal */}
      <AnimatePresence>
        {showPortalModal && selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPortalModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  Customer Portal Link
                </h2>
                <p className="text-gray-600 mt-1">Share this link with {selectedCustomer.name}</p>
              </div>

              <div className="p-6 space-y-4">
                {/* Short URL - Easy to share */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short URL (Easy to Share) 🎯
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shortUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-green-50 text-sm font-medium"
                    />
                    <button
                      onClick={() => copyPortalUrl(shortUrl)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Use this shorter link to easily share with customers</p>
                </div>

                {/* Full URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Portal URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={portalUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => copyPortalUrl(portalUrl)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        How it works
                      </p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Share this unique link with your customer</li>
                        <li>• They can browse products and place orders directly</li>
                        <li>• You'll receive orders in your dashboard</li>
                        <li>• No login required - the link is secure and unique</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {selectedCustomer.email && (
                  <div>
                    <button
                      onClick={() => {
                        window.location.href = `mailto:${selectedCustomer.email}?subject=Your Ordering Portal&body=Hi ${selectedCustomer.contactName || ''},\n\nYou can now place orders directly through our ordering portal:\n\n${portalUrl}\n\nBest regards`;
                      }}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Email Link to Customer
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex items-center justify-end">
                <button
                  onClick={() => setShowPortalModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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

