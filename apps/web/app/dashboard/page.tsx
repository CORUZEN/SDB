'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/DashboardHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiGet } from '@/lib/api-client';
import { 
  Users, 
  Shield, 
  Activity, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Clock,
  BarChart3,
  PieChart,
  MapPin,
  ExternalLink,
  Plus,
  Download,
  Zap
} from 'lucide-react';

interface DashboardMetrics {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  complianceRate: number;
  todayCommands: number;
  successRate: number;
  criticalAlerts: number;
  pendingPolicies: number;
}

interface DeviceStatus {
  online: number;
  offline: number;
  inactive: number;
}

interface ActivityItem {
  id: string;
  type: 'command' | 'device' | 'alert' | 'policy';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface CommandStats {
  [key: string]: { count: number; successRate: number };
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalDevices: 0,
    activeDevices: 0,
    offlineDevices: 0,
    complianceRate: 0,
    todayCommands: 0,
    successRate: 0,
    criticalAlerts: 0,
    pendingPolicies: 0
  });

  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    online: 0,
    offline: 0,
    inactive: 0
  });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [commandStats, setCommandStats] = useState<CommandStats>({});

  useEffect(() => {
    // Carregar dados reais do dashboard via APIs
    const loadDashboardData = async () => {
      try {
        // Carregar dados reais via cliente API com autenticação
        const devicesResult = await apiGet('/api/devices');
        const commandsResult = await apiGet('/api/commands');
        const policiesResult = await apiGet('/api/policies');
        
        // Calcular métricas reais
        const totalDevices = devicesResult.data?.length || 0;
        const activeDevices = devicesResult.data?.filter((d: any) => d.status === 'online').length || 0;
        const offlineDevices = devicesResult.data?.filter((d: any) => d.status === 'offline').length || 0;
        const inactiveDevices = devicesResult.data?.filter((d: any) => d.status === 'inactive').length || 0;
        
        // Calcular comandos de hoje
        const today = new Date().toISOString().split('T')[0];
        const todayCommands = commandsResult.data?.filter((c: any) => 
          c.created_at?.startsWith(today)
        ).length || 0;
        
        // Calcular taxa de sucesso
        const completedCommands = commandsResult.data?.filter((c: any) => 
          c.status === 'completed'
        ).length || 0;
        const successRate = commandsResult.data?.length > 0 ? 
          Math.round((completedCommands / commandsResult.data.length) * 100) : 0;
        
        // Calcular taxa de conformidade (dispositivos com políticas aplicadas)
        const devicesWithPolicies = devicesResult.data?.filter((d: any) => 
          d.policy_id
        ).length || 0;
        const complianceRate = totalDevices > 0 ? 
          Math.round((devicesWithPolicies / totalDevices) * 100) : 0;
        
        setMetrics({
          totalDevices,
          activeDevices,
          offlineDevices,
          complianceRate,
          todayCommands,
          successRate,
          criticalAlerts: 0, // TODO: Implementar alertas
          pendingPolicies: policiesResult.data?.filter((p: any) => !p.is_active).length || 0
        });

        setDeviceStatus({
          online: activeDevices,
          offline: offlineDevices,
          inactive: inactiveDevices
        });

        // Carregar atividade recente real
        const eventsResult = await apiGet('/api/events?limit=5');
        
        const recentEvents = eventsResult.data?.map((event: any) => ({
          id: event.id,
          type: event.event_type || 'info',
          title: event.event_name || 'Evento',
          description: event.description || 'Sem descrição',
          timestamp: event.created_at || new Date().toISOString(),
          status: event.severity === 'critical' ? 'error' : 
                 event.severity === 'warning' ? 'warning' : 'success'
        })) || [];

        setRecentActivity(recentEvents);
        
        // Calcular estatísticas de comandos por tipo
        const cmdStats: CommandStats = {};
        if (commandsResult.data) {
          commandsResult.data.forEach((cmd: any) => {
            const type = cmd.command_type || 'OTHER';
            if (!cmdStats[type]) {
              cmdStats[type] = { count: 0, successRate: 0 };
            }
            cmdStats[type].count++;
          });
          
          // Calcular taxa de sucesso por tipo
          Object.keys(cmdStats).forEach(type => {
            const typeCommands = commandsResult.data.filter((cmd: any) => cmd.command_type === type);
            const successCommands = typeCommands.filter((cmd: any) => cmd.status === 'completed');
            cmdStats[type].successRate = typeCommands.length > 0 ? 
              Math.round((successCommands.length / typeCommands.length) * 100) : 0;
          });
        }
        
        setCommandStats(cmdStats);
        
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        // Fallback para evitar tela em branco
        setMetrics({
          totalDevices: 0,
          activeDevices: 0,
          offlineDevices: 0,
          complianceRate: 0,
          todayCommands: 0,
          successRate: 0,
          criticalAlerts: 0,
          pendingPolicies: 0
        });
      }
    };

    loadDashboardData();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Título e Resumo Executivo */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Executivo</h1>
            <p className="text-lg text-gray-600">
              Visão geral estratégica da sua infraestrutura de dispositivos móveis
            </p>
          </div>

          {/* Cards de Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total de Dispositivos */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Total de Dispositivos
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {metrics.totalDevices}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600">
                      Sistema ativo
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Smartphone className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Dispositivos Ativos */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Dispositivos Ativos
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {metrics.activeDevices}
                  </p>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600">
                      {Math.round((metrics.activeDevices / metrics.totalDevices) * 100)}% online
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Taxa de Conformidade */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Taxa de Conformidade
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {metrics.complianceRate}%
                  </p>
                  <div className="flex items-center mt-2">
                    <Shield className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-sm font-medium text-blue-600">
                      Políticas ativas
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Comandos Hoje */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Comandos Hoje
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {metrics.todayCommands}
                  </p>
                  <div className="flex items-center mt-2">
                    <Clock className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm font-medium text-orange-600">
                      {metrics.successRate}% sucesso
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos e Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Status dos Dispositivos - Gráfico de Pizza */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Status dos Dispositivos</h3>
                <PieChart className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-40 h-40">
                  {/* Gráfico de Pizza Simples */}
                  <div className="w-full h-full rounded-full bg-gradient-to-r from-green-400 to-blue-500 relative overflow-hidden">
                    <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{metrics.totalDevices}</div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">Online</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{deviceStatus.online}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">Offline</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{deviceStatus.offline}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">Inativo</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{deviceStatus.inactive}</span>
                </div>
              </div>
            </div>

            {/* Atividade de Comandos - Gráfico de Barras */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Atividade de Comandos</h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {/* Barras de atividade baseadas em dados reais */}
                {Object.entries(commandStats).slice(0, 4).map(([type, stats]) => (
                  <div key={type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{type}</span>
                      <span className="font-medium">{stats.successRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          type === 'PING' ? 'bg-blue-600' :
                          type === 'LOCATE' ? 'bg-green-600' :
                          type === 'POLICY_APPLY' ? 'bg-purple-600' :
                          'bg-orange-600'
                        }`}
                        style={{ width: `${stats.successRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                
                {Object.keys(commandStats).length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Nenhum comando encontrado</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Taxa de sucesso média: <span className="font-medium text-gray-900">{metrics.successRate}%</span>
                </p>
              </div>
            </div>
          </div>

          {/* Seção Inferior - Alertas e Atividade Recente */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Alertas Críticos */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Alertas Críticos</h3>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              
              {metrics.criticalAlerts > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-red-900">Bateria Crítica</p>
                      <p className="text-xs text-red-700">2 dispositivos com menos de 15%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Dispositivo Offline</p>
                      <p className="text-xs text-yellow-700">Tablet Trabalho há 2 horas</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">Nenhum alerta crítico</p>
                  <p className="text-xs text-gray-500">Todos os sistemas funcionando normalmente</p>
                </div>
              )}
            </div>

            {/* Atividade Recente */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Atividade Recente</h3>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      activity.status === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTimestamp(activity.timestamp)}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'success' ? 'bg-green-100 text-green-800' :
                      activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      activity.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {activity.type}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Link 
                  href="/devices" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
                >
                  Ver todos os dispositivos
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Ações Rápidas</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/devices/add"
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 group"
              >
                <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                  Adicionar Dispositivo
                </span>
              </Link>
              
              <Link
                href="/policies/add"
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors duration-200 group"
              >
                <Shield className="w-8 h-8 text-gray-400 group-hover:text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">
                  Nova Política
                </span>
              </Link>
              
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors duration-200 group">
                <Download className="w-8 h-8 text-gray-400 group-hover:text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">
                  Exportar Relatório
                </span>
              </button>
              
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors duration-200 group">
                <Zap className="w-8 h-8 text-gray-400 group-hover:text-orange-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">
                  Comando Global
                </span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}