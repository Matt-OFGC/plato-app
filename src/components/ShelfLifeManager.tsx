"use client";

import { useState } from "react";
import { createShelfLifeOption, updateShelfLifeOption, deleteShelfLifeOption } from "@/app/shelf-life/actions";

interface ShelfLifeOption {
  id: number;
  name: string;
  description: string | null;
  _count: {
    recipes: number;
  };
}

interface Props {
  shelfLifeOptions: ShelfLifeOption[];
}

export function ShelfLifeManager({ shelfLifeOptions }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    
    if (editingId) {
      await updateShelfLifeOption(editingId, data);
    } else {
      await createShelfLifeOption(data);
    }
    
    // Reset form
    setFormData({ name: "", description: "" });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (option: ShelfLifeOption) => {
    setFormData({
      name: option.name,
      description: option.description || "",
    });
    setEditingId(option.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this shelf life option? Recipes using this option will have their shelf life removed.")) {
      await deleteShelfLifeOption(id);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "" });
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Shelf Life Options</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Create and manage your shelf life options</p>
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
            {editingId ? "Edit Shelf Life Option" : "Add New Shelf Life Option"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Shelf Life Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="e.g., 3 days, 1 week, 2 months"
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
                placeholder="Optional description for this shelf life option"
                rows={3}
              />
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
        {shelfLifeOptions.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <p>No shelf life options yet. Create your first option to get started!</p>
          </div>
        ) : (
          shelfLifeOptions.map((option) => (
            <div
              key={option.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <h5 className="font-medium text-[var(--foreground)]">{option.name}</h5>
                {option.description && (
                  <p className="text-sm text-[var(--muted-foreground)]">{option.description}</p>
                )}
                <p className="text-xs text-[var(--muted-foreground)]">
                  {option._count.recipes} recipe{option._count.recipes !== 1 ? 's' : ''}
                </p>
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

