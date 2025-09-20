'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/DashboardHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Shield, 
  ShieldCheck,
  ShieldX,
  Lock,
  Unlock,
  Smartphone,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  Edit3,
  ExternalLink,
  Play,
  Settings,
  Camera,
  CameraOff,
  Bluetooth,
  BluetoothOff,
  Wifi,
  WifiOff,
  Ban,
  Key,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { policiesApi, devicesApi, type Policy as PolicyType } from '@/lib/api-service';
import { useAuth } from '@/components/AuthProvider';

// Interfaces
interface PolicyFilters {
  status: 'all' | 'active' | 'inactive';
  search: string;
  type: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PolicyStats {
  total: number;
  active: number;
  inactive: number;
  devicesCovered: number;
  lastApplication: string;
}

interface PolicyConfig {
  launcher_apps?: string[];
  blocked_apps?: string[];
  kiosk_mode?: boolean;
  allow_unknown_sources?: boolean;
  require_pin?: boolean;
  min_pin_length?: number;
  allow_usb_debugging?: boolean;
  force_encrypt?: boolean;
  wipe_on_failures?: number;
  disable_camera?: boolean;
  disable_bluetooth?: boolean;
  disable_wifi_config?: boolean;
}

// Componente PolicyConfigPreview
const PolicyConfigPreview = ({ config }: { config: PolicyConfig }) => {
  const configItems = [];

  if (config.require_pin) {
    configItems.push({
      icon: Lock,
      text: `PIN obrigatório (${config.min_pin_length || 4} dígitos)`,
      color: 'text-red-600'
    });
  }

  if (config.blocked_apps && config.blocked_apps.length > 0) {
    configItems.push({
      icon: Ban,
      text: `Apps bloqueados (${config.blocked_apps.length})`,
      color: 'text-red-600'
    });
  }

  if (config.kiosk_mode) {
    configItems.push({
      icon: Settings,
      text: 'Modo kiosk ativo',
      color: 'text-orange-600'
    });
  }

  if (config.disable_camera) {
    configItems.push({
      icon: CameraOff,
      text: 'Câmera desabilitada',
      color: 'text-red-600'
    });
  }

  if (config.disable_bluetooth) {
    configItems.push({
      icon: BluetoothOff,
      text: 'Bluetooth desabilitado',
      color: 'text-red-600'
    });
  }

  if (config.disable_wifi_config) {
    configItems.push({
      icon: WifiOff,
      text: 'Config. WiFi bloqueada',
      color: 'text-red-600'
    });
  }

  if (config.force_encrypt) {
    configItems.push({
      icon: Key,
      text: 'Criptografia forçada',
      color: 'text-green-600'
    });
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Configurações:</h4>
      {configItems.length > 0 ? (
        <div className="space-y-1">
          {configItems.slice(0, 3).map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div key={index} className="flex items-center text-xs">
                <IconComponent className={`w-3 h-3 mr-2 ${item.color}`} />
                <span className="text-gray-600">{item.text}</span>
              </div>
            );
          })}
          {configItems.length > 3 && (
            <div className="text-xs text-gray-500">
              +{configItems.length - 3} outras configurações...
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-500">Nenhuma restrição configurada</div>
      )}
    </div>
  );
};

// Componente PolicyCard
const PolicyCard = ({ policy, onEdit, onApply, onToggleStatus }: {
  policy: PolicyType;
  onEdit: (policy: PolicyType) => void;
  onApply: (policyId: string) => void;
  onToggleStatus: (policyId: string, currentStatus: boolean) => void;
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Verificação de segurança
  if (!policy || !policy.id) {
    return null;
  }

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(policy.id);
    } finally {
      setIsApplying(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      await onToggleStatus(policy.id, policy.is_active);
    } finally {
      setIsToggling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const config = (policy.policy_json || {}) as PolicyConfig;
  const rulesCount = Object.keys(config).filter(key => config[key as keyof PolicyConfig] === true || (Array.isArray(config[key as keyof PolicyConfig]) && (config[key as keyof PolicyConfig] as string[]).length > 0)).length;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Header do Card */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{policy.name}</h3>
            <p className="text-sm text-gray-500 truncate">{policy.description || 'Sem descrição'}</p>
          </div>
        </div>
        
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
          policy.is_active 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-gray-100 text-gray-800 border-gray-200'
        }`}>
          {policy.is_active ? (
            <>
              <CheckCircle className="w-3 h-3" />
              Ativa
            </>
          ) : (
            <>
              <AlertTriangle className="w-3 h-3" />
              Inativa
            </>
          )}
        </span>
      </div>

      {/* Métricas da Política */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center">
          <Smartphone className="h-4 w-4 mr-2 text-blue-500" />
          <span className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">0</span> dispositivos
          </span>
        </div>
        
        <div className="flex items-center">
          <Settings className="h-4 w-4 mr-2 text-purple-500" />
          <span className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{rulesCount}</span> regras
          </span>
        </div>
      </div>

      {/* Informações Temporais */}
      <div className="mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2 text-gray-400" />
          <span>Criada em {formatDate(policy.created_at)}</span>
        </div>
      </div>

      {/* Preview das Configurações */}
      <div className="mb-6">
        <PolicyConfigPreview config={config} />
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          disabled={isApplying || !policy.is_active}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isApplying ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Aplicando...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Aplicar
            </>
          )}
        </button>
        
        <button
          onClick={handleToggleStatus}
          disabled={isToggling}
          className={`inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg ${
            policy.is_active
              ? 'border border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-500'
              : 'border border-green-300 text-green-700 bg-white hover:bg-green-50 focus:ring-green-500'
          }`}
        >
          {isToggling ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          ) : policy.is_active ? (
            <ShieldX className="h-4 w-4" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
        </button>
        
        <button
          onClick={() => onEdit(policy)}
          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        
        <Link
          href={`/policies/${policy.id}`}
          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

// Componente principal
export default function PoliciesPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<PolicyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<PolicyStats>({
    total: 0,
    active: 0,
    inactive: 0,
    devicesCovered: 0,
    lastApplication: new Date().toISOString()
  });

  // Filtros e paginação
  const [filters, setFilters] = useState<PolicyFilters>({
    status: 'all',
    search: '',
    type: ''
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 8, // 8 políticas por página
    total: 0,
    totalPages: 0
  });

  // Carregar políticas com debounce na busca
  const loadPolicies = useCallback(async (page: number = 1, newFilters?: PolicyFilters) => {
    setLoading(true);
    try {
      const currentFilters = newFilters || filters;
      
      // Carregar todas as políticas
      const apiFilters: any = {};
      if (currentFilters.search) {
        apiFilters.search = currentFilters.search;
      }
      if (currentFilters.status !== 'all') {
        apiFilters.is_active = currentFilters.status === 'active';
      }
      
      const allPolicies = await policiesApi.getAll(apiFilters);
      console.log('📋 Políticas carregadas:', allPolicies);
      
      // Filtrar políticas localmente se necessário
      let filteredPolicies = allPolicies;
      
      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        filteredPolicies = filteredPolicies.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
        );
      }

      // Paginação
      const total = filteredPolicies.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const startIndex = (page - 1) * pagination.limit;
      const paginatedPolicies = filteredPolicies.slice(startIndex, startIndex + pagination.limit);

      setPolicies(paginatedPolicies);
      setPagination(prev => ({
        ...prev,
        page,
        total,
        totalPages
      }));

      // Calcular estatísticas
      setStats({
        total: allPolicies.length,
        active: allPolicies.filter(p => p.is_active).length,
        inactive: allPolicies.filter(p => !p.is_active).length,
        devicesCovered: 0, // TODO: Calcular dispositivos cobertos
        lastApplication: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao carregar políticas:', error);
      setPolicies([]); // Garantir que sempre seja um array
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, pagination.limit]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== '' || filters.status !== 'all') {
        loadPolicies(1, filters);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.search, filters.status]);

  // Carregar dados iniciais
  useEffect(() => {
    loadPolicies();
  }, []);

  // Handlers
  const handleRefresh = () => {
    setRefreshing(true);
    loadPolicies(pagination.page);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadPolicies(newPage);
    }
  };

  const handleFilterChange = (key: keyof PolicyFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleEditPolicy = (policy: PolicyType) => {
    // TODO: Implementar modal de edição ou navegar para página de edição
    console.log('Editar política:', policy.id);
  };

  const handleApplyPolicy = async (policyId: string) => {
    // TODO: Implementar aplicação de política em dispositivos
    console.log('Aplicar política:', policyId);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
  };

  const handleTogglePolicyStatus = async (policyId: string, currentStatus: boolean) => {
    try {
      await policiesApi.update(policyId, { is_active: !currentStatus });
      loadPolicies(pagination.page);
    } catch (error) {
      console.error('Erro ao alterar status da política:', error);
    }
  };

  const formatLastApplication = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header da Página */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Políticas de Segurança</h1>
            <p className="text-lg text-gray-600">
              Crie, configure e aplique políticas de segurança em seus dispositivos
            </p>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total de Políticas */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Total de Políticas
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Políticas Ativas */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Políticas Ativas
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.active}
                  </p>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600">
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% ativas
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <ShieldCheck className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Dispositivos Cobertos */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Dispositivos Cobertos
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.devicesCovered}
                  </p>
                  <div className="flex items-center mt-2">
                    <Users className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-sm font-medium text-blue-600">
                      Proteção ativa
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Smartphone className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Última Aplicação */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Última Aplicação
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-2">
                    {formatLastApplication(stats.lastApplication)}
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
                    placeholder="Buscar por nome ou descrição..."
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
                  <option value="active">Ativas</option>
                  <option value="inactive">Inativas</option>
                </select>

                {/* Botões de Ação */}
                <Link
                  href="/policies/add"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Política
                </Link>

                <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg">
                  <Download className="w-4 h-4 mr-2" />
                  Relatório
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Políticas */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
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
                    <div className="h-16 bg-gray-300 rounded w-full"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-300 rounded flex-1"></div>
                      <div className="h-8 bg-gray-300 rounded w-8"></div>
                      <div className="h-8 bg-gray-300 rounded w-8"></div>
                      <div className="h-8 bg-gray-300 rounded w-8"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {filters.search || filters.status !== 'all' 
                  ? 'Nenhuma política encontrada' 
                  : 'Nenhuma política cadastrada'
                }
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {filters.search || filters.status !== 'all'
                  ? 'Tente ajustar os filtros de busca para encontrar políticas.'
                  : 'Crie sua primeira política de segurança para os dispositivos.'
                }
              </p>
              {(!filters.search && filters.status === 'all') && (
                <Link
                  href="/policies/add"
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Primeira Política
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {policies.filter(policy => policy && policy.id).map((policy) => (
                  <PolicyCard
                    key={policy.id}
                    policy={policy}
                    onEdit={handleEditPolicy}
                    onApply={handleApplyPolicy}
                    onToggleStatus={handleTogglePolicyStatus}
                  />
                ))}
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} políticas
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
                          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                            pagination.page === page
                              ? 'bg-purple-600 text-white'
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
      </div>
    </ProtectedRoute>
  );
}