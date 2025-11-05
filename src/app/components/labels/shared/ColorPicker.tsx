"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

export function ColorPicker({ color, onChange, onClose }: ColorPickerProps) {
  const [currentColor, setCurrentColor] = useState(color);

  const presetColors = [
    // Neutrals
    '#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#111827', '#000000',
    // Blues
    '#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A',
    // Greens
    '#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#15803D', '#166534', '#14532D',
    // Yellows
    '#FFFBEB', '#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F',
    // Reds
    '#FEF2F2', '#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D',
    // Purples
    '#FAF5FF', '#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#A855F7', '#9333EA', '#7E22CE', '#6B21A8', '#581C87',
    // Custom/Brand Colors
    '#E8E4DC', '#6D7C6F', '#FFF8F0', '#4A3B2A', '#C19A6B', '#FFFEF7', '#2D3142', '#F77F00', '#F5F3F0', '#2C2416', '#8B7355',
  ];

  const handleApply = () => {
    onChange(currentColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Choose Color</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Current Color Preview */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Color
          </label>
          <div className="flex items-center gap-4">
            <div
              className="w-24 h-24 rounded-xl border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: currentColor }}
            />
            <div className="flex-1">
              <input
                type="text"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#000000"
              />
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                className="w-full mt-2 h-12 rounded-xl cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Preset Colors */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preset Colors
          </label>
          <div className="grid grid-cols-12 gap-2">
            {presetColors.map((presetColor) => (
              <button
                key={presetColor}
                onClick={() => setCurrentColor(presetColor)}
                className={`w-full aspect-square rounded-lg border-2 transition-all ${
                  currentColor === presetColor
                    ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: presetColor }}
                title={presetColor}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
