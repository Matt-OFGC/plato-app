"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Timer {
  id: string;
  recipeId: number;
  recipeName: string;
  stepTitle: string;
  totalMinutes: number;
  remaining: number;
  interval: NodeJS.Timeout | null;
}

interface TimerContextType {
  timers: { [key: string]: Timer };
  startTimer: (id: string, recipeId: number, recipeName: string, stepTitle: string, minutes: number) => void;
  stopTimer: (id: string) => void;
  getTimer: (id: string) => Timer | undefined;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timers, setTimers] = useState<{ [key: string]: Timer }>({});

  const startTimer = (id: string, recipeId: number, recipeName: string, stepTitle: string, minutes: number) => {
    // Clear existing timer if any
    if (timers[id]?.interval) {
      clearInterval(timers[id].interval);
    }

    const totalSeconds = minutes * 60;
    
    const interval = setInterval(() => {
      setTimers(prev => {
        const current = prev[id];
        if (!current || current.remaining <= 1) {
          // Timer complete - play notification
          if (typeof window !== 'undefined') {
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              oscillator.frequency.value = 800;
              oscillator.type = 'sine';
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.2);
              
              // Show browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Timer Complete! ⏰', {
                  body: `${recipeName} - ${stepTitle}`,
                  icon: '/favicon.ico',
                });
              }
            } catch (e) {
              console.log('Notification not available');
            }
          }
          clearInterval(interval);
          const newState = { ...prev };
          delete newState[id];
          return newState;
        }
        return {
          ...prev,
          [id]: { ...current, remaining: current.remaining - 1 }
        };
      });
    }, 1000);

    setTimers(prev => ({
      ...prev,
      [id]: {
        id,
        recipeId,
        recipeName,
        stepTitle,
        totalMinutes: minutes,
        remaining: totalSeconds,
        interval
      }
    }));
  };

  const stopTimer = (id: string) => {
    if (timers[id]?.interval) {
      clearInterval(timers[id].interval);
    }
    setTimers(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const getTimer = (id: string) => timers[id];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timers).forEach(timer => {
        if (timer.interval) {
          clearInterval(timer.interval);
        }
      });
    };
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <TimerContext.Provider value={{ timers, startTimer, stopTimer, getTimer }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimers() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimers must be used within a TimerProvider');
  }
  return context;
}

