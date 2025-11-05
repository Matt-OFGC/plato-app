"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Copy, Trash2, Star } from 'lucide-react';

interface LabelTemplate {
  id: number;
  templateName: string;
  templateType: string;
  backgroundColor: string;
  textColor: string;
  productFont: string;
  productFontSize: number;
  bodyFont: string;
  widthMm: number;
  heightMm: number;
  alignment: string;
  isDefault: boolean;
  isSystemTemplate: boolean;
}

interface TemplateLibraryViewProps {
  onSelectTemplate: (template: LabelTemplate) => void;
}

export function TemplateLibraryView({ onSelectTemplate }: TemplateLibraryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/labels/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const duplicateTemplate = async (template: LabelTemplate) => {
    try {
      const response = await fetch(`/api/labels/templates/${template.id}/duplicate`, {
        method: 'POST'
      });
      const newTemplate = await response.json();
      setTemplates([...templates, newTemplate]);
      alert('Template duplicated successfully!');
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      alert('Failed to duplicate template');
    }
  };

  const deleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await fetch(`/api/labels/templates/${templateId}`, {
        method: 'DELETE'
      });
      setTemplates(templates.filter(t => t.id !== templateId));
      alert('Template deleted successfully');
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    }
  };

  const setAsDefault = async (templateId: number) => {
    try {
      await fetch(`/api/labels/templates/${templateId}/set-default`, {
        method: 'POST'
      });
      setTemplates(templates.map(t => ({
        ...t,
        isDefault: t.id === templateId
      })));
      alert('Default template updated');
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  // Separate system templates from custom
  const systemTemplates = templates.filter(t => t.isSystemTemplate);
  const customTemplates = templates.filter(t => !t.isSystemTemplate);

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
          Template Library
        </h1>
        <p className="text-lg text-gray-500">
          Choose from our curated templates or create your own
        </p>
      </div>

      {/* System Templates Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">System Templates</h2>
        <p className="text-sm text-gray-600 mb-6">
          Professional pre-made templates ready to use
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {systemTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-lg p-6 hover:shadow-xl transition-all"
            >
              {/* Template Preview */}
              <div
                className="h-32 rounded-2xl mb-4 p-4 flex items-center justify-center relative overflow-hidden"
                style={{
                  backgroundColor: template.backgroundColor,
                  color: template.textColor
                }}
              >
                <div className="text-center">
                  <div
                    className="font-bold text-lg mb-1"
                    style={{
                      fontFamily: template.productFont,
                      fontSize: `${template.productFontSize / 3}px`
                    }}
                  >
                    SAMPLE
                  </div>
                  <div
                    className="text-xs"
                    style={{ fontFamily: template.bodyFont }}
                  >
                    PRODUCT NAME
                  </div>
                </div>

                {/* Default Badge */}
                {template.isDefault && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Star size={12} />
                    Default
                  </div>
                )}
              </div>

              {/* Template Name */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {template.templateName}
              </h3>

              {/* Template Info */}
              <div className="text-xs text-gray-600 mb-4 space-y-1">
                <div>Size: {template.widthMm}mm × {template.heightMm}mm</div>
                <div>Alignment: {template.alignment}</div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onSelectTemplate(template)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-all"
                >
                  Use Template
                </button>
                <button
                  onClick={() => duplicateTemplate(template)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                  title="Duplicate"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Templates Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Custom Templates</h2>
            <p className="text-sm text-gray-600 mt-1">
              Templates you've created and saved
            </p>
          </div>
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('view', 'design-studio');
              router.push(`?${params.toString()}`);
            }}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Create New Template
          </button>
        </div>

        {customTemplates.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Custom Templates Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first custom template in the Design Studio
            </p>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('view', 'design-studio');
                router.push(`?${params.toString()}`);
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {customTemplates.map(template => (
              <div
                key={template.id}
                className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-lg p-6 hover:shadow-xl transition-all"
              >
                {/* Template Preview */}
                <div
                  className="h-32 rounded-2xl mb-4 p-4 flex items-center justify-center relative overflow-hidden"
                  style={{
                    backgroundColor: template.backgroundColor,
                    color: template.textColor
                  }}
                >
                  <div className="text-center">
                    <div
                      className="font-bold text-lg mb-1"
                      style={{
                        fontFamily: template.productFont,
                        fontSize: `${template.productFontSize / 3}px`
                      }}
                    >
                      SAMPLE
                    </div>
                    <div
                      className="text-xs"
                      style={{ fontFamily: template.bodyFont }}
                    >
                      PRODUCT NAME
                    </div>
                  </div>

                  {/* Default Badge */}
                  {template.isDefault && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Star size={12} />
                      Default
                    </div>
                  )}
                </div>

                {/* Template Name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.templateName}
                </h3>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectTemplate(template)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-all"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => setAsDefault(template.id)}
                    className={`px-3 py-2 rounded-xl transition-all ${
                      template.isDefault
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title="Set as default"
                  >
                    <Star size={16} />
                  </button>
                  <button
                    onClick={() => duplicateTemplate(template)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                    title="Duplicate"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
