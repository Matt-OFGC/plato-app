"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';
import { AllergenSheetCanvas } from '../shared/AllergenSheetCanvas';

interface AllergenSheetTemplate {
  id: number;
  templateName: string;
  layoutType: string;
  backgroundColor: string;
  textColor: string;
  accentColor?: string;
  headerFont: string;
  headerFontSize: number;
  headerFontWeight: string;
  bodyFont: string;
  bodyFontSize: number;
  bodyFontWeight: string;
  showIcons: boolean;
  showAllergenCodes: boolean;
  showDietaryInfo: boolean;
  showWarnings: boolean;
  showCompanyInfo: boolean;
  gridColumns: number;
}

interface Recipe {
  id: number;
  name: string;
  allergens?: string[];
  dietary_tags?: string[];
  category?: string;
}

interface PreviewViewProps {
  template: AllergenSheetTemplate | null;
  recipes: Recipe[];
}

export function PreviewView({ template, recipes }: PreviewViewProps) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please select a template and recipes to preview.</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please select recipes to preview allergen sheets.</p>
      </div>
    );
  }

  // Calculate recipes per page based on layout type
  const recipesPerPage = template.layoutType === 'matrix' ? 6 : 3;
  const totalPages = Math.ceil(recipes.length / recipesPerPage);

  // Get recipes for current page
  const startIdx = currentPage * recipesPerPage;
  const endIdx = startIdx + recipesPerPage;
  const currentPageRecipes = recipes.slice(startIdx, endIdx);

  const handleDownload = () => {
    alert('PDF generation will be implemented with jsPDF library');
    // TODO: Implement PDF generation with jsPDF
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
          Preview Allergen Sheets
        </h1>
        <p className="text-lg text-gray-500">
          Review your allergen information sheets before downloading
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-4">

        {/* Page Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
            Page {currentPage + 1} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            <Printer size={18} />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-lg"
          >
            <Download size={18} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex justify-center">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* A4 Sheet Preview */}
          <div
            className="relative bg-white"
            style={{
              width: '210mm',
              minHeight: '297mm',
            }}
          >
            <AllergenSheetCanvas
              template={template}
              recipes={currentPageRecipes}
            />
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
        <div className="grid grid-cols-4 gap-6">

          {/* Template */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Template</p>
            <p className="text-lg font-bold text-gray-900">{template.templateName}</p>
          </div>

          {/* Total Recipes */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Recipes</p>
            <p className="text-3xl font-bold text-gray-900">{recipes.length}</p>
          </div>

          {/* Unique Allergens */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Unique Allergens</p>
            <p className="text-3xl font-bold text-gray-900">
              {new Set(recipes.flatMap(r => r.allergens || [])).size}
            </p>
          </div>

          {/* Total Pages */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Pages</p>
            <p className="text-3xl font-bold text-gray-900">{totalPages}</p>
          </div>
        </div>
      </div>

      {/* Recipe List */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipes on Page {currentPage + 1}</h3>
        <div className="grid grid-cols-3 gap-4">
          {currentPageRecipes.map(recipe => (
            <div key={recipe.id} className="p-4 bg-white rounded-xl border border-gray-200">
              <p className="font-medium text-gray-900">{recipe.name}</p>
              {recipe.allergens && recipe.allergens.length > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {recipe.allergens.length} allergen{recipe.allergens.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
