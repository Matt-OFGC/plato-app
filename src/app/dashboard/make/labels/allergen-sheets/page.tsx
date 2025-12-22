"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "recent-updates";
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AllergenSheetTemplate | null>(null);
  // All MVP features are accessible - no unlock checks needed

  const handleTemplateSelect = (template: AllergenSheetTemplate) => {
    setSelectedTemplate(template);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "select-recipes");
    router.push(`?${params.toString()}`);
  };

  const handleRecentUpdatesSelect = (recipes: Recipe[]) => {
    setSelectedRecipes(recipes);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "sheet-style");
    router.push(`?${params.toString()}`);
  };

  const handleNavigateToSheetStyle = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "sheet-style");
    router.push(`?${params.toString()}`);
  };

  const handleNavigateToPreview = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "preview");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="h-full">
      {/* Main Content */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
              Allergen Sheets
            </h1>
            <p className="text-lg text-gray-500 mb-4">
              Generate comprehensive allergen information sheets for legal compliance
            </p>
          </div>

          {/* Content Area */}
          {currentView === "recent-updates" && (
            <RecentUpdatesView onSelectRecipes={handleRecentUpdatesSelect} />
          )}

          {currentView === "select-recipes" && (
            <RecipeSelectorView
              selectedRecipes={selectedRecipes}
              onSelectionChange={setSelectedRecipes}
              onNavigateToSheetStyle={handleNavigateToSheetStyle}
            />
          )}

          {currentView === "sheet-style" && (
            <SheetStyleView
              selectedTemplate={selectedTemplate}
              onTemplateSelect={handleTemplateSelect}
              onNavigateToPreview={handleNavigateToPreview}
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
