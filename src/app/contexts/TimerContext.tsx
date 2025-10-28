// Timer context for managing timers across the app
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Timer {
  id: string;
  name: string;
  duration: number; // in seconds
  remaining: number; // in seconds
  isRunning: boolean;
  isCompleted: boolean;
}

interface TimerContextType {
  timers: Timer[];
  addTimer: (name: string, duration: number) => void;
  removeTimer: (id: string) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  updateTimer: (id: string, updates: Partial<Timer>) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timers, setTimers] = useState<Timer[]>([]);

  useEffect(() => {
    // Load timers from localStorage
    const savedTimers = localStorage.getItem('plato-timers');
    if (savedTimers) {
      try {
        setTimers(JSON.parse(savedTimers));
      } catch (error) {
        console.error('Failed to load timers:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save timers to localStorage
    localStorage.setItem('plato-timers', JSON.stringify(timers));
  }, [timers]);

  useEffect(() => {
    // Timer countdown logic
    const interval = setInterval(() => {
      setTimers(prevTimers => 
        prevTimers.map(timer => {
          if (timer.isRunning && timer.remaining > 0) {
            const newRemaining = timer.remaining - 1;
            return {
              ...timer,
              remaining: newRemaining,
              isCompleted: newRemaining === 0,
              isRunning: newRemaining > 0
            };
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addTimer = (name: string, duration: number) => {
    const newTimer: Timer = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      duration,
      remaining: duration,
      isRunning: false,
      isCompleted: false
    };
    setTimers(prev => [...prev, newTimer]);
  };

  const removeTimer = (id: string) => {
    setTimers(prev => prev.filter(timer => timer.id !== id));
  };

  const startTimer = (id: string) => {
    setTimers(prev => 
      prev.map(timer => 
        timer.id === id 
          ? { ...timer, isRunning: true }
          : timer
      )
    );
  };

  const pauseTimer = (id: string) => {
    setTimers(prev => 
      prev.map(timer => 
        timer.id === id 
          ? { ...timer, isRunning: false }
          : timer
      )
    );
  };

  const resetTimer = (id: string) => {
    setTimers(prev => 
      prev.map(timer => 
        timer.id === id 
          ? { 
              ...timer, 
              remaining: timer.duration, 
              isRunning: false, 
              isCompleted: false 
            }
          : timer
      )
    );
  };

  const updateTimer = (id: string, updates: Partial<Timer>) => {
    setTimers(prev => 
      prev.map(timer => 
        timer.id === id 
          ? { ...timer, ...updates }
          : timer
      )
    );
  };

  return (
    <TimerContext.Provider value={{
      timers,
      addTimer,
      removeTimer,
      startTimer,
      pauseTimer,
      resetTimer,
      updateTimer
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
