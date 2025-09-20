// Reset direto do banco Neon - FRIAXIS v4.0.0
const postgres = require('postgres');

async function resetNeonDatabase() {
    console.log('🔄 FRIAXIS v4.0.0 - Reset Completo do Banco Neon');
    console.log('===============================================');
    
    // URL do Neon PostgreSQL
    const DATABASE_URL = "postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    
    try {
        const sql = postgres(DATABASE_URL, { ssl: 'require' });
        
        console.log('🗑️ Removendo tabelas existentes...');
        
        const dropTables = [
            'device_registrations',
            'device_telemetry', 
            'device_commands',
            'audit_logs',
            'subscriptions',
            'devices',
            'policies', 
            'organizations',
            'users'
        ];

        for (const table of dropTables) {
            try {
                await sql`DROP TABLE IF EXISTS ${sql(table)} CASCADE`;
                console.log(`✅ Tabela ${table} removida`);
            } catch (error) {
                console.log(`⚠️ Tabela ${table} não existia`);
            }
        }

        console.log('🔧 Criando estrutura completa FRIAXIS v4.0.0...');

        // 1. Tabela Organizations
        await sql`
            CREATE TABLE organizations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                subscription_tier VARCHAR(50) DEFAULT 'basic',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ Tabela organizations criada');

        // 2. Tabela Users
        await sql`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                firebase_uid VARCHAR(128) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ Tabela users criada');

        // 3. Tabela Policies
        await sql`
            CREATE TABLE policies (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                restrictions JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT true,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ Tabela policies criada');

        // 4. Tabela Devices
        await sql`
            CREATE TABLE devices (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                device_id VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                model VARCHAR(100),
                android_version VARCHAR(50),
                policy_id INTEGER REFERENCES policies(id),
                last_seen TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                battery_level INTEGER,
                location_lat DECIMAL(10, 8),
                location_lng DECIMAL(11, 8),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ Tabela devices criada');

        // 5. Tabela Device Registrations
        await sql`
            CREATE TABLE device_registrations (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                pairing_code VARCHAR(10) UNIQUE NOT NULL,
                device_info JSONB,
                status VARCHAR(50) DEFAULT 'pending',
                created_by_admin BOOLEAN DEFAULT false,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ Tabela device_registrations criada');

        // 6. Tabela Device Telemetry
        await sql`
            CREATE TABLE device_telemetry (
                id SERIAL PRIMARY KEY,
                device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
                battery_level INTEGER,
                location_lat DECIMAL(10, 8),
                location_lng DECIMAL(11, 8),
                signal_strength INTEGER,
                storage_used BIGINT,
                memory_used BIGINT,
                recorded_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ Tabela device_telemetry criada');

        // 7. Tabela Device Commands
        await sql`
            CREATE TABLE device_commands (
                id SERIAL PRIMARY KEY,
                device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
                command_type VARCHAR(100) NOT NULL,
                parameters JSONB DEFAULT '{}',
                status VARCHAR(50) DEFAULT 'pending',
                executed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ Tabela device_commands criada');

        // 8. Tabela Audit Logs
        await sql`
            CREATE TABLE audit_logs (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id),
                action VARCHAR(255) NOT NULL,
                resource_type VARCHAR(100),
                resource_id INTEGER,
                details JSONB,
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ Tabela audit_logs criada');

        // 9. Tabela Subscriptions
        await sql`
            CREATE TABLE subscriptions (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                plan_name VARCHAR(100) NOT NULL,
                status VARCHAR(50) DEFAULT 'active',
                device_limit INTEGER DEFAULT 10,
                features JSONB DEFAULT '{}',
                starts_at TIMESTAMP DEFAULT NOW(),
                ends_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ Tabela subscriptions criada');

        console.log('📊 Criando índices de performance...');

        // Índices essenciais
        await sql`CREATE INDEX idx_devices_organization_id ON devices(organization_id)`;
        await sql`CREATE INDEX idx_devices_device_id ON devices(device_id)`;
        await sql`CREATE INDEX idx_users_firebase_uid ON users(firebase_uid)`;
        await sql`CREATE INDEX idx_users_organization_id ON users(organization_id)`;
        await sql`CREATE INDEX idx_device_registrations_code ON device_registrations(pairing_code)`;
        await sql`CREATE INDEX idx_device_registrations_org ON device_registrations(organization_id)`;
        await sql`CREATE INDEX idx_device_telemetry_device ON device_telemetry(device_id)`;
        await sql`CREATE INDEX idx_device_commands_device ON device_commands(device_id)`;
        await sql`CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id)`;
        
        console.log('✅ Índices criados com sucesso');

        console.log('🔧 Inserindo dados iniciais...');

        // Organização padrão
        const [org] = await sql`
            INSERT INTO organizations (name, slug, subscription_tier)
            VALUES ('Development Organization', 'dev-org', 'premium')
            RETURNING id
        `;

        // Subscription padrão
        await sql`
            INSERT INTO subscriptions (organization_id, plan_name, device_limit)
            VALUES (${org.id}, 'Premium', 100)
        `;

        console.log('✅ Dados iniciais inseridos');

        await sql.end();
        
        console.log('🎯 SUCESSO: Banco Neon resetado e configurado!');
        console.log('   ✅ 9 tabelas criadas');
        console.log('   ✅ Índices de performance configurados');
        console.log('   ✅ Dados iniciais inseridos');
        console.log('   🌐 Conectado em tempo real com Neon PostgreSQL');
        
    } catch (error) {
        console.error('❌ ERRO durante reset:');
        console.error('   Mensagem:', error.message);
        console.error('   Código:', error.code || 'N/A');
    }
}

resetNeonDatabase();