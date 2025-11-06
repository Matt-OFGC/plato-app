"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RecipeSelectorView } from "@/components/labels/sales-labels/RecipeSelectorView";
import { TemplateLibraryView } from "@/components/labels/sales-labels/TemplateLibraryView";
import { PreviewView } from "@/components/labels/sales-labels/PreviewView";
import { HistoryView } from "@/components/labels/sales-labels/HistoryView";
import { DesignStudioView } from "@/components/labels/sales-labels/DesignStudioView";
import { SectionUnlockModal } from "@/components/unlock/SectionUnlockModal";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "templates";
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate | null>(null);
  const [unlockStatus, setUnlockStatus] = useState<{ unlocked: boolean } | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  useEffect(() => {
    fetch("/api/features/unlock-status")
      .then((res) => res.json())
      .then((data) => {
        if (data.unlockStatus?.make) {
          setUnlockStatus({ unlocked: data.unlockStatus.make.unlocked });
          if (!data.unlockStatus.make.unlocked) {
            setShowUnlockModal(true);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch unlock status:", err));
  }, []);

  if (unlockStatus && !unlockStatus.unlocked) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Make Module Locked</h2>
            <p className="text-gray-600 mb-4">Unlock the Make module to access label generation features.</p>
          </div>
        </div>
        <SectionUnlockModal
          isOpen={showUnlockModal}
          onClose={() => {
            setShowUnlockModal(false);
            router.push("/dashboard");
          }}
          moduleName="make"
        />
      </>
    );
  }

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "select-products");
    router.push(`?${params.toString()}`);
  };

  const handleSaveTemplate = async (template: LabelTemplate) => {
    try {
      const response = await fetch('/api/labels/templates', {
        method: template.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      
      if (!response.ok) throw new Error('Failed to save template');
      
      const savedTemplate = await response.json();
      setSelectedTemplate(savedTemplate);
      
      // Navigate to templates view after saving
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", "templates");
      router.push(`?${params.toString()}`);
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    }
  };

  const handleCancelDesign = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "templates");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="h-full">
      {/* Main Content */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Sales Labels
            </h1>
          </div>

          {currentView === "design-studio" && (
            <DesignStudioView
              initialTemplate={null}
              onSave={handleSaveTemplate}
              onCancel={handleCancelDesign}
            />
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
