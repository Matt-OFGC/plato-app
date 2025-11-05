"use client";

import { useState } from "react";

interface TemplateBuilderProps {
  onClose: () => void;
}

export function TemplateBuilder({ onClose }: TemplateBuilderProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("food_safety");
  const [emoji, setEmoji] = useState("📋");
  const [description, setDescription] = useState("");
  const [checklistItems, setChecklistItems] = useState<
    Array<{
      text: string;
      requiresPhoto: boolean;
      requiresTemperature: boolean;
      requiresNotes: boolean;
    }>
  >([{ text: "", requiresPhoto: false, requiresTemperature: false, requiresNotes: false }]);
  const [saving, setSaving] = useState(false);

  const categories = [
    { id: "food_safety", label: "Food Safety", emoji: "🍽️" },
    { id: "health_safety", label: "Health & Safety", emoji: "🏥" },
    { id: "cleaning", label: "Cleaning", emoji: "🧹" },
    { id: "equipment", label: "Equipment", emoji: "⚙️" },
    { id: "training", label: "Training", emoji: "📚" },
    { id: "custom", label: "Custom", emoji: "⭐" },
  ];

  const emojiOptions = ["📋", "✓", "🔍", "🌡️", "📸", "🧹", "🍽️", "⚙️", "🏥", "📚", "⭐", "🔔", "⚠️", "✅", "📝"];

  function addChecklistItem() {
    setChecklistItems([
      ...checklistItems,
      { text: "", requiresPhoto: false, requiresTemperature: false, requiresNotes: false },
    ]);
  }

  function removeChecklistItem(index: number) {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  }

  function updateChecklistItem(
    index: number,
    field: string,
    value: string | boolean
  ) {
    const updated = [...checklistItems];
    updated[index] = { ...updated[index], [field]: value };
    setChecklistItems(updated);
  }

  async function handleSave() {
    if (!name.trim() || checklistItems.filter((item) => item.text.trim()).length === 0) {
      alert("Please fill in template name and at least one checklist item");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/safety/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          description,
          emoji,
          checklistItems: checklistItems.filter((item) => item.text.trim()),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Template saved successfully:", result);
        // Reload templates after save
        window.dispatchEvent(new CustomEvent("templatesUpdated"));
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save template");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Create Template</h1>
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Kitchen Opening Checks"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emoji</label>
            <div className="flex gap-2 flex-wrap">
              {emojiOptions.map((emo) => (
                <button
                  key={emo}
                  onClick={() => setEmoji(emo)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center ${
                    emoji === emo ? "bg-orange-100 border-2 border-orange-500" : "bg-gray-100"
                  }`}
                >
                  {emo}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Checklist Items *</h2>
          <button
            onClick={addChecklistItem}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
          >
            + Add Item
          </button>
        </div>

        <div className="space-y-3">
          {checklistItems.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <div className="flex-1">
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateChecklistItem(index, "text", e.target.value)}
                  placeholder={`Checklist item ${index + 1}`}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
                />
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.requiresPhoto}
                      onChange={(e) =>
                        updateChecklistItem(index, "requiresPhoto", e.target.checked)
                      }
                      className="rounded"
                    />
                    <span>Requires Photo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.requiresTemperature}
                      onChange={(e) =>
                        updateChecklistItem(index, "requiresTemperature", e.target.checked)
                      }
                      className="rounded"
                    />
                    <span>Temperature</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.requiresNotes}
                      onChange={(e) =>
                        updateChecklistItem(index, "requiresNotes", e.target.checked)
                      }
                      className="rounded"
                    />
                    <span>Notes</span>
                  </label>
                </div>
              </div>
              {checklistItems.length > 1 && (
                <button
                  onClick={() => removeChecklistItem(index)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          onClick={onClose}
          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Template"}
        </button>
      </div>
    </div>
  );
}

