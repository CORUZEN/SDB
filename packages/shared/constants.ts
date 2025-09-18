// Constantes compartilhadas do sistema SDB

// ================================
// System Constants
// ================================

export const SDB_CONSTANTS = {
  // Versão do sistema
  VERSION: '0.1.0',
  
  // Nome do projeto Firebase
  FIREBASE_PROJECT_ID: 'sdb-sistema-de-bloqueio',
  
  // Package name do app Android
  ANDROID_PACKAGE_NAME: 'com.coruzen.sdb',
  
  // Timeouts (em milissegundos)
  TIMEOUTS: {
    COMMAND_DEFAULT: 30000,        // 30 segundos
    COMMAND_LOCATION: 60000,       // 1 minuto
    COMMAND_SCREENSHOT: 15000,     // 15 segundos
    FCM_TTL: 60000,               // 1 minuto
    SCREENSHOT_SESSION: 300000,    // 5 minutos
  },
  
  // Limites
  LIMITS: {
    MAX_DEVICES_PER_USER: 100,
    MAX_COMMANDS_PER_HOUR: 1000,
    MAX_LOCATION_ACCURACY: 1000,   // metros
    MIN_BATTERY_ALERT: 20,         // porcentagem
    MAX_SCREENSHOT_SIZE: 2048,     // pixels
  },
  
  // Intervalos de polling (em milissegundos)
  POLLING: {
    COMMAND_STATUS: 2000,          // 2 segundos
    DEVICE_STATUS: 10000,          // 10 segundos
    HEARTBEAT: 30000,             // 30 segundos
  },
} as const;

// ================================
// Command Types & Descriptions
// ================================

export const COMMAND_TYPES = {
  PING: {
    type: 'PING',
    description: 'Verificar se o dispositivo está online',
    timeout: SDB_CONSTANTS.TIMEOUTS.COMMAND_DEFAULT,
    requiresPermission: false,
  },
  LOCATE_NOW: {
    type: 'LOCATE_NOW',
    description: 'Obter localização atual do dispositivo',
    timeout: SDB_CONSTANTS.TIMEOUTS.COMMAND_LOCATION,
    requiresPermission: true,
  },
  LOCK: {
    type: 'LOCK',
    description: 'Bloquear dispositivo',
    timeout: SDB_CONSTANTS.TIMEOUTS.COMMAND_DEFAULT,
    requiresPermission: true,
  },
  UNLOCK: {
    type: 'UNLOCK',
    description: 'Desbloquear dispositivo',
    timeout: SDB_CONSTANTS.TIMEOUTS.COMMAND_DEFAULT,
    requiresPermission: true,
  },
  WIPE: {
    type: 'WIPE',
    description: 'Resetar dispositivo para configurações de fábrica',
    timeout: SDB_CONSTANTS.TIMEOUTS.COMMAND_DEFAULT,
    requiresPermission: true,
    dangerous: true,
  },
  SCREENSHOT: {
    type: 'SCREENSHOT',
    description: 'Capturar tela do dispositivo',
    timeout: SDB_CONSTANTS.TIMEOUTS.COMMAND_SCREENSHOT,
    requiresPermission: true,
  },
  OPEN_ACTIVITY: {
    type: 'OPEN_ACTIVITY',
    description: 'Abrir atividade específica no dispositivo',
    timeout: SDB_CONSTANTS.TIMEOUTS.COMMAND_DEFAULT,
    requiresPermission: true,
  },
} as const;

// ================================
// Device Status
// ================================

export const DEVICE_STATUS = {
  ONLINE: {
    value: 'online',
    label: 'Online',
    color: '#22c55e', // green-500
    description: 'Dispositivo conectado e responsivo',
  },
  OFFLINE: {
    value: 'offline',
    label: 'Offline',
    color: '#6b7280', // gray-500
    description: 'Dispositivo desconectado',
  },
  INACTIVE: {
    value: 'inactive',
    label: 'Inativo',
    color: '#f59e0b', // amber-500
    description: 'Dispositivo não utilizado há muito tempo',
  },
} as const;

// ================================
// User Roles & Permissions
// ================================

export const USER_ROLES = {
  ADMIN: {
    value: 'admin',
    label: 'Administrador',
    permissions: [
      'devices:read',
      'devices:write',
      'devices:delete',
      'commands:all',
      'policies:all',
      'users:all',
      'system:admin',
    ],
  },
  OPERATOR: {
    value: 'operator',
    label: 'Operador',
    permissions: [
      'devices:read',
      'devices:write',
      'commands:basic',
      'commands:location',
      'policies:read',
      'policies:apply',
    ],
  },
  VIEWER: {
    value: 'viewer',
    label: 'Visualizador',
    permissions: [
      'devices:read',
      'commands:read',
      'policies:read',
    ],
  },
} as const;

// ================================
// Event Types & Severity
// ================================

export const EVENT_TYPES = {
  // Device Events
  DEVICE_REGISTERED: 'DEVICE_REGISTERED',
  DEVICE_STATUS_CHANGED: 'DEVICE_STATUS_CHANGED',
  DEVICE_BATTERY_LOW: 'DEVICE_BATTERY_LOW',
  DEVICE_POLICY_APPLIED: 'DEVICE_POLICY_APPLIED',
  
  // Command Events
  COMMAND_CREATED: 'COMMAND_CREATED',
  COMMAND_SENT: 'COMMAND_SENT',
  COMMAND_COMPLETED: 'COMMAND_COMPLETED',
  COMMAND_FAILED: 'COMMAND_FAILED',
  
  // Security Events
  AUTHENTICATION_SUCCESS: 'AUTHENTICATION_SUCCESS',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  
  // System Events
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_WARNING: 'SYSTEM_WARNING',
} as const;

export const EVENT_SEVERITY = {
  DEBUG: {
    value: 'debug',
    label: 'Debug',
    color: '#6b7280',
    icon: '🔍',
  },
  INFO: {
    value: 'info',
    label: 'Informação',
    color: '#3b82f6',
    icon: 'ℹ️',
  },
  WARNING: {
    value: 'warning',
    label: 'Aviso',
    color: '#f59e0b',
    icon: '⚠️',
  },
  ERROR: {
    value: 'error',
    label: 'Erro',
    color: '#ef4444',
    icon: '❌',
  },
  CRITICAL: {
    value: 'critical',
    label: 'Crítico',
    color: '#dc2626',
    icon: '🚨',
  },
} as const;

// ================================
// Default Policy Configs
// ================================

export const DEFAULT_POLICIES = {
  BASIC_CORPORATE: {
    name: 'Política Básica Corporativa',
    config: {
      launcher_apps: ['com.android.chrome', 'com.microsoft.office.outlook'],
      kiosk_mode: true,
      allow_unknown_sources: false,
      require_pin: true,
      min_pin_length: 6,
      allow_usb_debugging: false,
      force_encrypt: true,
      wipe_on_failures: 10,
    },
  },
  RESTRICTIVE: {
    name: 'Política Restritiva',
    config: {
      launcher_apps: ['com.android.settings'],
      blocked_apps: ['*'],
      kiosk_mode: true,
      allow_unknown_sources: false,
      require_pin: true,
      min_pin_length: 8,
      allow_usb_debugging: false,
      force_encrypt: true,
      wipe_on_failures: 5,
      disable_camera: true,
      disable_bluetooth: true,
      disable_wifi_config: true,
    },
  },
  KIOSK_ONLY: {
    name: 'Modo Quiosque',
    config: {
      launcher_apps: ['com.example.kiosk'],
      kiosk_mode: true,
      allow_unknown_sources: false,
      require_pin: false,
      disable_camera: true,
      disable_bluetooth: true,
    },
  },
} as const;

// ================================
// API Endpoints
// ================================

export const API_ENDPOINTS = {
  // Auth
  AUTH_ME: '/api/auth/me',
  
  // Devices
  DEVICES: '/api/devices',
  DEVICE_BY_ID: '/api/devices/:id',
  DEVICE_REPORT: '/api/devices/:id/report',
  DEVICE_LOCATION: '/api/devices/:id/location',
  DEVICE_APPLY_POLICY: '/api/devices/:id/policy/apply',
  
  // Commands
  COMMANDS: '/api/commands',
  COMMAND_BY_ID: '/api/commands/:id',
  
  // Policies
  POLICIES: '/api/policies',
  POLICY_BY_ID: '/api/policies/:id',
  
  // Events
  EVENTS: '/api/events',
  
  // Health
  HEALTH: '/api/health',
  DB_TEST: '/api/dbtest',
} as const;

// ================================
// FCM Topics
// ================================

export const FCM_TOPICS = {
  ALL_DEVICES: 'all-devices',
  DEVICE_PREFIX: 'device-',
  COMMANDS: 'commands',
  POLICIES: 'policies',
} as const;

// ================================
// Storage Keys
// ================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'sdb_auth_token',
  USER_PREFERENCES: 'sdb_user_prefs',
  DEVICE_FILTERS: 'sdb_device_filters',
  LAST_LOCATION: 'sdb_last_location',
} as const;