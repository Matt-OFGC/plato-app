"use client";

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";

type ViewMode = "whole" | "steps" | "edit" | "photos";

interface RecipeViewContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onSave?: () => void;
  isSaving?: boolean;
  onPrint?: () => void;
  onDelete?: () => void;
  title?: string;
  updateSaveState?: (onSave: (() => void) | undefined, isSaving: boolean | undefined) => void;
  updatePrintHandler?: (onPrint: (() => void) | undefined) => void;
  updateDeleteHandler?: (onDelete: (() => void) | undefined) => void;
  updateTitle?: (title: string | undefined) => void;
}

const RecipeViewContext = createContext<RecipeViewContextType | undefined>(undefined);

export function RecipeViewProvider({ 
  children,
  initialViewMode = "steps",
  onSave,
  isSaving,
  onPrint,
  onDelete,
  title
}: { 
  children: ReactNode;
  initialViewMode?: ViewMode;
  onSave?: () => void;
  isSaving?: boolean;
  onPrint?: () => void;
  onDelete?: () => void;
  title?: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [currentOnSave, setCurrentOnSave] = useState<(() => void) | undefined>(onSave);
  const [currentIsSaving, setCurrentIsSaving] = useState<boolean | undefined>(isSaving);
  const [currentOnPrint, setCurrentOnPrint] = useState<(() => void) | undefined>(onPrint);
  const [currentOnDelete, setCurrentOnDelete] = useState<(() => void) | undefined>(onDelete);
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
    setCurrentOnDelete(() => onDelete);
  }, [onDelete]);
  
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
  
  const updateDeleteHandler = useCallback((newOnDelete: (() => void) | undefined) => {
    setCurrentOnDelete(() => newOnDelete);
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
      onDelete: currentOnDelete,
      title: currentTitle,
      updateSaveState,
      updatePrintHandler,
      updateDeleteHandler,
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

