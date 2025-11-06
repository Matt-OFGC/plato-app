"use client";

import { useState, useEffect } from "react";
import { RelatedEntity } from "@/lib/services/relationService";

export function useRecipeRelations(recipeId: number) {
  const [relations, setRelations] = useState<RelatedEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recipeId) {
      loadRelations();
    }
  }, [recipeId]);

  async function loadRelations() {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/relations`);
      if (res.ok) {
        const data = await res.json();
        setRelations(data.relations || []);
      }
    } catch (error) {
      console.error("Failed to load relations:", error);
    } finally {
      setLoading(false);
    }
  }

  return {
    relations,
    loading,
    refresh: loadRelations,
  };
}

