"use client";

import { useState } from "react";
import { useToast } from "./ToastProvider";

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: number[];
  entityType: "recipes" | "ingredients";
  onSave: (updates: Record<string, any>) => Promise<void>;
  fields: {
    name: string;
    label: string;
    type: "select" | "text" | "number";
    options?: { value: string; label: string }[];
  }[];
}

export function BulkEditModal({
  isOpen,
  onClose,
  selectedIds,
  entityType,
  onSave,
  fields,
}: BulkEditModalProps) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [updates, setUpdates] = useState<Record<string, any>>({});

  if (!isOpen) return null;

  const handleSave = async () => {
    if (Object.keys(updates).length === 0) {
      showToast("No changes to save", "info");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(updates);
      showToast(`Successfully updated ${selectedIds.length} ${entityType}`, "success");
      setUpdates({});
      onClose();
    } catch (error: any) {
      showToast(error.message || `Failed to update ${entityType}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Bulk Edit {selectedIds.length} {entityType}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Update common fields for all selected items
          </p>
        </div>

        <div className="p-6 space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {field.label}
              </label>
              {field.type === "select" && field.options ? (
                <select
                  value={updates[field.name] || ""}
                  onChange={(e) =>
                    setUpdates({ ...updates, [field.name]: e.target.value || null })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">No change</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "number" ? (
                <input
                  type="number"
                  value={updates[field.name] || ""}
                  onChange={(e) =>
                    setUpdates({
                      ...updates,
                      [field.name]: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Leave empty for no change"
                />
              ) : (
                <input
                  type="text"
                  value={updates[field.name] || ""}
                  onChange={(e) =>
                    setUpdates({ ...updates, [field.name]: e.target.value || null })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Leave empty for no change"
                />
              )}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || Object.keys(updates).length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

