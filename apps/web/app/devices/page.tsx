'use client';

import { useState, useEffect } from 'react';
import { Smartphone, MapPin, Battery, Wifi, Clock, Plus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { DashboardHeader } from '../../components/DashboardHeader';

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

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      const data = await response.json();
      
      if (data.success) {
        setDevices(data.data);
      } else {
        setError(data.error || 'Erro ao carregar dispositivos');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <ProtectedRoute>
        <div className="w-full h-full bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
          <DashboardHeader />
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button 
                onClick={fetchDevices} 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Tentar Novamente
              </button>
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
        
        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header da Página */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Dispositivos</h1>
                  <p className="text-gray-600">Gerencie e monitore todos os seus dispositivos conectados em tempo real</p>
                </div>
                <Link
                  href="/devices/add"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Dispositivo
                </Link>
              </div>
            </div>

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
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Primeiro Dispositivo
                </Link>
              </div>
            ) : (
              <>
                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

                {/* Lista de Dispositivos */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {devices.map((device) => (
                    <div 
                      key={device.id} 
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
                    >
                      {/* Device Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Smartphone className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
                            <p className="text-sm text-gray-600">{device.owner}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                          {getStatusText(device.status)}
                        </span>
                      </div>

                      {/* Device Info */}
                      <div className="space-y-3 mb-6">
                        {device.battery_level && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Battery className="h-4 w-4 mr-3 text-gray-400" />
                            <span>Bateria: {device.battery_level}%</span>
                            <div className="ml-auto w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${device.battery_level > 50 ? 'bg-green-500' : device.battery_level > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${device.battery_level}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {device.os_version && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Smartphone className="h-4 w-4 mr-3 text-gray-400" />
                            <span>Sistema: {device.os_version}</span>
                          </div>
                        )}
                        
                        {device.ssid && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Wifi className="h-4 w-4 mr-3 text-gray-400" />
                            <span>Wi-Fi: {device.ssid}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-3 text-gray-400" />
                          <span>Última atividade: {formatDate(device.last_seen_at)}</span>
                        </div>
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

                      {/* Actions */}
                      <div className="flex space-x-3">
                        <Link 
                          href={`/devices/${device.id}`} 
                          className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Localizar
                        </Link>
                        <button className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                          Comandos
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}