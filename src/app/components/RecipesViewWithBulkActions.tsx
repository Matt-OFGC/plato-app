"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RecipesView } from "./RecipesView";
import { BulkActionsBar } from "./BulkActionsBar";
import { BulkEditModal } from "./BulkEditModal";
import { bulkDeleteRecipes, bulkUpdateRecipes } from "../dashboard/recipes/actions";

interface Category {
  id: number;
  name: string;
}

interface Recipe {
  id: number;
  name: string;
  description: string | null;
  yieldQuantity: any;
  yieldUnit: string;
  imageUrl: string | null;
  bakeTime: number | null;
  bakeTemp: number | null;
  storage: string | null;
  category: string | null;
  categoryRef: { name: string; color: string | null } | null;
  items: any[];
  sellingPrice: number | null;
  cogsPercentage: number | null;
  totalSteps: number;
  totalTime: number | null;
}

interface RecipesViewWithBulkActionsProps {
  recipes: Recipe[];
  categories: Category[];
}

export function RecipesViewWithBulkActions({ recipes, categories }: RecipesViewWithBulkActionsProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(recipes.map((r) => r.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      try {
        await bulkDeleteRecipes(ids);
        setSelectedIds(new Set());
        router.refresh();
      } catch (error: any) {
        throw error;
      }
    });
  };

  const handleBulkUpdate = async (updates: Record<string, any>) => {
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      try {
        const updateData: { categoryId?: number | null } = {};
        if (updates.categoryId !== undefined && updates.categoryId !== null && updates.categoryId !== "") {
          updateData.categoryId = parseInt(updates.categoryId);
        } else if (updates.categoryId === null || updates.categoryId === "") {
          updateData.categoryId = null;
        }
        
        await bulkUpdateRecipes(ids, updateData);
        setSelectedIds(new Set());
        router.refresh();
      } catch (error: any) {
        throw error;
      }
    });
  };

  return (
    <>
      <RecipesView
        recipes={recipes}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        isSelecting={selectedIds.size > 0}
      />
      <BulkActionsBar
        selectedCount={selectedIds.size}
        totalCount={recipes.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onBulkDelete={handleBulkDelete}
        onBulkEdit={() => setShowBulkEdit(true)}
        entityType="recipes"
      />
      <BulkEditModal
        isOpen={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        selectedIds={Array.from(selectedIds)}
        entityType="recipes"
        onSave={handleBulkUpdate}
        fields={[
          {
            name: "categoryId",
            label: "Category",
            type: "select",
            options: [
              { value: "", label: "No category" },
              ...categories.map((cat) => ({ value: cat.id.toString(), label: cat.name })),
            ],
          },
        ]}
      />
    </>
  );
}

