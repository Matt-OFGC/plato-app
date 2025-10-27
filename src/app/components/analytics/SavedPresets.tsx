"use client";

import { useState, useEffect } from "react";

interface SavedPresetsProps {
  onApplyPreset: (filters: any) => void;
}

interface Preset {
  id: string;
  name: string;
  filters: any;
  createdAt: Date;
}

export function SavedPresets({ onApplyPreset }: SavedPresetsProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    // Load presets from localStorage
    const saved = localStorage.getItem('analytics-presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load presets:', error);
      }
    }
  }, []);

  const savePreset = (currentFilters: any) => {
    if (!presetName.trim()) return;

    const newPreset: Preset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: currentFilters,
      createdAt: new Date()
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('analytics-presets', JSON.stringify(updatedPresets));
    
    setPresetName("");
    setShowSaveForm(false);
  };

  const deletePreset = (presetId: string) => {
    const updatedPresets = presets.filter(p => p.id !== presetId);
    setPresets(updatedPresets);
    localStorage.setItem('analytics-presets', JSON.stringify(updatedPresets));
  };

  const applyPreset = (preset: Preset) => {
    onApplyPreset(preset.filters);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-200">Saved Presets</h3>
        <button
          onClick={() => setShowSaveForm(!showSaveForm)}
          className="text-xs text-cyan-400 hover:text-cyan-300"
        >
          {showSaveForm ? "Cancel" : "Save Current"}
        </button>
      </div>

      {/* Save Form */}
      {showSaveForm && (
        <div className="mb-3 p-3 bg-slate-800 rounded-lg">
          <input
            type="text"
            placeholder="Preset name..."
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => savePreset({})} // This would need current filters passed in
              disabled={!presetName.trim()}
              className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white text-xs rounded transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveForm(false)}
              className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Presets List */}
      <div className="space-y-2">
        {presets.length === 0 ? (
          <p className="text-xs text-slate-500">No saved presets</p>
        ) : (
          presets.map((preset) => (
            <div key={preset.id} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
              <button
                onClick={() => applyPreset(preset)}
                className="flex-1 text-left text-xs text-slate-300 hover:text-slate-100"
              >
                {preset.name}
              </button>
              <button
                onClick={() => deletePreset(preset.id)}
                className="ml-2 text-xs text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
