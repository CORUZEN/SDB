'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import ProtectedRoute from '../../components/ProtectedRoute';
import { DashboardHeader } from '../../components/DashboardHeader';
import EditDeviceModal from '../../components/EditDeviceModal';
import { MapPin, Smartphone, Battery, Clock, Wifi, AlertTriangle, Map, ExternalLink, Edit3 } from 'lucide-react';
import { devicesApi, commandsApi, locationsApi, apiUtils, type Device, type Location } from '../../lib/api-service';
import dynamic from 'next/dynamic';

// Importar MapView dinamicamente para evitar problemas de SSR
const MapView = dynamic(() => import('../../components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando mapa...</p>
      </div>
    </div>
  )
});

// Tipo extendido do Device para incluir localizações
interface DeviceWithLocations extends Device {
  locations?: Location[];
}
// Mock data para desenvolvimento/fallback (usando types do API service)
const mockDevices: DeviceWithLocations[] = [
  {
    id: 'mock-001',
    name: 'Smartphone Principal',
    fcm_token: null,
    status: 'online',
    owner: 'admin',
    tags: ['pessoal', 'principal'],
    last_seen_at: new Date().toISOString(),
    battery_level: 85,
    os_version: 'iOS 16.5',
    ssid: null,
    app_in_foreground: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-002',
    name: 'Tablet Trabalho',
    fcm_token: null,
    status: 'offline',
    owner: 'admin',
    tags: ['trabalho'],
    last_seen_at: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
    battery_level: 42,
    os_version: 'iPadOS 16.5',
    ssid: null,
    app_in_foreground: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-003',
    name: 'Smartwatch',
    fcm_token: null,
    status: 'online',
    owner: 'admin',
    tags: ['wearable'],
    last_seen_at: new Date(Date.now() - 30000).toISOString(), // 30 segundos atrás
    battery_level: 67,
    os_version: 'watchOS 9.4',
    ssid: null,
    app_in_foreground: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<DeviceWithLocations[]>([]);
  const [loading, setLoading] = useState(true);
  const [locatingDevices, setLocatingDevices] = useState<Set<string>>(new Set());
  const [showMap, setShowMap] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar dispositivos reais do Neon DB via API
      const allDevices = await devicesApi.getAll();
      
      // Filtrar por usuário se necessário (ou usar owner field)
      const userDevices = user?.email 
        ? allDevices.filter(device => device.owner === user.email || !device.owner)
        : allDevices;
      
      // Carregar localizações para cada dispositivo
      const devicesWithLocations: DeviceWithLocations[] = await Promise.all(
        userDevices.map(async (device) => {
          try {
            const locations = await locationsApi.getForDevice(device.id, 10);
            return { ...device, locations };
          } catch (error) {
            console.error(`Erro ao carregar localizações do dispositivo ${device.id}:`, error);
            return { ...device, locations: [] };
          }
        })
      );
      
      setDevices(devicesWithLocations.length > 0 ? devicesWithLocations : mockDevices);
      console.log(`📱 Carregados ${devicesWithLocations.length > 0 ? devicesWithLocations.length : mockDevices.length} dispositivos`);
    } catch (error) {
      console.error('Erro ao carregar dispositivos:', error);
      // Fallback para dados mockados em caso de erro
      setDevices(mockDevices);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadDevices();
  }, [user, loadDevices]);

  const handleLocateDevice = async (deviceId: string) => {
    if (!user) {
      console.error('Usuário não autenticado');
      return;
    }

    // Adicionar à lista de dispositivos sendo localizados
    setLocatingDevices(prev => new Set(prev).add(deviceId));
    
    // Atualizar status local imediatamente
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, status: 'online' as const }
        : device
    ));

    try {
      console.log(`📡 Enviando comando de localização para dispositivo: ${deviceId}`);
      console.log(`👤 Usuário autenticado:`, { email: user.email, uid: user.uid });
      
      // Validar se deviceId é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(deviceId)) {
        throw new Error(`ID do dispositivo inválido: ${deviceId}`);
      }
      
      // Enviar comando LOCATE_NOW real via API
      const command = await commandsApi.send(deviceId, {
        type: 'LOCATE_NOW',
        payload: {
          timestamp: new Date().toISOString(),
          requested_by: user.email || user.uid
        }
      });

      if (command && command.id) {
        console.log(`✅ Comando de localização enviado com sucesso:`, command.id);
        
        // Simular atualização de status do dispositivo (em produção seria real-time)
        setTimeout(async () => {
          try {
            console.log(`🔄 Atualizando status do dispositivo: ${deviceId}`);
            
            // Atualizar status do dispositivo para online
            await devicesApi.report(deviceId, {
              status: 'online',
              battery_level: Math.floor(Math.random() * 100),
            });
            
            console.log(`✅ Status do dispositivo atualizado: ${deviceId}`);
            
            // Recarregar dispositivos para obter dados atualizados
            await loadDevices();
            
          } catch (reportError) {
            console.error('Erro ao atualizar dispositivo:', reportError);
            // Falha silenciosa - não é crítico
          } finally {
            setLocatingDevices(prev => {
              const newSet = new Set(prev);
              newSet.delete(deviceId);
              return newSet;
            });
          }
        }, 3000);
      } else {
        throw new Error('Comando retornado inválido');
      }

    } catch (error) {
      console.error('❌ Erro ao enviar comando de localização:', error);
      
      // Mostrar notificação de erro ao usuário
      alert(`Erro ao localizar dispositivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      // Reverter status em caso de erro
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { ...device, status: 'offline' as const }
          : device
      ));
      
      setLocatingDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });
    }
  };

  const handleUpdateDevice = async (deviceId: string, updates: {
    name?: string;
    owner?: string;
    tags?: string[];
    status?: Device['status'];
  }) => {
    try {
      // Atualizar via API
      const updatedDevice = await devicesApi.update(deviceId, updates);
      
      // Atualizar estado local
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { ...device, ...updatedDevice }
          : device
      ));

      console.log('✅ Dispositivo atualizado com sucesso:', updatedDevice);
    } catch (error) {
      console.error('❌ Erro ao atualizar dispositivo:', error);
      throw error; // Re-throw para que o modal possa tratar o erro
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
        return <Wifi className="w-3 h-3" />;
      case 'offline':
        return <AlertTriangle className="w-3 h-3" />;
      case 'inactive':
        return <MapPin className="w-3 h-3" />;
      default:
        return <Smartphone className="w-3 h-3" />;
    }
  };

  const getDeviceIcon = () => {
    return <Smartphone className="w-6 h-6" />;
  };

  const getDeviceType = (tags: string[]) => {
    if (tags.includes('wearable')) return 'Smartwatch';
    if (tags.includes('tablet')) return 'Tablet';
    return 'Smartphone';
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <DashboardHeader />
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-blue-400 animate-spin animation-delay-75 mx-auto"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Carregando dispositivos...</h3>
              <p className="text-gray-600">Aguarde enquanto buscamos seus dispositivos</p>
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
        
        <main className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="h-full">
            {/* Header Section with improved design */}
            <div className="mb-6 sm:mb-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-6 lg:mb-0">
                  <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                    Meus Dispositivos
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
                    Gerencie e monitore todos os seus dispositivos conectados em tempo real
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/devices/add"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                  >
                    <Smartphone className="w-5 h-5 mr-2" />
                    Adicionar Dispositivo
                  </Link>
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                  >
                    <Map className="w-5 h-5 mr-2" />
                    {showMap ? 'Ocultar Mapa' : 'Ver Mapa'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-900/5 border border-white/50 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Wifi className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Dispositivos Online</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {devices.filter(d => d.status === 'online').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-900/5 border border-white/50 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Dispositivos</p>
                    <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-900/5 border border-white/50 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <Battery className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Bateria Média</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {devices.length > 0 ? Math.round(devices.reduce((acc, d) => acc + (d.battery_level || 0), 0) / devices.length) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Section with improved design */}
            {showMap && (
              <div className="mb-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-900/5 border border-white/50 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Localização dos Dispositivos
                    </h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      Atualizado em tempo real
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden">
                    <MapView 
                      devices={devices}
                      height="500px"
                      onLocationClick={(location, device) => {
                        console.log('Clicou na localização:', location, device);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Devices Section with improved cards */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Lista de Dispositivos</h3>
                <div className="text-sm text-gray-500">
                  {devices.length} dispositivo{devices.length !== 1 ? 's' : ''} encontrado{devices.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : devices.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-900/5 border border-white/50 p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Smartphone className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Nenhum dispositivo encontrado
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Você ainda não possui dispositivos cadastrados. Adicione seu primeiro dispositivo para começar.
                  </p>
                  <Link
                    href="/devices/add"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                  >
                    <Smartphone className="w-5 h-5 mr-2" />
                    Adicionar Primeiro Dispositivo
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {devices.map((device) => (
                    <div key={device.id} className="group">
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-900/5 border border-white/50 p-6 hover:shadow-2xl hover:shadow-gray-900/10 transition-all duration-300 hover:-translate-y-1">
                        {/* Device Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              device.status === 'online' 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                : 'bg-gradient-to-r from-gray-400 to-gray-500'
                            }`}>
                              <Smartphone className="w-6 h-6 text-white" />
                            </div>
                            <div className="ml-3">
                              <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {device.name}
                              </h4>
                              <div className="flex items-center mt-1">
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                  device.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                }`}></div>
                                <span className={`text-sm font-medium ${
                                  device.status === 'online' ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                  {device.status === 'online' ? 'Online' : 'Offline'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Device Info */}
                        <div className="space-y-3 mb-6">
                          {device.os_version && (
                            <div className="flex items-center text-sm">
                              <Smartphone className="w-4 h-4 text-gray-400 mr-3" />
                              <span className="text-gray-600">Sistema:</span>
                              <span className="ml-2 font-medium text-gray-900">{device.os_version}</span>
                            </div>
                          )}
                          
                          {device.battery_level && (
                            <div className="flex items-center text-sm">
                              <Battery className="w-4 h-4 text-gray-400 mr-3" />
                              <span className="text-gray-600">Bateria:</span>
                              <div className="ml-2 flex items-center">
                                <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      device.battery_level > 50 ? 'bg-green-500' :
                                      device.battery_level > 20 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{width: `${device.battery_level}%`}}
                                  ></div>
                                </div>
                                <span className="font-medium text-gray-900">{device.battery_level}%</span>
                              </div>
                            </div>
                          )}

                          {device.last_seen_at && (
                            <div className="flex items-center text-sm">
                              <Clock className="w-4 h-4 text-gray-400 mr-3" />
                              <span className="text-gray-600">Última atividade:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {apiUtils.timeAgo(device.last_seen_at)}
                              </span>
                            </div>
                          )}

                          {device.locations && device.locations.length > 0 && (
                            <div className="flex items-center text-sm">
                              <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                              <span className="text-gray-600">Localização disponível</span>
                              <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleLocateDevice(device.id)}
                            disabled={locatingDevices.has(device.id)}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-blue-500/25 hover:shadow-blue-500/40"
                          >
                            {locatingDevices.has(device.id) ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Localizando...
                              </>
                            ) : (
                              <>
                                <MapPin className="w-4 h-4 mr-2" />
                                Localizar
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => setEditingDevice(device)}
                            className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-md hover:shadow-lg"
                            title="Editar dispositivo"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Editar
                          </button>
                          
                          <Link 
                            href={`/device/${device.id}`}
                            className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
                            title="Ver detalhes"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Edição */}
      {editingDevice && (
        <EditDeviceModal
          device={editingDevice}
          isOpen={!!editingDevice}
          onClose={() => setEditingDevice(null)}
          onSave={handleUpdateDevice}
        />
      )}
    </ProtectedRoute>
  );
}