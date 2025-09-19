'use client';

import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { DashboardHeader } from '../components/DashboardHeader';
import Link from 'next/link';
import EditDeviceModal from '../components/EditDeviceModal';
import { MapPin, Smartphone, Battery, Clock, Wifi, AlertTriangle, Map, ExternalLink, Edit3 } from 'lucide-react';
import { devicesApi, commandsApi, locationsApi, apiUtils, type Device, type Location } from '../lib/api-service';
import dynamic from 'next/dynamic';

// Importar MapView dinamicamente para evitar problemas de SSR
const MapView = dynamic(() => import('../components/MapView'), {
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

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [devices, setDevices] = useState<DeviceWithLocations[]>([]);
  const [loading, setLoading] = useState(true);
  const [locatingDevices, setLocatingDevices] = useState<Set<string>>(new Set());
  const [showMap, setShowMap] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  useEffect(() => {
    loadDevices();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDevices = async () => {
    setLoading(true);
    try {
      // Carregar dispositivos reais do Neon DB via API
      const allDevices = await devicesApi.getAll();
      
      // Filtrar por usuário se necessário (ou usar owner field)
      const userDevices = user?.email 
        ? allDevices.filter(device => device.owner === user.email || !device.owner)
        : allDevices;
      
      // Se não houver dispositivos reais, usar mock data
      if (userDevices.length === 0) {
        console.log('📱 Usando dispositivos mock para demonstração');
        setDevices(mockDevices);
      } else {
        console.log(`📱 Carregados ${userDevices.length} dispositivos do banco`);
        
        // Carregar localizações para cada dispositivo em paralelo
        const devicesWithLocations = await Promise.all(
          userDevices.map(async (device) => {
            try {
              const locations = await locationsApi.getForDevice(device.id, 10);
              return { ...device, locations };
            } catch (error) {
              console.warn(`Erro ao carregar localizações para ${device.id}:`, error);
              return { ...device, locations: [] };
            }
          })
        );
        
        setDevices(devicesWithLocations);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dispositivos:', error);
      // Em caso de erro, usar mock data como fallback
      setDevices(mockDevices);
    }
    setLoading(false);
  };

  const handleLocateDevice = async (deviceId: string) => {
    console.log(`📍 Localizando dispositivo: ${deviceId}`);
    setLocatingDevices(prev => new Set(prev).add(deviceId));
    
    try {
      // Tentar enviar comando de localização
      await commandsApi.send(deviceId, {
        type: 'LOCATE_NOW',
        payload: {}
      });
      
      // Aguardar um momento para nova localização
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Recarregar localizações do dispositivo
      const locations = await locationsApi.getForDevice(deviceId, 10);
      
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { ...device, locations }
          : device
      ));
      
      console.log(`✅ Dispositivo localizado: ${locations.length} pontos`);
    } catch (error) {
      console.error('❌ Erro ao localizar dispositivo:', error);
    } finally {
      setLocatingDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });
    }
  };

  const handleUpdateDevice = async (deviceId: string, updatedData: Partial<Device>) => {
    try {
      // Filtrar apenas campos permitidos pela API
      const allowedFields = {
        name: updatedData.name,
        owner: updatedData.owner || undefined,
        tags: updatedData.tags,
        status: updatedData.status
      };
      
      await devicesApi.update(deviceId, allowedFields);
      await loadDevices(); // Recarregar dispositivos
      setEditingDevice(null);
    } catch (error) {
      console.error('Erro ao atualizar dispositivo:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'inactive': return 'Inativo';
      default: return 'Desconhecido';
    }
  };

  const formatLastSeen = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  const getBatteryIcon = (level: number | null) => {
    if (!level) return Battery;
    if (level > 75) return Battery;
    if (level > 50) return Battery;
    if (level > 25) return Battery;
    return Battery;
  };

  const getBatteryColor = (level: number | null) => {
    if (!level) return 'text-gray-400';
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getDeviceType = (tags: string[]) => {
    if (tags.includes('wearable')) return 'Smartwatch';
    if (tags.includes('tablet')) return 'Tablet';
    return 'Smartphone';
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="w-full h-full bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
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
      <div className="w-full h-full bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex flex-col">
        <DashboardHeader />
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header do Dashboard */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Dispositivos</h1>
              <p className="text-gray-600">Gerencie e monitore todos os seus dispositivos conectados em tempo real</p>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Dispositivos Online */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Wifi className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {devices.filter(d => d.status === 'online').length}
                    </div>
                    <div className="text-sm text-gray-600">Dispositivos Online</div>
                  </div>
                </div>
              </div>

              {/* Total de Dispositivos */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{devices.length}</div>
                    <div className="text-sm text-gray-600">Total de Dispositivos</div>
                  </div>
                </div>
              </div>

              {/* Bateria Média */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Battery className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(devices.filter(d => d.battery_level).reduce((acc, d) => acc + (d.battery_level || 0), 0) / devices.filter(d => d.battery_level).length) || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Bateria Média</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-wrap gap-4 mb-8">
              <Link
                href="/devices/add"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Smartphone className="w-5 h-5 mr-2" />
                Adicionar Dispositivo
              </Link>
              
              <button
                onClick={() => setShowMap(!showMap)}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Map className="w-5 h-5 mr-2" />
                {showMap ? 'Ocultar Mapa' : 'Ver Mapa'}
              </button>
            </div>

            {/* Mapa */}
            {showMap && (
              <div className="mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Localização dos Dispositivos</h3>
                  <MapView devices={devices} />
                </div>
              </div>
            )}

            {/* Lista de Dispositivos */}
            {devices.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Nenhum dispositivo encontrado</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">Adicione dispositivos para começar a gerenciar e monitorar seus equipamentos.</p>
                <Link
                  href="/devices/add"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  Adicionar Primeiro Dispositivo
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {devices.map((device) => {
                  const BatteryIcon = getBatteryIcon(device.battery_level);
                  const isLocating = locatingDevices.has(device.id);
                  
                  return (
                    <div
                      key={device.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
                    >
                      {/* Header do Card */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Smartphone className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
                            <p className="text-sm text-gray-500">{getDeviceType(device.tags)}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                          {getStatusText(device.status)}
                        </span>
                      </div>

                      {/* Informações do Dispositivo */}
                      <div className="space-y-3 mb-6">
                        {device.battery_level && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-600">
                              <BatteryIcon className={`h-4 w-4 mr-2 ${getBatteryColor(device.battery_level)}`} />
                              <span>Bateria</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{device.battery_level}%</span>
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    device.battery_level > 50 ? 'bg-green-500' : 
                                    device.battery_level > 20 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${device.battery_level}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Última atividade</span>
                          </div>
                          <span className="font-medium">{formatLastSeen(device.last_seen_at)}</span>
                        </div>
                        
                        {device.os_version && (
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center">
                              <Smartphone className="h-4 w-4 mr-2" />
                              <span>Sistema</span>
                            </div>
                            <span className="font-medium">{device.os_version}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {device.tags.length > 0 && (
                        <div className="mb-6">
                          <div className="flex flex-wrap gap-2">
                            {device.tags.map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleLocateDevice(device.id)}
                          disabled={isLocating}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                          onClick={() => setEditingDevice(device)}
                          className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Editar
                        </button>
                        
                        <Link
                          href={`/device/${device.id}`}
                          className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Detalhes
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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
