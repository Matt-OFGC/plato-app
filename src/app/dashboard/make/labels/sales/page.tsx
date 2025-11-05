"use client";

import { useState } from "react";
import { RecipeSelectorView } from "@/components/labels/sales-labels/RecipeSelectorView";
import { TemplateLibraryView } from "@/components/labels/sales-labels/TemplateLibraryView";

interface Recipe {
  id: number;
  name: string;
  selling_price?: number;
  allergens?: string[];
  dietary_tags?: string[];
  quantity?: number;
}

interface LabelTemplate {
  id: number;
  templateName: string;
  backgroundColor: string;
  textColor: string;
}

export default function SalesLabelsPage() {
  const [currentView, setCurrentView] = useState("templates");
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate | null>(null);

  const handleTemplateSelect = (template: LabelTemplate) => {
    setSelectedTemplate(template);
    setCurrentView("select-products");
  };

  return (
    <div className="h-full">
      {/* Floating Top Navigation */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-2 py-2">
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

      {/* Main Content */}
      <div className="pt-24 px-8 pb-8">
        <div className="max-w-7xl mx-auto">
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
            <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Preview
              </h2>
              <p className="text-gray-600">
                Preview your labels before printing.
              </p>
              {selectedRecipes.length === 0 ? (
                <div className="mt-6 p-8 bg-gray-100/50 rounded-2xl text-center">
                  <p className="text-gray-500">
                    Please select products first
                  </p>
                  <button
                    onClick={() => setCurrentView("select-products")}
                    className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"
                  >
                    Select Products
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-8 bg-gray-100/50 rounded-2xl text-center">
                  <p className="text-gray-500">
                    Preview functionality coming soon
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {selectedRecipes.length} products selected
                  </p>
                </div>
              )}
            </div>
          )}

          {currentView === "history" && (
            <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                History
              </h2>
              <p className="text-gray-600">
                View previously generated label sheets.
              </p>
              <div className="mt-6 p-8 bg-gray-100/50 rounded-2xl text-center">
                <p className="text-gray-500">
                  History view coming soon
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
