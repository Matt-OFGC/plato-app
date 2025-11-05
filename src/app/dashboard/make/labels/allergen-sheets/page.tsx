"use client";

import { useState } from "react";
import { RecipeSelectorView } from "@/components/labels/allergen-sheets/RecipeSelectorView";
import { SheetStyleView } from "@/components/labels/allergen-sheets/SheetStyleView";
import { PreviewView } from "@/components/labels/allergen-sheets/PreviewView";
import { HistoryView } from "@/components/labels/sales-labels/HistoryView";
import { RecentUpdatesView } from "@/components/labels/allergen-sheets/RecentUpdatesView";

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

  const handleRecentUpdatesSelect = (recipes: Recipe[]) => {
    setSelectedRecipes(recipes);
    setCurrentView("sheet-style");
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
            <RecentUpdatesView onSelectRecipes={handleRecentUpdatesSelect} />
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
