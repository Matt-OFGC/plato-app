"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

function getKey(recipeId: string, suffix: string) {
  return `recipe:${recipeId}:${suffix}`;
}

export function useServings(recipeId: string, baseServings: number) {
  const [servings, setServings] = useState<number>(baseServings);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(getKey(recipeId, 'servings')) : null;
    if (saved) {
      const num = parseFloat(saved);
      if (!Number.isNaN(num) && num > 0) setServings(num);
    }
  }, [recipeId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(getKey(recipeId, 'servings'), String(servings));
    }
  }, [recipeId, servings]);

  return useMemo(() => ({ servings, setServings }), [servings]);
}

export function useIngredientChecklist(recipeId: string) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(getKey(recipeId, 'checked')) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        setChecked(parsed || {});
      } catch {
        setChecked({});
      }
    }
  }, [recipeId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(getKey(recipeId, 'checked'), JSON.stringify(checked));
    }
  }, [recipeId, checked]);

  const toggle = useCallback((id: string) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const set = useCallback((id: string, value: boolean) => {
    setChecked(prev => ({ ...prev, [id]: value }));
  }, []);

  const clear = useCallback(() => setChecked({}), []);

  return { checked, toggle, set, clear };
}









