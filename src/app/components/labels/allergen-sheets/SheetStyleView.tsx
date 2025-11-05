"use client";

import React, { useState, useEffect } from 'react';
import { Check, Grid3x3, List, Table } from 'lucide-react';

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
  isDefault: boolean;
  isSystemTemplate: boolean;
}

interface SheetStyleViewProps {
  selectedTemplate: AllergenSheetTemplate | null;
  onTemplateSelect: (template: AllergenSheetTemplate) => void;
}

export function SheetStyleView({ selectedTemplate, onTemplateSelect }: SheetStyleViewProps) {
  const [templates, setTemplates] = useState<AllergenSheetTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/allergen-sheets/templates');
      const data = await response.json();
      setTemplates(data);

      // Auto-select default template if nothing selected
      if (!selectedTemplate) {
        const defaultTemplate = data.find((t: AllergenSheetTemplate) => t.isDefault);
        if (defaultTemplate) {
          onTemplateSelect(defaultTemplate);
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLayoutIcon = (layoutType: string) => {
    switch (layoutType) {
      case 'detailed':
        return <List size={24} />;
      case 'simple':
        return <Table size={24} />;
      case 'matrix':
        return <Grid3x3 size={24} />;
      default:
        return <List size={24} />;
    }
  };

  const getLayoutDescription = (layoutType: string) => {
    switch (layoutType) {
      case 'detailed':
        return 'Full allergen information with warnings, ingredients, and detailed dietary information';
      case 'simple':
        return 'Clean, minimal reference sheet showing allergen presence with yes/no indicators';
      case 'matrix':
        return 'Visual grid matrix showing allergen presence across all products at a glance';
      default:
        return '';
    }
  };

  // Filter system templates
  const systemTemplates = templates.filter(t => t.isSystemTemplate);

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
          Choose Sheet Style
        </h1>
        <p className="text-lg text-gray-500">
          Select a layout style for your allergen information sheets
        </p>
      </div>

      {/* Template Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          Loading templates...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {systemTemplates.map(template => {
            const isSelected = selectedTemplate?.id === template.id;

            return (
              <div
                key={template.id}
                className={`group relative rounded-3xl border-2 p-6 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-xl'
                    : 'border-gray-200 bg-white/70 backdrop-blur-xl hover:border-gray-300 hover:shadow-lg'
                }`}
                onClick={() => onTemplateSelect(template)}
              >
                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check size={20} className="text-white" />
                  </div>
                )}

                {/* Template Preview Icon */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                } transition-all`}>
                  {getLayoutIcon(template.layoutType)}
                </div>

                {/* Template Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {template.templateName}
                </h3>

                {/* Layout Type Badge */}
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full mb-4">
                  {template.layoutType}
                </span>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-6">
                  {getLayoutDescription(template.layoutType)}
                </p>

                {/* Features List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Features
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className={isSelected ? 'text-blue-500' : 'text-gray-400'} />
                    <span>Allergen presence indicators</span>
                  </div>
                  {template.showDietaryInfo && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={16} className={isSelected ? 'text-blue-500' : 'text-gray-400'} />
                      <span>Dietary information</span>
                    </div>
                  )}
                  {template.showWarnings && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={16} className={isSelected ? 'text-blue-500' : 'text-gray-400'} />
                      <span>Cross-contamination warnings</span>
                    </div>
                  )}
                  {template.showCompanyInfo && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={16} className={isSelected ? 'text-blue-500' : 'text-gray-400'} />
                      <span>Company contact information</span>
                    </div>
                  )}
                </div>

                {/* Select Button */}
                <button
                  onClick={() => onTemplateSelect(template)}
                  className={`w-full mt-6 px-4 py-3 rounded-xl font-semibold transition-all ${
                    isSelected
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select Style'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Next Button - Only show if template selected */}
      {selectedTemplate && (
        <div className="sticky bottom-0 bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Selected Style</p>
              <p className="text-2xl font-bold text-gray-900">{selectedTemplate.templateName}</p>
            </div>
            <button
              onClick={() => window.location.hash = '#preview'}
              className="px-8 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl"
            >
              Preview Sheets →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
