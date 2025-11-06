"use client";

import { useState, useEffect } from "react";
import { RelatedEntity } from "@/lib/services/relationService";

export function useTrainingRelations(moduleId: number) {
  const [relations, setRelations] = useState<RelatedEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (moduleId) {
      loadRelations();
    }
  }, [moduleId]);

  async function loadRelations() {
    try {
      const res = await fetch(`/api/training/modules/${moduleId}/relations`);
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

