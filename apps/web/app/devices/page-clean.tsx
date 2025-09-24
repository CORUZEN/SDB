'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  MoreVertical, 
  Edit3, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Activity,
  AlertTriangle,
  Clock,
  MapPin,
  Battery,
  Wifi,
  WifiOff
} from 'lucide-react';

import {
  useDebounce,
  useCache,
  useDeviceFiltering,
  useDeviceStats,
  usePagination,
  usePerformanceMonitor,
  globalCache
} from '@/lib/performance-utils';

interface DeviceType {
  id: string;
  device_name: string;
  device_id: string;
  status: 'online' | 'offline' | 'idle' | 'inactive';
  battery_level: number | null;
  location: string | null;
  last_seen_at: string | null;
  brand: string | null;
  model: string | null;
  created_at: string;
  updated_at: string;
}

export default function OptimizedDevicesPage() {
  // Performance monitoring
  const { start, end } = usePerformanceMonitor('DevicesPage');
  
  // State management
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    location: 'all',
    batteryRange: { min: 0, max: 100 }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [editingDevice, setEditingDevice] = useState<DeviceType | null>(null);

  // Debounced search
  const debouncedSearch = useDebounce(filters.search, 300);

  // Fetch devices with caching
  const { 
    data: devices = [], 
    loading, 
    error, 
    refresh 
  } = useCache(
    'devices-list',
    async () => {
      start();
      const response = await fetch('/api/devices', {
        headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}` }
      });
      if (!response.ok) throw new Error('Failed to fetch devices');
      const data = await response.json();
      end();
      return data;
    },
    [], // dependencies
    2 * 60 * 1000 // 2 minutes cache TTL
  );

  // Memoized filtered devices
  const filteredDevices = useDeviceFiltering(devices || [], {
    ...filters,
    search: debouncedSearch
  });

  // Memoized stats
  const stats = useDeviceStats(devices || []);

  // Pagination
  const {
    paginatedItems: paginatedDevices,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
    totalItems
  } = usePagination(filteredDevices || [], 12);

  // Handlers
  const handleRefreshDevices = useCallback(async () => {
    start();
    globalCache.clear();
    await refresh();
    end();
  }, [refresh, start, end]);

  const handleSaveDevice = useCallback(async (deviceData: Partial<DeviceType>) => {
    try {
      // Implementation would go here
      await refresh();
    } catch (error) {
      console.error('Error saving device:', error);
    }
  }, [refresh]);

  // Loading states
  if (loading && (!devices || devices.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dispositivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dispositivos
          </h1>
          <p className="text-gray-600">
            Gerenciar e monitorar todos os dispositivos da rede
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <Wifi className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.online}</p>
                <p className="text-sm text-gray-600">Online</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <WifiOff className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.offline}</p>
                <p className="text-sm text-gray-600">Offline</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <Battery className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.averageBattery}%</p>
                <p className="text-sm text-gray-600">Bateria Média</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar dispositivos..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </button>
              
              <button
                onClick={handleRefreshDevices}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Todos os status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="idle">Idle</option>
                <option value="inactive">Inativo</option>
              </select>
              
              <select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Todas as localizações</option>
                {stats.locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Bateria:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.batteryRange.min}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    batteryRange: { ...prev.batteryRange, min: parseInt(e.target.value) }
                  }))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600">{filters.batteryRange.min}%+</span>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Mostrando {paginatedDevices.length} de {totalItems} dispositivos
          {filters.search && ` (filtrado por "${filters.search}")`}
        </div>

        {/* Device Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {paginatedDevices.map((device) => (
            <div
              key={device.id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {device.device_name || device.device_id}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    ID: {device.device_id}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                  <div className={`w-3 h-3 rounded-full ${
                    device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>

              <div className="space-y-3">
                {device.battery_level !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bateria</span>
                    <div className="flex items-center gap-1">
                      <Battery className={`h-4 w-4 ${
                        device.battery_level < 20 ? 'text-red-500' : 
                        device.battery_level < 50 ? 'text-yellow-500' : 'text-green-500'
                      }`} />
                      <span className="text-sm font-medium">{device.battery_level}%</span>
                    </div>
                  </div>
                )}

                {device.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Localização</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm truncate max-w-24">{device.location}</span>
                    </div>
                  </div>
                )}

                {device.last_seen_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Última vez</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(device.last_seen_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
                <Link
                  href={`/devices/${device.id}`}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver Detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={previousPage}
                  disabled={!hasPreviousPage}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-2 rounded-lg ${
                          pageNum === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={nextPage}
                  disabled={!hasNextPage}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Erro ao carregar dispositivos</span>
            </div>
            <p className="mt-1 text-sm text-red-600">{error.message}</p>
            <button
              onClick={handleRefreshDevices}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}