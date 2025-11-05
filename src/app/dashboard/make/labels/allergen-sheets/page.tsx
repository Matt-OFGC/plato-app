"use client";

import { useState } from "react";
import { RecipeSelectorView } from "@/components/labels/allergen-sheets/RecipeSelectorView";
import { SheetStyleView } from "@/components/labels/allergen-sheets/SheetStyleView";
import { PreviewView } from "@/components/labels/allergen-sheets/PreviewView";
import { HistoryView } from "@/components/labels/sales-labels/HistoryView";

interface Recipe {
  id: number;
  name: string;
  allergens?: string[];
  dietary_tags?: string[];
  category?: string;
  has_recent_changes?: boolean;
}

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

export default function AllergenSheetsPage() {
  const [currentView, setCurrentView] = useState("recent-updates");
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AllergenSheetTemplate | null>(null);

  const handleTemplateSelect = (template: AllergenSheetTemplate) => {
    setSelectedTemplate(template);
    setCurrentView("select-recipes");
  };

  return (
    <div className="h-full">
      {/* Main Content */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header with Tabs */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
              Allergen Sheets
            </h1>
            <p className="text-lg text-gray-500 mb-4">
              Generate comprehensive allergen information sheets for legal compliance
            </p>

            {/* Tab Navigation - Inside content, not floating */}
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-2 py-2 w-fit">
              {["Recent Updates", "Select Recipes", "Sheet Style", "Preview", "History"].map(
                (tab) => {
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
                }
              )}
            </div>
          </div>

          {/* Content Area */}
          {currentView === "recent-updates" && (
            <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Recent Updates
                </h2>
                <p className="text-gray-600 mb-6">
                  Track ingredient changes that affect allergen information.
                  Stay compliant with food safety regulations.
                </p>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">
                            Allergen Change Detected
                          </h3>
                          <span className="text-xs text-gray-500">2 days ago</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          Recipe: <strong>Sourdough Loaf</strong> - Supplier changed for
                          "Plain Flour" now contains <strong>Celery</strong>
                        </p>
                        <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                          Update allergen sheets →
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="text-center text-sm text-gray-500">
                      No other recent changes detected
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setCurrentView("sheet-style")}
                    className="px-8 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-lg"
                  >
                    Generate New Sheets →
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentView === "select-recipes" && (
            <RecipeSelectorView
              selectedRecipes={selectedRecipes}
              onSelectionChange={setSelectedRecipes}
            />
          )}

          {currentView === "sheet-style" && (
            <SheetStyleView
              selectedTemplate={selectedTemplate}
              onTemplateSelect={handleTemplateSelect}
            />
          )}

          {currentView === "preview" && (
            <PreviewView
              template={selectedTemplate}
              recipes={selectedRecipes}
            />
          )}

          {currentView === "history" && (
            <HistoryView documentType="allergen_sheet" />
          )}
        </div>
      </div>
    </div>
  );
}
