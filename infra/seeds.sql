-- Dados de exemplo para desenvolvimento e testes

-- Inserir usuário admin padrão (será sobrescrito pelo Firebase Auth)
INSERT INTO users (firebase_uid, email, display_name, role) VALUES 
('dev-admin-uid', 'admin@coruzen.com', 'Admin SDB', 'admin')
ON CONFLICT (firebase_uid) DO NOTHING;

-- Inserir políticas de exemplo
INSERT INTO policies (name, description, policy_json) VALUES 
(
    'Política Básica Corporativa',
    'Política padrão para dispositivos corporativos com configurações essenciais de segurança',
    '{
        "launcher_apps": ["com.android.chrome", "com.microsoft.office.outlook", "com.slack"],
        "blocked_apps": ["com.facebook.katana", "com.instagram.android"],
        "kiosk_mode": true,
        "allow_unknown_sources": false,
        "require_pin": true,
        "min_pin_length": 6,
        "allow_usb_debugging": false,
        "force_encrypt": true,
        "wipe_on_failures": 10
    }'::jsonb
),
(
    'Política Restritiva',
    'Política com máxima segurança para ambientes sensíveis',
    '{
        "launcher_apps": ["com.android.settings"],
        "blocked_apps": ["*"],
        "kiosk_mode": true,
        "allow_unknown_sources": false,
        "require_pin": true,
        "min_pin_length": 8,
        "allow_usb_debugging": false,
        "force_encrypt": true,
        "wipe_on_failures": 5,
        "disable_camera": true,
        "disable_bluetooth": true,
        "disable_wifi_config": true
    }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Inserir dispositivos de exemplo para desenvolvimento
INSERT INTO devices (name, status, owner, tags, battery_level, os_version) VALUES 
(
    'Tablet Recepção 01',
    'offline',
    'admin@coruzen.com',
    '["recepção", "tablet", "lobby"]'::jsonb,
    85,
    'Android 12'
),
(
    'Smartphone Supervisor',
    'offline', 
    'admin@coruzen.com',
    '["supervisor", "mobile", "campo"]'::jsonb,
    67,
    'Android 13'
)
ON CONFLICT DO NOTHING;

-- Inserir alguns eventos de exemplo
INSERT INTO events (device_id, type, description, data_json, severity) 
SELECT 
    d.id,
    'DEVICE_REGISTERED',
    'Dispositivo registrado no sistema',
    '{"source": "seed_data", "initial_setup": true}'::jsonb,
    'info'
FROM devices d
WHERE d.name IN ('Tablet Recepção 01', 'Smartphone Supervisor');