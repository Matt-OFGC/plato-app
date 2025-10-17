"use client";

import { useState, useEffect } from "react";

interface Supplier {
  id: number;
  name: string;
  description?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  deliveryDays?: string[];
  deliveryNotes?: string;
  accountLogin?: string;
  accountPassword?: string;
  accountNumber?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  currency?: string;
  paymentTerms?: string;
  minimumOrder?: number | null;
  _count?: {
    ingredients: number;
  };
}

interface SupplierManagerProps {
  suppliers: Supplier[];
}

export function SupplierManager({ suppliers: initialSuppliers }: SupplierManagerProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    deliveryDays: [] as string[],
    deliveryNotes: "",
    accountLogin: "",
    accountPassword: "",
    accountNumber: "",
    address: "",
    city: "",
    postcode: "",
    country: "",
    currency: "GBP",
    paymentTerms: "",
    minimumOrder: "",
  });

  const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : "") : value
    }));
  };

  const handleDeliveryDayChange = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      deliveryDays: checked 
        ? [...prev.deliveryDays, day]
        : prev.deliveryDays.filter(d => d !== day)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      deliveryDays: [],
      deliveryNotes: "",
      accountLogin: "",
      accountPassword: "",
      accountNumber: "",
      address: "",
      city: "",
      postcode: "",
      country: "",
      currency: "GBP",
      paymentTerms: "",
      minimumOrder: "",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'deliveryDays') {
          formDataObj.append(key, JSON.stringify(value));
        } else {
          formDataObj.append(key, value.toString());
        }
      });

      const url = editingId ? `/api/suppliers/${editingId}` : '/api/suppliers';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataObj,
      });

      const result = await response.json();

      if (result.success) {
        if (editingId) {
          setSuppliers(prev => prev.map(s => s.id === editingId ? result.supplier : s));
          setMessage({ type: 'success', text: 'Supplier updated successfully!' });
        } else {
          setSuppliers(prev => [...prev, result.supplier]);
          setMessage({ type: 'success', text: 'Supplier added successfully!' });
        }
        resetForm();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save supplier' });
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      setMessage({ type: 'error', text: 'Failed to save supplier. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      description: supplier.description || "",
      contactName: supplier.contactName || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      website: supplier.website || "",
      deliveryDays: supplier.deliveryDays || [],
      deliveryNotes: supplier.deliveryNotes || "",
      accountLogin: supplier.accountLogin || "",
      accountPassword: supplier.accountPassword || "",
      accountNumber: supplier.accountNumber || "",
      address: supplier.address || "",
      city: supplier.city || "",
      postcode: supplier.postcode || "",
      country: supplier.country || "",
      currency: supplier.currency || "GBP",
      paymentTerms: supplier.paymentTerms || "",
      minimumOrder: supplier.minimumOrder?.toString() || "",
    });
    setEditingId(supplier.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSuppliers(prev => prev.filter(s => s.id !== id));
        setMessage({ type: 'success', text: 'Supplier deleted successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete supplier' });
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      setMessage({ type: 'error', text: 'Failed to delete supplier. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Supplier' : 'Add New Supplier'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="minimumOrder" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order
                </label>
                <input
                  type="number"
                  id="minimumOrder"
                  name="minimumOrder"
                  value={formData.minimumOrder}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Days
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.deliveryDays.includes(day)}
                      onChange={(e) => handleDeliveryDayChange(day, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="deliveryNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Notes
              </label>
              <textarea
                id="deliveryNotes"
                name="deliveryNotes"
                value={formData.deliveryNotes}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : (editingId ? 'Update Supplier' : 'Add Supplier')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suppliers List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Suppliers</h3>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Supplier
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{supplier.name}</h4>
                  {supplier.contactName && (
                    <p className="text-sm text-gray-600">Contact: {supplier.contactName}</p>
                  )}
                  {supplier.email && (
                    <p className="text-sm text-gray-600">Email: {supplier.email}</p>
                  )}
                  {supplier.phone && (
                    <p className="text-sm text-gray-600">Phone: {supplier.phone}</p>
                  )}
                  {supplier.minimumOrder && (
                    <p className="text-sm text-gray-600">Min Order: £{supplier.minimumOrder}</p>
                  )}
                  {supplier._count && (
                    <p className="text-sm text-gray-500">
                      {supplier._count.ingredients} ingredient{supplier._count.ingredients !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(supplier)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(supplier.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {suppliers.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            No suppliers found. Add your first supplier to get started.
          </div>
        )}
      </div>
    </div>
  );
}
