"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TaskSignOff } from "@/components/safety/TaskSignOff";
import { PhotoUpload } from "@/components/safety/PhotoUpload";
import { FridgeFreezerChecklist } from "@/components/safety/FridgeFreezerChecklist";

interface TaskDetailClientProps {
  params: Promise<{ id: string }>;
}

export function TaskDetailClient({ params }: TaskDetailClientProps) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignOff, setShowSignOff] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<number, any>>({});
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setTaskId(p.id));
  }, [params]);

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  async function loadTask() {
    if (!taskId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/safety/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data);
        // Initialize checklist state (skip if fridge/freezer checklist)
        if (!data.isFridgeFreezerChecklist) {
          const state: Record<number, any> = {};
          data.checklistItems?.forEach((item: any, index: number) => {
            state[index] = {
              checked: false,
              temperature: null,
              notes: "",
              photos: [],
            };
          });
          setChecklistState(state);
        }
      }
    } catch (error) {
      console.error("Failed to load task:", error);
    } finally {
      setLoading(false);
    }
  }

  function updateChecklistItem(index: number, field: string, value: any) {
    setChecklistState({
      ...checklistState,
      [index]: {
        ...checklistState[index],
        [field]: value,
      },
    });
  }

  function handleComplete() {
    // Check time window constraint if enforced
    if (task.enforceTimeWindow && task.timeWindowStart && task.timeWindowEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const startTime = task.timeWindowStart.slice(0, 5);
      const endTime = task.timeWindowEnd.slice(0, 5);
      
      if (currentTime < startTime || currentTime > endTime) {
        alert(`This task can only be completed between ${startTime} and ${endTime}. Current time: ${currentTime}`);
        return;
      }
    }
    setShowSignOff(true);
  }

  function handleSignOffComplete() {
    router.push("/dashboard/safety");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading task...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Task not found</h2>
        <button
          onClick={() => router.push("/dashboard/safety")}
          className="text-orange-600 hover:text-orange-700"
        >
          Back to Safety
        </button>
      </div>
    );
  }

  const completedCount = Object.values(checklistState).filter((item) => item.checked).length;
  const totalCount = task.checklistItems?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Check if task is within time window
  const isWithinTimeWindow = task.enforceTimeWindow && task.timeWindowStart && task.timeWindowEnd ? (() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const startTime = task.timeWindowStart.slice(0, 5);
    const endTime = task.timeWindowEnd.slice(0, 5);
    return currentTime >= startTime && currentTime <= endTime;
  })() : true;

  // Check if this is a fridge/freezer checklist task
  const isFridgeFreezerTask = task.templateName?.toLowerCase().includes('fridge') || 
                               task.templateName?.toLowerCase().includes('freezer') ||
                               task.templateName?.toLowerCase().includes('temperature');

  // Handle fridge/freezer checklist completion
  async function handleFridgeFreezerComplete(records: any[]) {
    // Convert records to checklist items format for sign-off
    const checklistItems = records.map((record, index) => ({
      item_id: null,
      item_text: `${record.applianceName} (${record.type}) - ${record.temperature}°C`,
      item_order: index + 1,
      checked: true,
      temperature_value: record.temperature,
      temperature_unit: "celsius",
      notes: record.temperature && ((record.type === "fridge" && record.temperature > 5) || (record.type === "freezer" && record.temperature > -18)) 
        ? "Out of range - corrective action required" 
        : "",
      photo_ids: [],
    }));

    // Update checklist state
    const state: Record<number, any> = {};
    checklistItems.forEach((item, index) => {
      state[index] = {
        checked: item.checked,
        temperature: item.temperature_value,
        notes: item.notes,
        photos: [],
      };
    });
    setChecklistState(state);

    // Update task checklist items for sign-off
    task.checklistItems = checklistItems;

    // Show sign-off
    setShowSignOff(true);
  }

  if (showSignOff) {
    return (
      <TaskSignOff
        task={task}
        checklistState={checklistState}
        onComplete={handleSignOffComplete}
        onCancel={() => setShowSignOff(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push("/dashboard/safety")}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{task.templateEmoji}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{task.templateName}</h1>
              <p className="text-gray-600 mt-1">
                {task.templateCategory} • Due: {task.dueTime || "All day"}
              </p>
            </div>
          </div>
        </div>
        <span
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            task.status === "completed"
              ? "bg-green-100 text-green-700"
              : task.status === "in_progress"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {task.status}
        </span>
      </div>

      {/* Fridge/Freezer Checklist */}
      {isFridgeFreezerTask ? (
        <FridgeFreezerChecklist
          taskId={task.id}
          onComplete={handleFridgeFreezerComplete}
        />
      ) : (
        <>
          {/* Progress */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-gray-700">
                {completedCount} of {totalCount} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-orange-500 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Checklist */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Checklist</h2>
        {task.checklistItems?.map((item: any, index: number) => {
          const state = checklistState[index] || { checked: false, temperature: null, notes: "", photos: [] };
          return (
            <div
              key={index}
              className={`p-4 rounded-xl border-2 ${
                state.checked ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={state.checked}
                  onChange={(e) => updateChecklistItem(index, "checked", e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <div className="flex-1">
                  <label className="font-medium text-gray-900 cursor-pointer">
                    {item.itemText}
                  </label>
                  
                  {item.requiresTemperature && (
                    <div className="mt-2">
                      <input
                        type="number"
                        placeholder="Temperature"
                        value={state.temperature || ""}
                        onChange={(e) => updateChecklistItem(index, "temperature", e.target.value)}
                        className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      />
                      <span className="ml-2 text-sm text-gray-600">°C</span>
                    </div>
                  )}

                  {item.requiresNotes && (
                    <div className="mt-2">
                      <textarea
                        placeholder="Add notes..."
                        value={state.notes}
                        onChange={(e) => updateChecklistItem(index, "notes", e.target.value)}
                        rows={2}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  )}

                  {item.requiresPhoto && (
                    <div className="mt-2">
                      <PhotoUpload
                        taskCompletionId={task.id}
                        checklistItemId={item.id}
                        onUploadComplete={(photo) => {
                          updateChecklistItem(index, "photos", [
                            ...(checklistState[index]?.photos || []),
                            photo,
                          ]);
                        }}
                      />
                      {checklistState[index]?.photos?.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {checklistState[index].photos.map((photo: any, photoIndex: number) => (
                            <div key={photoIndex} className="relative">
                              <img
                                src={photo.thumbnailPath || photo.filePath}
                                alt={`Photo ${photoIndex + 1}`}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                onClick={() => {
                                  const updatedPhotos = checklistState[index].photos.filter(
                                    (_: any, i: number) => i !== photoIndex
                                  );
                                  updateChecklistItem(index, "photos", updatedPhotos);
                                }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

            {/* Time Window Warning */}
            {task.enforceTimeWindow && task.timeWindowStart && task.timeWindowEnd && !isWithinTimeWindow && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-yellow-800">Time Window Restriction</p>
                    <p className="text-sm text-yellow-700">
                      This task can only be completed between {task.timeWindowStart.slice(0, 5)} and {task.timeWindowEnd.slice(0, 5)}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Button */}
            {completedCount === totalCount && totalCount > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleComplete}
                  disabled={!isWithinTimeWindow}
                  className={`px-8 py-3 rounded-xl transition-colors font-medium text-lg ${
                    isWithinTimeWindow
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isWithinTimeWindow ? "Complete & Sign Off" : "Outside Time Window"}
                </button>
              </div>
            )}
          </>
      )}
    </div>
  );
}

