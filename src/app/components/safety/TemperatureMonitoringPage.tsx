"use client";

import { useState, useEffect } from "react";
import { FridgeFreezerChecklist } from "./FridgeFreezerChecklist";

interface TemperatureMonitoringPageProps {
  selectedDate: string;
}

type TemperatureSection = "fridge-freezer" | "hot-holding" | "reheating-cooking" | "am-pm-checks";

export function TemperatureMonitoringPage({ selectedDate }: TemperatureMonitoringPageProps) {
  const [activeSection, setActiveSection] = useState<TemperatureSection>("fridge-freezer");
  const [checkPeriod, setCheckPeriod] = useState<"AM" | "PM">(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "AM" : "PM";
  });

  const sections = [
    { id: "fridge-freezer" as TemperatureSection, label: "Fridge & Freezer", icon: "❄️" },
    { id: "hot-holding" as TemperatureSection, label: "Hot Holding", icon: "🔥" },
    { id: "reheating-cooking" as TemperatureSection, label: "Reheating & Cooking", icon: "🍳" },
    { id: "am-pm-checks" as TemperatureSection, label: "AM/PM Checks", icon: "📋" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Temperature Monitoring</h1>
          <p className="text-gray-600 mt-1">Track and record all temperature checks</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => window.location.href = `/dashboard/safety?page=temperatures&date=${e.target.value}`}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {activeSection === "am-pm-checks" && (
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1">
              <button
                onClick={() => setCheckPeriod("AM")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  checkPeriod === "AM"
                    ? "bg-orange-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                AM
              </button>
              <button
                onClick={() => setCheckPeriod("PM")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  checkPeriod === "PM"
                    ? "bg-orange-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                PM
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeSection === section.id
                ? "bg-orange-500 text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span className="text-xl">{section.icon}</span>
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="mt-6">
        {activeSection === "fridge-freezer" && (
          <FridgeFreezerChecklist />
        )}

        {activeSection === "hot-holding" && (
          <HotHoldingSection selectedDate={selectedDate} />
        )}

        {activeSection === "reheating-cooking" && (
          <ReheatingCookingSection selectedDate={selectedDate} />
        )}

        {activeSection === "am-pm-checks" && (
          <AmPmChecksSection selectedDate={selectedDate} period={checkPeriod} />
        )}
      </div>
    </div>
  );
}

// Hot Holding Section
function HotHoldingSection({ selectedDate }: { selectedDate: string }) {
  const [records, setRecords] = useState<Array<{
    itemName: string;
    temperature: number | null;
    location: string;
    saved: boolean;
  }>>([
    { itemName: "", temperature: null, location: "", saved: false }
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentRecord = records[selectedIndex];

  function addRecord() {
    setRecords([...records, { itemName: "", temperature: null, location: "", saved: false }]);
    setSelectedIndex(records.length);
  }

  function updateRecord(field: string, value: any) {
    const updated = [...records];
    updated[selectedIndex] = { ...updated[selectedIndex], [field]: value, saved: false };
    setRecords(updated);
  }

  const isOutOfRange = currentRecord.temperature !== null && currentRecord.temperature < 63;

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <h3 className="font-semibold text-red-900 mb-2">Hot Holding Guidelines</h3>
        <ul className="text-sm text-red-800 space-y-1">
          <li>• Hot food must be held at 63°C or above</li>
          <li>• Check temperatures every 2 hours</li>
          <li>• Discard food if below 63°C for more than 2 hours</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Hot Holding Items</h3>
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
                <div className="text-sm font-medium">
                  {record.itemName || `Item ${index + 1}`}
                </div>
                {record.temperature !== null && (
                  <div className="text-xs text-gray-500 mt-1">
                    {record.temperature}°C
                  </div>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={addRecord}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            + Add Item
          </button>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name
              </label>
              <input
                type="text"
                value={currentRecord.itemName}
                onChange={(e) => updateRecord("itemName", e.target.value)}
                placeholder="e.g., Soup, Curry, Rice"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={currentRecord.location}
                onChange={(e) => updateRecord("location", e.target.value)}
                placeholder="e.g., Hot holding unit, Baine marie"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (°C)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={currentRecord.temperature ?? ""}
                  onChange={(e) => updateRecord("temperature", e.target.value ? parseFloat(e.target.value) : null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-gray-600 font-medium">°C</span>
              </div>
              {isOutOfRange && (
                <div className="mt-3 bg-red-50 border border-red-300 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    ⚠️ Temperature below 63°C! Food must be discarded or reheated immediately.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reheating & Cooking Section
function ReheatingCookingSection({ selectedDate }: { selectedDate: string }) {
  const [records, setRecords] = useState<Array<{
    itemName: string;
    method: "reheating" | "cooking";
    temperature: number | null;
    time: string;
    saved: boolean;
  }>>([
    { itemName: "", method: "reheating", temperature: null, time: "", saved: false }
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentRecord = records[selectedIndex];

  function addRecord() {
    setRecords([...records, { itemName: "", method: "reheating", temperature: null, time: "", saved: false }]);
    setSelectedIndex(records.length);
  }

  function updateRecord(field: string, value: any) {
    const updated = [...records];
    updated[selectedIndex] = { ...updated[selectedIndex], [field]: value, saved: false };
    setRecords(updated);
  }

  const reheatingMinTemp = 82;
  const cookingMinTemp = 75;
  const minTemp = currentRecord.method === "reheating" ? reheatingMinTemp : cookingMinTemp;
  const isOutOfRange = currentRecord.temperature !== null && currentRecord.temperature < minTemp;

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <h3 className="font-semibold text-purple-900 mb-2">Reheating & Cooking Guidelines</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Reheating: Food must reach 82°C for at least 2 minutes</li>
          <li>• Cooking: Food must reach 75°C minimum</li>
          <li>• Record time when temperature is reached</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Records</h3>
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
                <div className="text-sm font-medium">
                  {record.itemName || `Record ${index + 1}`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {record.method === "reheating" ? "Reheating" : "Cooking"}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={addRecord}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            + Add Record
          </button>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name
              </label>
              <input
                type="text"
                value={currentRecord.itemName}
                onChange={(e) => updateRecord("itemName", e.target.value)}
                placeholder="e.g., Chicken Curry, Pasta"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Method
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => updateRecord("method", "reheating")}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                    currentRecord.method === "reheating"
                      ? "bg-orange-50 border-orange-500 text-orange-700 font-medium"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Reheating
                </button>
                <button
                  onClick={() => updateRecord("method", "cooking")}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                    currentRecord.method === "cooking"
                      ? "bg-orange-50 border-orange-500 text-orange-700 font-medium"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Cooking
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (°C)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={currentRecord.temperature ?? ""}
                  onChange={(e) => updateRecord("temperature", e.target.value ? parseFloat(e.target.value) : null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-gray-600 font-medium">°C</span>
              </div>
              {isOutOfRange && (
                <div className="mt-3 bg-red-50 border border-red-300 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    ⚠️ Temperature below {minTemp}°C! {currentRecord.method === "reheating" ? "Reheat to 82°C for 2 minutes." : "Continue cooking until 75°C is reached."}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Reached
              </label>
              <input
                type="time"
                value={currentRecord.time}
                onChange={(e) => updateRecord("time", e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// AM/PM Checks Section
function AmPmChecksSection({ selectedDate, period }: { selectedDate: string; period: "AM" | "PM" }) {
  const [checks, setChecks] = useState<Array<{
    checkType: string;
    temperature: number | null;
    notes: string;
    completed: boolean;
  }>>([
    { checkType: "Fridge Check", temperature: null, notes: "", completed: false },
    { checkType: "Freezer Check", temperature: null, notes: "", completed: false },
    { checkType: "Hot Holding Check", temperature: null, notes: "", completed: false },
  ]);

  function updateCheck(index: number, field: string, value: any) {
    const updated = [...checks];
    updated[index] = { ...updated[index], [field]: value };
    setChecks(updated);
  }

  function toggleComplete(index: number) {
    updateCheck(index, "completed", !checks[index].completed);
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          {period} Temperature Checks - {new Date(selectedDate).toLocaleDateString()}
        </h3>
        <p className="text-sm text-blue-800">
          Complete all temperature checks for this {period.toLowerCase()} period.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {checks.map((check, index) => (
          <div
            key={index}
            className={`bg-white rounded-2xl border-2 p-6 transition-all ${
              check.completed
                ? "border-green-300 bg-green-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{check.checkType}</h3>
              <button
                onClick={() => toggleComplete(index)}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  check.completed
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 hover:border-green-500"
                }`}
              >
                {check.completed && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={check.temperature ?? ""}
                  onChange={(e) => updateCheck(index, "temperature", e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={check.completed}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={check.notes}
                  onChange={(e) => updateCheck(index, "notes", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  placeholder="Add any notes or issues..."
                  disabled={check.completed}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={async () => {
            // Save all checks to database
            try {
              const response = await fetch("/api/safety/temperatures/daily-checks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  checks,
                  date: selectedDate,
                  period,
                }),
              });
              if (response.ok) {
                alert(`${period} checks saved successfully!`);
              } else {
                alert("Failed to save checks");
              }
            } catch (error) {
              console.error("Failed to save checks:", error);
              alert("Failed to save checks");
            }
          }}
          disabled={!checks.every(c => c.completed)}
          className={`px-8 py-3 rounded-xl font-medium text-lg transition-colors ${
            checks.every(c => c.completed)
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Complete {period} Checks
        </button>
      </div>
    </div>
  );
}

