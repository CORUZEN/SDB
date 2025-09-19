'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Smartphone, Battery, Wifi, Clock, ArrowLeft, RotateCcw } from 'lucide-react';
import dynamic from 'next/dynamic';

// Importação dinâmica do mapa para evitar problemas de SSR
const DeviceMap = dynamic(() => import('../../../components/DeviceMap'), { 
  ssr: false,
  loading: () => <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
});

interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'inactive';
  owner: string | null;
  tags: string[];
  last_seen_at: string | null;
  battery_level: number | null;
  os_version: string | null;
  ssid: string | null;
  app_in_foreground: string | null;
  created_at: string;
  updated_at: string;
}

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  captured_at: string;
  source: string;
}

interface Command {
  id: string;
  type: string;
  status: string;
  created_at: string;
}

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = params.id as string;
  
  const [device, setDevice] = useState<Device | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeviceData = useCallback(async () => {
    try {
      const response = await fetch(`/api/devices?search=${deviceId}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const foundDevice = data.data.find((d: Device) => d.id === deviceId);
        if (foundDevice) {
          setDevice(foundDevice);
        } else {
          setError('Dispositivo não encontrado');
        }
      } else {
        setError('Dispositivo não encontrado');
      }
    } catch (err) {
      setError('Erro ao carregar dispositivo');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/location?limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setLocations(data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar localizações:', err);
    }
  }, [deviceId]);

  useEffect(() => {
    if (deviceId) {
      fetchDeviceData();
      fetchLocations();
    }
  }, [deviceId, fetchDeviceData, fetchLocations]);

  const handleLocateDevice = async () => {
    setLocating(true);
    try {
      // Criar comando de localização
      const response = await fetch('/api/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: deviceId,
          type: 'LOCATE_NOW',
          payload: {
            priority: 'high',
            timeout: 30
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Simular delay para comando ser executado
        // Em produção, aqui seria um polling ou WebSocket
        setTimeout(() => {
          fetchLocations();
          setLocating(false);
          // Mostrar notificação de sucesso
          alert('Comando de localização enviado! A localização aparecerá no mapa quando o dispositivo responder.');
        }, 2000);
      } else {
        setLocating(false);
        alert('Erro ao enviar comando de localização: ' + data.error);
      }
    } catch (err) {
      setLocating(false);
      alert('Erro de conexão');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dispositivo...</p>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/devices" className="btn-primary">
            Voltar para Dispositivos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <a href="/devices" className="text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-6 w-6" />
              </a>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{device.name}</h1>
                <p className="text-sm text-gray-600">{device.owner}</p>
              </div>
              <span className={`ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(device.status)}`}>
                {getStatusText(device.status)}
              </span>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={handleLocateDevice}
                disabled={locating}
                className="btn-primary flex items-center"
              >
                {locating ? (
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                {locating ? 'Localizando...' : 'Localizar Agora'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Mapa */}
            <div className="lg:col-span-2">
              <div className="card p-0">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Localização</h3>
                  <p className="text-sm text-gray-600">
                    {locations.length > 0 
                      ? `Última atualização: ${formatDate(locations[0].captured_at)}`
                      : 'Nenhuma localização registrada'
                    }
                  </p>
                </div>
                <div className="h-96">
                  <DeviceMap 
                    deviceId={device.id}
                    deviceName={device.name}
                    locations={locations}
                    className="h-full"
                  />
                </div>
              </div>
            </div>

            {/* Info Sidebar */}
            <div className="space-y-6">
              
              {/* Device Info */}
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações</h3>
                <div className="space-y-4">
                  
                  {device.battery_level && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Battery className="h-4 w-4 mr-2" />
                        <span>Bateria</span>
                      </div>
                      <span className="text-sm font-medium">{device.battery_level}%</span>
                    </div>
                  )}
                  
                  {device.os_version && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Smartphone className="h-4 w-4 mr-2" />
                        <span>Sistema</span>
                      </div>
                      <span className="text-sm font-medium">{device.os_version}</span>
                    </div>
                  )}
                  
                  {device.ssid && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Wifi className="h-4 w-4 mr-2" />
                        <span>Wi-Fi</span>
                      </div>
                      <span className="text-sm font-medium">{device.ssid}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Última conexão</span>
                    </div>
                    <span className="text-sm font-medium">{formatDate(device.last_seen_at)}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {device.tags.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {device.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Histórico de Localizações */}
              {locations.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Histórico</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {locations.slice(0, 5).map((location, index) => (
                      <div key={location.id} className="text-sm border-b border-gray-100 pb-2">
                        <div className="flex justify-between items-start">
                          <span className="text-gray-900 font-medium">
                            {index === 0 ? 'Atual' : `${index + 1}ª posição`}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(location.captured_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </p>
                        {location.accuracy && (
                          <p className="text-xs text-gray-500">
                            Precisão: {location.accuracy}m
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}