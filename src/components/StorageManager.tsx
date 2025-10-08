"use client";

import { useState } from "react";
import { createStorageOption, updateStorageOption, deleteStorageOption } from "@/app/storage/actions";

interface StorageOption {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  _count: {
    recipes: number;
  };
}

interface Props {
  storageOptions: StorageOption[];
}

const predefinedIcons = [
  { name: "Refrigerator", value: "🧊" },
  { name: "Freezer", value: "❄️" },
  { name: "Room Temperature", value: "🌡️" },
  { name: "Pantry", value: "🏠" },
  { name: "Cool Dry Place", value: "🌬️" },
  { name: "Airtight Container", value: "📦" },
  { name: "Vacuum Sealed", value: "🔒" },
  { name: "Wrapped", value: "📄" },
];

export function StorageManager({ storageOptions }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "🧊",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("icon", formData.icon);
    
    if (editingId) {
      await updateStorageOption(editingId, data);
    } else {
      await createStorageOption(data);
    }
    
    // Reset form
    setFormData({ name: "", description: "", icon: "🧊" });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (option: StorageOption) => {
    setFormData({
      name: option.name,
      description: option.description || "",
      icon: option.icon || "🧊",
    });
    setEditingId(option.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this storage option? Recipes using this option will have their storage removed.")) {
      await deleteStorageOption(id);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "", icon: "🧊" });
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Storage Options</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Create and manage your storage instructions</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:bg-[var(--accent)] transition-colors font-medium"
        >
          Add Option
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-medium text-[var(--foreground)] mb-4">
            {editingId ? "Edit Storage Option" : "Add New Storage Option"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Storage Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="e.g., Refrigerate, Room temperature, Freeze"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="Optional description for this storage option"
                rows={3}
              />
            </div>
            
            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Icon
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-16 h-10 border border-gray-300 rounded-lg text-center text-lg"
                  maxLength={2}
                />
                <div className="flex gap-2 flex-wrap">
                  {predefinedIcons.map((icon) => (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: icon.value })}
                      className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-lg flex items-center justify-center"
                      title={icon.name}
                    >
                      {icon.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:bg-[var(--accent)] transition-colors font-medium"
              >
                {editingId ? "Update Option" : "Create Option"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Options List */}
      <div className="space-y-3">
        {storageOptions.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <p>No storage options yet. Create your first option to get started!</p>
          </div>
        ) : (
          storageOptions.map((option) => (
            <div
              key={option.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{option.icon}</div>
                <div>
                  <h5 className="font-medium text-[var(--foreground)]">{option.name}</h5>
                  {option.description && (
                    <p className="text-sm text-[var(--muted-foreground)]">{option.description}</p>
                  )}
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {option._count.recipes} recipe{option._count.recipes !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(option)}
                  className="text-[var(--primary)] hover:text-[var(--accent)] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(option.id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

