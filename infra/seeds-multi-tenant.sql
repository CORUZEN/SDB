-- Dados de Seed para o Sistema Multi-tenant FRIAXIS v4.0.0
-- Este arquivo contém dados de exemplo para testar o funcionamento do sistema

-- ================================
-- Organizações de Exemplo
-- ================================

-- Organização 1: Empresa Teste (Professional)
INSERT INTO organizations (
    id, name, slug, display_name, description, contact_email, phone, website,
    settings, plan_type, plan_limits, status, created_at, updated_at
) VALUES (
    'org_test_001',
    'Empresa Teste Ltda',
    'empresa-teste',
    'Empresa Teste Ltda',
    'Empresa de teste para validação do sistema multi-tenant',
    'contato@empresateste.com',
    '+55 11 99999-9999',
    'https://empresateste.com',
    '{
        "max_devices": 100,
        "max_users": 15,
        "features": ["device_management", "advanced_policies", "location_tracking", "alerts", "analytics"],
        "timezone": "America/Sao_Paulo",
        "language": "pt-BR",
        "notifications": {"email": true, "sms": false, "webhook": true}
    }'::jsonb,
    'professional',
    '{
        "devices": 100,
        "users": 15,
        "storage_gb": 25,
        "api_calls_month": 15000
    }'::jsonb,
    'active',
    NOW(),
    NOW()
);

-- Organização 2: TechCorp (Enterprise)
INSERT INTO organizations (
    id, name, slug, display_name, description, contact_email, phone,
    settings, plan_type, plan_limits, status, created_at, updated_at
) VALUES (
    'org_techcorp_002',
    'TechCorp Solutions',
    'techcorp-solutions',
    'TechCorp Solutions Inc.',
    'Empresa de tecnologia enterprise',
    'admin@techcorp.com',
    '+55 21 88888-8888',
    '{
        "max_devices": 1000,
        "max_users": 50,
        "features": ["device_management", "enterprise_policies", "location_tracking", "geofencing", "alerts", "enterprise_analytics", "api_access", "sso_integration"],
        "timezone": "America/Sao_Paulo",
        "language": "pt-BR",
        "notifications": {"email": true, "sms": true, "webhook": true}
    }'::jsonb,
    'enterprise',
    '{
        "devices": 1000,
        "users": 50,
        "storage_gb": 100,
        "api_calls_month": 50000
    }'::jsonb,
    'active',
    NOW(),
    NOW()
);

-- Organização 3: StartupTech (Trial)
INSERT INTO organizations (
    id, name, slug, display_name, description, contact_email,
    settings, plan_type, plan_limits, status, trial_ends_at, created_at, updated_at
) VALUES (
    'org_startup_003',
    'StartupTech',
    'startuptech',
    'StartupTech Innovation',
    'Startup em período de trial',
    'hello@startuptech.io',
    '{
        "max_devices": 5,
        "max_users": 2,
        "features": ["device_management", "basic_policies", "location_tracking", "basic_analytics"],
        "timezone": "America/Sao_Paulo",
        "language": "pt-BR",
        "notifications": {"email": true, "sms": false, "webhook": false}
    }'::jsonb,
    'trial',
    '{
        "devices": 5,
        "users": 2,
        "storage_gb": 1,
        "api_calls_month": 1000
    }'::jsonb,
    'active',
    NOW() + INTERVAL '14 days',
    NOW(),
    NOW()
);

-- ================================
-- Usuários de Exemplo
-- ================================

-- Usuário Admin da Empresa Teste
INSERT INTO users (
    id, firebase_uid, email, email_verified, display_name, 
    preferences, login_count, two_factor_enabled, is_active, is_verified,
    created_at, updated_at
) VALUES (
    'user_admin_001',
    'firebase_uid_admin_001',
    'admin@empresateste.com',
    true,
    'João Administrador',
    '{
        "timezone": "America/Sao_Paulo",
        "language": "pt-BR",
        "theme": "light",
        "notifications": {"email": true, "push": true, "desktop": true},
        "dashboard": {"default_view": "dashboard", "widgets": ["device_status", "recent_alerts", "compliance"]}
    }'::jsonb,
    5,
    false,
    true,
    true,
    NOW() - INTERVAL '30 days',
    NOW()
);

-- Usuário Operador da Empresa Teste
INSERT INTO users (
    id, firebase_uid, email, email_verified, display_name,
    preferences, login_count, two_factor_enabled, is_active, is_verified,
    created_at, updated_at
) VALUES (
    'user_operator_002',
    'firebase_uid_operator_002',
    'operador@empresateste.com',
    true,
    'Maria Operadora',
    '{
        "timezone": "America/Sao_Paulo",
        "language": "pt-BR",
        "theme": "dark",
        "notifications": {"email": true, "push": false, "desktop": true},
        "dashboard": {"default_view": "devices", "widgets": ["device_status", "recent_events"]}
    }'::jsonb,
    12,
    true,
    true,
    true,
    NOW() - INTERVAL '15 days',
    NOW()
);

-- Usuário Admin da TechCorp
INSERT INTO users (
    id, firebase_uid, email, email_verified, display_name,
    preferences, login_count, two_factor_enabled, is_active, is_verified,
    created_at, updated_at
) VALUES (
    'user_techcorp_003',
    'firebase_uid_techcorp_003',
    'admin@techcorp.com',
    true,
    'Carlos Enterprise',
    '{
        "timezone": "America/Sao_Paulo",
        "language": "pt-BR",
        "theme": "light",
        "notifications": {"email": true, "push": true, "desktop": true},
        "dashboard": {"default_view": "analytics", "widgets": ["device_status", "compliance", "analytics_overview"]}
    }'::jsonb,
    25,
    true,
    true,
    true,
    NOW() - INTERVAL '60 days',
    NOW()
);

-- ================================
-- Memberships das Organizações
-- ================================

-- Admin da Empresa Teste
INSERT INTO organization_members (
    id, organization_id, user_id, role, permissions, status, joined_at, created_at, updated_at
) VALUES (
    'member_001',
    'org_test_001',
    'user_admin_001',
    'owner',
    '{
        "devices": {"read": true, "write": true, "delete": true},
        "policies": {"read": true, "write": true, "delete": true},
        "users": {"read": true, "write": true, "delete": true},
        "analytics": {"read": true},
        "settings": {"read": true, "write": true}
    }'::jsonb,
    'active',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    NOW()
);

-- Operador da Empresa Teste
INSERT INTO organization_members (
    id, organization_id, user_id, role, permissions, status, joined_at, created_at, updated_at
) VALUES (
    'member_002',
    'org_test_001',
    'user_operator_002',
    'operator',
    '{
        "devices": {"read": true, "write": true, "delete": false},
        "policies": {"read": true, "write": false, "delete": false},
        "users": {"read": true, "write": false, "delete": false},
        "analytics": {"read": true},
        "settings": {"read": true, "write": false}
    }'::jsonb,
    'active',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days',
    NOW()
);

-- Admin da TechCorp
INSERT INTO organization_members (
    id, organization_id, user_id, role, permissions, status, joined_at, created_at, updated_at
) VALUES (
    'member_003',
    'org_techcorp_002',
    'user_techcorp_003',
    'owner',
    '{
        "devices": {"read": true, "write": true, "delete": true},
        "policies": {"read": true, "write": true, "delete": true},
        "users": {"read": true, "write": true, "delete": true},
        "analytics": {"read": true},
        "settings": {"read": true, "write": true}
    }'::jsonb,
    'active',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days',
    NOW()
);

-- ================================
-- Subscriptions
-- ================================

-- Subscription da Empresa Teste
INSERT INTO subscriptions (
    id, organization_id, status, plan_type, amount_cents, currency, billing_cycle,
    current_period_start, current_period_end, metadata, created_at, updated_at
) VALUES (
    'sub_test_001',
    'org_test_001',
    'active',
    'professional',
    4990,
    'BRL',
    'monthly',
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days',
    '{"created_via": "seed", "payment_method": "credit_card"}'::jsonb,
    NOW() - INTERVAL '30 days',
    NOW()
);

-- Subscription da TechCorp
INSERT INTO subscriptions (
    id, organization_id, status, plan_type, amount_cents, currency, billing_cycle,
    current_period_start, current_period_end, metadata, created_at, updated_at
) VALUES (
    'sub_techcorp_002',
    'org_techcorp_002',
    'active',
    'enterprise',
    99900,
    'BRL',
    'yearly',
    NOW() - INTERVAL '60 days',
    NOW() + INTERVAL '305 days',
    '{"created_via": "seed", "payment_method": "bank_transfer", "contract": "annual"}'::jsonb,
    NOW() - INTERVAL '60 days',
    NOW()
);

-- ================================
-- Dispositivos de Exemplo
-- ================================

-- Dispositivos da Empresa Teste
INSERT INTO devices (
    id, organization_id, name, device_identifier, serial_number, status, health_score,
    compliance_status, device_type, manufacturer, model, os_type, os_version, app_version,
    owner_name, owner_email, department, location_name, tags, metadata, settings,
    last_seen_at, last_checkin_at, first_enrolled_at, enrolled_by, created_at, updated_at
) VALUES 
(
    'device_test_001',
    'org_test_001',
    'Samsung Galaxy A54 - João',
    'SM-A546B-001',
    'R58R703DVCR',
    'online',
    95,
    'compliant',
    'smartphone',
    'Samsung',
    'Galaxy A54 5G',
    'android',
    '14',
    '3.0.0',
    'João Silva',
    'joao.silva@empresateste.com',
    'Vendas',
    'Escritório SP',
    '["vendas", "campo"]'::jsonb,
    '{"imei": "356938035643809", "phone_number": "+5511999887766"}'::jsonb,
    '{"auto_update": true, "backup_enabled": true, "location_tracking": true, "screenshot_allowed": false, "remote_wipe_enabled": true}'::jsonb,
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '2 minutes',
    NOW() - INTERVAL '30 days',
    'user_admin_001',
    NOW() - INTERVAL '30 days',
    NOW()
),
(
    'device_test_002',
    'org_test_001',
    'iPhone 14 Pro - Maria',
    'iPhone15,3-002',
    'F2LNX1YZPQ',
    'offline',
    88,
    'non_compliant',
    'smartphone',
    'Apple',
    'iPhone 14 Pro',
    'ios',
    '17.1.2',
    '3.0.0',
    'Maria Santos',
    'maria.santos@empresateste.com',
    'Marketing',
    'Escritório RJ',
    '["marketing", "executivo"]'::jsonb,
    '{"imei": "356123456789012", "phone_number": "+5521988776655"}'::jsonb,
    '{"auto_update": true, "backup_enabled": true, "location_tracking": false, "screenshot_allowed": true, "remote_wipe_enabled": true}'::jsonb,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '15 days',
    'user_admin_001',
    NOW() - INTERVAL '15 days',
    NOW()
);

-- Dispositivos da TechCorp
INSERT INTO devices (
    id, organization_id, name, device_identifier, serial_number, status, health_score,
    compliance_status, device_type, manufacturer, model, os_type, os_version, app_version,
    owner_name, owner_email, department, location_name, tags, metadata, settings,
    last_seen_at, last_checkin_at, first_enrolled_at, enrolled_by, created_at, updated_at
) VALUES 
(
    'device_techcorp_001',
    'org_techcorp_002',
    'Surface Pro 9 - Carlos',
    'Surface-Pro-9-001',
    'SFP9001XYZ',
    'online',
    92,
    'compliant',
    'tablet',
    'Microsoft',
    'Surface Pro 9',
    'windows',
    '11',
    '3.0.0',
    'Carlos Enterprise',
    'carlos@techcorp.com',
    'TI',
    'Matriz RJ',
    '["executive", "it"]'::jsonb,
    '{"serial": "SFP9001XYZ", "asset_tag": "TC-001"}'::jsonb,
    '{"auto_update": true, "backup_enabled": true, "location_tracking": true, "screenshot_allowed": true, "remote_wipe_enabled": true}'::jsonb,
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '60 days',
    'user_techcorp_003',
    NOW() - INTERVAL '60 days',
    NOW()
);

-- ================================
-- Telemetria de Exemplo
-- ================================

INSERT INTO device_telemetry (
    id, device_id, organization_id, battery_level, battery_status, storage_total_gb,
    storage_used_gb, storage_available_gb, ram_total_mb, ram_used_mb, ram_available_mb,
    cpu_usage_percent, network_type, wifi_ssid, wifi_strength, ip_address,
    app_in_foreground, installed_apps_count, is_rooted, is_developer_mode_enabled,
    screen_lock_enabled, latitude, longitude, location_accuracy, location_source,
    captured_at, received_at
) VALUES 
(
    'telemetry_001',
    'device_test_001',
    'org_test_001',
    85,
    'charging',
    128,
    45,
    83,
    8192,
    3500,
    4692,
    12.5,
    'wifi',
    'EmpresaTeste-WiFi',
    -45,
    '192.168.1.105',
    'com.friaxis.mdm',
    156,
    false,
    false,
    true,
    -23.5505,
    -46.6333,
    10.0,
    'gps',
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '4 minutes'
),
(
    'telemetry_002',
    'device_techcorp_001',
    'org_techcorp_002',
    67,
    'discharging',
    512,
    234,
    278,
    16384,
    8900,
    7484,
    25.3,
    'ethernet',
    null,
    null,
    '10.0.1.50',
    'Microsoft.Office.Desktop',
    89,
    false,
    false,
    true,
    -22.9068,
    -43.1729,
    15.0,
    'network',
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '8 minutes'
);

-- ================================
-- Políticas de Exemplo
-- ================================

INSERT INTO policies (
    id, organization_id, name, description, category, priority, policy_config,
    launcher_apps, blocked_apps, required_apps, kiosk_mode, require_pin,
    min_pin_length, max_failed_attempts, auto_lock_timeout, disable_camera,
    disable_bluetooth, disable_wifi_config, disable_usb_debugging, force_encrypt,
    compliance_rules, audit_settings, is_active, version, tags, metadata,
    created_by, created_at, updated_at
) VALUES 
(
    'policy_test_001',
    'org_test_001',
    'Política Padrão Vendas',
    'Política padrão para equipe de vendas',
    'security',
    1,
    '{"type": "standard", "enforcement_level": "medium"}'::jsonb,
    '["com.friaxis.mdm", "com.android.dialer", "com.whatsapp"]'::jsonb,
    '["com.facebook.katana", "com.instagram.android"]'::jsonb,
    '["com.friaxis.mdm"]'::jsonb,
    false,
    true,
    6,
    3,
    300,
    false,
    false,
    true,
    true,
    true,
    '{"password_policy": {"min_length": 8, "require_special": true}}'::jsonb,
    '{"log_app_usage": true, "log_location": true, "log_network": false, "retention_days": 90}'::jsonb,
    true,
    1,
    '["vendas", "padrão"]'::jsonb,
    '{"created_via": "seed"}'::jsonb,
    'user_admin_001',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '5 days'
),
(
    'policy_techcorp_001',
    'org_techcorp_002',
    'Política Enterprise TI',
    'Política restritiva para departamento de TI',
    'security',
    1,
    '{"type": "enterprise", "enforcement_level": "high"}'::jsonb,
    '["com.friaxis.mdm", "com.microsoft.office.suite"]'::jsonb,
    '["com.facebook.katana", "com.instagram.android", "com.tiktok"]'::jsonb,
    '["com.friaxis.mdm", "com.microsoft.authenticator"]'::jsonb,
    false,
    true,
    8,
    2,
    180,
    true,
    true,
    true,
    true,
    true,
    '{"password_policy": {"min_length": 12, "require_special": true, "require_numbers": true}}'::jsonb,
    '{"log_app_usage": true, "log_location": true, "log_network": true, "retention_days": 365}'::jsonb,
    true,
    2,
    '["ti", "enterprise", "security"]'::jsonb,
    '{"created_via": "seed", "compliance_required": true}'::jsonb,
    'user_techcorp_003',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '10 days'
);

-- ================================
-- Comandos de Exemplo
-- ================================

INSERT INTO commands (
    id, organization_id, device_id, type, category, priority, payload, timeout_seconds,
    retry_policy, status, result, fcm_message_id, delivery_attempts, created_at,
    scheduled_at, sent_at, executed_at, completed_at, created_by, reason, metadata
) VALUES 
(
    'cmd_001',
    'org_test_001',
    'device_test_001',
    'LOCATE_NOW',
    'location',
    1,
    '{"accuracy": "high", "timeout": 30}'::jsonb,
    60,
    '{"max_retries": 3, "retry_delay_seconds": 30, "exponential_backoff": true}'::jsonb,
    'success',
    '{"latitude": -23.5505, "longitude": -46.6333, "accuracy": 8.5, "timestamp": "2024-01-15T10:30:00Z"}'::jsonb,
    'fcm_msg_001_xyz',
    1,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '58 minutes',
    NOW() - INTERVAL '57 minutes',
    NOW() - INTERVAL '57 minutes',
    'user_operator_002',
    'Localização solicitada pelo operador',
    '{"source": "dashboard", "manual": true}'::jsonb
),
(
    'cmd_002',
    'org_techcorp_002',
    'device_techcorp_001',
    'PING',
    'connectivity',
    1,
    '{}'::jsonb,
    30,
    '{"max_retries": 2, "retry_delay_seconds": 15, "exponential_backoff": false}'::jsonb,
    'success',
    '{"response_time_ms": 45, "status": "online"}'::jsonb,
    'fcm_msg_002_abc',
    1,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '29 minutes',
    NOW() - INTERVAL '28 minutes',
    NOW() - INTERVAL '28 minutes',
    'user_techcorp_003',
    'Teste de conectividade automático',
    '{"source": "monitoring", "automatic": true}'::jsonb
);

-- ================================
-- Eventos de Exemplo
-- ================================

INSERT INTO events (
    id, organization_id, type, category, action, entity_type, entity_id, device_id,
    user_id, title, description, event_data, severity, risk_level, source,
    compliance_relevant, retention_policy, tags, metadata, occurred_at, created_at
) VALUES 
(
    'event_001',
    'org_test_001',
    'device.checkin',
    'device_activity',
    'checkin',
    'device',
    'device_test_001',
    'device_test_001',
    null,
    'Device Check-in',
    'Dispositivo realizou check-in automático',
    '{"battery_level": 85, "app_version": "3.0.0", "location": {"lat": -23.5505, "lng": -46.6333}}'::jsonb,
    'info',
    'low',
    'device_agent',
    false,
    'standard',
    '["device", "checkin", "automatic"]'::jsonb,
    '{"automatic": true}'::jsonb,
    NOW() - INTERVAL '2 minutes',
    NOW() - INTERVAL '2 minutes'
),
(
    'event_002',
    'org_test_001',
    'policy.violation',
    'security',
    'app_blocked',
    'device',
    'device_test_002',
    'device_test_002',
    null,
    'App Bloqueado',
    'Tentativa de acesso a aplicativo bloqueado detectada',
    '{"blocked_app": "com.facebook.katana", "policy_id": "policy_test_001", "action_taken": "blocked"}'::jsonb,
    'warning',
    'medium',
    'policy_engine',
    true,
    'compliance',
    '["policy", "violation", "app_blocked"]'::jsonb,
    '{"policy_enforced": true, "compliance_impact": "medium"}'::jsonb,
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '45 minutes'
),
(
    'event_003',
    'org_techcorp_002',
    'user.login',
    'authentication',
    'login_success',
    'user',
    'user_techcorp_003',
    null,
    'user_techcorp_003',
    'Login Realizado',
    'Usuário realizou login no sistema',
    '{"ip_address": "10.0.1.50", "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "session_id": "sess_xyz_123"}'::jsonb,
    'info',
    'low',
    'auth_system',
    true,
    'audit',
    '["authentication", "login", "success"]'::jsonb,
    '{"session_created": true, "mfa_used": true}'::jsonb,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
);

-- ================================
-- Alertas de Exemplo
-- ================================

INSERT INTO alerts (
    id, organization_id, title, message, alert_type, severity, category,
    priority, device_id, user_id, policy_id, status, alert_data,
    auto_resolve, notification_sent, notification_channels, first_occurred_at,
    last_occurred_at, occurrence_count, tags, metadata, created_at, updated_at
) VALUES 
(
    'alert_001',
    'org_test_001',
    'Dispositivo Offline',
    'Dispositivo iPhone 14 Pro - Maria está offline há mais de 2 horas',
    'device_offline',
    'medium',
    'connectivity',
    2,
    'device_test_002',
    null,
    null,
    'open',
    '{"last_seen": "2024-01-15T08:00:00Z", "offline_duration_minutes": 125}'::jsonb,
    true,
    true,
    '["email", "web"]'::jsonb,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours',
    1,
    '["device", "offline", "connectivity"]'::jsonb,
    '{"auto_escalate": false, "sla_hours": 4}'::jsonb,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
),
(
    'alert_002',
    'org_test_001',
    'Violação de Política',
    'Tentativa de instalação de app não autorizado detectada',
    'policy_violation',
    'high',
    'security',
    1,
    'device_test_002',
    null,
    'policy_test_001',
    'acknowledged',
    '{"violation_type": "app_installation", "blocked_app": "com.facebook.katana", "user_action": "install_attempt"}'::jsonb,
    false,
    true,
    '["email", "web", "push"]'::jsonb,
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '45 minutes',
    1,
    '["policy", "violation", "security", "high_priority"]'::jsonb,
    '{"requires_action": true, "compliance_impact": "high"}'::jsonb,
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '30 minutes'
),
(
    'alert_003',
    'org_techcorp_002',
    'Dispositivo em Local Não Autorizado',
    'Dispositivo detectado fora da geofence autorizada',
    'geofence_violation',
    'critical',
    'location',
    1,
    'device_techcorp_001',
    'user_techcorp_003',
    null,
    'resolved',
    '{"current_location": {"lat": -22.9068, "lng": -43.1729}, "authorized_zone": "office_zone", "distance_km": 15.2}'::jsonb,
    false,
    true,
    '["email", "sms", "web"]'::jsonb,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours',
    1,
    '["geofence", "location", "security", "critical"]'::jsonb,
    '{"resolution": "device_returned", "resolved_by": "user_techcorp_003"}'::jsonb,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '1 hour'
);

-- ================================
-- Configurações da Organização
-- ================================

INSERT INTO organization_settings (
    id, organization_id, category, key, value, description, is_encrypted,
    is_public, version, created_at, updated_at
) VALUES 
(
    'setting_001',
    'org_test_001',
    'notifications',
    'email_alerts_enabled',
    'true',
    'Habilitar alertas por email',
    false,
    false,
    1,
    NOW(),
    NOW()
),
(
    'setting_002',
    'org_test_001',
    'security',
    'max_failed_login_attempts',
    '3',
    'Máximo de tentativas de login falhadas',
    false,
    false,
    1,
    NOW(),
    NOW()
),
(
    'setting_003',
    'org_techcorp_002',
    'compliance',
    'audit_retention_days',
    '2555',
    'Dias de retenção de logs de auditoria (7 anos)',
    false,
    false,
    1,
    NOW(),
    NOW()
);

-- ================================
-- Métricas de Analytics
-- ================================

INSERT INTO analytics_metrics (
    id, organization_id, metric_name, metric_type, dimensions, value,
    value_type, unit, period_start, period_end, granularity, metadata,
    calculated_at, created_at
) VALUES 
(
    'metric_001',
    'org_test_001',
    'devices_online_count',
    'count',
    '{"status": "online"}'::jsonb,
    1,
    'integer',
    'devices',
    NOW() - INTERVAL '1 hour',
    NOW(),
    'hourly',
    '{"calculation_method": "distinct_count"}'::jsonb,
    NOW(),
    NOW()
),
(
    'metric_002',
    'org_test_001',
    'policy_compliance_rate',
    'percentage',
    '{"category": "security"}'::jsonb,
    75.5,
    'decimal',
    'percent',
    NOW() - INTERVAL '1 day',
    NOW(),
    'daily',
    '{"total_devices": 2, "compliant_devices": 1.5}'::jsonb,
    NOW(),
    NOW()
),
(
    'metric_003',
    'org_techcorp_002',
    'average_battery_level',
    'average',
    '{"device_type": "tablet"}'::jsonb,
    67.0,
    'decimal',
    'percent',
    NOW() - INTERVAL '1 hour',
    NOW(),
    'hourly',
    '{"sample_size": 1}'::jsonb,
    NOW(),
    NOW()
);

-- ================================
-- Confirmação dos Dados
-- ================================

-- Exibir resumo dos dados inseridos
DO $$
BEGIN
    RAISE NOTICE '=== DADOS DE SEED APLICADOS COM SUCESSO ===';
    RAISE NOTICE 'Organizações: %', (SELECT COUNT(*) FROM organizations);
    RAISE NOTICE 'Usuários: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Memberships: %', (SELECT COUNT(*) FROM organization_members);
    RAISE NOTICE 'Dispositivos: %', (SELECT COUNT(*) FROM devices);
    RAISE NOTICE 'Políticas: %', (SELECT COUNT(*) FROM policies);
    RAISE NOTICE 'Comandos: %', (SELECT COUNT(*) FROM commands);
    RAISE NOTICE 'Eventos: %', (SELECT COUNT(*) FROM events);
    RAISE NOTICE 'Alertas: %', (SELECT COUNT(*) FROM alerts);
    RAISE NOTICE 'Métricas: %', (SELECT COUNT(*) FROM analytics_metrics);
    RAISE NOTICE '==========================================';
END $$;