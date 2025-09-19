'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { DashboardHeader } from '../../../components/DashboardHeader';
import { 
  ArrowLeft, 
  MapPin, 
  Smartphone, 
  Battery, 
  Clock, 
  Wifi, 
  AlertTriangle,
  Activity,
  Terminal,
  History,
  Settings
} from 'lucide-react';
import { devicesApi, commandsApi, locationsApi, apiUtils, type Device, type Location, type Command } from '../../../lib/api-service';
import dynamic from 'next/dynamic';

// Importar MapView dinamicamente
const MapView = dynamic(() => import('../../../components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 text-sm">Carregando mapa...</p>
      </div>
    </div>
  )
});

type TabType = 'overview' | 'locations' | 'commands' | 'settings';

export default function DevicePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const deviceId = params.id as string;

  const [device, setDevice] = useState<Device | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sendingCommand, setSendingCommand] = useState(false);

  const loadDeviceData = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar dados do dispositivo
      const deviceData = await devicesApi.getById(deviceId);
      if (!deviceData) {
        router.push('/dashboard');
        return;
      }
      setDevice(deviceData);

      // Carregar localizações
      const locationsData = await locationsApi.getForDevice(deviceId, 20);
      setLocations(locationsData);

      // Carregar comandos
      const commandsData = await commandsApi.getForDevice(deviceId, 20);
      setCommands(commandsData);

    } catch (error) {
      console.error('Erro ao carregar dados do dispositivo:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [deviceId, router]);

  useEffect(() => {
    if (deviceId) {
      loadDeviceData();
    }
  }, [deviceId, loadDeviceData]);

  const handleSendCommand = async (commandType: Command['type']) => {
    if (!device || !user) return;

    setSendingCommand(true);
    try {
      const command = await commandsApi.send(device.id, {
        type: commandType,
        payload: {
          timestamp: new Date().toISOString(),
          requested_by: user.email || user.uid
        }
      });

      // Atualizar lista de comandos
      setCommands(prev => [command, ...prev]);
      
      console.log(`📡 Comando ${commandType} enviado:`, command.id);
    } catch (error) {
      console.error('Erro ao enviar comando:', error);
    } finally {
      setSendingCommand(false);
    }
  };

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      case 'inactive':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-4 h-4" />;
      case 'offline':
        return <AlertTriangle className="w-4 h-4" />;
      case 'inactive':
        return <Clock className="w-4 h-4" />;
      default:
        return <Smartphone className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <DashboardHeader />
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dispositivo...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!device) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <DashboardHeader />
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Dispositivo não encontrado
              </h3>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-500"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="mr-4 p-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{device.name}</h1>
                  <div className="flex items-center mt-2">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                      {getStatusIcon(device.status)}
                      <span className="ml-1 capitalize">{device.status}</span>
                    </div>
                    <span className="ml-4 text-sm text-gray-500">
                      Última atividade: {device.last_seen_at ? apiUtils.timeAgo(device.last_seen_at) : 'Nunca'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'overview', name: 'Visão Geral', icon: Activity },
                    { id: 'locations', name: 'Localizações', icon: MapPin },
                    { id: 'commands', name: 'Comandos', icon: Terminal },
                    { id: 'settings', name: 'Configurações', icon: Settings },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <tab.icon className="w-4 h-4 mr-2" />
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info Cards */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Device Info */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Informações do Dispositivo
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Bateria</p>
                        <div className="flex items-center mt-1">
                          <Battery className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-900">{device.battery_level || 0}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">SO</p>
                        <p className="text-sm text-gray-900 mt-1">{device.os_version || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Proprietário</p>
                        <p className="text-sm text-gray-900 mt-1">{device.owner || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tags</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {device.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Ações Rápidas
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleSendCommand('LOCATE_NOW')}
                        disabled={sendingCommand}
                        className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        {sendingCommand ? 'Enviando...' : 'Localizar'}
                      </button>
                      <button
                        onClick={() => handleSendCommand('PING')}
                        disabled={sendingCommand}
                        className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Wifi className="w-4 h-4 mr-2" />
                        Ping
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Locations */}
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Últimas Localizações
                    </h3>
                    {locations.length > 0 ? (
                      <div className="space-y-3">
                        {locations.slice(0, 5).map((location) => (
                          <div key={location.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {apiUtils.timeAgo(location.captured_at)}
                                {location.accuracy && ` • ${location.accuracy}m`}
                              </p>
                            </div>
                            <MapPin className="w-4 h-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhuma localização encontrada</p>
                    )}
                  </div>

                  {/* Recent Commands */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Comandos Recentes
                    </h3>
                    {commands.length > 0 ? (
                      <div className="space-y-3">
                        {commands.slice(0, 5).map((command) => (
                          <div key={command.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{command.type}</p>
                              <p className="text-xs text-gray-500">
                                {apiUtils.timeAgo(command.created_at)} • {apiUtils.translateStatus(command.status)}
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${apiUtils.getStatusColor(command.status)}`}>
                              {apiUtils.translateStatus(command.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhum comando encontrado</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'locations' && (
              <div className="space-y-6">
                {/* Map */}
                {locations.length > 0 && (
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Mapa de Localizações
                    </h3>
                    <MapView 
                      devices={[{ ...device, locations }]}
                      height="400px"
                    />
                  </div>
                )}

                {/* Locations List */}
                <div className="bg-white rounded-lg shadow border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Histórico de Localizações
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {locations.length > 0 ? (
                      locations.map((location) => (
                        <div key={location.id} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                              </p>
                              <div className="flex items-center mt-1 text-sm text-gray-500 space-x-4">
                                <span>{apiUtils.formatDate(location.captured_at)}</span>
                                {location.accuracy && <span>Precisão: {location.accuracy}m</span>}
                                <span className="capitalize">Fonte: {location.source}</span>
                              </div>
                            </div>
                            <MapPin className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center">
                        <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Nenhuma localização encontrada
                        </h3>
                        <p className="text-gray-600">
                          Este dispositivo ainda não reportou sua localização
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'commands' && (
              <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Histórico de Comandos
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {commands.length > 0 ? (
                    commands.map((command) => (
                      <div key={command.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{command.type}</p>
                            <div className="flex items-center mt-1 text-sm text-gray-500 space-x-4">
                              <span>{apiUtils.formatDate(command.created_at)}</span>
                              {command.sent_at && <span>Enviado: {apiUtils.formatDate(command.sent_at)}</span>}
                              {command.executed_at && <span>Executado: {apiUtils.formatDate(command.executed_at)}</span>}
                            </div>
                            {command.error_message && (
                              <p className="text-sm text-red-600 mt-1">{command.error_message}</p>
                            )}
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${apiUtils.getStatusColor(command.status)}`}>
                            {apiUtils.translateStatus(command.status)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-8 text-center">
                      <Terminal className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum comando encontrado
                      </h3>
                      <p className="text-gray-600">
                        Ainda não foram enviados comandos para este dispositivo
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Configurações do Dispositivo
                </h3>
                <p className="text-gray-600">
                  Configurações avançadas em desenvolvimento...
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}