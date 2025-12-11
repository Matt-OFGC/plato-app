"use client";

import { useState } from "react";

interface ReportIssueProps {
  context?: {
    page?: string;
    error?: string;
    userId?: number;
    companyId?: number | null;
  };
  onClose?: () => void;
}

export function ReportIssue({ context, onClose }: ReportIssueProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/support/report-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          context: {
            ...context,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setDescription("");
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          onClose?.();
        }, 2000);
      } else {
        alert("Failed to submit report. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen && !submitted) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-gray-600 hover:text-gray-800 underline"
      >
        Something not working?
      </button>
    );
  }

  if (submitted) {
    return (
      <div className="text-sm text-green-600 font-medium">
        ✓ Report submitted. Thank you!
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Report an Issue</h3>
          <button
            onClick={() => {
              setIsOpen(false);
              onClose?.();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's not working?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows={4}
              placeholder="Describe what you were trying to do and what went wrong..."
              required
            />
          </div>

          {context && (
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <p className="font-medium mb-1">Context (automatically included):</p>
              <ul className="list-disc list-inside space-y-1">
                {context.page && <li>Page: {context.page}</li>}
                {context.error && <li>Error: {context.error}</li>}
                {context.userId && <li>User ID: {context.userId}</li>}
                {context.companyId !== undefined && (
                  <li>Company ID: {context.companyId ?? "None"}</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
