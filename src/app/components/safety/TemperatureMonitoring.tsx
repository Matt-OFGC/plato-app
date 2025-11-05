"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function TemperatureMonitoring() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSensor, setShowAddSensor] = useState(false);

  useEffect(() => {
    loadSensors();
    // Refresh every 30 seconds
    const interval = setInterval(loadSensors, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadSensors() {
    try {
      const response = await fetch("/api/safety/sensors");
      if (response.ok) {
        const data = await response.json();
        setSensors(data);
      }
    } catch (error) {
      console.error("Failed to load sensors:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(temperature: number, min: number | null, max: number | null, target: number | null) {
    if (!min || !max) return "bg-gray-500";
    
    if (temperature < min || temperature > max) {
      return "bg-red-500";
    }
    
    if (target) {
      const diff = Math.abs(temperature - target);
      if (diff <= 1) return "bg-green-500";
      if (diff <= 2) return "bg-yellow-500";
    }
    
    return "bg-green-500";
  }

  function getStatusText(temperature: number, min: number | null, max: number | null) {
    if (!min || !max) return "No thresholds set";
    
    if (temperature < min) return "Below minimum";
    if (temperature > max) return "Above maximum";
    return "Within range";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sensors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Temperature Monitoring</h1>
        <button
          onClick={() => setShowAddSensor(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
        >
          + Add Sensor
        </button>
      </div>

      {showAddSensor && (
        <AddSensorModal
          onClose={() => {
            setShowAddSensor(false);
            loadSensors();
          }}
        />
      )}

      {sensors.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌡️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No sensors configured</h3>
          <p className="text-gray-600 mb-4">Add a temperature sensor to start monitoring.</p>
          <button
            onClick={() => setShowAddSensor(true)}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
          >
            Add Sensor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((sensor) => {
            const temp = sensor.latestReading?.temperatureValue;
            const statusColor = getStatusColor(
              temp || 0,
              sensor.minThreshold,
              sensor.maxThreshold,
              sensor.targetTemperature
            );
            const statusText = getStatusText(temp || 0, sensor.minThreshold, sensor.maxThreshold);

            return (
              <Link
                key={sensor.id}
                href={`/dashboard/safety/temperature/${sensor.id}`}
                className="block bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{sensor.sensorName}</h3>
                    <p className="text-sm text-gray-600">{sensor.location || "No location"}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
                </div>

                <div className="mb-4">
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {temp !== null && temp !== undefined ? `${temp.toFixed(1)}°C` : "—"}
                  </div>
                  <div className="text-sm text-gray-600">{statusText}</div>
                </div>

                {sensor.targetTemperature && (
                  <div className="text-xs text-gray-500">
                    Target: {sensor.targetTemperature}°C
                  </div>
                )}

                {sensor.latestReading && (
                  <div className="text-xs text-gray-500 mt-2">
                    Last reading: {new Date(sensor.latestReading.recordedAt).toLocaleTimeString()}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddSensorModal({ onClose }: { onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    sensorName: "",
    sensorType: "fridge",
    location: "",
    targetTemperature: "",
    minThreshold: "",
    maxThreshold: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.sensorName.trim()) {
      alert("Sensor name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/safety/sensors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          targetTemperature: formData.targetTemperature ? parseFloat(formData.targetTemperature) : null,
          minThreshold: formData.minThreshold ? parseFloat(formData.minThreshold) : null,
          maxThreshold: formData.maxThreshold ? parseFloat(formData.maxThreshold) : null,
        }),
      });

      if (response.ok) {
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create sensor");
      }
    } catch (error) {
      console.error("Create sensor error:", error);
      alert("Failed to create sensor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Temperature Sensor</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sensor Name *
            </label>
            <input
              type="text"
              value={formData.sensorName}
              onChange={(e) => setFormData({ ...formData, sensorName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sensor Type
            </label>
            <select
              value={formData.sensorType}
              onChange={(e) => setFormData({ ...formData, sensorType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="fridge">Fridge</option>
              <option value="freezer">Freezer</option>
              <option value="ambient">Ambient</option>
              <option value="hot_holding">Hot Holding</option>
              <option value="cold_holding">Cold Holding</option>
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
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Kitchen - Walk-in Fridge"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.targetTemperature}
                onChange={(e) => setFormData({ ...formData, targetTemperature: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.maxThreshold}
                onChange={(e) => setFormData({ ...formData, maxThreshold: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
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
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Sensor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

