"use client";

import { useState, useEffect } from "react";

export function EquipmentTracker() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadEquipment();
  }, [filter]);

  async function loadEquipment() {
    setLoading(true);
    try {
      const url = filter !== "all" ? `/api/safety/equipment?status=${filter}` : "/api/safety/equipment";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error("Failed to load equipment:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "good":
        return "bg-green-100 text-green-700 border-green-300";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "maintenance_required":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading equipment...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Equipment Tracker</h1>
        <button
          onClick={() => setShowAddEquipment(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
        >
          + Add Equipment
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("good")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === "good"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Good
        </button>
        <button
          onClick={() => setFilter("warning")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === "warning"
              ? "bg-yellow-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Warning
        </button>
        <button
          onClick={() => setFilter("maintenance_required")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === "maintenance_required"
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Maintenance Required
        </button>
      </div>

      {showAddEquipment && (
        <AddEquipmentModal
          onClose={() => {
            setShowAddEquipment(false);
            loadEquipment();
          }}
        />
      )}

      {equipment.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚙️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No equipment registered</h3>
          <p className="text-gray-600 mb-4">Add equipment to track maintenance and issues.</p>
          <button
            onClick={() => setShowAddEquipment(true)}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
          >
            Add Equipment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.equipmentName}</h3>
                  <p className="text-sm text-gray-600">{item.location || "No location"}</p>
                  {item.equipmentCategory && (
                    <p className="text-xs text-gray-500 mt-1">{item.equipmentCategory}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(item.status)}`}
                >
                  {item.status.replace("_", " ")}
                </span>
              </div>

              {item.openIssuesCount > 0 && (
                <div className="mb-3">
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                    {item.openIssuesCount} open issue{item.openIssuesCount > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                {item.nextServiceDate && (
                  <div>
                    Next service: {new Date(item.nextServiceDate).toLocaleDateString()}
                  </div>
                )}
                {item.warrantyExpiry && (
                  <div>
                    Warranty: {new Date(item.warrantyExpiry).toLocaleDateString()}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  // TODO: Open equipment detail modal
                  alert(`Equipment detail for ${item.equipmentName}`);
                }}
                className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddEquipmentModal({ onClose }: { onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    equipmentName: "",
    equipmentCategory: "",
    location: "",
    lastServiceDate: "",
    nextServiceDate: "",
    warrantyExpiry: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.equipmentName.trim()) {
      alert("Equipment name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/safety/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lastServiceDate: formData.lastServiceDate || null,
          nextServiceDate: formData.nextServiceDate || null,
          warrantyExpiry: formData.warrantyExpiry || null,
        }),
      });

      if (response.ok) {
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create equipment");
      }
    } catch (error) {
      console.error("Create equipment error:", error);
      alert("Failed to create equipment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Equipment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipment Name *
            </label>
            <input
              type="text"
              value={formData.equipmentName}
              onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={formData.equipmentCategory}
              onChange={(e) => setFormData({ ...formData, equipmentCategory: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Oven, Mixer, Fridge"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Service
              </label>
              <input
                type="date"
                value={formData.lastServiceDate}
                onChange={(e) => setFormData({ ...formData, lastServiceDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Service
              </label>
              <input
                type="date"
                value={formData.nextServiceDate}
                onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warranty Expiry
              </label>
              <input
                type="date"
                value={formData.warrantyExpiry}
                onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Equipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

