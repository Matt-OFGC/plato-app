"use client";

import React, { useState } from 'react';
import { Save, X, Eye } from 'lucide-react';

interface LabelTemplate {
  id?: number;
  templateName: string;
  backgroundColor: string;
  textColor: string;
  accentColor?: string;
  productFont: string;
  productFontWeight: string;
  productFontSize: number;
  subtitleFont: string;
  subtitleFontWeight: string;
  subtitleFontSize: number;
  bodyFont: string;
  bodyFontWeight: string;
  bodyFontSize: number;
  alignment: string;
  textTransform: string;
  spacingStyle: string;
  marginMm: number;
  widthMm: number;
  heightMm: number;
  showPrice: boolean;
  showAllergens: boolean;
  showDietaryTags: boolean;
  showDate: boolean;
  showWeight?: boolean;
  showCompanyName?: boolean;
  showStorageInfo?: boolean;
  showBarcode?: boolean;
}

interface DesignStudioViewProps {
  initialTemplate?: LabelTemplate | null;
  onSave: (template: LabelTemplate) => void;
  onCancel: () => void;
}

const FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
];

const FONT_WEIGHTS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
];

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const TEXT_TRANSFORM_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
];

const STANDARD_SIZES = [
  { width: 65, height: 38, label: '65mm × 38mm (Standard)' },
  { width: 50, height: 30, label: '50mm × 30mm (Small)' },
  { width: 80, height: 50, label: '80mm × 50mm (Large)' },
  { width: 100, height: 60, label: '100mm × 60mm (Extra Large)' },
];

export function DesignStudioView({ initialTemplate, onSave, onCancel }: DesignStudioViewProps) {
  const [template, setTemplate] = useState<LabelTemplate>(
    initialTemplate || {
      templateName: '',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      accentColor: '#3b82f6',
      productFont: 'Arial',
      productFontWeight: '700',
      productFontSize: 24,
      subtitleFont: 'Arial',
      subtitleFontWeight: '400',
      subtitleFontSize: 14,
      bodyFont: 'Arial',
      bodyFontWeight: '400',
      bodyFontSize: 12,
      alignment: 'left',
      textTransform: 'none',
      spacingStyle: 'normal',
      marginMm: 5,
      widthMm: 65,
      heightMm: 38,
      showPrice: true,
      showAllergens: true,
      showDietaryTags: false,
      showDate: true,
      showWeight: false,
      showCompanyName: false,
      showStorageInfo: false,
      showBarcode: false,
    }
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!template.templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    setIsSaving(true);
    try {
      onSave(template);
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const updateTemplate = (updates: Partial<LabelTemplate>) => {
    setTemplate({ ...template, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
            Design Studio
          </h1>
          <p className="text-lg text-gray-500">
            Create and customize your label templates
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center gap-2"
          >
            <X size={20} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {isSaving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={template.templateName}
                  onChange={(e) => updateTemplate({ templateName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Standard Product Label"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Label Size
                  </label>
                  <select
                    value={`${template.widthMm}x${template.heightMm}`}
                    onChange={(e) => {
                      const [width, height] = e.target.value.split('x').map(Number);
                      updateTemplate({ widthMm: width, heightMm: height });
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STANDARD_SIZES.map(size => (
                      <option key={`${size.width}x${size.height}`} value={`${size.width}x${size.height}`}>
                        {size.label}
                      </option>
                    ))}
                    <option value="custom">Custom Size</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Margin (mm)
                  </label>
                  <input
                    type="number"
                    value={template.marginMm}
                    onChange={(e) => updateTemplate({ marginMm: Number(e.target.value) })}
                    min="0"
                    max="20"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Colors</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={template.backgroundColor}
                    onChange={(e) => updateTemplate({ backgroundColor: e.target.value })}
                    className="w-16 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={template.backgroundColor}
                    onChange={(e) => updateTemplate({ backgroundColor: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={template.textColor}
                    onChange={(e) => updateTemplate({ textColor: e.target.value })}
                    className="w-16 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={template.textColor}
                    onChange={(e) => updateTemplate({ textColor: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={template.accentColor || '#3b82f6'}
                    onChange={(e) => updateTemplate({ accentColor: e.target.value })}
                    className="w-16 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={template.accentColor || '#3b82f6'}
                    onChange={(e) => updateTemplate({ accentColor: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Typography</h2>
            <div className="space-y-4">
              {/* Product Name Font */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name Font
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <select
                    value={template.productFont}
                    onChange={(e) => updateTemplate({ productFont: e.target.value })}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FONT_OPTIONS.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                  <select
                    value={template.productFontWeight}
                    onChange={(e) => updateTemplate({ productFontWeight: e.target.value })}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FONT_WEIGHTS.map(weight => (
                      <option key={weight.value} value={weight.value}>{weight.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={template.productFontSize}
                    onChange={(e) => updateTemplate({ productFontSize: Number(e.target.value) })}
                    min="8"
                    max="72"
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Size"
                  />
                </div>
              </div>

              {/* Body Font */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body Font
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <select
                    value={template.bodyFont}
                    onChange={(e) => updateTemplate({ bodyFont: e.target.value })}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FONT_OPTIONS.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                  <select
                    value={template.bodyFontWeight}
                    onChange={(e) => updateTemplate({ bodyFontWeight: e.target.value })}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FONT_WEIGHTS.map(weight => (
                      <option key={weight.value} value={weight.value}>{weight.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={template.bodyFontSize}
                    onChange={(e) => updateTemplate({ bodyFontSize: Number(e.target.value) })}
                    min="6"
                    max="24"
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Size"
                  />
                </div>
              </div>

              {/* Alignment & Transform */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Alignment
                  </label>
                  <select
                    value={template.alignment}
                    onChange={(e) => updateTemplate({ alignment: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ALIGNMENT_OPTIONS.map(align => (
                      <option key={align.value} value={align.value}>{align.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Transform
                  </label>
                  <select
                    value={template.textTransform}
                    onChange={(e) => updateTemplate({ textTransform: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TEXT_TRANSFORM_OPTIONS.map(transform => (
                      <option key={transform.value} value={transform.value}>{transform.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Display Options */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Display Options</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.showPrice}
                  onChange={(e) => updateTemplate({ showPrice: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Show Price</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.showAllergens}
                  onChange={(e) => updateTemplate({ showAllergens: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Show Allergens</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.showDietaryTags}
                  onChange={(e) => updateTemplate({ showDietaryTags: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Show Dietary Tags</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.showDate}
                  onChange={(e) => updateTemplate({ showDate: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Show Date</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.showWeight || false}
                  onChange={(e) => updateTemplate({ showWeight: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Show Weight</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.showCompanyName || false}
                  onChange={(e) => updateTemplate({ showCompanyName: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Show Company Name</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.showStorageInfo || false}
                  onChange={(e) => updateTemplate({ showStorageInfo: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Show Storage Info</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.showBarcode || false}
                  onChange={(e) => updateTemplate({ showBarcode: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Show Barcode</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye size={20} />
              Live Preview
            </h2>
            <div
              className="rounded-2xl p-6 border-4 border-gray-300 mx-auto"
              style={{
                width: `${(template.widthMm / 25.4) * 3}rem`,
                height: `${(template.heightMm / 25.4) * 3}rem`,
                backgroundColor: template.backgroundColor,
                color: template.textColor,
                textAlign: template.alignment as any,
              }}
            >
              <div
                style={{
                  fontFamily: template.productFont,
                  fontWeight: template.productFontWeight,
                  fontSize: `${template.productFontSize / 3}px`,
                  textTransform: template.textTransform as any,
                  marginBottom: '8px',
                }}
              >
                Product Name
              </div>
              {template.showPrice && (
                <div
                  style={{
                    fontFamily: template.bodyFont,
                    fontWeight: template.bodyFontWeight,
                    fontSize: `${template.bodyFontSize / 3}px`,
                    color: template.accentColor,
                  }}
                >
                  £5.99
                </div>
              )}
              {template.showAllergens && (
                <div
                  style={{
                    fontFamily: template.bodyFont,
                    fontWeight: template.bodyFontWeight,
                    fontSize: `${template.bodyFontSize / 3}px`,
                    marginTop: '4px',
                  }}
                >
                  Contains: Gluten, Milk
                </div>
              )}
              {template.showDate && (
                <div
                  style={{
                    fontFamily: template.bodyFont,
                    fontWeight: template.bodyFontWeight,
                    fontSize: `${template.bodyFontSize / 3}px`,
                    marginTop: '4px',
                    opacity: 0.7,
                  }}
                >
                  {new Date().toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center">
              {template.widthMm}mm × {template.heightMm}mm
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







