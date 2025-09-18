// Tipos TypeScript para o sistema SDB
// Baseados na modelagem de dados do banco

// ================================
// Database Entity Types
// ================================

export interface Device {
  id: string;
  name: string;
  fcm_token: string | null;
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

export interface Policy {
  id: string;
  name: string;
  description: string | null;
  policy_json: PolicyConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DevicePolicy {
  id: string;
  device_id: string;
  policy_id: string;
  applied_at: string;
  status: 'pending' | 'applied' | 'failed' | 'removed';
  error_message: string | null;
}

export interface Command {
  id: string;
  device_id: string;
  type: CommandType;
  payload_json: Record<string, any> | null;
  status: 'pending' | 'sent' | 'success' | 'failed' | 'timeout';
  created_at: string;
  sent_at: string | null;
  executed_at: string | null;
  error_message: string | null;
  result_json: Record<string, any> | null;
}

export interface Event {
  id: string;
  device_id: string | null;
  type: string;
  description: string | null;
  data_json: Record<string, any> | null;
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  created_at: string;
}

export interface Location {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  bearing: number | null;
  source: 'gps' | 'network' | 'passive' | 'fused';
  captured_at: string;
  created_at: string;
}

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'operator' | 'viewer';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

// ================================
// Command Types
// ================================

export type CommandType = 
  | 'PING'
  | 'LOCATE_NOW'
  | 'LOCK'
  | 'UNLOCK'
  | 'WIPE'
  | 'SCREENSHOT'
  | 'OPEN_ACTIVITY';

// ================================
// Policy Configuration Types
// ================================

export interface PolicyConfig {
  // Apps permitidos no launcher (kiosk mode)
  launcher_apps?: string[];
  
  // Apps bloqueados
  blocked_apps?: string[];
  
  // Modo kiosk ativo
  kiosk_mode?: boolean;
  
  // Permitir instalação de fontes desconhecidas
  allow_unknown_sources?: boolean;
  
  // Requer PIN para desbloquear
  require_pin?: boolean;
  
  // Tamanho mínimo do PIN
  min_pin_length?: number;
  
  // Permitir debug USB
  allow_usb_debugging?: boolean;
  
  // Forçar criptografia
  force_encrypt?: boolean;
  
  // Número de tentativas antes de wipe
  wipe_on_failures?: number;
  
  // Desabilitar câmera
  disable_camera?: boolean;
  
  // Desabilitar Bluetooth
  disable_bluetooth?: boolean;
  
  // Desabilitar configuração de Wi-Fi
  disable_wifi_config?: boolean;
  
  // Configurações adicionais
  [key: string]: any;
}

// ================================
// API Request/Response Types
// ================================

export interface CreateCommandRequest {
  deviceId: string;
  type: CommandType;
  payload?: Record<string, any>;
}

export interface CreateCommandResponse {
  id: string;
  status: 'pending' | 'sent';
  message: string;
}

export interface DeviceReportRequest {
  battery_level?: number;
  os_version?: string;
  ssid?: string;
  app_in_foreground?: string;
  status: 'online' | 'offline';
}

export interface LocationReportRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  bearing?: number;
  source?: 'gps' | 'network' | 'passive' | 'fused';
  captured_at: string;
}

export interface ApplyPolicyRequest {
  policy_id: string;
}

// ================================
// FCM Payload Types
// ================================

export interface FCMCommandPayload {
  type: CommandType;
  command_id: string;
  payload?: Record<string, any>;
}

// ================================
// Frontend UI Types
// ================================

export interface DeviceListFilter {
  status?: 'online' | 'offline' | 'inactive';
  owner?: string;
  tags?: string[];
  search?: string;
}

export interface CommandFilter {
  device_id?: string;
  type?: CommandType;
  status?: 'pending' | 'sent' | 'success' | 'failed' | 'timeout';
  date_from?: string;
  date_to?: string;
}

export interface EventFilter {
  device_id?: string;
  type?: string;
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  date_from?: string;
  date_to?: string;
}

// ================================
// Utility Types
// ================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  code?: string;
}

// ================================
// Android App Types
// ================================

export interface DeviceInfo {
  deviceId: string;
  model: string;
  manufacturer: string;
  osVersion: string;
  appVersion: string;
  batteryLevel: number;
  isCharging: boolean;
  ssid?: string;
  ipAddress?: string;
}

export interface AppInfo {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  isSystemApp: boolean;
  isEnabled: boolean;
}

// ================================
// Screenshot Types
// ================================

export interface ScreenshotSession {
  sessionId: string;
  deviceId: string;
  isActive: boolean;
  startedAt: string;
  expiresAt: string;
}

export interface ScreenshotRequest {
  sessionId: string;
  quality?: number; // 1-100
  maxWidth?: number;
  maxHeight?: number;
}