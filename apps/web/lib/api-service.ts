// API Service - Conexão com Neon DB via APIs REST
// Substitui Firestore para usar PostgreSQL (Neon DB)

import type { DeviceSchema, CommandSchema, LocationSchema, PolicySchema } from '@sdb/shared/schemas';
import { z } from 'zod';

// Tipos inferidos dos schemas Zod
type Device = z.infer<typeof DeviceSchema>;
type Command = z.infer<typeof CommandSchema>;
type Location = z.infer<typeof LocationSchema>;
type Policy = z.infer<typeof PolicySchema>;

// Base URL da API
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// Helper para requisições autenticadas
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const url = `${API_BASE}${endpoint}`;
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    if (options.body) {
      console.log(`📤 Request body:`, JSON.parse(options.body as string));
    }

    // Get auth token from localStorage or use development mock
    const authToken = (typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null) || 'dev-token-mock';
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    console.log(`📥 API Response:`, { status: response.status, ok: response.ok, data });
    
    if (!response.ok) {
      console.error(`❌ API Request Failed: ${url} - Status: ${response.status} - ${response.statusText}`);
      return { success: false, error: data.error || `Erro na requisição: ${response.statusText}` };
    }

    return { success: true, data: data.data || data };
  } catch (error) {
    const err = error as Error;
    console.error(`❌ API Request Error: ${endpoint} -`, err);
    return { success: false, error: `Erro de conexão: ${err.message}` };
  }
}

// ================================
// Devices API
// ================================
export const devicesApi = {
  // Buscar todos os dispositivos
  async getAll(): Promise<Device[]> {
    const result = await apiRequest<Device[]>('/devices');
    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar dispositivos');
    }
    return result.data || [];
  },

  // Buscar dispositivo por ID
  async getById(id: string): Promise<Device | null> {
    const result = await apiRequest<Device>(`/devices/${id}`);
    return result.data || null;
  },

  // Criar novo dispositivo
  async create(device: Partial<Device>): Promise<Device> {
    const result = await apiRequest<Device>('/devices', {
      method: 'POST',
      body: JSON.stringify(device),
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao criar dispositivo');
    }
    return result.data!;
  },

  // Atualizar dispositivo existente
  async update(id: string, updates: {
    name?: string;
    owner?: string;
    tags?: string[];
    status?: Device['status'];
  }): Promise<Device> {
    const result = await apiRequest<Device>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao atualizar dispositivo');
    }
    return result.data!;
  },

  // Deletar dispositivo
  async delete(id: string): Promise<void> {
    const result = await apiRequest(`/devices/${id}`, {
      method: 'DELETE',
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao deletar dispositivo');
    }
  },

  // Reportar status do dispositivo
  async report(deviceId: string, data: {
    status?: Device['status'];
    battery_level?: number;
    os_version?: string;
    ssid?: string;
    app_in_foreground?: string;
  }): Promise<Device> {
    const result = await apiRequest<Device>(`/devices/${deviceId}/report`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao reportar status');
    }
    return result.data!;
  }
};

// ================================
// Commands API
// ================================
export const commandsApi = {
  // Enviar comando para dispositivo
  async send(deviceId: string, command: {
    type: Command['type'];
    payload?: Record<string, any>;
  }): Promise<Command> {
    const result = await apiRequest<Command>(`/devices/${deviceId}/commands`, {
      method: 'POST',
      body: JSON.stringify({
        type: command.type,
        payload: command.payload || {},
      }),
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao enviar comando');
    }
    return result.data!;
  },

  // Buscar comandos de um dispositivo
  async getForDevice(deviceId: string, limit = 50): Promise<Command[]> {
    const result = await apiRequest<Command[]>(`/devices/${deviceId}/commands?limit=${limit}`);
    return result.data || [];
  },

  // Buscar todos os comandos
  async getAll(limit = 50): Promise<Command[]> {
    const result = await apiRequest<Command[]>(`/commands?limit=${limit}`);
    return result.data || [];
  },

  // Buscar comando por ID
  async getById(id: string): Promise<Command | null> {
    const result = await apiRequest<Command>(`/commands/${id}`);
    return result.data || null;
  }
};

// ================================
// Locations API  
// ================================
export const locationsApi = {
  // Buscar localizações (todas ou de um dispositivo específico)
  async getAll(deviceId?: string, limit = 50): Promise<Location[]> {
    const params = new URLSearchParams();
    if (deviceId) params.append('device_id', deviceId);
    params.append('limit', limit.toString());
    
    const result = await apiRequest<Location[]>(`/locations?${params}`);
    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar localizações');
    }
    return result.data || [];
  },

  // Buscar localizações de um dispositivo específico
  async getForDevice(deviceId: string, limit = 50): Promise<Location[]> {
    const result = await apiRequest<Location[]>(`/devices/${deviceId}/locations?limit=${limit}`);
    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar localizações');
    }
    return result.data || [];
  },

  // Buscar última localização de um dispositivo
  async getLatest(deviceId: string): Promise<Location | null> {
    const locations = await this.getForDevice(deviceId, 1);
    return locations.length > 0 ? locations[0] : null;
  },

  // Adicionar nova localização
  async add(location: {
    device_id: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    bearing?: number;
    source?: 'gps' | 'network' | 'passive' | 'fused';
    captured_at?: string;
  }): Promise<Location> {
    const result = await apiRequest<Location>('/locations', {
      method: 'POST',
      body: JSON.stringify(location),
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao adicionar localização');
    }
    return result.data!;
  },

  // Buscar última localização conhecida de todos os dispositivos
  async getLatestForAllDevices(): Promise<Record<string, Location>> {
    const locations = await this.getAll();
    const latestByDevice: Record<string, Location> = {};
    
    locations.forEach(location => {
      if (!latestByDevice[location.device_id] || 
          new Date(location.captured_at) > new Date(latestByDevice[location.device_id].captured_at)) {
        latestByDevice[location.device_id] = location;
      }
    });
    
    return latestByDevice;
  }
};

// ================================
// Health API
// ================================
export const healthApi = {
  async check(): Promise<{ ok: boolean; time: string; env: any }> {
    const result = await apiRequest<{ ok: boolean; time: string; env: any }>('/health');
    if (!result.success) {
      throw new Error(result.error || 'Erro no health check');
    }
    return result.data!;
  }
};

// ================================
// Policies API
// ================================
export const policiesApi = {
  // Buscar todas as políticas
  async getAll(filters?: { is_active?: boolean; search?: string; limit?: number }): Promise<Policy[]> {
    const params = new URLSearchParams();
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const result = await apiRequest<Policy[]>(`/policies?${params}`);
    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar políticas');
    }
    return result.data || [];
  },

  // Buscar política por ID
  async getById(id: string): Promise<Policy | null> {
    const result = await apiRequest<Policy>(`/policies/${id}`);
    return result.data || null;
  },

  // Criar nova política
  async create(policy: {
    name: string;
    description?: string;
    policy_json: any;
    is_active?: boolean;
  }): Promise<Policy> {
    const result = await apiRequest<Policy>('/policies', {
      method: 'POST',
      body: JSON.stringify(policy),
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao criar política');
    }
    return result.data!;
  },

  // Atualizar política existente
  async update(id: string, updates: {
    name?: string;
    description?: string;
    policy_json?: any;
    is_active?: boolean;
  }): Promise<Policy> {
    const result = await apiRequest<Policy>(`/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao atualizar política');
    }
    return result.data!;
  },

  // Deletar política
  async delete(id: string): Promise<void> {
    const result = await apiRequest(`/policies/${id}`, {
      method: 'DELETE',
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao deletar política');
    }
  },

  // Aplicar política a um dispositivo
  async applyToDevice(deviceId: string, policyId: string): Promise<any> {
    const result = await apiRequest(`/devices/${deviceId}/policy/apply`, {
      method: 'POST',
      body: JSON.stringify({ policy_id: policyId }),
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao aplicar política');
    }
    return result.data;
  },

  // Listar políticas aplicadas a um dispositivo
  async getAppliedToDevice(deviceId: string): Promise<any[]> {
    const result = await apiRequest<any[]>(`/devices/${deviceId}/policy/apply`);
    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar políticas do dispositivo');
    }
    return result.data || [];
  }
};

// ================================
// Utility Functions
// ================================
export const apiUtils = {
  // Formatar data
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-BR');
  },

  // Calcular tempo decorrido
  timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dias atrás`;
  },

  // Status em português
  translateStatus(status: string): string {
    const translations = {
      'online': 'Online',
      'offline': 'Offline', 
      'inactive': 'Inativo',
      'pending': 'Pendente',
      'sent': 'Enviado',
      'success': 'Sucesso',
      'failed': 'Falhou',
      'timeout': 'Timeout'
    };
    return translations[status as keyof typeof translations] || status;
  },

  // Cores do status
  getStatusColor(status: string): string {
    const colors = {
      'online': 'text-green-600 bg-green-100',
      'offline': 'text-red-600 bg-red-100',
      'inactive': 'text-gray-600 bg-gray-100',
      'pending': 'text-yellow-600 bg-yellow-100',
      'sent': 'text-blue-600 bg-blue-100',
      'success': 'text-green-600 bg-green-100',
      'failed': 'text-red-600 bg-red-100',
      'timeout': 'text-orange-600 bg-orange-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  }
};

// Exportar todos os tipos
export type { Device, Command, Location, Policy };