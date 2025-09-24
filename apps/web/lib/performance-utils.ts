'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// Cache utility with TTL and memory management
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttl = 300000): void { // 5 minutes default TTL
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const globalCache = new PerformanceCache();

// Debounced search hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Cache hook with automatic cleanup
export function useCache<T>(key: string, fetcher: () => Promise<T>, deps: any[] = [], ttl = 300000) {
  const [data, setData] = useState<T | null>(() => globalCache.get<T>(key));
  const [loading, setLoading] = useState<boolean>(!data);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    const cached = globalCache.get<T>(key);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      globalCache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  useEffect(() => {
    fetchData();
  }, deps);

  const refresh = useCallback(() => {
    globalCache.set(key, null as any, 0); // Invalidate cache
    fetchData();
  }, [key, fetchData]);

  return { data, loading, error, refresh };
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
}

// Optimized device filtering and sorting
export function useDeviceFiltering(devices: any[], filters: any) {
  return useMemo(() => {
    if (!devices || !Array.isArray(devices)) return [];

    let filtered = devices;

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(device => device?.status === filters.status);
    }

    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      filtered = filtered.filter(device =>
        device?.device_name?.toLowerCase().includes(searchLower) ||
        device?.device_id?.toLowerCase().includes(searchLower) ||
        device?.location?.toLowerCase().includes(searchLower) ||
        device?.brand?.toLowerCase().includes(searchLower)
      );
    }

    // Tag filter
    if (filters.tag) {
      filtered = filtered.filter(device =>
        device?.tags?.includes(filters.tag)
      );
    }

    // Owner filter
    if (filters.owner) {
      filtered = filtered.filter(device => device?.owner === filters.owner);
    }

    // Location filter  
    if (filters.location && filters.location !== 'all') {
      filtered = filtered.filter(device => device?.location === filters.location);
    }

    // Battery filter
    if (filters.batteryRange) {
      filtered = filtered.filter(device => {
        const battery = device?.battery_level;
        if (battery === null || battery === undefined) return false;
        
        if (filters.batteryRange.min !== undefined && battery < filters.batteryRange.min) return false;
        if (filters.batteryRange.max !== undefined && battery > filters.batteryRange.max) return false;
        
        return true;
      });
    }

    return filtered;
  }, [devices, filters]);
}

// Device statistics calculation
export function useDeviceStats(devices: any[]) {
  return useMemo(() => {
    if (!devices || !Array.isArray(devices)) {
      return {
        total: 0,
        online: 0,
        offline: 0,
        lowBattery: 0,
        averageBattery: 0,
        locations: []
      };
    }

    const total = devices.length;
    const online = devices.filter(d => d?.status === 'online' || d?.is_online).length;
    const offline = total - online;
    
    const validBatteries = devices
      .map(d => d?.battery_level)
      .filter(b => b !== null && b !== undefined && !isNaN(b));
    
    const lowBattery = devices.filter(d => {
      const battery = d?.battery_level;
      return battery !== null && battery !== undefined && battery < 20;
    }).length;
    
    const averageBattery = validBatteries.length > 0 
      ? Math.round(validBatteries.reduce((a, b) => a + b, 0) / validBatteries.length)
      : 0;

    const locations = [...new Set(
      devices
        .map(d => d?.location)
        .filter(l => l && l.trim())
    )];

    return {
      total,
      online,
      offline,
      lowBattery,
      averageBattery,
      locations
    };
  }, [devices]);
}

// Pagination hook
export function usePagination<T>(items: T[], itemsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 if items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  const totalItems = items?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginatedItems = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  return {
    paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    nextPage,
    previousPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(name: string) {
  const startTime = useRef<number>();
  const measurements = useRef<number[]>([]);

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      measurements.current.push(duration);
      
      // Keep only last 10 measurements
      if (measurements.current.length > 10) {
        measurements.current.shift();
      }
      
      console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
      return duration;
    }
    return 0;
  }, [name]);

  const getAverage = useCallback(() => {
    if (measurements.current.length === 0) return 0;
    return measurements.current.reduce((a, b) => a + b, 0) / measurements.current.length;
  }, []);

  const clear = useCallback(() => {
    measurements.current = [];
  }, []);

  return { start, end, getAverage, clear };
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items?.length || 0
  );

  const visibleItems = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    return items.slice(visibleStart, visibleEnd);
  }, [items, visibleStart, visibleEnd]);

  const totalHeight = (items?.length || 0) * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
}

export { globalCache };