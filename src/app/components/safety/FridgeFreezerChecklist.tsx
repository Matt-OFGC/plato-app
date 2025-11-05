"use client";

import { useState, useEffect } from "react";

interface TemperatureRecord {
  id?: number;
  applianceName: string;
  type: "fridge" | "freezer";
  temperature: number | null;
  saved: boolean;
}

interface FridgeFreezerChecklistProps {
  taskId?: number;
  onComplete?: (records: TemperatureRecord[]) => void;
}

export function FridgeFreezerChecklist({ taskId, onComplete }: FridgeFreezerChecklistProps) {
  const [records, setRecords] = useState<TemperatureRecord[]>([
    { applianceName: "", type: "fridge", temperature: null, saved: false }
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [savedAppliances, setSavedAppliances] = useState<string[]>([]);

  // Load saved appliances on mount
  useEffect(() => {
    if (taskId) {
      loadSavedAppliances();
    }
  }, [taskId]);

  async function loadSavedAppliances() {
    try {
      const response = await fetch(`/api/safety/tasks/${taskId}/fridge-records`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          // Load saved appliances and populate records
          setRecords(data.map((app: any) => ({
            id: app.id,
            applianceName: app.applianceName || "",
            type: (app.applianceType || "fridge") as "fridge" | "freezer",
            temperature: null,
            saved: true, // Mark as saved since they're from the database
          })));
        } else {
          // If no saved appliances, start with one empty record
          setRecords([{ applianceName: "", type: "fridge", temperature: null, saved: false }]);
        }
      }
    } catch (error) {
      console.error("Failed to load saved appliances:", error);
      // Start with one empty record if load fails
      setRecords([{ applianceName: "", type: "fridge", temperature: null, saved: false }]);
    }
  }

  const currentRecord = records[selectedIndex];

  function addRecord() {
    setRecords([...records, { applianceName: "", type: "fridge", temperature: null, saved: false }]);
    setSelectedIndex(records.length);
  }

  function deleteRecord(index: number) {
    if (records.length <= 1) return;
    const updated = records.filter((_, i) => i !== index);
    setRecords(updated);
    if (selectedIndex >= updated.length) {
      setSelectedIndex(updated.length - 1);
    } else if (selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  }

  function updateRecord(field: keyof TemperatureRecord, value: any) {
    const updated = [...records];
    updated[selectedIndex] = { ...updated[selectedIndex], [field]: value, saved: false };
    setRecords(updated);
  }

  async function saveRecord() {
    const updated = [...records];
    updated[selectedIndex] = { ...updated[selectedIndex], saved: true };
    setRecords(updated);

    // Save appliance name to template for future use (so it persists)
    if (taskId && updated[selectedIndex].applianceName) {
      try {
        await fetch(`/api/safety/tasks/${taskId}/fridge-records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            records: updated,
            saveAppliances: true // Save appliance names so they persist
          }),
        });
      } catch (error) {
        console.error("Failed to save appliance:", error);
      }
    }
  }

  function goToNext() {
    if (selectedIndex < records.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  }

  function goToPrevious() {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  }

  const isOutOfRange = (): { warning: boolean; message: string } => {
    const record = currentRecord;
    if (!record.temperature) return { warning: false, message: "" };

    if (record.type === "fridge") {
      if (record.temperature > 5) {
        return { warning: true, message: "Fridges should operate under 5°C. Please comment with corrective action." };
      }
      if (record.temperature >= 0 && record.temperature <= 5) {
        return { warning: true, message: "Fridges between 0°C and 5°C. Please comment with corrective action." };
      }
    } else {
      if (record.temperature > -18) {
        return { warning: true, message: "Freezers should operate under -18°C. Please comment with corrective action." };
      }
    }
    return { warning: false, message: "" };
  };

  const outOfRange = isOutOfRange();
  const canSubmit = records.length > 0 && records.every(r => r.applianceName && r.temperature !== null);

  return (
    <div className="space-y-6">
      {/* Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Operating Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Fridges should operate under 5°C</li>
          <li>• Freezers under -18°C</li>
        </ul>
        <p className="text-sm text-blue-700 mt-2 italic">
          If there is a fault or temperatures are out of range, please enter your corrective action as a comment.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Appliance List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Fridge & Freezer Records</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">VIEW</span>
              <button
                onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                className="p-1.5 rounded hover:bg-gray-100"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {viewMode === "list" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-4">
            At least 1 record must be submitted.
          </p>

          {/* Appliance List */}
          <div className="space-y-1 mb-4 max-h-96 overflow-y-auto">
            {records.map((record, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedIndex === index
                    ? "bg-orange-100 text-orange-900 border-2 border-orange-300"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {record.applianceName || `Record ${index + 1}`}
                  </span>
                  {record.saved && (
                    <span className="text-xs text-green-600">✓</span>
                  )}
                </div>
                {record.temperature !== null && (
                  <div className="text-xs text-gray-500 mt-1">
                    {record.temperature}°C ({record.type})
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={addRecord}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add record
          </button>
        </div>

        {/* Right Panel - Record Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedIndex + 1} / {records.length}
              </span>
              {currentRecord.saved && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </div>
              )}
            </div>
            <button
              onClick={() => deleteRecord(selectedIndex)}
              disabled={records.length <= 1}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Appliance Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fridge/Freezer Name
            </label>
            <input
              type="text"
              value={currentRecord.applianceName}
              onChange={(e) => updateRecord("applianceName", e.target.value)}
              placeholder="e.g., Coffee Area Milk Fridge"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">Repeats every time</p>
          </div>

          {/* Type Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => updateRecord("type", "fridge")}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  currentRecord.type === "fridge"
                    ? "bg-orange-50 border-orange-500 text-orange-700 font-medium"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Fridge
              </button>
              <button
                onClick={() => updateRecord("type", "freezer")}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  currentRecord.type === "freezer"
                    ? "bg-orange-50 border-orange-500 text-orange-700 font-medium"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Freezer
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Repeats every time</p>
          </div>

          {/* Temperature Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={currentRecord.temperature ?? ""}
                onChange={(e) => updateRecord("temperature", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Enter temperature"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-gray-600 font-medium">°C</span>
            </div>

            {/* Out of Range Warning */}
            {outOfRange.warning && (
              <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-yellow-800">{outOfRange.message}</p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={goToPrevious}
              disabled={selectedIndex === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={saveRecord}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Save
              </button>
              {onComplete && (
                <button
                  onClick={async () => {
                    // Save all records before completing
                    if (taskId) {
                      try {
                        await fetch(`/api/safety/tasks/${taskId}/fridge-records`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ 
                            records: records.filter(r => r.applianceName && r.temperature !== null),
                            saveAppliances: true // Save appliance names for future use
                          }),
                        });
                      } catch (error) {
                        console.error("Failed to save records:", error);
                      }
                    }
                    onComplete(records);
                  }}
                  disabled={!canSubmit}
                  className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                    canSubmit
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Complete Task
                </button>
              )}
            </div>

            <button
              onClick={goToNext}
              disabled={selectedIndex === records.length - 1}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

