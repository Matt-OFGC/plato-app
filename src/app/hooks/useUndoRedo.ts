"use client";

import { useState, useCallback, useEffect } from "react";
import { UndoRedoManager } from "../lib/undo-redo";

export function useUndoRedo<T>(initialState: T, maxHistory: number = 50) {
  const [manager] = useState(() => new UndoRedoManager(initialState, maxHistory));
  const [state, setState] = useState<T>(initialState);

  useEffect(() => {
    manager.setState = (newState: T, addToHistory: boolean = true) => {
      if (addToHistory) {
        const newPast = [...manager["state"].past, manager["state"].present].slice(-maxHistory);
        manager["state"] = {
          past: newPast,
          present: newState,
          future: [],
        };
      } else {
        manager["state"].present = newState;
      }
      setState(newState);
    };
  }, [manager, maxHistory]);

  const setValue = useCallback((newState: T, addToHistory: boolean = true) => {
    manager.setState(newState, addToHistory);
  }, [manager]);

  const undo = useCallback(() => {
    const success = manager.undo();
    if (success) {
      setState(manager.getState());
    }
    return success;
  }, [manager]);

  const redo = useCallback(() => {
    const success = manager.redo();
    if (success) {
      setState(manager.getState());
    }
    return success;
  }, [manager]);

  const canUndo = manager.canUndo();
  const canRedo = manager.canRedo();

  return {
    state,
    setValue,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

