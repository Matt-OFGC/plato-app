'use client';

import { useEffect, useState, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  networkRequests: number;
  buttonClickTime: number;
  formSubmissionTime: number;
  pageNavigationTime: number;
  apiResponseTime: number;
  bundleSize: number;
}

interface PerformanceEvent {
  type: 'button_click' | 'form_submit' | 'page_nav' | 'api_call';
  duration: number;
  timestamp: number;
  details?: any;
}

export function EnhancedPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    networkRequests: 0,
    buttonClickTime: 0,
    formSubmissionTime: 0,
    pageNavigationTime: 0,
    apiResponseTime: 0,
    bundleSize: 0,
  });
  
  const [isVisible, setIsVisible] = useState(false);
  const [events, setEvents] = useState<PerformanceEvent[]>([]);
  const startTime = useRef<number>(Date.now());
  const renderStart = useRef<number>(0);
  const navigationStart = useRef<number>(0);

  useEffect(() => {
    // Measure page load time
    const loadTime = Date.now() - startTime.current;
    
    // Measure memory usage (if available)
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Count network requests
    const networkRequests = performance.getEntriesByType('resource').length;
    
    // Calculate cache hit rate
    const resources = performance.getEntriesByType('resource');
    const cachedResources = resources.filter(r => r.transferSize === 0).length;
    const cacheHitRate = resources.length > 0 ? (cachedResources / resources.length) * 100 : 0;
    
    // Estimate bundle size
    const scripts = performance.getEntriesByType('resource').filter(r => r.name.includes('.js'));
    const bundleSize = scripts.reduce((total, script) => total + script.transferSize, 0);
    
    setMetrics({
      loadTime,
      renderTime: 0,
      memoryUsage: Math.round(memoryUsage / 1024 / 1024), // Convert to MB
      cacheHitRate: Math.round(cacheHitRate),
      networkRequests,
      buttonClickTime: 0,
      formSubmissionTime: 0,
      pageNavigationTime: 0,
      apiResponseTime: 0,
      bundleSize: Math.round(bundleSize / 1024), // Convert to KB
    });
  }, []);

  // Monitor render performance
  useEffect(() => {
    renderStart.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStart.current;
      setMetrics(prev => ({ ...prev, renderTime: Math.round(renderTime) }));
    };
  }, []);

  // Monitor navigation performance
  useEffect(() => {
    navigationStart.current = performance.now();
    
    return () => {
      const navigationTime = performance.now() - navigationStart.current;
      setMetrics(prev => ({ ...prev, pageNavigationTime: Math.round(navigationTime) }));
      
      // Log navigation event
      setEvents(prev => [...prev.slice(-9), {
        type: 'page_nav',
        duration: navigationTime,
        timestamp: Date.now(),
        details: { path: window.location.pathname }
      }]);
    };
  }, []);

  // Monitor API calls
  useEffect(() => {
    const originalFetch = window.fetch;
    let apiCallCount = 0;
    let totalApiTime = 0;

    window.fetch = async (...args) => {
      const start = performance.now();
      apiCallCount++;
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        totalApiTime += duration;
        
        // Log API event
        setEvents(prev => [...prev.slice(-9), {
          type: 'api_call',
          duration,
          timestamp: Date.now(),
          details: { url: args[0], status: response.status }
        }]);
        
        // Update average API response time
        setMetrics(prev => ({ 
          ...prev, 
          apiResponseTime: Math.round(totalApiTime / apiCallCount) 
        }));
        
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        totalApiTime += duration;
        
        setEvents(prev => [...prev.slice(-9), {
          type: 'api_call',
          duration,
          timestamp: Date.now(),
          details: { url: args[0], error: true }
        }]);
        
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Keyboard shortcut to toggle visibility
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-lg z-50 text-sm font-mono max-w-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">Performance Monitor</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Load Time:</span>
          <span className={metrics.loadTime > 2000 ? 'text-red-400' : metrics.loadTime > 1000 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.loadTime}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Render Time:</span>
          <span className={metrics.renderTime > 16 ? 'text-red-400' : 'text-green-400'}>
            {metrics.renderTime}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Memory:</span>
          <span className={metrics.memoryUsage > 100 ? 'text-red-400' : metrics.memoryUsage > 50 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.memoryUsage}MB
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Cache Hit:</span>
          <span className={metrics.cacheHitRate > 80 ? 'text-green-400' : metrics.cacheHitRate > 60 ? 'text-yellow-400' : 'text-red-400'}>
            {metrics.cacheHitRate}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Requests:</span>
          <span className={metrics.networkRequests > 20 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.networkRequests}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>API Avg:</span>
          <span className={metrics.apiResponseTime > 1000 ? 'text-red-400' : metrics.apiResponseTime > 500 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.apiResponseTime}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Bundle Size:</span>
          <span className={metrics.bundleSize > 1000 ? 'text-red-400' : metrics.bundleSize > 500 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.bundleSize}KB
          </span>
        </div>
      </div>
      
      {/* Recent Events */}
      {events.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <h4 className="text-xs font-bold mb-2">Recent Events</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {events.slice(-5).map((event, i) => (
              <div key={i} className="text-xs flex justify-between">
                <span className="text-gray-400">{event.type.replace('_', ' ')}</span>
                <span className={event.duration > 1000 ? 'text-red-400' : event.duration > 500 ? 'text-yellow-400' : 'text-green-400'}>
                  {Math.round(event.duration)}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}

// Hook for measuring component performance
export function usePerformanceMeasure(componentName: string) {
  const renderStart = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStart.current = performance.now();
    renderCount.current += 1;

    return () => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current;
        if (renderTime > 16) { // More than one frame
          console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms`);
        }
      }
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
  };
}

// Hook for measuring API performance
export function useAPIPerformance() {
  const [metrics, setMetrics] = useState<{ [key: string]: number }>({});

  const measureAPI = async (apiCall: () => Promise<any>, name: string) => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - start;
      setMetrics(prev => ({ ...prev, [name]: duration }));
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      setMetrics(prev => ({ ...prev, [`${name}-error`]: duration }));
      throw error;
    }
  };

  return { measureAPI, metrics };
}
