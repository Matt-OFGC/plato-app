"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function keyFor(recipeId: string, stepId: string) {
  return `recipe:${recipeId}:timer:${stepId}`;
}

type TimerState = {
  durationMs: number;
  endAt?: number; // epoch ms when it should reach 0
  remainingMs: number;
  running: boolean;
};

function now() {
  return Date.now();
}

export function useCountdown(recipeId: string, stepId: string, defaultMinutes = 0) {
  const defaultMs = defaultMinutes * 60 * 1000;
  const [state, setState] = useState<TimerState>({ durationMs: defaultMs, remainingMs: defaultMs, running: false });
  const raf = useRef<number | null>(null);

  // Load persisted
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(keyFor(recipeId, stepId)) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as TimerState;
        setState(prev => ({ ...prev, ...parsed }));
      } catch {}
    } else {
      setState({ durationMs: defaultMs, remainingMs: defaultMs, running: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId, stepId]);

  // Persist
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(keyFor(recipeId, stepId), JSON.stringify(state));
    }
  }, [recipeId, stepId, state]);

  const tick = useCallback(() => {
    setState(prev => {
      if (!prev.running || !prev.endAt) return prev;
      const remaining = Math.max(0, prev.endAt - now());
      if (remaining === 0) {
        return { ...prev, remainingMs: 0, running: false, endAt: undefined };
      }
      return { ...prev, remainingMs: remaining };
    });
    raf.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (state.running) {
      raf.current = requestAnimationFrame(tick);
      return () => {
        if (raf.current) cancelAnimationFrame(raf.current);
      };
    }
    return undefined;
  }, [state.running, tick]);

  const start = useCallback((minutes?: number) => {
    setState(prev => {
      const durationMs = (minutes ?? prev.durationMs / 60000) * 60000;
      return { durationMs, endAt: now() + (prev.remainingMs || durationMs), remainingMs: prev.remainingMs || durationMs, running: true };
    });
  }, []);

  const pause = useCallback(() => setState(prev => ({ ...prev, running: false })), []);
  const reset = useCallback((minutes?: number) => {
    setState(prev => {
      const ms = (minutes ?? prev.durationMs / 60000) * 60000;
      return { durationMs: ms, remainingMs: ms, running: false, endAt: undefined };
    });
  }, []);

  const minutes = Math.floor(state.remainingMs / 60000);
  const seconds = Math.floor((state.remainingMs % 60000) / 1000);

  return useMemo(() => ({
    ...state,
    minutes,
    seconds,
    start,
    pause,
    reset,
  }), [state, minutes, seconds, start, pause, reset]);
}






