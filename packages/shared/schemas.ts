// Schemas Zod para validação de dados
// Baseados nos tipos TypeScript definidos

import { z } from 'zod';

// ================================
// Base Schemas
// ================================

export const UUIDSchema = z.string().uuid();
export const DateTimeSchema = z.string().datetime();
export const EmailSchema = z.string().email();

// ================================
// Command Schemas
// ================================

export const CommandTypeSchema = z.enum([
  'PING',
  'LOCATE_NOW', 
  'LOCK',
  'UNLOCK',
  'WIPE',
  'SCREENSHOT',
  'OPEN_ACTIVITY'
]);

export const CommandStatusSchema = z.enum([
  'pending',
  'sent',
  'success',
  'failed',
  'timeout'
]);

export const CreateCommandSchema = z.object({
  deviceId: UUIDSchema,
  type: CommandTypeSchema,
  payload: z.record(z.any()).optional(),
});

export const CommandSchema = z.object({
  id: UUIDSchema,
  device_id: UUIDSchema,
  type: CommandTypeSchema,
  payload_json: z.record(z.any()).nullable(),
  status: CommandStatusSchema,
  created_at: DateTimeSchema,
  sent_at: DateTimeSchema.nullable(),
  executed_at: DateTimeSchema.nullable(),
  error_message: z.string().nullable(),
  result_json: z.record(z.any()).nullable(),
});

// ================================
// Device Schemas
// ================================

export const DeviceStatusSchema = z.enum(['online', 'offline', 'inactive']);

export const DeviceSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  fcm_token: z.string().max(512).nullable(),
  status: DeviceStatusSchema,
  owner: z.string().max(255).nullable(),
  tags: z.array(z.string()),
  last_seen_at: DateTimeSchema.nullable(),
  battery_level: z.number().int().min(0).max(100).nullable(),
  os_version: z.string().max(100).nullable(),
  ssid: z.string().max(255).nullable(),
  app_in_foreground: z.string().max(255).nullable(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export const DeviceReportSchema = z.object({
  battery_level: z.number().int().min(0).max(100).optional(),
  os_version: z.string().max(100).optional(),
  ssid: z.string().max(255).optional(),
  app_in_foreground: z.string().max(255).optional(),
  status: DeviceStatusSchema,
});

export const DeviceListFilterSchema = z.object({
  status: DeviceStatusSchema.optional(),
  owner: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
});

export const UpdateDeviceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  owner: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
  status: DeviceStatusSchema.optional(),
});

// ================================
// Policy Schemas
// ================================

export const PolicyConfigSchema = z.object({
  launcher_apps: z.array(z.string()).optional(),
  blocked_apps: z.array(z.string()).optional(),
  kiosk_mode: z.boolean().optional(),
  allow_unknown_sources: z.boolean().optional(),
  require_pin: z.boolean().optional(),
  min_pin_length: z.number().int().min(4).max(16).optional(),
  allow_usb_debugging: z.boolean().optional(),
  force_encrypt: z.boolean().optional(),
  wipe_on_failures: z.number().int().min(1).max(50).optional(),
  disable_camera: z.boolean().optional(),
  disable_bluetooth: z.boolean().optional(),
  disable_wifi_config: z.boolean().optional(),
}).catchall(z.any()); // Permite campos adicionais

export const PolicySchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  description: z.string().nullable(),
  policy_json: PolicyConfigSchema,
  is_active: z.boolean(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export const CreatePolicySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  policy_json: PolicyConfigSchema,
  is_active: z.boolean().default(true),
});

export const ApplyPolicySchema = z.object({
  policy_id: UUIDSchema,
});

// ================================
// Location Schemas
// ================================

export const LocationSourceSchema = z.enum(['gps', 'network', 'passive', 'fused']);

export const LocationSchema = z.object({
  id: UUIDSchema,
  device_id: UUIDSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).nullable(),
  altitude: z.number().nullable(),
  speed: z.number().min(0).nullable(),
  bearing: z.number().min(0).max(360).nullable(),
  source: LocationSourceSchema,
  captured_at: DateTimeSchema,
  created_at: DateTimeSchema,
});

export const LocationReportSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  altitude: z.number().optional(),
  speed: z.number().min(0).optional(),
  bearing: z.number().min(0).max(360).optional(),
  source: LocationSourceSchema.default('gps'),
  captured_at: DateTimeSchema,
});

// ================================
// Event Schemas
// ================================

export const EventSeveritySchema = z.enum(['debug', 'info', 'warning', 'error', 'critical']);

export const EventSchema = z.object({
  id: UUIDSchema,
  device_id: UUIDSchema.nullable(),
  type: z.string().min(1).max(100),
  description: z.string().nullable(),
  data_json: z.record(z.any()).nullable(),
  severity: EventSeveritySchema,
  created_at: DateTimeSchema,
});

export const CreateEventSchema = z.object({
  device_id: UUIDSchema.optional(),
  type: z.string().min(1).max(100),
  description: z.string().optional(),
  data_json: z.record(z.any()).optional(),
  severity: EventSeveritySchema.default('info'),
});

export const EventFilterSchema = z.object({
  device_id: UUIDSchema.optional(),
  type: z.string().optional(),
  severity: EventSeveritySchema.optional(),
  date_from: DateTimeSchema.optional(),
  date_to: DateTimeSchema.optional(),
});

// ================================
// User Schemas
// ================================

export const UserRoleSchema = z.enum(['admin', 'operator', 'viewer']);

export const UserSchema = z.object({
  id: UUIDSchema,
  firebase_uid: z.string().min(1).max(255),
  email: EmailSchema,
  display_name: z.string().max(255).nullable(),
  role: UserRoleSchema,
  is_active: z.boolean(),
  last_login_at: DateTimeSchema.nullable(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

// ================================
// API Response Schemas
// ================================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
});

export const PaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: PaginationSchema,
  });

// ================================
// FCM Schemas
// ================================

export const FCMCommandPayloadSchema = z.object({
  type: CommandTypeSchema,
  command_id: UUIDSchema,
  payload: z.record(z.any()).optional(),
});

// ================================
// Screenshot Schemas
// ================================

export const ScreenshotSessionSchema = z.object({
  sessionId: UUIDSchema,
  deviceId: UUIDSchema,
  isActive: z.boolean(),
  startedAt: DateTimeSchema,
  expiresAt: DateTimeSchema,
});

export const ScreenshotRequestSchema = z.object({
  sessionId: UUIDSchema,
  quality: z.number().int().min(1).max(100).default(80),
  maxWidth: z.number().int().min(100).max(4096).optional(),
  maxHeight: z.number().int().min(100).max(4096).optional(),
});

// ================================
// Query Parameter Schemas
// ================================

export const CommandFilterSchema = z.object({
  device_id: UUIDSchema.optional(),
  type: CommandTypeSchema.optional(),
  status: CommandStatusSchema.optional(),
  date_from: DateTimeSchema.optional(),
  date_to: DateTimeSchema.optional(),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});