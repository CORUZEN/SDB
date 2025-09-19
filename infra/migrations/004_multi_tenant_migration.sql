-- ================================================================
-- MIGRAÇÃO PARA SCHEMA MULTI-TENANT - FRIAXIS v4.0.0
-- Este arquivo aplica o novo schema multi-tenant preservando dados existentes
-- ================================================================

BEGIN;

-- ================================================================
-- BACKUP DE DADOS EXISTENTES
-- ================================================================

-- Criar tabelas temporárias para backup
CREATE TEMP TABLE backup_devices AS SELECT * FROM devices;
CREATE TEMP TABLE backup_policies AS SELECT * FROM policies;
CREATE TEMP TABLE backup_commands AS SELECT * FROM commands;
CREATE TEMP TABLE backup_events AS SELECT * FROM events;
CREATE TEMP TABLE backup_locations AS SELECT * FROM locations;
CREATE TEMP TABLE backup_users AS SELECT * FROM users;

-- ================================================================
-- APLICAR NOVO SCHEMA
-- ================================================================

-- Desabilitar RLS temporariamente
ALTER TABLE IF EXISTS devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS commands DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Droppar tabelas existentes (dados já estão em backup)
DROP TABLE IF EXISTS device_policies CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS commands CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Aplicar o novo schema completo
\i schema-multi-tenant.sql

-- ================================================================
-- MIGRAÇÃO DE DADOS EXISTENTES
-- ================================================================

-- 1. Criar organização padrão para dados existentes
INSERT INTO organizations (
    id, 
    name, 
    slug, 
    display_name, 
    contact_email, 
    status,
    plan_type
) VALUES (
    '00000000-0000-0000-0000-000000000999',
    'Default Organization',
    'default',
    'Organização Padrão',
    'admin@friaxis.com',
    'active',
    'enterprise'
) ON CONFLICT (slug) DO NOTHING;

-- 2. Migrar usuários existentes
INSERT INTO users (
    id,
    firebase_uid,
    email,
    display_name,
    is_active,
    created_at,
    updated_at
)
SELECT 
    id,
    firebase_uid,
    email,
    display_name,
    is_active,
    created_at,
    updated_at
FROM backup_users
ON CONFLICT (firebase_uid) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

-- 3. Criar memberships para usuários existentes na organização padrão
INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    status,
    joined_at
)
SELECT 
    '00000000-0000-0000-0000-000000000999',
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 'admin'
        WHEN u.role = 'operator' THEN 'operator'
        ELSE 'viewer'
    END,
    'active',
    u.created_at
FROM backup_users u
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 4. Migrar dispositivos existentes
INSERT INTO devices (
    id,
    organization_id,
    name,
    fcm_token,
    status,
    device_type,
    os_version,
    owner_name,
    tags,
    last_seen_at,
    first_enrolled_at,
    created_at,
    updated_at
)
SELECT 
    d.id,
    '00000000-0000-0000-0000-000000000999', -- organização padrão
    d.name,
    d.fcm_token,
    d.status,
    'smartphone', -- valor padrão
    d.os_version,
    d.owner,
    COALESCE(d.tags, '[]'::jsonb),
    d.last_seen_at,
    d.created_at,
    d.created_at,
    d.updated_at
FROM backup_devices d
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    fcm_token = EXCLUDED.fcm_token,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 5. Migrar políticas existentes
INSERT INTO policies (
    id,
    organization_id,
    name,
    description,
    policy_config,
    is_active,
    created_by,
    created_at,
    updated_at
)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000999', -- organização padrão
    p.name,
    p.description,
    p.policy_json,
    p.is_active,
    (SELECT id FROM users LIMIT 1), -- primeiro usuário como criador
    p.created_at,
    p.updated_at
FROM backup_policies p
ON CONFLICT (organization_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    policy_config = EXCLUDED.policy_config,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 6. Migrar comandos existentes
INSERT INTO commands (
    id,
    organization_id,
    device_id,
    type,
    payload,
    status,
    result,
    error_message,
    created_by,
    created_at,
    sent_at,
    executed_at
)
SELECT 
    c.id,
    '00000000-0000-0000-0000-000000000999', -- organização padrão
    c.device_id,
    c.type,
    c.payload_json,
    c.status,
    c.result_json,
    c.error_message,
    (SELECT id FROM users LIMIT 1), -- primeiro usuário como criador
    c.created_at,
    c.sent_at,
    c.executed_at
FROM backup_commands c
WHERE EXISTS (SELECT 1 FROM devices d WHERE d.id = c.device_id)
ON CONFLICT (id) DO NOTHING;

-- 7. Migrar eventos existentes
INSERT INTO events (
    id,
    organization_id,
    type,
    category,
    action,
    title,
    description,
    device_id,
    event_data,
    severity,
    source,
    occurred_at,
    created_at
)
SELECT 
    e.id,
    '00000000-0000-0000-0000-000000000999', -- organização padrão
    e.type,
    'system', -- categoria padrão
    'unknown', -- ação padrão
    COALESCE(e.description, e.type),
    e.description,
    e.device_id,
    COALESCE(e.data_json, '{}'),
    e.severity,
    'legacy_migration',
    e.created_at,
    e.created_at
FROM backup_events e
ON CONFLICT (id) DO NOTHING;

-- 8. Migrar localizações para nova tabela device_locations
INSERT INTO device_locations (
    id,
    organization_id,
    device_id,
    latitude,
    longitude,
    accuracy,
    altitude,
    speed,
    bearing,
    source,
    trigger_type,
    captured_at,
    created_at
)
SELECT 
    l.id,
    '00000000-0000-0000-0000-000000000999', -- organização padrão
    l.device_id,
    l.latitude,
    l.longitude,
    l.accuracy,
    l.altitude,
    l.speed,
    l.bearing,
    l.source,
    'legacy_migration',
    l.captured_at,
    l.created_at
FROM backup_locations l
WHERE EXISTS (SELECT 1 FROM devices d WHERE d.id = l.device_id)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- CONFIGURAÇÕES INICIAIS
-- ================================================================

-- Configurar organização padrão com configurações adequadas
UPDATE organizations 
SET settings = jsonb_build_object(
    'max_devices', 1000,
    'max_users', 50,
    'features', '["device_management", "policies", "location", "commands", "analytics", "alerts"]'::jsonb,
    'timezone', 'America/Sao_Paulo',
    'language', 'pt-BR',
    'notifications', jsonb_build_object(
        'email', true,
        'sms', false,
        'webhook', false
    )
)
WHERE id = '00000000-0000-0000-0000-000000000999';

-- Inserir configurações padrão da organização
INSERT INTO organization_settings (organization_id, category, key, value, description) VALUES
('00000000-0000-0000-0000-000000000999', 'general', 'company_name', '"FRIAXIS - Gestão de Dispositivos"', 'Nome da empresa'),
('00000000-0000-0000-0000-000000000999', 'general', 'timezone', '"America/Sao_Paulo"', 'Fuso horário padrão'),
('00000000-0000-0000-0000-000000000999', 'general', 'language', '"pt-BR"', 'Idioma padrão'),
('00000000-0000-0000-0000-000000000999', 'security', 'session_timeout', '7200', 'Timeout de sessão em segundos'),
('00000000-0000-0000-0000-000000000999', 'security', 'max_failed_logins', '5', 'Máximo de tentativas de login'),
('00000000-0000-0000-0000-000000000999', 'notifications', 'email_enabled', 'true', 'Notificações por email habilitadas'),
('00000000-0000-0000-0000-000000000999', 'notifications', 'alert_email', '"admin@friaxis.com"', 'Email para alertas críticos')
ON CONFLICT (organization_id, category, key) DO NOTHING;

-- ================================================================
-- CRIAR ALERTAS INICIAIS BASEADOS EM DADOS EXISTENTES
-- ================================================================

-- Alerta para dispositivos offline há muito tempo
INSERT INTO alerts (
    organization_id,
    title,
    message,
    alert_type,
    severity,
    category,
    device_id,
    status,
    first_occurred_at
)
SELECT 
    '00000000-0000-0000-0000-000000000999',
    'Dispositivo Offline',
    'Dispositivo "' || d.name || '" está offline há mais de 24 horas',
    'maintenance',
    'medium',
    'device_offline',
    d.id,
    'open',
    COALESCE(d.last_seen_at, d.created_at)
FROM devices d
WHERE d.status = 'offline'
AND (d.last_seen_at < NOW() - INTERVAL '24 hours' OR d.last_seen_at IS NULL)
LIMIT 10; -- Limitar para não criar muitos alertas

-- ================================================================
-- VALIDAÇÕES E VERIFICAÇÕES
-- ================================================================

-- Verificar se todos os dados foram migrados corretamente
DO $$
DECLARE
    backup_count INTEGER;
    migrated_count INTEGER;
    table_name TEXT;
BEGIN
    -- Verificar devices
    SELECT COUNT(*) INTO backup_count FROM backup_devices;
    SELECT COUNT(*) INTO migrated_count FROM devices WHERE organization_id = '00000000-0000-0000-0000-000000000999';
    
    IF backup_count != migrated_count THEN
        RAISE WARNING 'ATENÇÃO: Devices migrados (%) diferente do backup (%)', migrated_count, backup_count;
    ELSE
        RAISE NOTICE 'SUCESSO: % devices migrados corretamente', migrated_count;
    END IF;
    
    -- Verificar policies
    SELECT COUNT(*) INTO backup_count FROM backup_policies;
    SELECT COUNT(*) INTO migrated_count FROM policies WHERE organization_id = '00000000-0000-0000-0000-000000000999';
    
    IF backup_count != migrated_count THEN
        RAISE WARNING 'ATENÇÃO: Políticas migradas (%) diferente do backup (%)', migrated_count, backup_count;
    ELSE
        RAISE NOTICE 'SUCESSO: % políticas migradas corretamente', migrated_count;
    END IF;
    
    -- Verificar commands
    SELECT COUNT(*) INTO backup_count FROM backup_commands;
    SELECT COUNT(*) INTO migrated_count FROM commands WHERE organization_id = '00000000-0000-0000-0000-000000000999';
    
    IF backup_count != migrated_count THEN
        RAISE WARNING 'ATENÇÃO: Comandos migrados (%) diferente do backup (%)', migrated_count, backup_count;
    ELSE
        RAISE NOTICE 'SUCESSO: % comandos migrados corretamente', migrated_count;
    END IF;
END $$;

-- ================================================================
-- FINALIZAÇÃO
-- ================================================================

-- Atualizar estatísticas das tabelas
ANALYZE organizations;
ANALYZE users;
ANALYZE organization_members;
ANALYZE devices;
ANALYZE policies;
ANALYZE commands;
ANALYZE events;
ANALYZE device_locations;
ANALYZE alerts;

-- Registrar evento de migração
INSERT INTO events (
    organization_id,
    type,
    category,
    action,
    title,
    description,
    severity,
    source,
    event_data
) VALUES (
    '00000000-0000-0000-0000-000000000999',
    'system.migration',
    'system',
    'completed',
    'Migração Multi-tenant Concluída',
    'Sistema migrado com sucesso para arquitetura multi-tenant v4.0.0',
    'info',
    'migration_script',
    jsonb_build_object(
        'version', '4.0.0',
        'migration_date', NOW(),
        'devices_migrated', (SELECT COUNT(*) FROM devices),
        'policies_migrated', (SELECT COUNT(*) FROM policies),
        'commands_migrated', (SELECT COUNT(*) FROM commands)
    )
);

COMMIT;

-- ================================================================
-- RELATÓRIO FINAL
-- ================================================================

\echo '==============================================='
\echo 'MIGRAÇÃO MULTI-TENANT CONCLUÍDA COM SUCESSO!'
\echo '==============================================='

SELECT 
    'RESUMO DA MIGRAÇÃO' as status,
    (SELECT COUNT(*) FROM organizations) as organizations_total,
    (SELECT COUNT(*) FROM users) as users_total,
    (SELECT COUNT(*) FROM devices) as devices_total,
    (SELECT COUNT(*) FROM policies) as policies_total,
    (SELECT COUNT(*) FROM commands) as commands_total,
    (SELECT COUNT(*) FROM events) as events_total,
    (SELECT COUNT(*) FROM device_locations) as locations_total,
    (SELECT COUNT(*) FROM alerts) as alerts_total;

\echo ''
\echo 'PRÓXIMOS PASSOS:'
\echo '1. Atualizar variáveis de ambiente com ORGANIZATION_ID padrão'
\echo '2. Testar APIs com novo contexto multi-tenant'
\echo '3. Atualizar frontend para suportar seleção de organização'
\echo '4. Configurar RLS policies em produção'
\echo '==============================================='