"use client";

import { useState } from "react";

interface DateRangePickerProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
}

const PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "This month", custom: true },
  { label: "Last month", custom: true },
  { label: "This year", custom: true }
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    if (preset.custom) {
      setIsCustom(true);
      return;
    }

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - preset.days!);
    
    onChange({ start, end });
    setIsCustom(false);
  };

  const handleCustomChange = (field: 'start' | 'end', dateString: string) => {
    const date = new Date(dateString);
    onChange({
      ...value,
      [field]: date
    });
  };

  return (
    <div className="space-y-3">
      {/* Presets */}
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset)}
            className="px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      <div className="space-y-2">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Start Date</label>
          <input
            type="date"
            value={value.start.toISOString().split('T')[0]}
            onChange={(e) => handleCustomChange('start', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        
        <div>
          <label className="block text-xs text-slate-400 mb-1">End Date</label>
          <input
            type="date"
            value={value.end.toISOString().split('T')[0]}
            onChange={(e) => handleCustomChange('end', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Current Range Display */}
      <div className="text-xs text-slate-400 bg-slate-800 p-2 rounded">
        <div>From: {value.start.toLocaleDateString()}</div>
        <div>To: {value.end.toLocaleDateString()}</div>
      </div>
    </div>
  );
}
