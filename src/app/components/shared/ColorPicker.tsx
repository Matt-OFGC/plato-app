"use client";

import React, { useState } from 'react';
import { ChromePicker, ColorResult } from 'react-color';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  presetColors?: string[];
}

const DEFAULT_PRESET_COLORS = [
  // Whites and Grays
  '#FFFFFF',
  '#F9FAFB',
  '#F3F4F6',
  '#E5E7EB',
  '#D1D5DB',
  '#9CA3AF',
  '#6B7280',
  '#4B5563',
  '#374151',
  '#1F2937',
  '#111827',

  // Blues
  '#EFF6FF',
  '#DBEAFE',
  '#BFDBFE',
  '#93C5FD',
  '#60A5FA',
  '#3B82F6',
  '#2563EB',
  '#1D4ED8',

  // Reds
  '#FEF2F2',
  '#FEE2E2',
  '#FECACA',
  '#FCA5A5',
  '#F87171',
  '#EF4444',
  '#DC2626',
  '#B91C1C',

  // Greens
  '#F0FDF4',
  '#DCFCE7',
  '#BBF7D0',
  '#86EFAC',
  '#4ADE80',
  '#22C55E',
  '#16A34A',
  '#15803D',

  // Yellows
  '#FEFCE8',
  '#FEF9C3',
  '#FEF08A',
  '#FDE047',
  '#FACC15',
  '#EAB308',
  '#CA8A04',
  '#A16207',

  // Oranges
  '#FFF7ED',
  '#FFEDD5',
  '#FED7AA',
  '#FDBA74',
  '#FB923C',
  '#F97316',
  '#EA580C',
  '#C2410C',

  // Purples
  '#FAF5FF',
  '#F3E8FF',
  '#E9D5FF',
  '#D8B4FE',
  '#C084FC',
  '#A855F7',
  '#9333EA',
  '#7E22CE',

  // Pinks
  '#FDF2F8',
  '#FCE7F3',
  '#FBCFE8',
  '#F9A8D4',
  '#F472B6',
  '#EC4899',
  '#DB2777',
  '#BE185D'
];

export function ColorPicker({
  color,
  onChange,
  label,
  presetColors = DEFAULT_PRESET_COLORS
}: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (colorResult: ColorResult) => {
    onChange(colorResult.hex);
  };

  const handlePresetClick = (presetColor: string) => {
    onChange(presetColor);
    setShowPicker(false);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Color Preview Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all w-full"
        >
          <div
            className="w-8 h-8 rounded-lg border-2 border-gray-200 shadow-sm"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-gray-900 uppercase">
            {color}
          </span>
        </button>

        {/* Picker Popover */}
        {showPicker && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPicker(false)}
            />

            {/* Picker Container */}
            <div className="absolute top-full left-0 mt-2 z-20 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
              {/* Chrome Picker */}
              <ChromePicker
                color={color}
                onChange={handleChange}
                disableAlpha={false}
              />

              {/* Preset Colors */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Preset Colors
                </p>
                <div className="grid grid-cols-11 gap-2">
                  {presetColors.map((presetColor, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePresetClick(presetColor)}
                      className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                        color.toUpperCase() === presetColor.toUpperCase()
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: presetColor }}
                      title={presetColor}
                    />
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => onChange('#FFFFFF')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Reset to White
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Color Swatches (Quick Access) */}
      <div className="flex gap-2 flex-wrap">
        {presetColors.slice(0, 8).map((presetColor, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handlePresetClick(presetColor)}
            className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
              color.toUpperCase() === presetColor.toUpperCase()
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{ backgroundColor: presetColor }}
            title={presetColor}
          />
        ))}
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="w-8 h-8 rounded-lg border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all"
          title="More colors..."
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
