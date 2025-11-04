"use client";

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";

type ViewMode = "whole" | "steps" | "edit" | "photos";

interface RecipeViewContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onSave?: () => void;
  isSaving?: boolean;
  onPrint?: () => void;
  title?: string;
  updateSaveState?: (onSave: (() => void) | undefined, isSaving: boolean | undefined) => void;
  updatePrintHandler?: (onPrint: (() => void) | undefined) => void;
  updateTitle?: (title: string | undefined) => void;
}

const RecipeViewContext = createContext<RecipeViewContextType | undefined>(undefined);

export function RecipeViewProvider({ 
  children,
  initialViewMode = "steps",
  onSave,
  isSaving,
  onPrint,
  title
}: { 
  children: ReactNode;
  initialViewMode?: ViewMode;
  onSave?: () => void;
  isSaving?: boolean;
  onPrint?: () => void;
  title?: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [currentOnSave, setCurrentOnSave] = useState<(() => void) | undefined>(onSave);
  const [currentIsSaving, setCurrentIsSaving] = useState<boolean | undefined>(isSaving);
  const [currentOnPrint, setCurrentOnPrint] = useState<(() => void) | undefined>(onPrint);
  const [currentTitle, setCurrentTitle] = useState<string | undefined>(title);
  
  // Update when props change
  useEffect(() => {
    setCurrentOnSave(() => onSave);
  }, [onSave]);
  
  useEffect(() => {
    setCurrentIsSaving(isSaving);
  }, [isSaving]);
  
  useEffect(() => {
    setCurrentOnPrint(() => onPrint);
  }, [onPrint]);
  
  useEffect(() => {
    setCurrentTitle(title);
  }, [title]);
  
  const updateSaveState = useCallback((newOnSave: (() => void) | undefined, newIsSaving: boolean | undefined) => {
    setCurrentOnSave(() => newOnSave);
    setCurrentIsSaving(newIsSaving);
  }, []);
  
  const updatePrintHandler = useCallback((newOnPrint: (() => void) | undefined) => {
    setCurrentOnPrint(() => newOnPrint);
  }, []);
  
  const updateTitle = useCallback((newTitle: string | undefined) => {
    setCurrentTitle(newTitle);
  }, []);

  return (
    <RecipeViewContext.Provider value={{ 
      viewMode, 
      setViewMode, 
      onSave: currentOnSave, 
      isSaving: currentIsSaving, 
      onPrint: currentOnPrint, 
      title: currentTitle,
      updateSaveState,
      updatePrintHandler,
      updateTitle
    }}>
      {children}
    </RecipeViewContext.Provider>
  );
}

export function useRecipeView() {
  const context = useContext(RecipeViewContext);
  return context; // Returns undefined if not within provider
}

