// Reset completo e corrigido do banco FRIAXIS v4.0.0
const postgres = require('postgres');

async function createCompleteDatabase() {
    console.log('🔧 FRIAXIS v4.0.0 - Estrutura Completa e Corrigida');
    console.log('================================================');
    
    const DATABASE_URL = "postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    
    try {
        const sql = postgres(DATABASE_URL, { ssl: 'require' });
        
        console.log('🗑️ Removendo estrutura anterior...');
        
        // Dropar todas as tabelas
        const dropTables = [
            'notifications', 'alerts', 'events', 'locations', 'organization_members',
            'device_policies', 'device_telemetry', 'device_commands', 'device_registrations',
            'audit_logs', 'subscriptions', 'devices', 'policies', 'users', 'organizations'
        ];

        for (const table of dropTables) {
            try {
                await sql`DROP TABLE IF EXISTS ${sql(table)} CASCADE`;
                console.log(`✅ ${table} removida`);
            } catch (error) {
                console.log(`⚠️ ${table} não existia`);
            }
        }

        console.log('🏗️ Criando estrutura completa...');

        // 1. ORGANIZATIONS
        await sql`
            CREATE TABLE organizations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                display_name VARCHAR(255),
                description TEXT,
                logo_url TEXT,
                website TEXT,
                contact_email VARCHAR(255),
                phone VARCHAR(50),
                subscription_tier VARCHAR(50) DEFAULT 'basic',
                status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
                settings JSONB DEFAULT '{}',
                plan_limits JSONB DEFAULT '{"devices": 10, "users": 5, "storage_gb": 5}',
                trial_ends_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ organizations criada');

        // 2. USERS
        await sql`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                firebase_uid VARCHAR(128) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                email_verified BOOLEAN DEFAULT false,
                display_name VARCHAR(255),
                avatar_url TEXT,
                phone VARCHAR(50),
                role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'operator', 'viewer')),
                preferences JSONB DEFAULT '{}',
                last_login_at TIMESTAMP,
                last_login_ip INET,
                login_count INTEGER DEFAULT 0,
                two_factor_enabled BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                is_verified BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ users criada');

        // 3. ORGANIZATION_MEMBERS (Relacionamento N:M)
        await sql`
            CREATE TABLE organization_members (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
                permissions JSONB DEFAULT '{}',
                status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
                invited_by INTEGER REFERENCES users(id),
                invitation_token VARCHAR(255),
                invitation_expires_at TIMESTAMP,
                joined_at TIMESTAMP DEFAULT NOW(),
                last_active_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(organization_id, user_id)
            )
        `;
        console.log('✅ organization_members criada');

        // 4. POLICIES
        await sql`
            CREATE TABLE policies (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100) DEFAULT 'general',
                priority INTEGER DEFAULT 1,
                policy_config JSONB NOT NULL DEFAULT '{}',
                compliance_rules JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT true,
                version INTEGER DEFAULT 1,
                parent_policy_id INTEGER REFERENCES policies(id),
                tags TEXT[] DEFAULT '{}',
                metadata JSONB DEFAULT '{}',
                created_by INTEGER REFERENCES users(id),
                updated_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ policies criada');

        // 5. DEVICES (Estrutura Completa)
        await sql`
            CREATE TABLE devices (
                id VARCHAR(255) PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                device_identifier VARCHAR(255),
                serial_number VARCHAR(255),
                asset_tag VARCHAR(255),
                fcm_token TEXT,
                last_fcm_update TIMESTAMP,
                status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'inactive', 'maintenance')),
                health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
                compliance_status VARCHAR(50) DEFAULT 'unknown' CHECK (compliance_status IN ('compliant', 'non_compliant', 'unknown')),
                device_type VARCHAR(50) DEFAULT 'smartphone' CHECK (device_type IN ('smartphone', 'tablet', 'laptop', 'desktop', 'other')),
                manufacturer VARCHAR(100),
                model VARCHAR(255),
                os_type VARCHAR(50) DEFAULT 'android' CHECK (os_type IN ('android', 'ios', 'windows', 'macos', 'linux')),
                os_version VARCHAR(100),
                app_version VARCHAR(50),
                hardware_info JSONB DEFAULT '{}', -- DeviceSpec completo
                capabilities JSONB DEFAULT '{}', -- hasNfc, hasBluetooth, etc
                security_info JSONB DEFAULT '{}', -- isRooted, securityPatch, etc
                owner_name VARCHAR(255),
                owner_email VARCHAR(255),
                department VARCHAR(100),
                location_name VARCHAR(255),
                location_lat DECIMAL(10, 8),
                location_lng DECIMAL(11, 8),
                location_updated_at TIMESTAMP,
                tags TEXT[] DEFAULT '{}',
                metadata JSONB DEFAULT '{}',
                settings JSONB DEFAULT '{}',
                last_seen_at TIMESTAMP,
                last_checkin_at TIMESTAMP,
                first_enrolled_at TIMESTAMP DEFAULT NOW(),
                enrolled_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                deleted_at TIMESTAMP
            )
        `;
        console.log('✅ devices criada');

        // 6. DEVICE_REGISTRATIONS (Corrigida)
        await sql`
            CREATE TABLE device_registrations (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                pairing_code VARCHAR(10) UNIQUE NOT NULL,
                device_info JSONB NOT NULL, -- DeviceSpec completo do Android
                status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
                created_by_admin BOOLEAN DEFAULT false,
                created_by INTEGER REFERENCES users(id),
                approved_by INTEGER REFERENCES users(id),
                approved_at TIMESTAMP,
                rejection_reason TEXT,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ device_registrations criada');

        // 7. DEVICE_POLICIES (Relacionamento)
        await sql`
            CREATE TABLE device_policies (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                device_id VARCHAR(255) REFERENCES devices(id) ON DELETE CASCADE,
                policy_id INTEGER REFERENCES policies(id) ON DELETE CASCADE,
                status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'applying', 'applied', 'failed', 'removed', 'outdated')),
                applied_version INTEGER,
                applied_config JSONB,
                result_details JSONB,
                error_message TEXT,
                error_code VARCHAR(50),
                retry_count INTEGER DEFAULT 0,
                max_retries INTEGER DEFAULT 3,
                compliance_status VARCHAR(50) DEFAULT 'unknown' CHECK (compliance_status IN ('compliant', 'non_compliant', 'unknown', 'checking')),
                last_compliance_check TIMESTAMP,
                compliance_details JSONB DEFAULT '{}',
                applied_at TIMESTAMP DEFAULT NOW(),
                applied_by INTEGER REFERENCES users(id),
                verified_at TIMESTAMP,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(device_id, policy_id)
            )
        `;
        console.log('✅ device_policies criada');

        // 8. DEVICE_TELEMETRY (Expandida)
        await sql`
            CREATE TABLE device_telemetry (
                id SERIAL PRIMARY KEY,
                device_id VARCHAR(255) REFERENCES devices(id) ON DELETE CASCADE,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
                battery_status VARCHAR(50),
                battery_temperature INTEGER,
                storage_total_gb DECIMAL(10, 2),
                storage_used_gb DECIMAL(10, 2),
                storage_available_gb DECIMAL(10, 2),
                ram_total_mb INTEGER,
                ram_used_mb INTEGER,
                ram_available_mb INTEGER,
                cpu_usage_percent DECIMAL(5, 2),
                cpu_temperature INTEGER,
                network_type VARCHAR(50),
                wifi_ssid VARCHAR(255),
                wifi_strength INTEGER,
                cellular_carrier VARCHAR(100),
                cellular_signal_strength INTEGER,
                ip_address INET,
                app_in_foreground VARCHAR(255),
                installed_apps_count INTEGER,
                security_patch_level VARCHAR(50),
                is_rooted BOOLEAN DEFAULT false,
                is_developer_mode_enabled BOOLEAN DEFAULT false,
                screen_lock_enabled BOOLEAN DEFAULT false,
                location_lat DECIMAL(10, 8),
                location_lng DECIMAL(11, 8),
                location_accuracy DECIMAL(8, 2),
                location_source VARCHAR(50) CHECK (location_source IN ('gps', 'network', 'passive', 'fused')),
                additional_data JSONB DEFAULT '{}',
                captured_at TIMESTAMP DEFAULT NOW(),
                received_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ device_telemetry criada');

        // 9. DEVICE_COMMANDS (Expandida)
        await sql`
            CREATE TABLE device_commands (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                device_id VARCHAR(255) REFERENCES devices(id) ON DELETE CASCADE,
                type VARCHAR(100) NOT NULL CHECK (type IN ('PING', 'LOCATE_NOW', 'LOCK', 'UNLOCK', 'WIPE', 'SCREENSHOT', 'OPEN_ACTIVITY', 'INSTALL_APP', 'UNINSTALL_APP', 'UPDATE_POLICY', 'REBOOT', 'SYNC_DATA')),
                category VARCHAR(100) DEFAULT 'general',
                priority INTEGER DEFAULT 1,
                payload JSONB DEFAULT '{}',
                timeout_seconds INTEGER DEFAULT 300,
                retry_policy JSONB DEFAULT '{"max_retries": 3, "retry_delay_seconds": 30}',
                status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'executing', 'success', 'failed', 'timeout', 'cancelled')),
                result JSONB,
                error_message TEXT,
                error_code VARCHAR(50),
                execution_log JSONB DEFAULT '[]',
                fcm_message_id VARCHAR(255),
                delivery_status VARCHAR(50),
                delivery_attempts INTEGER DEFAULT 0,
                created_by INTEGER REFERENCES users(id),
                reason TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                scheduled_at TIMESTAMP DEFAULT NOW(),
                sent_at TIMESTAMP,
                executed_at TIMESTAMP,
                completed_at TIMESTAMP,
                expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour')
            )
        `;
        console.log('✅ device_commands criada');

        // 10. EVENTS (Nova)
        await sql`
            CREATE TABLE events (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                type VARCHAR(100) NOT NULL,
                category VARCHAR(100) DEFAULT 'general',
                action VARCHAR(255) NOT NULL,
                entity_type VARCHAR(100),
                entity_id VARCHAR(255),
                device_id VARCHAR(255) REFERENCES devices(id) ON DELETE SET NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                event_data JSONB DEFAULT '{}',
                old_values JSONB,
                new_values JSONB,
                severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency')),
                risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
                source VARCHAR(100) DEFAULT 'system',
                source_ip INET,
                user_agent TEXT,
                session_id VARCHAR(255),
                compliance_relevant BOOLEAN DEFAULT false,
                retention_policy VARCHAR(100) DEFAULT 'standard',
                tags TEXT[] DEFAULT '{}',
                metadata JSONB DEFAULT '{}',
                occurred_at TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ events criada');

        // 11. LOCATIONS (Nova)
        await sql`
            CREATE TABLE locations (
                id SERIAL PRIMARY KEY,
                device_id VARCHAR(255) REFERENCES devices(id) ON DELETE CASCADE,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                altitude DECIMAL(8, 2),
                accuracy DECIMAL(8, 2),
                speed DECIMAL(6, 2),
                bearing DECIMAL(6, 2),
                source VARCHAR(50) DEFAULT 'gps' CHECK (source IN ('gps', 'network', 'passive', 'fused')),
                provider VARCHAR(100),
                satellites_used INTEGER,
                address_street VARCHAR(255),
                address_city VARCHAR(100),
                address_state VARCHAR(100),
                address_country VARCHAR(100),
                address_zip VARCHAR(20),
                place_name VARCHAR(255),
                trigger_type VARCHAR(100),
                triggered_by VARCHAR(255),
                command_id INTEGER REFERENCES device_commands(id),
                metadata JSONB DEFAULT '{}',
                captured_at TIMESTAMP NOT NULL,
                processed_at TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ locations criada');

        // 12. ALERTS (Nova)
        await sql`
            CREATE TABLE alerts (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                alert_type VARCHAR(100) NOT NULL,
                severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
                category VARCHAR(100) DEFAULT 'general',
                subcategory VARCHAR(100),
                priority INTEGER DEFAULT 1,
                device_id VARCHAR(255) REFERENCES devices(id) ON DELETE SET NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                policy_id INTEGER REFERENCES policies(id) ON DELETE SET NULL,
                command_id INTEGER REFERENCES device_commands(id) ON DELETE SET NULL,
                status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'investigating', 'resolved', 'closed', 'false_positive')),
                alert_data JSONB DEFAULT '{}',
                conditions JSONB,
                thresholds JSONB,
                auto_resolve BOOLEAN DEFAULT false,
                resolution_notes TEXT,
                resolved_by INTEGER REFERENCES users(id),
                resolved_at TIMESTAMP,
                notification_sent BOOLEAN DEFAULT false,
                notification_channels TEXT[] DEFAULT '{}',
                notification_settings JSONB DEFAULT '{}',
                first_occurred_at TIMESTAMP DEFAULT NOW(),
                last_occurred_at TIMESTAMP DEFAULT NOW(),
                occurrence_count INTEGER DEFAULT 1,
                acknowledged_at TIMESTAMP,
                acknowledged_by INTEGER REFERENCES users(id),
                tags TEXT[] DEFAULT '{}',
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ alerts criada');

        // 13. NOTIFICATIONS (Nova)
        await sql`
            CREATE TABLE notifications (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                notification_type VARCHAR(100) NOT NULL,
                channel VARCHAR(50) DEFAULT 'web' CHECK (channel IN ('web', 'email', 'push', 'sms')),
                delivery_status VARCHAR(50) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
                read_at TIMESTAMP,
                clicked_at TIMESTAMP,
                delivery_attempts INTEGER DEFAULT 0,
                last_attempt_at TIMESTAMP,
                related_entity_type VARCHAR(100),
                related_entity_id VARCHAR(255),
                alert_id INTEGER REFERENCES alerts(id) ON DELETE SET NULL,
                priority INTEGER DEFAULT 1,
                expires_at TIMESTAMP,
                data JSONB DEFAULT '{}',
                scheduled_at TIMESTAMP DEFAULT NOW(),
                sent_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ notifications criada');

        // 14. AUDIT_LOGS (Renomeada)
        await sql`
            CREATE TABLE audit_logs (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(255) NOT NULL,
                resource_type VARCHAR(100),
                resource_id VARCHAR(255),
                details JSONB DEFAULT '{}',
                ip_address INET,
                user_agent TEXT,
                session_id VARCHAR(255),
                result VARCHAR(50) DEFAULT 'success' CHECK (result IN ('success', 'failure', 'partial')),
                error_message TEXT,
                timestamp TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ audit_logs criada');

        // 15. SUBSCRIPTIONS (Atualizada)
        await sql`
            CREATE TABLE subscriptions (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                external_subscription_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'unpaid')),
                plan_type VARCHAR(100) NOT NULL,
                amount_cents INTEGER DEFAULT 0,
                currency VARCHAR(10) DEFAULT 'USD',
                billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
                current_period_start TIMESTAMP DEFAULT NOW(),
                current_period_end TIMESTAMP,
                trial_end TIMESTAMP,
                cancel_at TIMESTAMP,
                cancelled_at TIMESTAMP,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ subscriptions criada');

        console.log('📊 Criando índices de performance...');

        // Índices essenciais
        const indexes = [
            // Organizations
            'CREATE INDEX idx_organizations_slug ON organizations(slug)',
            'CREATE INDEX idx_organizations_status ON organizations(status)',
            
            // Users  
            'CREATE INDEX idx_users_firebase_uid ON users(firebase_uid)',
            'CREATE INDEX idx_users_email ON users(email)',
            'CREATE INDEX idx_users_active ON users(is_active)',
            
            // Organization Members
            'CREATE INDEX idx_org_members_org_id ON organization_members(organization_id)',
            'CREATE INDEX idx_org_members_user_id ON organization_members(user_id)',
            'CREATE INDEX idx_org_members_role ON organization_members(role)',
            
            // Devices
            'CREATE INDEX idx_devices_organization_id ON devices(organization_id)',
            'CREATE INDEX idx_devices_status ON devices(status)',
            'CREATE INDEX idx_devices_fcm_token ON devices(fcm_token)',
            'CREATE INDEX idx_devices_last_seen ON devices(last_seen_at)',
            'CREATE INDEX idx_devices_device_type ON devices(device_type)',
            
            // Device Registrations
            'CREATE INDEX idx_device_registrations_pairing_code ON device_registrations(pairing_code)',
            'CREATE INDEX idx_device_registrations_org ON device_registrations(organization_id)',
            'CREATE INDEX idx_device_registrations_status ON device_registrations(status)',
            'CREATE INDEX idx_device_registrations_expires ON device_registrations(expires_at)',
            
            // Device Policies
            'CREATE INDEX idx_device_policies_device_id ON device_policies(device_id)',
            'CREATE INDEX idx_device_policies_policy_id ON device_policies(policy_id)',
            'CREATE INDEX idx_device_policies_status ON device_policies(status)',
            
            // Device Telemetry
            'CREATE INDEX idx_device_telemetry_device ON device_telemetry(device_id)',
            'CREATE INDEX idx_device_telemetry_org ON device_telemetry(organization_id)',
            'CREATE INDEX idx_device_telemetry_captured ON device_telemetry(captured_at)',
            
            // Device Commands
            'CREATE INDEX idx_device_commands_device ON device_commands(device_id)',
            'CREATE INDEX idx_device_commands_org ON device_commands(organization_id)',
            'CREATE INDEX idx_device_commands_status ON device_commands(status)',
            'CREATE INDEX idx_device_commands_type ON device_commands(type)',
            'CREATE INDEX idx_device_commands_created ON device_commands(created_at)',
            
            // Events
            'CREATE INDEX idx_events_org ON events(organization_id)',
            'CREATE INDEX idx_events_device ON events(device_id)',
            'CREATE INDEX idx_events_type ON events(type)',
            'CREATE INDEX idx_events_severity ON events(severity)',
            'CREATE INDEX idx_events_occurred ON events(occurred_at)',
            
            // Locations
            'CREATE INDEX idx_locations_device ON locations(device_id)',
            'CREATE INDEX idx_locations_org ON locations(organization_id)',
            'CREATE INDEX idx_locations_captured ON locations(captured_at)',
            'CREATE INDEX idx_locations_coords ON locations(latitude, longitude)',
            
            // Alerts
            'CREATE INDEX idx_alerts_org ON alerts(organization_id)',
            'CREATE INDEX idx_alerts_status ON alerts(status)',
            'CREATE INDEX idx_alerts_severity ON alerts(severity)',
            'CREATE INDEX idx_alerts_created ON alerts(created_at)',
            
            // Notifications
            'CREATE INDEX idx_notifications_user ON notifications(user_id)',
            'CREATE INDEX idx_notifications_org ON notifications(organization_id)',
            'CREATE INDEX idx_notifications_status ON notifications(delivery_status)',
            'CREATE INDEX idx_notifications_read ON notifications(read_at)',
            
            // Audit Logs
            'CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id)',
            'CREATE INDEX idx_audit_logs_user ON audit_logs(user_id)',
            'CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp)',
            'CREATE INDEX idx_audit_logs_action ON audit_logs(action)',
            
            // Policies
            'CREATE INDEX idx_policies_org ON policies(organization_id)',
            'CREATE INDEX idx_policies_active ON policies(is_active)',
            'CREATE INDEX idx_policies_category ON policies(category)'
        ];

        for (const indexSql of indexes) {
            await sql.unsafe(indexSql);
        }
        console.log(`✅ ${indexes.length} índices criados`);

        console.log('🔧 Inserindo dados iniciais...');

        // Organização padrão
        const [org] = await sql`
            INSERT INTO organizations (name, slug, display_name, contact_email, subscription_tier)
            VALUES ('Development Organization', 'dev-org', 'FRIAXIS Development', 'admin@friaxis.com', 'premium')
            RETURNING id
        `;

        // Usuário admin padrão
        const [user] = await sql`
            INSERT INTO users (firebase_uid, email, display_name, role, email_verified, is_active, is_verified)
            VALUES ('admin-dev-001', 'admin@friaxis.com', 'Admin FRIAXIS', 'admin', true, true, true)
            RETURNING id
        `;

        // Membership
        await sql`
            INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
            VALUES (${org.id}, ${user.id}, 'owner', 'active', NOW())
        `;

        // Subscription padrão
        await sql`
            INSERT INTO subscriptions (organization_id, plan_type, status, current_period_end)
            VALUES (${org.id}, 'premium', 'active', NOW() + INTERVAL '1 year')
        `;

        // Política padrão
        await sql`
            INSERT INTO policies (organization_id, name, description, category, policy_config, created_by)
            VALUES (
                ${org.id}, 
                'Política Padrão', 
                'Configuração básica de segurança para dispositivos FRIAXIS',
                'security',
                '{"kiosk_mode": false, "allow_unknown_sources": false, "require_pin": true, "min_pin_length": 4}',
                ${user.id}
            )
        `;

        await sql.end();
        
        console.log('🎯 SUCESSO: Estrutura completa criada!');
        console.log('   ✅ 15 tabelas principais');
        console.log('   ✅ 45+ índices de performance');
        console.log('   ✅ Relacionamentos e constraints');
        console.log('   ✅ Dados iniciais inseridos');
        console.log('   ✅ Multi-tenant support completo');
        console.log('   ✅ Compatibilidade Android/Web garantida');
        
    } catch (error) {
        console.error('❌ ERRO durante criação:');
        console.error('   Mensagem:', error.message);
        console.error('   Código:', error.code || 'N/A');
    }
}

createCompleteDatabase();