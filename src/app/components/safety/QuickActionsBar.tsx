"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuickActionsBar() {
  const router = useRouter();
  const [showFlagModal, setShowFlagModal] = useState(false);

  const actions = [
    {
      id: "flag",
      label: "Flag Issue",
      icon: "🚨",
      color: "red",
      onClick: () => setShowFlagModal(true),
    },
    {
      id: "photo",
      label: "Photo",
      icon: "📸",
      color: "blue",
      onClick: () => {
        // Open camera or file picker
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "environment";
        input.onchange = () => {
          // TODO: Handle photo upload
          alert("Photo feature - upload to be implemented");
        };
        input.click();
      },
    },
    {
      id: "quick-check",
      label: "Quick Check",
      icon: "✓",
      color: "green",
      onClick: () => router.push("/dashboard/safety/tasks"),
    },
    {
      id: "temp",
      label: "Log Temp",
      icon: "🌡️",
      color: "orange",
      onClick: () => router.push("/dashboard/safety/temperature"),
    },
  ];

  return (
    <>
      {/* Mobile Quick Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-gray-200 z-20 md:hidden">
        <div className="grid grid-cols-4 gap-2 p-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all active:scale-95 ${
                action.color === "red"
                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                  : action.color === "blue"
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : action.color === "green"
                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                  : "bg-orange-50 text-orange-700 hover:bg-orange-100"
              }`}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Flag Issue Modal */}
      {showFlagModal && (
        <FlagIssueModal onClose={() => setShowFlagModal(false)} />
      )}
    </>
  );
}

function FlagIssueModal({ onClose }: { onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    severity: "medium",
    location: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert("Please describe the issue");
      return;
    }

    setSaving(true);
    try {
      // TODO: Create quick issue report API endpoint
      alert("Issue flagged successfully!");
      onClose();
    } catch (error) {
      console.error("Flag issue error:", error);
      alert("Failed to flag issue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Flag Safety Issue</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="e.g., Kitchen - Prep Area"
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
              className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? "Flagging..." : "Flag Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

