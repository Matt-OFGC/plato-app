"use client";

export interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export class UndoRedoManager<T> {
  private state: UndoRedoState<T>;
  private maxHistory: number;
  private onStateChange?: (state: T) => void;

  constructor(initialState: T, maxHistory: number = 50, onStateChange?: (state: T) => void) {
    this.state = {
      past: [],
      present: initialState,
      future: [],
    };
    this.maxHistory = maxHistory;
    this.onStateChange = onStateChange;
  }

  getState(): T {
    return this.state.present;
  }

  setState(newState: T, addToHistory: boolean = true) {
    if (addToHistory) {
      // Add current state to past
      const newPast = [...this.state.past, this.state.present].slice(-this.maxHistory);
      this.state = {
        past: newPast,
        present: newState,
        future: [], // Clear future when new action is performed
      };
    } else {
      // Update without adding to history (e.g., when loading initial state)
      this.state.present = newState;
    }
    
    this.onStateChange?.(newState);
  }

  undo(): boolean {
    if (this.state.past.length === 0) {
      return false;
    }

    const previous = this.state.past[this.state.past.length - 1];
    const newPast = this.state.past.slice(0, -1);

    this.state = {
      past: newPast,
      present: previous,
      future: [this.state.present, ...this.state.future],
    };

    this.onStateChange?.(previous);
    return true;
  }

  redo(): boolean {
    if (this.state.future.length === 0) {
      return false;
    }

    const next = this.state.future[0];
    const newFuture = this.state.future.slice(1);

    this.state = {
      past: [...this.state.past, this.state.present],
      present: next,
      future: newFuture,
    };

    this.onStateChange?.(next);
    return true;
  }

  canUndo(): boolean {
    return this.state.past.length > 0;
  }

  canRedo(): boolean {
    return this.state.future.length > 0;
  }

  clear() {
    this.state = {
      past: [],
      present: this.state.present,
      future: [],
    };
  }
}

