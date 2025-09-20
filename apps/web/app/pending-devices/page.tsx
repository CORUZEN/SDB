'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Smartphone, Calendar, CheckCircle, XCircle, AlertTriangle, RotateCcw, Search, Filter, Users, Timer, Activity, Plus } from 'lucide-react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { GenerateCodeModal } from '@/components/GenerateCodeModal';
import ProtectedRoute from '@/components/ProtectedRoute';

interface PendingDevice {
  id: string;
  device_name: string;
  device_model: string;
  android_version: string;
  pairing_code: string;
  created_at: string;
  expires_at: string;
}

interface DeviceStats {
  total: number;
  todayCount: number;
  averageWaitTime: string;
  urgentCount: number;
}

interface PendingDeviceCardProps {
  device: PendingDevice;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isLoading: boolean;
}

// Função para calcular urgência temporal
const getTimeUrgency = (createdAt: string, expiresAt: string) => {
  const now = new Date();
  const created = new Date(createdAt);
  const expires = new Date(expiresAt);
  const totalTime = expires.getTime() - created.getTime();
  const elapsed = now.getTime() - created.getTime();
  const remaining = expires.getTime() - now.getTime();
  
  const elapsedPercentage = (elapsed / totalTime) * 100;
  
  if (remaining <= 0) return { level: 'expired', color: 'red', percentage: 100 };
  if (elapsedPercentage >= 80) return { level: 'critical', color: 'red', percentage: elapsedPercentage };
  if (elapsedPercentage >= 60) return { level: 'warning', color: 'orange', percentage: elapsedPercentage };
  if (elapsedPercentage >= 30) return { level: 'moderate', color: 'yellow', percentage: elapsedPercentage };
  return { level: 'fresh', color: 'green', percentage: elapsedPercentage };
};

// Função para formatar tempo relativo
const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Agora mesmo';
  if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
  return `${Math.floor(diffInMinutes / 1440)}d atrás`;
};

// Função para formatar tempo restante
const formatTimeRemaining = (dateString: string) => {
  const now = new Date();
  const expires = new Date(dateString);
  const diffInMinutes = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60));
  
  if (diffInMinutes <= 0) return 'Expirado';
  if (diffInMinutes < 60) return `${diffInMinutes}min restantes`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h restantes`;
  return `${Math.floor(diffInMinutes / 1440)}d restantes`;
};

// Componente do Card de Dispositivo Pendente
const PendingDeviceCard = ({ device, onApprove, onReject, isLoading }: PendingDeviceCardProps) => {
  const urgency = getTimeUrgency(device.created_at, device.expires_at);
  const timeAgo = formatTimeAgo(device.created_at);
  const timeRemaining = formatTimeRemaining(device.expires_at);
  
  const urgencyColors = {
    green: 'from-green-500 to-emerald-500',
    yellow: 'from-yellow-500 to-amber-500',
    orange: 'from-orange-500 to-red-400',
    red: 'from-red-500 to-rose-600'
  };

  const urgencyBg = {
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200'
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${urgencyBg[urgency.color as keyof typeof urgencyBg]}`}>
      {/* Timeline Progress Bar */}
      <div className="h-2 rounded-t-xl bg-gray-100 overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${urgencyColors[urgency.color as keyof typeof urgencyColors]} transition-all duration-1000`}
          style={{ width: `${Math.min(urgency.percentage, 100)}%` }}
        />
      </div>
      
      <div className="p-6">
        {/* Header com Código de Pareamento */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{device.device_name}</h3>
              <p className="text-sm text-gray-500">{device.device_model}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-gray-900 text-white px-4 py-2 rounded-lg font-mono text-lg font-bold">
              {device.pairing_code}
            </div>
            <p className="text-xs text-gray-500 mt-1">Código de Pareamento</p>
          </div>
        </div>

        {/* Informações do Dispositivo */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Android {device.android_version}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{timeAgo}</span>
          </div>
        </div>

        {/* Status Temporal */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Status Temporal</span>
            <span className={`text-sm font-medium ${
              urgency.color === 'green' ? 'text-green-600' : 
              urgency.color === 'yellow' ? 'text-yellow-600' : 
              urgency.color === 'orange' ? 'text-orange-600' : 'text-red-600'
            }`}>
              {timeRemaining}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {urgency.level === 'expired' && <AlertTriangle className="w-4 h-4 text-red-500" />}
            {urgency.level === 'critical' && <AlertTriangle className="w-4 h-4 text-red-500" />}
            {urgency.level === 'warning' && <Timer className="w-4 h-4 text-orange-500" />}
            {urgency.level === 'moderate' && <Clock className="w-4 h-4 text-yellow-500" />}
            {urgency.level === 'fresh' && <CheckCircle className="w-4 h-4 text-green-500" />}
            <span className="text-sm capitalize">
              {urgency.level === 'expired' ? 'Expirado' :
               urgency.level === 'critical' ? 'Crítico' :
               urgency.level === 'warning' ? 'Atenção' :
               urgency.level === 'moderate' ? 'Moderado' : 'Novo'}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex space-x-3">
          <button
            onClick={() => onApprove(device.id)}
            disabled={isLoading || urgency.level === 'expired'}
            className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Aprovar</span>
          </button>
          <button
            onClick={() => onReject(device.id)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Rejeitar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PendingDevicesPage() {
  const [devices, setDevices] = useState<PendingDevice[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<PendingDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'urgent' | 'fresh'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [stats, setStats] = useState<DeviceStats>({
    total: 0,
    todayCount: 0,
    averageWaitTime: '0min',
    urgentCount: 0
  });

  // Função para buscar dispositivos pendentes
  const fetchPendingDevices = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      // Get auth token for organization context
      const authToken = localStorage.getItem('auth-token') || 'dev-token-mock';
      
      const response = await fetch('/api/admin/pending-devices', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Pending devices loaded:', data.length);
        setDevices(data);
        setLastUpdated(new Date());
        
        // Calcular estatísticas
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const todayDevices = data.filter((device: PendingDevice) => 
          new Date(device.created_at) >= today
        );
        
        const urgentDevices = data.filter((device: PendingDevice) => {
          const urgency = getTimeUrgency(device.created_at, device.expires_at);
          return urgency.level === 'critical' || urgency.level === 'warning';
        });
        
        // Calcular tempo médio de espera
        const totalWaitTime = data.reduce((acc: number, device: PendingDevice) => {
          const created = new Date(device.created_at);
          const waitTime = now.getTime() - created.getTime();
          return acc + waitTime;
        }, 0);
        
        const averageWaitMinutes = data.length > 0 ? Math.floor(totalWaitTime / (data.length * 1000 * 60)) : 0;
        const averageWaitTime = averageWaitMinutes < 60 ? `${averageWaitMinutes}min` : `${Math.floor(averageWaitMinutes / 60)}h`;
        
        setStats({
          total: data.length,
          todayCount: todayDevices.length,
          averageWaitTime,
          urgentCount: urgentDevices.length
        });
      } else {
        console.error('❌ Failed to fetch pending devices:', response.status);
        
        if (response.status === 503) {
          const errorData = await response.json();
          if (errorData.needsSetup) {
            console.warn('⚠️ Database schema not configured');
            // Show setup message to user
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching pending devices:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Filtrar dispositivos baseado na busca e filtro
  useEffect(() => {
    let filtered = devices;

    // Aplicar busca
    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.device_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.pairing_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro
    if (filter !== 'all') {
      filtered = filtered.filter(device => {
        const urgency = getTimeUrgency(device.created_at, device.expires_at);
        if (filter === 'urgent') {
          return urgency.level === 'critical' || urgency.level === 'warning';
        }
        if (filter === 'fresh') {
          return urgency.level === 'fresh' || urgency.level === 'moderate';
        }
        return true;
      });
    }

    setFilteredDevices(filtered);
  }, [devices, searchTerm, filter]);

  // Auto-refresh
  useEffect(() => {
    fetchPendingDevices();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchPendingDevices(false);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchPendingDevices]);

  // Função para aprovar dispositivo
  const handleApprove = async (id: string) => {
    setLoadingActions(prev => new Set(prev).add(id));
    
    try {
      // Get auth token for organization context
      const authToken = localStorage.getItem('auth-token') || 'dev-token-mock';
      
      const response = await fetch(`/api/admin/pending-devices/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Device approved:', result.device?.name);
        await fetchPendingDevices(false);
      } else {
        const error = await response.json();
        console.error('❌ Failed to approve device:', error.error);
      }
    } catch (error) {
      console.error('❌ Error approving device:', error);
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Função para rejeitar dispositivo
  const handleReject = async (id: string) => {
    setLoadingActions(prev => new Set(prev).add(id));
    
    try {
      // Get auth token for organization context
      const authToken = localStorage.getItem('auth-token') || 'dev-token-mock';
      
      const response = await fetch(`/api/admin/pending-devices/${id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('❌ Device rejected:', result.device?.name);
        await fetchPendingDevices(false);
      } else {
        const error = await response.json();
        console.error('❌ Failed to reject device:', error.error);
      }
    } catch (error) {
      console.error('❌ Error rejecting device:', error);
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        
        {/* Header da Página */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dispositivos Pendentes</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gerencie solicitações de pareamento com controle temporal inteligente
                </p>
              </div>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Gerar Código</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pendentes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hoje</p>
                  <p className="text-3xl font-bold text-green-600">{stats.todayCount}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.averageWaitTime}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Timer className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgentes</p>
                  <p className="text-3xl font-bold text-red-600">{stats.urgentCount}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Controles e Filtros */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Busca */}
              <div className="flex-1 lg:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, modelo ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Filtros e Controles */}
              <div className="flex items-center space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'urgent' | 'fresh')}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="urgent">Urgentes</option>
                  <option value="fresh">Recentes</option>
                </select>

                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    autoRefresh 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  <RotateCcw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  <span>Auto-Refresh</span>
                </button>

                <button
                  onClick={() => fetchPendingDevices()}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <Activity className="w-4 h-4" />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>

            {/* Última Atualização */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Última atualização: {lastUpdated.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Lista de Dispositivos */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="flex-1 h-10 bg-gray-200 rounded"></div>
                    <div className="flex-1 h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDevices.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDevices.map((device) => (
                <PendingDeviceCard
                  key={device.id}
                  device={device}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isLoading={loadingActions.has(device.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Smartphone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filter !== 'all' ? 'Nenhum dispositivo encontrado' : 'Nenhum dispositivo pendente'}
              </h3>
              <p className="text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Todos os dispositivos foram processados.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal de Geração de Código */}
        <GenerateCodeModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          onCodeGenerated={() => fetchPendingDevices(false)}
        />
      </div>
    </ProtectedRoute>
  );
}