"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IngredientsView } from "./IngredientsView";
import { BulkActionsBar } from "./BulkActionsBar";
import { BulkEditModal } from "./BulkEditModal";
import { bulkDeleteIngredients, bulkUpdateIngredients } from "../dashboard/ingredients/actions";

interface Supplier {
  id: number;
  name: string;
}

interface Ingredient {
  id: number;
  name: string;
  supplier: string | null;
  supplierRef: { name: string; contactName: string | null; minimumOrder: number | null } | null;
  packQuantity: number;
  packUnit: string;
  originalUnit: string | null;
  packPrice: number;
  currency: string;
  densityGPerMl: number | null;
  lastPriceUpdate: Date | null;
  allergens?: string[];
}

interface IngredientsViewWithBulkActionsProps {
  ingredients: Ingredient[];
  suppliers: Supplier[];
  deleteIngredient: (id: number) => Promise<void>;
  onEdit?: (ingredient: Ingredient) => void;
  onNew?: () => void;
}

export function IngredientsViewWithBulkActions({
  ingredients,
  suppliers,
  deleteIngredient,
  onEdit,
  onNew,
}: IngredientsViewWithBulkActionsProps) {
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
    setSelectedIds(new Set(ingredients.map((ing) => ing.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      try {
        await bulkDeleteIngredients(ids);
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
        const updateData: { supplierId?: number | null } = {};
        if (updates.supplierId !== undefined && updates.supplierId !== null && updates.supplierId !== "") {
          updateData.supplierId = parseInt(updates.supplierId);
        } else if (updates.supplierId === null || updates.supplierId === "") {
          updateData.supplierId = null;
        }

        await bulkUpdateIngredients(ids, updateData);
        setSelectedIds(new Set());
        router.refresh();
      } catch (error: any) {
        throw error;
      }
    });
  };

  return (
    <>
      <IngredientsView
        ingredients={ingredients}
        deleteIngredient={deleteIngredient}
        onEdit={onEdit}
        onNew={onNew}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        isSelecting={selectedIds.size > 0}
      />
      <BulkActionsBar
        selectedCount={selectedIds.size}
        totalCount={ingredients.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onBulkDelete={handleBulkDelete}
        onBulkEdit={() => setShowBulkEdit(true)}
        entityType="ingredients"
      />
      <BulkEditModal
        isOpen={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        selectedIds={Array.from(selectedIds)}
        entityType="ingredients"
        onSave={handleBulkUpdate}
        fields={[
          {
            name: "supplierId",
            label: "Supplier",
            type: "select",
            options: [
              { value: "", label: "No supplier" },
              ...suppliers.map((sup) => ({ value: sup.id.toString(), label: sup.name })),
            ],
          },
        ]}
      />
    </>
  );
}

