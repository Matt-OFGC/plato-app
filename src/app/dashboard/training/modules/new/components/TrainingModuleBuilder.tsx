"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Recipe {
  id: number;
  name: string;
}

interface TrainingContent {
  type: "text" | "image" | "video" | "video_embed";
  content: string;
  order: number;
  metadata?: Record<string, any>;
}

interface TrainingModuleBuilderProps {
  companyId: number;
  recipes: Recipe[];
}

export default function TrainingModuleBuilder({
  companyId,
  recipes,
}: TrainingModuleBuilderProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Module fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [refreshFrequencyDays, setRefreshFrequencyDays] = useState<number | null>(null);
  const [isTemplate, setIsTemplate] = useState(false);
  const [linkedRecipeIds, setLinkedRecipeIds] = useState<number[]>([]);

  // Content management
  const [contentItems, setContentItems] = useState<TrainingContent[]>([]);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      // Create module
      const moduleRes = await fetch("/api/training/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          estimatedDuration,
          refreshFrequencyDays: refreshFrequencyDays || null,
          isTemplate,
          companyId,
        }),
      });

      if (!moduleRes.ok) {
        const data = await moduleRes.json();
        throw new Error(data.error || "Failed to create module");
      }

      const { module } = await moduleRes.json();

      // Link recipes
      if (linkedRecipeIds.length > 0) {
        for (const recipeId of linkedRecipeIds) {
          await fetch(`/api/recipes/${recipeId}/relations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "training",
              relatedId: module.id,
            }),
          });
        }
      }

      // Create content items
      for (const [index, item] of contentItems.entries()) {
        await fetch("/api/training/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId: module.id,
            type: item.type,
            content: item.content,
            order: index,
            metadata: item.metadata || {},
          }),
        });
      }

      router.push(`/dashboard/training/modules/${module.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create training module");
    } finally {
      setIsSaving(false);
    }
  }

  function addContentItem(type: TrainingContent["type"]) {
    setContentItems([
      ...contentItems,
      {
        type,
        content: "",
        order: contentItems.length,
        metadata: {},
      },
    ]);
  }

  function updateContentItem(index: number, updates: Partial<TrainingContent>) {
    const updated = [...contentItems];
    updated[index] = { ...updated[index], ...updates };
    setContentItems(updated);
  }

  function removeContentItem(index: number) {
    setContentItems(contentItems.filter((_, i) => i !== index));
  }

  function moveContentItem(index: number, direction: "up" | "down") {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === contentItems.length - 1)
    ) {
      return;
    }

    const updated = [...contentItems];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated[index].order = index;
    updated[newIndex].order = newIndex;
    setContentItems(updated);
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Module Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="e.g., Barista Training - Latte Art"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Brief description of what this training covers..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                value={estimatedDuration || ""}
                onChange={(e) =>
                  setEstimatedDuration(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="e.g., 30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refresh Frequency (days)
              </label>
              <input
                type="number"
                value={refreshFrequencyDays || ""}
                onChange={(e) =>
                  setRefreshFrequencyDays(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="e.g., 365"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isTemplate"
              checked={isTemplate}
              onChange={(e) => setIsTemplate(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isTemplate" className="text-sm text-gray-700">
              Mark as template (available to all companies)
            </label>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Training Content
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => addContentItem("text")}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              + Text
            </button>
            <button
              onClick={() => addContentItem("image")}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              + Image
            </button>
            <button
              onClick={() => addContentItem("video")}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              + Video
            </button>
          </div>
        </div>

        {contentItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No content added yet. Click the buttons above to add content.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contentItems.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}{" "}
                    Section {index + 1}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveContentItem(index, "up")}
                      disabled={index === 0}
                      className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveContentItem(index, "down")}
                      disabled={index === contentItems.length - 1}
                      className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeContentItem(index)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {item.type === "text" && (
                  <textarea
                    value={item.content}
                    onChange={(e) =>
                      updateContentItem(index, { content: e.target.value })
                    }
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter training text content..."
                  />
                )}

                {item.type === "image" && (
                  <div>
                    <input
                      type="text"
                      value={item.content}
                      onChange={(e) =>
                        updateContentItem(index, { content: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Image URL or upload image..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter image URL or use upload button (coming soon)
                    </p>
                  </div>
                )}

                {item.type === "video" && (
                  <div>
                    <input
                      type="text"
                      value={item.content}
                      onChange={(e) =>
                        updateContentItem(index, { content: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Video URL or embed code..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter video URL or embed code
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recipe Links */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Link to Recipes
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Link this training module to specific recipes. Staff viewing those
          recipes will see a link to this training.
        </p>

        <div className="space-y-2">
          {recipes.map((recipe) => (
            <label
              key={recipe.id}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
            >
              <input
                type="checkbox"
                checked={linkedRecipeIds.includes(recipe.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setLinkedRecipeIds([...linkedRecipeIds, recipe.id]);
                  } else {
                    setLinkedRecipeIds(
                      linkedRecipeIds.filter((id) => id !== recipe.id)
                    );
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{recipe.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !title.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Creating..." : "Create Module"}
        </button>
      </div>
    </div>
  );
}

