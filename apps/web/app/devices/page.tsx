'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { DashboardHeader } from '@/components/DashboardHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import OptimizedDeviceCard from '@/components/OptimizedDeviceCard';
import { 
  Smartphone, 
  Plus,
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  SortDesc,
  Users,
  Activity,
  AlertTriangle,
  Battery,
  Clock,
  MapPin,
  Edit3,
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react';
import { devicesApi, type Device as DeviceType } from '@/lib/api-service';
import { useAuth } from '@/components/AuthProvider';
import { 
  useDebounce, 
  useCache, 
  useDeviceFiltering, 
  useDeviceStats, 
  usePagination,
  usePerformanceMonitor,
  globalCache 
} from '@/lib/performance-utils';

// Lazy load heavy components
const EditDeviceModal = dynamic(() => import('@/components/EditDeviceModal'), {
  loading: () => <div className="animate-pulse">Carregando...</div>
});

// Interfaces
interface DeviceFilters {
  status: 'all' | 'online' | 'offline' | 'idle' | 'inactive';
  search: string;
  tag: string;
  owner: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  alerts: number;
  lastSync: string;
}

// Componente DeviceCard otimizado
const DeviceCard = ({ device, onEdit, onLocate }: {
  device: DeviceType;
  onEdit: (device: DeviceType) => void;
  onLocate: (deviceId: string) => void;
}) => {
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = async () => {
    setIsLocating(true);
    try {
      await onLocate(device.id);
    } finally {
      setIsLocating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800 border-green-200';
      case 'offline': return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="w-3 h-3" />;
      case 'offline': return <WifiOff className="w-3 h-3" />;
      default: return <WifiOff className="w-3 h-3" />;
    }
  };

  const getBatteryColor = (level: number | null) => {
    if (!level) return 'text-gray-400';
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatLastSeen = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Header do Card */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{device.name}</h3>
            <p className="text-sm text-gray-500 truncate">{device.owner || 'Não atribuído'}</p>
          </div>
        </div>
        
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
          {getStatusIcon(device.status)}
          {device.status === 'online' ? 'Online' : device.status === 'offline' ? 'Offline' : 'Inativo'}
        </span>
      </div>

      {/* Métricas do Dispositivo */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {device.battery_level !== null && (
          <div className="flex items-center">
            <Battery className={`h-4 w-4 mr-2 ${getBatteryColor(device.battery_level)}`} />
            <span className="text-sm font-medium text-gray-700">
              {device.battery_level}%
            </span>
          </div>
        )}
        
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-gray-400" />
          <span className="text-sm text-gray-600">
            {formatLastSeen(device.last_seen_at)}
          </span>
        </div>
      </div>

      {/* Informações Técnicas */}
      {device.os_version && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Sistema:</span> {device.os_version}
          </p>
        </div>
      )}

      {/* Tags */}
      {device.tags && device.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {device.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                {tag}
              </span>
            ))}
            {device.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{device.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2">
        <button
          onClick={handleLocate}
          disabled={isLocating || device.status === 'offline'}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLocating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Localizando...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Localizar
            </>
          )}
        </button>
        
        <button
          onClick={() => onEdit(device)}
          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        
        <Link
          href={`/devices/${device.id}`}
          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

// Componente principal
export default function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceType | null>(null);
  const [stats, setStats] = useState<DeviceStats>({
    total: 0,
    online: 0,
    offline: 0,
    alerts: 0,
    lastSync: new Date().toISOString()
  });

  // Filtros e paginação
  const [filters, setFilters] = useState<DeviceFilters>({
    status: 'all',
    search: '',
    tag: '',
    owner: ''
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12, // 12 dispositivos por página
    total: 0,
    totalPages: 0
  });

  // Carregar dispositivos com debounce na busca
  const loadDevices = useCallback(async (page: number = 1, newFilters?: DeviceFilters) => {
    setLoading(true);
    try {
      const currentFilters = newFilters || filters;
      
      // Simular API com paginação e filtros
      // Em produção, isso seria uma chamada para a API com query parameters
      const allDevices = await devicesApi.getAll();
      
      // Filtrar dispositivos
      let filteredDevices = allDevices;
      
      if (currentFilters.status !== 'all') {
        filteredDevices = filteredDevices.filter(d => d.status === currentFilters.status);
      }
      
      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        filteredDevices = filteredDevices.filter(d => 
          d.name.toLowerCase().includes(searchLower) ||
          d.owner?.toLowerCase().includes(searchLower) ||
          d.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      if (currentFilters.tag) {
        filteredDevices = filteredDevices.filter(d => 
          d.tags.includes(currentFilters.tag)
        );
      }

      // Paginação
      const total = filteredDevices.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const startIndex = (page - 1) * pagination.limit;
      const paginatedDevices = filteredDevices.slice(startIndex, startIndex + pagination.limit);

      setDevices(paginatedDevices);
      setPagination(prev => ({
        ...prev,
        page,
        total,
        totalPages
      }));

      // Calcular estatísticas
      setStats({
        total: allDevices.length,
        online: allDevices.filter(d => d.status === 'online').length,
        offline: allDevices.filter(d => d.status === 'offline').length,
        alerts: allDevices.filter(d => d.battery_level !== null && d.battery_level < 20).length,
        lastSync: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao carregar dispositivos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, pagination.limit]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== '' || filters.status !== 'all' || filters.tag !== '') {
        loadDevices(1, filters);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.search, filters.status, filters.tag, filters, loadDevices]);

  // Carregar dados iniciais
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Handlers
  const handleRefresh = () => {
    setRefreshing(true);
    loadDevices(pagination.page);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadDevices(newPage);
    }
  };

  const handleFilterChange = (key: keyof DeviceFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleEditDevice = (device: DeviceType) => {
    setEditingDevice(device);
  };

  const handleSaveDevice = async (deviceId: string, updates: {
    name?: string;
    owner?: string;
    tags?: string[];
    status?: DeviceType['status'];
  }) => {
    try {
      const updatedDevice = await devicesApi.update(deviceId, updates);
      
      // Atualizar a lista de dispositivos
      setDevices(prev => prev.map(d => 
        d.id === deviceId ? { ...d, ...updatedDevice } : d
      ));
      
      setEditingDevice(null);
    } catch (error) {
      console.error('Erro ao salvar dispositivo:', error);
      throw error;
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      await devicesApi.delete(deviceId);
      
      // Remover da lista de dispositivos
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      
      setEditingDevice(null);
      
      // Recarregar estatísticas
      await loadDevices(pagination.page);
    } catch (error) {
      console.error('Erro ao excluir dispositivo:', error);
      throw error;
    }
  };

  const handleLocateDevice = async (deviceId: string) => {
    console.log('Localizar dispositivo:', deviceId);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
  };

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    return date.toLocaleDateString();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header da Página */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Dispositivos</h1>
            <p className="text-lg text-gray-600">
              Monitore, controle e gerencie todos os dispositivos da sua organização
            </p>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total de Dispositivos */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Total de Dispositivos
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Smartphone className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Dispositivos Online */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Dispositivos Online
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.online}
                  </p>
                  <div className="flex items-center mt-2">
                    <Wifi className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600">
                      {stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}% conectados
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Wifi className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Alertas Ativos */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Alertas Ativos
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.alerts}
                  </p>
                  <div className="flex items-center mt-2">
                    <Battery className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-sm font-medium text-red-600">
                      Bateria baixa
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Última Sincronização */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Última Sincronização
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-2">
                    {formatLastSync(stats.lastSync)}
                  </p>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Atualizando...' : 'Atualizar'}
                  </button>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Ações e Filtros */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Busca */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, proprietário ou tag..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>

              {/* Filtros e Ações */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro de Status */}
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">Todos os Status</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="inactive">Inativo</option>
                </select>

                {/* Botões de Ação */}
                <Link
                  href="/devices/add"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Dispositivo
                </Link>

                <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Dispositivos */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
                      <div className="ml-3">
                        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-300 rounded flex-1"></div>
                      <div className="h-8 bg-gray-300 rounded w-8"></div>
                      <div className="h-8 bg-gray-300 rounded w-8"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {filters.search || filters.status !== 'all' 
                  ? 'Nenhum dispositivo encontrado' 
                  : 'Nenhum dispositivo cadastrado'
                }
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {filters.search || filters.status !== 'all'
                  ? 'Tente ajustar os filtros de busca para encontrar dispositivos.'
                  : 'Adicione dispositivos para começar a gerenciar e monitorar seus equipamentos.'
                }
              </p>
              {(!filters.search && filters.status === 'all') && (
                <Link
                  href="/devices/add"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Primeiro Dispositivo
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {devices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    onEdit={handleEditDevice}
                    onLocate={handleLocateDevice}
                  />
                ))}
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} dispositivos
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {[...Array(Math.min(pagination.totalPages, 5))].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            pagination.page === page
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
        
        {/* Modal de Edição */}
        {editingDevice && (
          <EditDeviceModal
            device={editingDevice}
            isOpen={true}
            onClose={() => setEditingDevice(null)}
            onSave={handleSaveDevice}
            onDelete={handleDeleteDevice}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}