"use client";

import { useState, useRef, useEffect } from "react";

interface Supplier {
  id: number;
  name: string;
  description?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  deliveryDays: string[];
  deliveryNotes?: string | null;
  accountLogin?: string | null;
  accountPassword?: string | null;
  accountNumber?: string | null;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
  currency?: string | null;
  paymentTerms?: string | null;
  minimumOrder?: number | null;
}

interface SupplierSelectorProps {
  suppliers: Supplier[];
  value?: number | null;
  onChange: (supplierId: number | null) => void;
  placeholder?: string;
}

export function SupplierSelector({ suppliers, value, onChange, placeholder = "Select or create supplier..." }: SupplierSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedSupplier = suppliers.find(s => s.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setIsCreating(false);
        setNewSupplierName("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return;

    try {
      const response = await fetch("/api/quick-create/supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSupplierName.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.supplier) {
        onChange(data.supplier.id);
        setNewSupplierName("");
        setIsCreating(false);
        setSearchTerm("");
        setIsOpen(false);
        // Refresh to get updated suppliers list
        window.location.reload();
      } else {
        alert(data.error || "Failed to create supplier");
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      alert("Failed to create supplier. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isCreating) {
        handleCreateSupplier();
      } else if (filteredSuppliers.length === 0 && searchTerm.trim()) {
        setIsCreating(true);
        setNewSupplierName(searchTerm);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
      setIsCreating(false);
      setNewSupplierName("");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className={selectedSupplier ? "text-gray-900" : "text-gray-500"}>
            {selectedSupplier ? selectedSupplier.name : placeholder}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="p-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsCreating(false);
                setNewSupplierName("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search suppliers..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-auto">
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                  onClick={() => {
                    onChange(supplier.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  <div>
                    <div className="font-medium text-gray-900">{supplier.name}</div>
                    {supplier.contactName && (
                      <div className="text-sm text-gray-500">Contact: {supplier.contactName}</div>
                    )}
                    {supplier.deliveryDays.length > 0 && (
                      <div className="text-sm text-gray-500">
                        Delivery: {supplier.deliveryDays.join(", ")}
                      </div>
                    )}
                  </div>
                  {supplier.id === value && (
                    <svg className="w-5 h-5 text-[var(--primary)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              ))
            ) : searchTerm.trim() ? (
              <div className="px-3 py-2">
                {isCreating ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Create new supplier: "{newSupplierName}"
                    </div>
                    <input
                      type="text"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Supplier name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateSupplier}
                        className="px-3 py-1 bg-[var(--primary)] text-white text-sm rounded hover:bg-[var(--accent)] transition-colors"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          setNewSupplierName("");
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-[var(--primary)] hover:text-[var(--accent)] cursor-pointer"
                    onClick={() => {
                      setIsCreating(true);
                      setNewSupplierName(searchTerm);
                    }}
                  >
                    Create "{searchTerm}"
                  </div>
                )}
              </div>
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                No suppliers found
              </div>
            )}
          </div>

          {value && (
            <div className="border-t p-2">
              <button
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
