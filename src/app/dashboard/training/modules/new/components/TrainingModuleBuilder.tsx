"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface TrainingContent {
  type: "text" | "image" | "video" | "video_embed";
  content: string;
  order: number;
  metadata?: Record<string, any>;
}

interface TrainingModuleBuilderProps {
  companyId: number;
}

export default function TrainingModuleBuilder({
  companyId,
}: TrainingModuleBuilderProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Module fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [refreshFrequencyDays, setRefreshFrequencyDays] = useState<number | null>(null);
  const [isTemplate, setIsTemplate] = useState(false);

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
      // Create module with content in one request
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
          content: contentItems.length > 0 ? contentItems.map((item, index) => ({
            type: item.type,
            content: item.content,
            order: index,
            metadata: item.metadata || {},
          })) : undefined,
        }),
      });

      if (!moduleRes.ok) {
        const data = await moduleRes.json();
        throw new Error(data.error || "Failed to create module");
      }

      const { module } = await moduleRes.json();
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

  async function handleFileUpload(index: number, file: File, type: "image" | "video") {
    setUploadingIndex(index);
    const newUploadErrors = { ...uploadErrors };
    delete newUploadErrors[index];
    setUploadErrors(newUploadErrors);

    try {
      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("File size exceeds 50MB limit");
      }

      // Validate file type
      if (type === "image" && !file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }
      if (type === "video" && !file.type.startsWith("video/")) {
        throw new Error("Please select a video file");
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/training-media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Update the content item with the uploaded URL
      updateContentItem(index, { content: data.url });
    } catch (err: any) {
      setUploadErrors({ ...uploadErrors, [index]: err.message || "Upload failed" });
    } finally {
      setUploadingIndex(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Basic Info */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
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
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Training Content
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => addContentItem("text")}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              + Text
            </button>
            <button
              onClick={() => addContentItem("image")}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              + Image
            </button>
            <button
              onClick={() => addContentItem("video")}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
                    placeholder="Enter training text content..."
                  />
                )}

                {item.type === "image" && (
                  <div className="space-y-3">
                    {/* URL Input */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={item.content}
                        onChange={(e) =>
                          updateContentItem(index, { content: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
                        placeholder="Enter image URL..."
                      />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="text-xs text-gray-500">OR</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* File Upload */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Upload from Computer
                      </label>
                      <input
                        ref={(el) => (fileInputRefs.current[index] = el)}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(index, file, "image");
                          }
                        }}
                        disabled={uploadingIndex === index}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[index]?.click()}
                          disabled={uploadingIndex === index}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingIndex === index ? "Uploading..." : "Choose Image"}
                        </button>
                        {item.content && (
                          <span className="text-xs text-gray-500">
                            {item.content.startsWith("http") ? "URL set" : "File uploaded"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preview */}
                    {item.content && item.content.startsWith("http") && (
                      <div className="mt-2">
                        <img
                          src={item.content}
                          alt="Preview"
                          className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200"
                          onError={() => {
                            setUploadErrors({
                              ...uploadErrors,
                              [index]: "Failed to load image. Please check the URL.",
                            });
                          }}
                        />
                      </div>
                    )}

                    {/* Upload Error */}
                    {uploadErrors[index] && (
                      <p className="text-xs text-red-600">{uploadErrors[index]}</p>
                    )}
                  </div>
                )}

                {item.type === "video" && (
                  <div className="space-y-3">
                    {/* URL Input */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Video URL or Embed Code
                      </label>
                      <input
                        type="text"
                        value={item.content}
                        onChange={(e) =>
                          updateContentItem(index, { content: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
                        placeholder="Enter video URL or embed code..."
                      />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="text-xs text-gray-500">OR</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* File Upload */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Upload from Computer
                      </label>
                      <input
                        ref={(el) => (fileInputRefs.current[index] = el)}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(index, file, "video");
                          }
                        }}
                        disabled={uploadingIndex === index}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[index]?.click()}
                          disabled={uploadingIndex === index}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingIndex === index ? "Uploading..." : "Choose Video"}
                        </button>
                        {item.content && (
                          <span className="text-xs text-gray-500">
                            {item.content.startsWith("http") ? "URL set" : "File uploaded"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum file size: 50MB. Supported formats: MP4, WebM, QuickTime
                      </p>
                    </div>

                    {/* Preview */}
                    {item.content && item.content.startsWith("http") && !item.content.includes("<iframe") && (
                      <div className="mt-2">
                        <video
                          src={item.content}
                          controls
                          className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200"
                          onError={() => {
                            setUploadErrors({
                              ...uploadErrors,
                              [index]: "Failed to load video. Please check the URL.",
                            });
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}

                    {/* Upload Error */}
                    {uploadErrors[index] && (
                      <p className="text-xs text-red-600">{uploadErrors[index]}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !title.trim()}
          className="px-6 py-2 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white rounded-lg hover:opacity-90 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Creating..." : "Create Module"}
        </button>
      </div>
    </div>
  );
}

