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
  alarmInterval?: NodeJS.Timeout | null; // For looping alarm sound
  userId?: number; // Track which user owns this timer
}

interface TimerSettings {
  volume: number; // 0-1
  ringtone: 'beep' | 'chime' | 'bell';
}

interface TimerContextType {
  timers: { [key: string]: Timer };
  settings: TimerSettings;
  startTimer: (id: string, recipeId: number, recipeName: string, stepTitle: string, minutes: number, userId?: number) => void;
  stopTimer: (id: string) => void;
  stopAlarm: (id: string) => void;
  getTimer: (id: string) => Timer | undefined;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const DEFAULT_SETTINGS: TimerSettings = {
  volume: 0.5,
  ringtone: 'beep',
};

// Play sound function (defined outside to be reusable)
const playTimerSound = (ringtone: string, volume: number) => {
  if (typeof window === 'undefined') return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different sounds based on ringtone
    switch (ringtone) {
      case 'beep':
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
      case 'chime':
        oscillator.frequency.value = 523;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        setTimeout(() => {
          const osc2 = audioContext.createOscillator();
          const gain2 = audioContext.createGain();
          osc2.connect(gain2);
          gain2.connect(audioContext.destination);
          osc2.frequency.value = 659;
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
          osc2.start(audioContext.currentTime);
          osc2.stop(audioContext.currentTime + 0.3);
        }, 200);
        break;
      case 'bell':
        oscillator.frequency.value = 1000;
        oscillator.type = 'triangle';
        gainNode.gain.setValueAtTime(volume * 0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        break;
    }
  } catch (e) {
    console.log('Audio not available');
  }
};

// Start looping alarm that plays for 2 minutes
const startLoopingAlarm = (ringtone: string, volume: number): NodeJS.Timeout => {
  // Play immediately
  playTimerSound(ringtone, volume);
  
  // Set up interval to repeat every 2 seconds
  const alarmInterval = setInterval(() => {
    playTimerSound(ringtone, volume);
  }, 2000); // Play every 2 seconds
  
  // Auto-stop after 2 minutes
  setTimeout(() => {
    clearInterval(alarmInterval);
  }, 120000); // 2 minutes = 120,000ms
  
  return alarmInterval;
};

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timers, setTimers] = useState<{ [key: string]: Timer }>({});
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [userId, setUserId] = useState<number | null>(null);
  const [hasLoadedTimers, setHasLoadedTimers] = useState(false);

  // Load user ID on mount
  useEffect(() => {
    fetch('/api/session')
      .then(res => res.json())
      .then(data => {
        if (data.user?.id) {
          setUserId(data.user.id);
        }
      })
      .catch(() => {});
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('timerSettings');
      if (saved) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
        } catch (e) {
          console.error('Failed to load timer settings');
        }
      }
    }
  }, []);

  // Load timers from localStorage on mount (only once)
  useEffect(() => {
    if (typeof window !== 'undefined' && userId && !hasLoadedTimers) {
      const savedTimers = localStorage.getItem(`timers-user-${userId}`);
      if (savedTimers) {
        try {
          const parsed = JSON.parse(savedTimers);
          
          // Reconstruct timers with new intervals
          const reconstructedTimers: { [key: string]: Timer } = {};
          
          Object.entries(parsed).forEach(([id, savedTimer]: [string, any]) => {
            if (savedTimer.remaining > 0) {
              let currentRemaining = savedTimer.remaining;
              
              const interval = setInterval(() => {
                currentRemaining--;
                
                if (currentRemaining <= 0) {
                  clearInterval(interval);
                  
                  // Use a callback to ensure we have the latest settings
                  setTimers(prev => {
                    const alarmInterval = startLoopingAlarm(settings.ringtone, settings.volume);
                    
                    // Show browser notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                      new Notification('Timer Complete! ⏰', {
                        body: `${savedTimer.recipeName} - ${savedTimer.stepTitle}`,
                        icon: '/favicon.ico',
                      });
                    }
                    
                    return {
                      ...prev,
                      [id]: { ...prev[id], remaining: 0, interval: null, alarmInterval }
                    };
                  });
                } else {
                  setTimers(prev => ({
                    ...prev,
                    [id]: { ...prev[id], remaining: currentRemaining }
                  }));
                }
              }, 1000);
              
              reconstructedTimers[id] = {
                ...savedTimer,
                interval,
              };
            }
          });
          
          setTimers(reconstructedTimers);
          setHasLoadedTimers(true);
        } catch (e) {
          console.error('Failed to load timers');
          setHasLoadedTimers(true);
        }
      } else {
        setHasLoadedTimers(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, hasLoadedTimers]);

  // Save timers to localStorage whenever they change (but only after initial load)
  useEffect(() => {
    if (typeof window !== 'undefined' && userId && hasLoadedTimers) {
      const timersToSave = Object.entries(timers).reduce((acc, [id, timer]) => {
        // Don't save the interval, just the data
        acc[id] = {
          id: timer.id,
          recipeId: timer.recipeId,
          recipeName: timer.recipeName,
          stepTitle: timer.stepTitle,
          totalMinutes: timer.totalMinutes,
          remaining: timer.remaining,
          userId: timer.userId,
        };
        return acc;
      }, {} as any);
      
      localStorage.setItem(`timers-user-${userId}`, JSON.stringify(timersToSave));
    }
  }, [timers, userId, hasLoadedTimers]);

  const startTimer = (id: string, recipeId: number, recipeName: string, stepTitle: string, minutes: number, timerUserId?: number) => {
    // Clear existing timer and alarm if any
    const existingTimer = timers[id];
    if (existingTimer) {
      if (existingTimer.interval) {
        clearInterval(existingTimer.interval);
      }
      if (existingTimer.alarmInterval) {
        clearInterval(existingTimer.alarmInterval);
      }
    }

    const totalSeconds = minutes * 60;
    let currentRemaining = totalSeconds;
    const ownerUserId = timerUserId || userId || undefined;
    
    const interval = setInterval(() => {
      currentRemaining--;
      
      if (currentRemaining <= 0) {
        // Timer complete - start looping alarm
        const alarmInterval = startLoopingAlarm(settings.ringtone, settings.volume);
        
        // Show browser notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Timer Complete! ⏰', {
            body: `${recipeName} - ${stepTitle}`,
            icon: '/favicon.ico',
          });
        }
        
        clearInterval(interval);
        
        // Keep timer visible with 0 remaining and store alarm interval
        setTimers(prev => ({
          ...prev,
          [id]: { ...prev[id], remaining: 0, interval: null, alarmInterval }
        }));
      } else {
        setTimers(prev => ({
          ...prev,
          [id]: { ...prev[id], remaining: currentRemaining }
        }));
      }
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
        interval,
        userId: ownerUserId
      }
    }));
  };

  const stopTimer = (id: string) => {
    const timer = timers[id];
    if (timer) {
      // Clear countdown interval if running
      if (timer.interval) {
        clearInterval(timer.interval);
      }
      // Clear alarm interval if playing
      if (timer.alarmInterval) {
        clearInterval(timer.alarmInterval);
      }
    }
    setTimers(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const stopAlarm = (id: string) => {
    const timer = timers[id];
    if (timer && timer.alarmInterval) {
      clearInterval(timer.alarmInterval);
      setTimers(prev => ({
        ...prev,
        [id]: { ...prev[id], alarmInterval: null }
      }));
    }
  };

  const getTimer = (id: string) => timers[id];

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('timerSettings', JSON.stringify(updated));
    }
  };

  // Cleanup on unmount - properly clean up all intervals
  useEffect(() => {
    return () => {
      // Get current timers from state at unmount time
      setTimers(currentTimers => {
        Object.values(currentTimers).forEach(timer => {
          if (timer.interval) {
            clearInterval(timer.interval);
          }
          if (timer.alarmInterval) {
            clearInterval(timer.alarmInterval);
          }
        });
        return currentTimers;
      });
    };
  }, []); // Only run on unmount

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <TimerContext.Provider value={{ timers, settings, startTimer, stopTimer, stopAlarm, getTimer, updateSettings }}>
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

