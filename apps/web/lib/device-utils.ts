// Utilities for device search and data synchronization

export interface SearchableDevice {
  id: string
  name: string
  deviceModel: string
  status: 'online' | 'offline' | 'inactive'
  ownerName?: string
  location?: string
  lastSeen: Date
}

// Função para buscar todos os dispositivos das APIs reais
export const getAllDevices = async (): Promise<SearchableDevice[]> => {
  try {
    const response = await fetch('/api/devices');
    const data = await response.json();
    
    if (!data.success || !data.data) {
      return [];
    }
    
    // Converter dados da API para o formato SearchableDevice
    return data.data.map((device: any) => ({
      id: device.device_id || device.id,
      name: device.name || `Device ${device.device_id}`,
      deviceModel: device.device_model || 'Unknown Model',
      status: device.status === 'online' ? 'online' : 
              device.status === 'offline' ? 'offline' : 'inactive',
      ownerName: device.owner_name || undefined,
      location: device.location || undefined,
      lastSeen: device.last_seen ? new Date(device.last_seen) : new Date()
    }));
  } catch (error) {
    console.error('Erro ao buscar dispositivos:', error);
    return [];
  }
}

// Função para buscar dispositivos com cache local para performance
let devicesCache: SearchableDevice[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 segundos

export const getAllDevicesWithCache = async (): Promise<SearchableDevice[]> => {
  const now = Date.now();
  
  // Se o cache ainda está válido, retornar dados em cache
  if (devicesCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
    return devicesCache;
  }
  
  // Buscar dados atualizados
  const devices = await getAllDevices();
  devicesCache = devices;
  cacheTimestamp = now;
  
  return devices;
}

// Função para buscar dispositivos (versão async)
export const searchDevices = async (query: string): Promise<SearchableDevice[]> => {
  if (!query.trim()) return []
  
  const devices = await getAllDevicesWithCache();
  const searchTerm = query.toLowerCase()
  
  return devices.filter(device => 
    device.name.toLowerCase().includes(searchTerm) ||
    device.deviceModel.toLowerCase().includes(searchTerm) ||
    device.id.toLowerCase().includes(searchTerm) ||
    device.ownerName?.toLowerCase().includes(searchTerm) ||
    device.location?.toLowerCase().includes(searchTerm)
  ).slice(0, 8) // Limitar a 8 resultados
}

// Função para formatar tempo
export const formatLastSeen = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) { // menos de 1 minuto
    return 'Agora'
  } else if (diff < 3600000) { // menos de 1 hora
    const minutes = Math.floor(diff / 60000)
    return `${minutes} min atrás`
  } else if (diff < 86400000) { // menos de 24 horas
    const hours = Math.floor(diff / 3600000)
    return `${hours}h atrás`
  } else {
    const days = Math.floor(diff / 86400000)
    return `${days}d atrás`
  }
}

// Função para obter cor do status
export const getStatusColor = (status: SearchableDevice['status']): string => {
  switch (status) {
    case 'online':
      return 'text-green-600 bg-green-100'
    case 'offline':
      return 'text-red-600 bg-red-100'
    case 'inactive':
      return 'text-yellow-600 bg-yellow-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

// Função para obter nome do status
export const getStatusName = (status: SearchableDevice['status']): string => {
  switch (status) {
    case 'online':
      return 'Online'
    case 'offline':
      return 'Offline'
    case 'inactive':
      return 'Inativo'
    default:
      return 'Desconhecido'
  }
}