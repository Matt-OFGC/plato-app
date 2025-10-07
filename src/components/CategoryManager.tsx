"use client";

import { useState } from "react";
import { createCategory, updateCategory, deleteCategory } from "@/app/categories/actions";

interface Category {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  _count: {
    recipes: number;
  };
}

interface Props {
  categories: Category[];
}

const predefinedColors = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F59E0B" },
  { name: "Pink", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Lime", value: "#84CC16" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Emerald", value: "#10B981" },
  { name: "Sky", value: "#0EA5E9" },
];

export function CategoryManager({ categories }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });
  const [showAdvancedColorPicker, setShowAdvancedColorPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("color", formData.color);
    
    if (editingId) {
      await updateCategory(editingId, data);
    } else {
      await createCategory(data);
    }
    
    // Reset form
    setFormData({ name: "", description: "", color: "#3B82F6" });
    setIsAdding(false);
    setEditingId(null);
    setShowAdvancedColorPicker(false);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "#3B82F6",
    });
    setEditingId(category.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this category? Recipes using this category will have their category removed.")) {
      await deleteCategory(id);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "", color: "#3B82F6" });
    setIsAdding(false);
    setEditingId(null);
    setShowAdvancedColorPicker(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Recipe Categories</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Create and manage your recipe categories</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:bg-[var(--accent)] transition-colors font-medium"
        >
          Add Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-medium text-[var(--foreground)] mb-4">
            {editingId ? "Edit Category" : "Add New Category"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Category Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="e.g., Desserts, Bread, Sauces"
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
                placeholder="Optional description for this category"
                rows={3}
              />
            </div>
            
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Color
              </label>
              <div className="space-y-3">
                {/* Custom Color Picker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Custom color:</p>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedColorPicker(!showAdvancedColorPicker)}
                      className="text-xs text-[var(--primary)] hover:text-[var(--accent)] transition-colors"
                    >
                      {showAdvancedColorPicker ? 'Hide' : 'Show'} advanced
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                      title="Custom color picker"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => {
                          // Validate hex color format
                          const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                          if (e.target.value === '' || hexPattern.test(e.target.value)) {
                            setFormData({ ...formData, color: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm font-mono"
                        placeholder="#3B82F6"
                        maxLength={7}
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter hex color code (e.g., #3B82F6)</p>
                    </div>
                  </div>
                  
                  {/* Advanced Color Options */}
                  {showAdvancedColorPicker && (
                    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                      <p className="text-xs text-gray-600 font-medium">Quick color generators:</p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}` })}
                          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Random
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
                            const randomColor = colors[Math.floor(Math.random() * colors.length)];
                            setFormData({ ...formData, color: randomColor });
                          }}
                          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Pastel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const colors = ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7', '#ECF0F1'];
                            const randomColor = colors[Math.floor(Math.random() * colors.length)];
                            setFormData({ ...formData, color: randomColor });
                          }}
                          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Neutral
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Predefined Colors */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Quick select:</p>
                  <div className="grid grid-cols-8 gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                          formData.color === color.value 
                            ? 'border-gray-800 shadow-lg' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Color Preview */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div
                    className="w-8 h-8 rounded-lg border border-gray-300"
                    style={{ backgroundColor: formData.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Preview</p>
                    <p className="text-xs text-gray-500 font-mono">{formData.color}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:bg-[var(--accent)] transition-colors font-medium"
              >
                {editingId ? "Update Category" : "Create Category"}
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

      {/* Categories List */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <p>No categories yet. Create your first category to get started!</p>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-lg border border-gray-300 shadow-sm"
                  style={{ backgroundColor: category.color || "#3B82F6" }}
                  title={`Color: ${category.color || "#3B82F6"}`}
                />
                <div>
                  <h5 className="font-medium text-[var(--foreground)]">{category.name}</h5>
                  {category.description && (
                    <p className="text-sm text-[var(--muted-foreground)]">{category.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {category._count.recipes} recipe{category._count.recipes !== 1 ? 's' : ''}
                    </p>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-500 font-mono">{category.color || "#3B82F6"}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="text-[var(--primary)] hover:text-[var(--accent)] transition-colors px-2 py-1 rounded hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50"
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
