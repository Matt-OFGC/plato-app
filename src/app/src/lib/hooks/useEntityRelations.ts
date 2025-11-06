"use client";

import { useState, useEffect } from "react";
import { RelatedEntity, EntityType } from "@/lib/services/relationService";

export function useEntityRelations(entityType: EntityType, entityId: number) {
  const [relations, setRelations] = useState<RelatedEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entityId) {
      loadRelations();
    }
  }, [entityType, entityId]);

  async function loadRelations() {
    try {
      const res = await fetch(`/api/relations/${entityType}/${entityId}`);
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

