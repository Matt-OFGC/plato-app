"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Printer, Download } from 'lucide-react';
import { LabelCanvas } from '../shared/LabelCanvas';

interface Recipe {
  id: number;
  name: string;
  selling_price?: number;
  allergens?: string[];
  dietary_tags?: string[];
  shelf_life?: number;
  quantity?: number;
}

interface LabelTemplate {
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
  templateName: string;
}

interface PreviewViewProps {
  template: LabelTemplate | null;
  recipes: Recipe[];
}

// Helper function to calculate best before date
function calculateBestBefore(shelfLifeDays?: number): string {
  const date = new Date();
  date.setDate(date.getDate() + (shelfLifeDays || 3));
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function PreviewView({ template, recipes }: PreviewViewProps) {
  const [currentSheet, setCurrentSheet] = useState(0);

  if (!template || recipes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
            Preview Sheets
          </h1>
          <p className="text-lg text-gray-500">
            Review your labels before printing
          </p>
        </div>
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-12 text-center">
          <p className="text-gray-600 mb-4">
            {!template ? 'Please select a template first' : 'Please select products first'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Calculate sheet layout
  const labelsPerSheet = 21; // 3 columns × 7 rows for 65mm×38mm on A4
  const labelsPerRow = 3;
  const labelsPerColumn = 7;

  // Flatten all labels into single array
  const allLabels: Array<{ recipe: Recipe; labelData: any }> = [];
  recipes.forEach(recipe => {
    for (let i = 0; i < (recipe.quantity || 0); i++) {
      allLabels.push({
        recipe,
        labelData: {
          productName: recipe.name,
          price: recipe.selling_price,
          allergens: recipe.allergens || [],
          dietaryTags: recipe.dietary_tags || [],
          bestBefore: calculateBestBefore(recipe.shelf_life),
        }
      });
    }
  });

  const totalSheets = Math.ceil(allLabels.length / labelsPerSheet);
  const sheetsArray: Array<Array<typeof allLabels[0]>> = [];

  // Split labels into sheets
  for (let i = 0; i < totalSheets; i++) {
    const startIdx = i * labelsPerSheet;
    const endIdx = Math.min(startIdx + labelsPerSheet, allLabels.length);
    sheetsArray.push(allLabels.slice(startIdx, endIdx));
  }

  const currentSheetLabels = sheetsArray[currentSheet] || [];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    alert('PDF download will be implemented with jsPDF in next update');
    // PDF generation implementation coming next
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
          Preview Sheets
        </h1>
        <p className="text-lg text-gray-500">
          Review your labels before printing
        </p>
      </div>

      {/* Sheet Navigation */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-2xl border border-gray-200/60 shadow-lg p-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentSheet(Math.max(0, currentSheet - 1))}
          disabled={currentSheet === 0}
          className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">Sheet</p>
          <p className="text-2xl font-bold text-gray-900">
            {currentSheet + 1} / {totalSheets}
          </p>
        </div>

        <button
          onClick={() => setCurrentSheet(Math.min(totalSheets - 1, currentSheet + 1))}
          disabled={currentSheet === totalSheets - 1}
          className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          Next
          <ChevronRight size={20} />
        </button>
      </div>

      {/* A4 Sheet Preview */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-8">
        <div
          className="bg-white rounded-2xl shadow-inner p-8 mx-auto overflow-auto"
          style={{
            width: '210mm',
            minHeight: '297mm',
          }}
        >
          {/* Label Grid */}
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: labelsPerSheet }).map((_, idx) => {
              const label = currentSheetLabels[idx];

              return (
                <div
                  key={idx}
                  className="border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{
                    width: '65mm',
                    height: '38mm'
                  }}
                >
                  {label ? (
                    <LabelCanvas
                      template={template}
                      data={label.labelData}
                      scale={1}
                    />
                  ) : (
                    <div className="text-gray-300 text-xs">Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sheet Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>A4 Sheet (210mm × 297mm) • 65mm × 38mm labels • {currentSheetLabels.length} labels on this sheet</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handlePrint}
          className="flex-1 px-8 py-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
        >
          <Printer size={24} />
          <span>Print All Sheets ({totalSheets})</span>
        </button>

        <button
          onClick={handleDownloadPDF}
          className="flex-1 px-8 py-4 bg-white/70 backdrop-blur-xl border border-gray-200/60 text-gray-900 rounded-xl font-semibold hover:bg-white transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
        >
          <Download size={24} />
          <span>Download PDF</span>
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-2xl border border-gray-200/60 p-6">
        <div className="grid grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-sm text-gray-600 mb-1">Products</p>
            <p className="text-3xl font-bold text-gray-900">{recipes.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Labels</p>
            <p className="text-3xl font-bold text-gray-900">{allLabels.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Sheets</p>
            <p className="text-3xl font-bold text-gray-900">{totalSheets}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Template</p>
            <p className="text-lg font-semibold text-gray-900">{template.templateName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
