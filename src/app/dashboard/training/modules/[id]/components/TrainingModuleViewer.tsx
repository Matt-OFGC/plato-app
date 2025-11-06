"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TrainingContent {
  id: number;
  type: "text" | "image" | "video" | "video_embed";
  content: string;
  order: number;
  metadata?: Record<string, any>;
}

interface Recipe {
  id: number;
  name: string;
}

interface TrainingModule {
  id: number;
  title: string;
  description: string | null;
  estimatedDuration: number | null;
  refreshFrequencyDays: number | null;
  isTemplate: boolean;
  content: TrainingContent[];
  recipes: Array<{ recipe: Recipe }>;
}

interface TrainingRecord {
  id: number;
  status: "not_started" | "in_progress" | "completed";
  startedAt: Date | null;
  completedAt: Date | null;
  nextRefreshDate: Date | null;
}

interface TrainingModuleViewerProps {
  module: TrainingModule;
  trainingRecord: TrainingRecord | null;
  companyId: number;
  currentUserId: number;
}

export default function TrainingModuleViewer({
  module,
  trainingRecord,
  companyId,
  currentUserId,
}: TrainingModuleViewerProps) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);

  const currentContent = module.content[currentContentIndex];
  const hasPrevious = currentContentIndex > 0;
  const hasNext = currentContentIndex < module.content.length - 1;

  async function handleComplete() {
    if (!trainingRecord) {
      // Create new record
      try {
        const res = await fetch("/api/training/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId: module.id,
            status: "completed",
          }),
        });

        if (res.ok) {
          router.refresh();
        }
      } catch (error) {
        console.error("Failed to complete training:", error);
      }
    } else if (trainingRecord.status !== "completed") {
      // Update existing record
      setIsCompleting(true);
      try {
        const res = await fetch("/api/training/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId: module.id,
            status: "completed",
          }),
        });

        if (res.ok) {
          router.refresh();
        }
      } catch (error) {
        console.error("Failed to complete training:", error);
      } finally {
        setIsCompleting(false);
      }
    }
  }

  function renderContent(content: TrainingContent) {
    switch (content.type) {
      case "text":
        return (
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{content.content}</p>
          </div>
        );

      case "image":
        return (
          <div className="flex justify-center">
            <img
              src={content.content}
              alt="Training content"
              className="max-w-full h-auto rounded-lg shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        );

      case "video":
      case "video_embed":
        return (
          <div className="aspect-video">
            {content.content.startsWith("http") ? (
              <video
                src={content.content}
                controls
                className="w-full h-full rounded-lg"
              />
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: content.content }}
                className="w-full h-full"
              />
            )}
          </div>
        );

      default:
        return null;
    }
  }

  const progress =
    module.content.length > 0
      ? ((currentContentIndex + 1) / module.content.length) * 100
      : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
            {module.description && (
              <p className="text-gray-600 mt-2">{module.description}</p>
            )}
          </div>
          <Link
            href="/dashboard/training"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Back
          </Link>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          {module.estimatedDuration && (
            <span>⏱️ {module.estimatedDuration} minutes</span>
          )}
          {module.content.length > 0 && (
            <span>{module.content.length} sections</span>
          )}
          {module.recipes.length > 0 && (
            <span>{module.recipes.length} linked recipes</span>
          )}
          {module.isTemplate && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              Template
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {module.content.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>
                {currentContentIndex + 1} / {module.content.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {module.content.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No content available for this module.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          {currentContent && (
            <div className="space-y-6">
              {renderContent(currentContent)}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentContentIndex(currentContentIndex - 1)}
                  disabled={!hasPrevious}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                <span className="text-sm text-gray-600">
                  Section {currentContentIndex + 1} of {module.content.length}
                </span>

                {hasNext ? (
                  <button
                    onClick={() =>
                      setCurrentContentIndex(currentContentIndex + 1)
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    disabled={
                      isCompleting || trainingRecord?.status === "completed"
                    }
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {trainingRecord?.status === "completed"
                      ? "✓ Completed"
                      : isCompleting
                      ? "Completing..."
                      : "Mark as Complete"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Linked Recipes */}
      {module.recipes.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Linked Recipes
          </h2>
          <div className="flex flex-wrap gap-2">
            {module.recipes.map(({ recipe }) => (
              <Link
                key={recipe.id}
                href={`/dashboard/recipes/${recipe.id}`}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
              >
                {recipe.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

