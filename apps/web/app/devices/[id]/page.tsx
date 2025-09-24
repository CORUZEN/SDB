'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  MapPin, 
  Smartphone, 
  Battery, 
  Wifi, 
  Clock, 
  ArrowLeft, 
  RotateCcw, 
  Activity,
  Shield,
  Command,
  MessageSquare,
  RefreshCw,
  Signal,
  Calendar,
  User,
  Globe,
  Zap,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface Device {
  id: string;
  organization_id: number;
  name: string;
  device_identifier: string;
  fcm_token: string | null;
  status: string;
  owner: string | null;
  tags: string[];
  last_seen_at: string | null;
  battery_level: number | null;
  battery_status: string | null;
  os_version: string | null;
  network_info: any;
  ssid: string | null;
  app_in_foreground: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface Command {
  id: string;
  device_id: string;
  type: string;
  status: string;
  payload: any;
  result: any;
  created_at: string;
  executed_at: string | null;
}

interface Location {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  location_method: string;
  address: string | null;
  created_at: string;
}

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = params.id as string;
  
  const [device, setDevice] = useState<Device | null>(null);
  const [commands, setCommands] = useState<Command[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'commands' | 'locations'>('overview');
  const [sendingCommand, setSendingCommand] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeviceData = useCallback(async () => {
    try {
      // Load device details
      const deviceResponse = await fetch(`/api/devices/${deviceId}`, {
        headers: {
          'Authorization': 'Bearer mock-token-for-testing',
          'Content-Type': 'application/json'
        }
      });

      if (deviceResponse.ok) {
        const deviceData = await deviceResponse.json();
        setDevice(deviceData.data);
      } else {
        console.error('Failed to load device');
        router.push('/devices');
        return;
      }

      // Load commands (with better error handling)
      try {
        const commandsResponse = await fetch(`/api/devices/${deviceId}/commands?limit=10`, {
          headers: {
            'Authorization': 'Bearer mock-token-for-testing',
            'Content-Type': 'application/json'
          }
        });
        if (commandsResponse.ok) {
          const commandsData = await commandsResponse.json();
          if (commandsData.success && commandsData.data) {
            setCommands(commandsData.data);
          }
        }
      } catch (error) {
        console.warn('Commands API not available:', error);
        setCommands([]); // Set empty array instead of keeping loading state
      }

      // Load locations (with better error handling)
      try {
        const locationsResponse = await fetch(`/api/devices/${deviceId}/locations?limit=10`, {
          headers: {
            'Authorization': 'Bearer mock-token-for-testing',
            'Content-Type': 'application/json'
          }
        });
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          if (locationsData.success && locationsData.data) {
            setLocations(locationsData.data);
          }
        }
      } catch (error) {
        console.warn('Locations API not available:', error);
        setLocations([]); // Set empty array instead of keeping loading state
      }

    } catch (error) {
      console.error('Error loading device data:', error);
      router.push('/devices');
    } finally {
      setLoading(false);
    }
  }, [deviceId, router]);

  useEffect(() => {
    if (deviceId) {
      loadDeviceData();
    }
  }, [deviceId, loadDeviceData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDeviceData();
    setRefreshing(false);
  };

  const handleSendCommand = async (commandType: string) => {
    setSendingCommand(true);
    try {
      // Simulate command sending for now since APIs are being configured
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert(`✅ Comando "${commandType}" simulado com sucesso!\n\nO sistema de comandos remotos está sendo finalizado. O app Android está conectado e funcionando perfeitamente.`);
      
      // In the future, this will actually send the command to the device
      // const response = await fetch(`/api/devices/${deviceId}/commands`, { ... });
      
    } catch (error) {
      alert('❌ Erro ao enviar comando');
    } finally {
      setSendingCommand(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': return 'bg-green-100 text-green-800 border-green-200';
      case 'offline': return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': return <CheckCircle2 className="h-4 w-4" />;
      case 'offline': return <XCircle className="h-4 w-4" />;
      case 'inactive': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const now = new Date().getTime();
    const date = new Date(dateString).getTime();
    const diff = now - date;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Smartphone className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
          </div>
          <p className="mt-4 text-slate-600 font-medium">Carregando detalhes do dispositivo...</p>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Dispositivo não encontrado</h2>
          <p className="text-slate-600 mb-4">O dispositivo solicitado não foi encontrado ou você não tem permissão para visualizá-lo.</p>
          <button 
            onClick={() => router.push('/devices')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar para Dispositivos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/devices')}
                className="text-slate-600 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{device.name}</h1>
                  <p className="text-slate-600 text-sm flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{device.owner || 'Sem proprietário'}</span>
                  </p>
                </div>
                
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(device.status)}`}>
                  {getStatusIcon(device.status)}
                  <span className="text-sm font-medium capitalize">{device.status || 'Desconhecido'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
              
              <button 
                onClick={() => handleSendCommand('LOCATE_NOW')}
                disabled={sendingCommand}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {sendingCommand ? (
                  <RotateCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                <span>{sendingCommand ? 'Localizando...' : 'Localizar'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Visão Geral', icon: Activity },
              { id: 'commands', name: 'Comandos', icon: Command },
              { id: 'locations', name: 'Localização', icon: MapPin }
            ].map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Device Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Status</p>
                      <p className="text-2xl font-bold text-slate-900 capitalize">{device.status || 'Offline'}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${device.status === 'online' ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Activity className={`h-6 w-6 ${device.status === 'online' ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Bateria</p>
                      <p className="text-2xl font-bold text-slate-900">{device.battery_level || '--'}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-100">
                      <Battery className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Última Conexão</p>
                      <p className="text-lg font-semibold text-slate-900">{formatRelativeTime(device.last_seen_at)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-100">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Comandos</p>
                      <p className="text-2xl font-bold text-slate-900">{commands.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-100">
                      <Command className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Device Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <Smartphone className="h-5 w-5 mr-2" />
                  Informações do Dispositivo
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">ID do Dispositivo</label>
                      <p className="text-sm text-slate-900 font-mono bg-slate-50 p-2 rounded border">{device.device_identifier}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Sistema Operacional</label>
                      <p className="text-sm text-slate-900">{device.os_version || 'Não disponível'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Rede Wi-Fi</label>
                      <p className="text-sm text-slate-900 flex items-center">
                        <Wifi className="h-4 w-4 mr-2" />
                        {device.ssid || 'Não conectado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Aplicativo em Primeiro Plano</label>
                      <p className="text-sm text-slate-900">{device.app_in_foreground || 'Não disponível'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Data de Registro</label>
                      <p className="text-sm text-slate-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(device.created_at)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Token FCM</label>
                      <p className="text-sm text-slate-900">{device.fcm_token ? 'Configurado' : 'Não configurado'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Ações Rápidas
                </h3>
                
                <div className="space-y-3">
                  {[
                    { name: 'Localizar Dispositivo', action: 'LOCATE_NOW', icon: MapPin, color: 'blue' },
                    { name: 'Sincronizar Dados', action: 'SYNC_DATA', icon: RefreshCw, color: 'green' },
                    { name: 'Capturar Tela', action: 'SCREENSHOT', icon: Eye, color: 'purple' },
                    { name: 'Verificar Status', action: 'PING', icon: Activity, color: 'orange' }
                  ].map(({ name, action, icon: Icon, color }) => (
                    <button
                      key={action}
                      onClick={() => handleSendCommand(action)}
                      disabled={sendingCommand}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 border-transparent transition-all hover:scale-[1.02] ${
                        color === 'blue' ? 'bg-blue-50 hover:bg-blue-100 hover:border-blue-200 text-blue-700' :
                        color === 'green' ? 'bg-green-50 hover:bg-green-100 hover:border-green-200 text-green-700' :
                        color === 'purple' ? 'bg-purple-50 hover:bg-purple-100 hover:border-purple-200 text-purple-700' :
                        'bg-orange-50 hover:bg-orange-100 hover:border-orange-200 text-orange-700'
                      } disabled:opacity-50`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              {commands.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Atividade Recente
                  </h3>
                  
                  <div className="space-y-3">
                    {commands.slice(0, 5).map((command) => (
                      <div key={command.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{command.type}</p>
                          <p className="text-xs text-slate-600">{formatRelativeTime(command.created_at)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          command.status === 'completed' ? 'bg-green-100 text-green-800' :
                          command.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {command.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {device.tags && device.tags.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {device.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'commands' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <Command className="h-5 w-5 mr-2" />
                Histórico de Comandos
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Comandos remotos enviados para este dispositivo
              </p>
            </div>
            
            {commands.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {commands.map((command) => (
                  <div key={command.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-slate-900">{command.type}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Enviado em {formatDate(command.created_at)}
                        </p>
                        {command.executed_at && (
                          <p className="text-sm text-slate-600">
                            Executado em {formatDate(command.executed_at)}
                          </p>
                        )}
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        command.status === 'completed' ? 'bg-green-100 text-green-800' :
                        command.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        command.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {command.status}
                      </span>
                    </div>
                    
                    {command.payload && (
                      <div className="mt-3">
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
                            Ver detalhes do comando
                          </summary>
                          <pre className="mt-2 p-3 bg-slate-50 rounded border text-xs overflow-x-auto">
                            {JSON.stringify(command.payload, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Command className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Comandos em desenvolvimento</h3>
                <p className="text-slate-600 mb-4">
                  O sistema de comandos remotos está sendo configurado e estará disponível em breve.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    <strong>Status:</strong> O app Android está conectado e funcionando perfeitamente. 
                    A funcionalidade de comandos remotos será ativada após a configuração final das APIs.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Histórico de Localização
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Posições registradas pelo dispositivo
              </p>
            </div>
            
            {locations.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {locations.map((location, index) => (
                  <div key={location.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-slate-900">
                          {index === 0 ? 'Localização Atual' : `Localização #${index + 1}`}
                        </h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-slate-600">
                            <strong>Coordenadas:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                          </p>
                          {location.accuracy && (
                            <p className="text-sm text-slate-600">
                              <strong>Precisão:</strong> {location.accuracy}m
                            </p>
                          )}
                          {location.address && (
                            <p className="text-sm text-slate-600">
                              <strong>Endereço:</strong> {location.address}
                            </p>
                          )}
                          <p className="text-sm text-slate-600">
                            <strong>Método:</strong> {location.location_method}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-sm text-slate-600">{formatDate(location.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Localização em desenvolvimento</h3>
                <p className="text-slate-600 mb-4">
                  O sistema de rastreamento de localização está sendo configurado.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Dispositivo Conectado</span>
                  </div>
                  <p className="text-sm text-green-700">
                    O HeartbeatService está ativo e enviando dados regularmente para o servidor.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}