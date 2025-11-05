"use client";

import { useState } from "react";
import { RecipeSelectorView } from "@/components/labels/sales-labels/RecipeSelectorView";
import { TemplateLibraryView } from "@/components/labels/sales-labels/TemplateLibraryView";
import { PreviewView } from "@/components/labels/sales-labels/PreviewView";
import { HistoryView } from "@/components/labels/sales-labels/HistoryView";

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
  id: number;
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

export default function SalesLabelsPage() {
  const [currentView, setCurrentView] = useState("templates");
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate | null>(null);

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setCurrentView("select-products");
  };

  return (
    <div className="h-full">
      {/* Main Content */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">

          {/* Page Header with Tabs */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Sales Labels
            </h1>

            {/* Tab Navigation - Inside content, not floating */}
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-2 py-2 w-fit">
              {["Design Studio", "Templates", "Select Products", "Preview", "History"].map((tab) => {
                const tabId = tab.toLowerCase().replace(/ /g, "-");
                const isActive = currentView === tabId;

                return (
                  <button
                    key={tab}
                    onClick={() => setCurrentView(tabId)}
                    className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white shadow-md text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {currentView === "design-studio" && (
            <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Design Studio
              </h2>
              <p className="text-gray-600">
                Customize every aspect of your product labels. Choose colors,
                fonts, layout, and what information to display.
              </p>
              <div className="mt-6 p-8 bg-gray-100/50 rounded-2xl text-center">
                <p className="text-gray-500">
                  Advanced label customization coming soon...
                </p>
                <button
                  onClick={() => setCurrentView("templates")}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"
                >
                  Browse Templates
                </button>
              </div>
            </div>
          )}

          {currentView === "templates" && (
            <TemplateLibraryView onSelectTemplate={handleTemplateSelect} />
          )}

          {currentView === "select-products" && (
            <RecipeSelectorView
              selectedRecipes={selectedRecipes}
              onSelectionChange={setSelectedRecipes}
            />
          )}

          {currentView === "preview" && (
            <PreviewView template={selectedTemplate} recipes={selectedRecipes} />
          )}

          {currentView === "history" && (
            <HistoryView documentType="label" />
          )}
        </div>
      </div>
    </div>
  );
}
