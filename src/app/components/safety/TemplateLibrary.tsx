"use client";

import { useState, useEffect } from "react";
import { TemplateBuilder } from "./TemplateBuilder";

export function TemplateLibrary() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
    
    // Listen for template updates
    const handleUpdate = () => {
      loadTemplates();
    };
    window.addEventListener("templatesUpdated", handleUpdate);
    return () => window.removeEventListener("templatesUpdated", handleUpdate);
  }, [selectedCategory]);

  async function loadTemplates() {
    setLoading(true);
    try {
      const url = selectedCategory
        ? `/api/safety/templates?category=${selectedCategory}`
        : "/api/safety/templates";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    { id: "food_safety", label: "Food Safety", emoji: "🍽️", color: "orange" },
    { id: "health_safety", label: "Health & Safety", emoji: "🏥", color: "blue" },
    { id: "cleaning", label: "Cleaning", emoji: "🧹", color: "green" },
    { id: "equipment", label: "Equipment", emoji: "⚙️", color: "purple" },
    { id: "training", label: "Training", emoji: "📚", color: "yellow" },
    { id: "custom", label: "Custom", emoji: "⭐", color: "pink" },
  ];

  if (showBuilder) {
    return (
      <TemplateBuilder
        onClose={() => {
          setShowBuilder(false);
          loadTemplates();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage task templates for your safety procedures</p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
        >
          + Create Template
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            selectedCategory === null
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedCategory === cat.id
                ? `bg-${cat.color}-500 text-white`
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading templates...</div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">Create your first template to get started.</p>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
          >
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{template.emoji || "📋"}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{template.category}</p>
                </div>
                {template.isSystemTemplate && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg">
                    System
                  </span>
                )}
              </div>
              {template.description && (
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {template.checklistItemsCount || 0} items
                </span>
                <button className="text-orange-600 hover:text-orange-700 font-medium">
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

