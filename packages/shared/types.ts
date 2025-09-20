// Tipos TypeScript para o sistema FRIAXIS v4.0.0
// Schema Multi-tenant - Baseados na nova modelagem de dados

// ================================
// Multi-tenant Core Types
// ================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  display_name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email: string;
  phone?: string;
  address?: Address;
  settings: OrganizationSettings;
  plan_type: 'trial' | 'starter' | 'professional' | 'enterprise';
  plan_limits: PlanLimits;
  status: 'active' | 'suspended' | 'cancelled';
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

export interface OrganizationSettings {
  max_devices: number;
  max_users: number;
  features: string[];
  timezone: string;
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    webhook: boolean;
  };
}

export interface PlanLimits {
  devices: number;
  users: number;
  storage_gb: number;
  api_calls_month: number;
}

export interface Subscription {
  id: string;
  organization_id: string;
  external_subscription_id?: string;
  status: 'active' | 'past_due' | 'cancelled' | 'unpaid';
  plan_type: string;
  amount_cents: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancel_at?: string;
  cancelled_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  email_verified: boolean;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  preferences: UserPreferences;
  last_login_at?: string;
  last_login_ip?: string;
  login_count: number;
  password_changed_at?: string;
  two_factor_enabled: boolean;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  timezone: string;
  language: string;
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  dashboard: {
    default_view: string;
    widgets: string[];
  };
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'operator' | 'viewer';
  permissions: MemberPermissions;
  status: 'active' | 'inactive' | 'pending';
  invited_by?: string;
  invitation_token?: string;
  invitation_expires_at?: string;
  joined_at: string;
  last_active_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MemberPermissions {
  devices: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
  policies: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
  users: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
  analytics: {
    read: boolean;
  };
  settings: {
    read: boolean;
    write: boolean;
  };
}

// ================================
// Device Management Types
// ================================

export interface Device {
  id: string;
  organization_id: string;
  name: string;
  device_identifier?: string;
  serial_number?: string;
  asset_tag?: string;
  fcm_token?: string;
  last_fcm_update?: string;
  status: 'online' | 'offline' | 'inactive' | 'maintenance' | 'idle';
  health_score?: number;
  compliance_status?: 'compliant' | 'non_compliant' | 'unknown';
  device_type?: 'smartphone' | 'tablet' | 'laptop' | 'desktop' | 'other';
  manufacturer?: string;
  model?: string;
  os_type?: 'android' | 'ios' | 'windows' | 'macos' | 'linux';
  os_version?: string;
  app_version?: string;
  owner_name?: string;
  owner_email?: string;
  department?: string;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  physical_location?: PhysicalLocation;
  tags: string[];
  metadata?: Record<string, any>;
  settings?: DeviceSettings;
  
  // New heartbeat and telemetry fields
  battery_level?: number;
  battery_status?: string;
  location_accuracy?: number;
  location_timestamp?: string;
  network_info?: string;
  last_heartbeat?: string;
  
  // Timestamps
  last_seen_at?: string;
  last_checkin_at?: string;
  first_enrolled_at?: string;
  enrolled_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface PhysicalLocation {
  building: string;
  floor: string;
  room: string;
}

export interface DeviceSettings {
  auto_update: boolean;
  backup_enabled: boolean;
  location_tracking: boolean;
  screenshot_allowed: boolean;
  remote_wipe_enabled: boolean;
}

// Legacy interfaces removed - replaced with multi-tenant versions below

export interface DeviceTelemetry {
  id: string;
  device_id: string;
  organization_id: string;
  battery_level?: number;
  battery_status?: string;
  battery_temperature?: number;
  storage_total_gb?: number;
  storage_used_gb?: number;
  storage_available_gb?: number;
  ram_total_mb?: number;
  ram_used_mb?: number;
  ram_available_mb?: number;
  cpu_usage_percent?: number;
  cpu_temperature?: number;
  network_type?: string;
  wifi_ssid?: string;
  wifi_strength?: number;
  cellular_carrier?: string;
  cellular_signal_strength?: number;
  ip_address?: string;
  app_in_foreground?: string;
  installed_apps_count?: number;
  security_patch_level?: string;
  is_rooted: boolean;
  is_developer_mode_enabled: boolean;
  screen_lock_enabled: boolean;
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  location_source?: string;
  captured_at: string;
  received_at: string;
}

export interface DeviceLocation {
  id: string;
  device_id: string;
  organization_id: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  bearing?: number;
  source: 'gps' | 'network' | 'passive' | 'fused';
  provider?: string;
  satellites_used?: number;
  address?: Address;
  place_name?: string;
  trigger_type: string;
  triggered_by?: string;
  command_id?: string;
  captured_at: string;
  processed_at: string;
  created_at: string;
}

export interface Policy {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  category: string;
  priority: number;
  policy_config: PolicyConfig;
  launcher_apps: string[];
  blocked_apps: string[];
  required_apps: string[];
  kiosk_mode: boolean;
  require_pin: boolean;
  min_pin_length: number;
  max_failed_attempts: number;
  auto_lock_timeout: number;
  disable_camera: boolean;
  disable_bluetooth: boolean;
  disable_wifi_config: boolean;
  disable_usb_debugging: boolean;
  force_encrypt: boolean;
  compliance_rules: Record<string, any>;
  audit_settings: AuditSettings;
  is_active: boolean;
  version: number;
  parent_policy_id?: string;
  auto_apply_rules: Record<string, any>;
  tags: string[];
  metadata: Record<string, any>;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditSettings {
  log_app_usage: boolean;
  log_location: boolean;
  log_network: boolean;
  retention_days: number;
}

export interface DevicePolicy {
  id: string;
  organization_id: string;
  device_id: string;
  policy_id: string;
  status: 'pending' | 'applying' | 'applied' | 'failed' | 'removed' | 'outdated';
  applied_version?: number;
  applied_config?: Record<string, any>;
  result_details?: Record<string, any>;
  error_message?: string;
  error_code?: string;
  retry_count: number;
  max_retries: number;
  compliance_status: 'compliant' | 'non_compliant' | 'unknown' | 'checking';
  last_compliance_check?: string;
  compliance_details?: Record<string, any>;
  applied_at: string;
  applied_by?: string;
  verified_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// ================================
// Commands and Remote Actions
// ================================

export interface Command {
  id: string;
  organization_id: string;
  device_id: string;
  type: CommandType;
  category: string;
  priority: number;
  payload?: Record<string, any>;
  timeout_seconds: number;
  retry_policy: RetryPolicy;
  status: 'pending' | 'queued' | 'sent' | 'executing' | 'success' | 'failed' | 'timeout' | 'cancelled';
  result?: Record<string, any>;
  error_message?: string;
  error_code?: string;
  execution_log: any[];
  fcm_message_id?: string;
  delivery_status?: string;
  delivery_attempts: number;
  created_at: string;
  scheduled_at: string;
  sent_at?: string;
  executed_at?: string;
  completed_at?: string;
  expires_at?: string;
  created_by: string;
  reason?: string;
  metadata: Record<string, any>;
}

export interface RetryPolicy {
  max_retries: number;
  retry_delay_seconds: number;
  exponential_backoff: boolean;
}

export interface ScreenshotSession {
  id: string;
  organization_id: string;
  device_id: string;
  session_token: string;
  is_active: boolean;
  consent_given: boolean;
  consent_given_at?: string;
  consent_expires_at?: string;
  max_screenshots: number;
  screenshots_taken: number;
  quality: number;
  max_width: number;
  max_height: number;
  initiated_by: string;
  purpose: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  expires_at: string;
  closed_at?: string;
}

// ================================
// Events, Logs and Audit
// ================================

export interface Event {
  id: string;
  organization_id: string;
  type: string;
  category: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  device_id?: string;
  user_id?: string;
  title: string;
  description?: string;
  event_data: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  severity: 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical' | 'alert' | 'emergency';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  source_ip?: string;
  user_agent?: string;
  session_id?: string;
  compliance_relevant: boolean;
  retention_policy: string;
  tags: string[];
  metadata: Record<string, any>;
  occurred_at: string;
  created_at: string;
}

export interface Alert {
  id: string;
  organization_id: string;
  title: string;
  message: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  subcategory?: string;
  priority: number;
  device_id?: string;
  user_id?: string;
  policy_id?: string;
  command_id?: string;
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'closed' | 'false_positive';
  alert_data: Record<string, any>;
  conditions?: Record<string, any>;
  thresholds?: Record<string, any>;
  auto_resolve: boolean;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  notification_sent: boolean;
  notification_channels: string[];
  notification_settings: Record<string, any>;
  first_occurred_at: string;
  last_occurred_at: string;
  occurrence_count: number;
  acknowledged_at?: string;
  acknowledged_by?: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  channel: 'web' | 'email' | 'push' | 'sms';
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  read_at?: string;
  clicked_at?: string;
  delivery_attempts: number;
  last_attempt_at?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  alert_id?: string;
  priority: number;
  expires_at?: string;
  data: Record<string, any>;
  scheduled_at: string;
  sent_at?: string;
  created_at: string;
}

// ================================
// Configuration and Analytics
// ================================

export interface OrganizationSetting {
  id: string;
  organization_id: string;
  category: string;
  key: string;
  value: any;
  description?: string;
  is_encrypted: boolean;
  is_public: boolean;
  version: number;
  previous_value?: any;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsMetric {
  id: string;
  organization_id: string;
  metric_name: string;
  metric_type: string;
  dimensions: Record<string, any>;
  value: number;
  value_type: string;
  unit?: string;
  period_start: string;
  period_end: string;
  granularity: string;
  metadata: Record<string, any>;
  calculated_at: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  organization_id: string;
  user_id: string;
  session_token: string;
  session_type: 'web' | 'mobile' | 'api';
  ip_address: string;
  user_agent?: string;
  device_fingerprint?: string;
  country?: string;
  region?: string;
  city?: string;
  is_active: boolean;
  is_suspicious: boolean;
  suspicious_reason?: string;
  last_activity_at: string;
  actions_count: number;
  pages_visited: string[];
  started_at: string;
  ended_at?: string;
  expires_at?: string;
  metadata: Record<string, any>;
}

// ================================
// Command Types (Extended)
// ================================

export type CommandType = 
  | 'PING'
  | 'LOCATE_NOW'
  | 'LOCK'
  | 'UNLOCK'
  | 'WIPE'
  | 'SCREENSHOT'
  | 'OPEN_ACTIVITY'
  | 'INSTALL_APP'
  | 'UNINSTALL_APP'
  | 'UPDATE_POLICY'
  | 'REBOOT'
  | 'SYNC_DATA';

// ================================
// Legacy Device Location (to be removed)
// ================================

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