const postgres = require('postgres');

async function populateWithTestData() {
    try {
        const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
        const sql = postgres(DATABASE_URL, { ssl: 'require' });

        console.log('🎯 POPULANDO NEON COM DADOS DE TESTE...');
        console.log('='.repeat(50));

        // 1. Inserir organizações
        const org = await sql`
            INSERT INTO organizations (name, slug, display_name, description, logo_url, contact_email, status, created_at)
            VALUES ('FRIAXIS Demo Corp', 'friaxis-demo', 'FRIAXIS Demo Corporation', 'Organização de demonstração do sistema FRIAXIS', 'https://via.placeholder.com/200x100?text=FRIAXIS', 'admin@friaxis.coruzen.com', 'active', NOW())
            ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
            RETURNING id, name
        `;
        console.log('✅ Organização criada:', org[0].name);
        const orgId = org[0].id;

        // 2. Inserir usuários  
        const user = await sql`
            INSERT INTO users (firebase_uid, email, display_name, avatar_url, role, is_active, is_verified, created_at)
            VALUES ('mock_firebase_uid', 'admin@friaxis.coruzen.com', 'Administrador Sistema', 'https://via.placeholder.com/150x150?text=Admin', 'admin', true, true, NOW())
            ON CONFLICT (firebase_uid) DO UPDATE SET display_name = EXCLUDED.display_name
            RETURNING id, display_name
        `;
        console.log('✅ Usuário criado:', user[0].display_name);
        const userId = user[0].id;

        // 3. Inserir políticas
        const policy = await sql`
            INSERT INTO policies (name, description, policy_config, organization_id, is_active, created_at, created_by)
            VALUES ('Política de Segurança Padrão', 'Política básica de segurança para todos os dispositivos', 
                    '{"require_lock": true, "lock_timeout": 300, "allow_camera": false, "allow_usb": false}'::jsonb, 
                    ${orgId}, true, NOW(), ${userId})
            RETURNING id, name
        `;
        console.log('✅ Política criada:', policy[0].name);
        const policyId = policy[0].id;

        // 4. Inserir dispositivos de teste
        const devices = [
            {
                id: 'DEV-001',
                name: 'Smartphone Principal',
                model: 'Samsung Galaxy S23',
                status: 'online',
                owner_name: 'João Silva',
                location_name: 'São Paulo, SP'
            },
            {
                id: 'DEV-002', 
                name: 'Tablet Trabalho',
                model: 'iPad Pro 12.9"',
                status: 'offline',
                owner_name: 'Maria Santos',
                location_name: 'Rio de Janeiro, RJ'
            },
            {
                id: 'DEV-003',
                name: 'Desktop Escritório',
                model: 'Dell OptiPlex 7090',
                status: 'online',
                owner_name: 'Carlos Costa',
                location_name: 'Belo Horizonte, MG'
            },
            {
                id: 'DEV-004',
                name: 'Notebook Vendas',
                model: 'MacBook Pro M2',
                status: 'online',
                owner_name: 'Ana Clara',
                location_name: 'Salvador, BA'
            },
            {
                id: 'DEV-005',
                name: 'Smartwatch',
                model: 'Apple Watch Series 9',
                status: 'inactive',
                owner_name: 'Pedro Lima',
                location_name: 'Fortaleza, CE'
            }
        ];

        for (const device of devices) {
            await sql`
                INSERT INTO devices (id, name, model, status, owner_name, location_name, organization_id, last_seen_at, created_at)
                VALUES (${device.id}, ${device.name}, ${device.model}, ${device.status}, ${device.owner_name}, ${device.location_name}, ${orgId}, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET 
                    name = EXCLUDED.name,
                    status = EXCLUDED.status,
                    last_seen_at = NOW()
            `;
            console.log(`✅ Dispositivo criado: ${device.name} (${device.status})`);
        }

        // 5. Inserir comandos de teste (commands usa UUID e device_id UUID)
        const commandsToInsert = [
            { type: 'PING', device: 'DEV-001', status: 'completed' },
            { type: 'LOCATE', device: 'DEV-001', status: 'completed' },
            { type: 'PING', device: 'DEV-002', status: 'failed' },
            { type: 'LOCK', device: 'DEV-004', status: 'completed' },
            { type: 'PING', device: 'DEV-004', status: 'completed' }
        ];

        // Como commands precisa de UUID, vamos ignorar por enquanto pois a estrutura não bate
        console.log(`⚠️ Comandos pulados - estrutura requer UUIDs`);

        // 6. Inserir eventos de teste
        const events = [
            {
                type: 'device',
                action: 'connected',
                title: 'Dispositivo Conectado',
                description: 'Smartphone Principal se conectou',
                severity: 'info',
                device: 'DEV-001'
            },
            {
                type: 'command',
                action: 'executed',
                title: 'Comando Executado',
                description: 'Comando PING executado com sucesso',
                severity: 'info',
                device: 'DEV-001'
            },
            {
                type: 'alert',
                action: 'battery_low',
                title: 'Bateria Baixa',
                description: 'Smartwatch com bateria baixa',
                severity: 'warning',
                device: 'DEV-005'
            },
            {
                type: 'device',
                action: 'disconnected',
                title: 'Dispositivo Offline',
                description: 'Tablet Trabalho perdeu conexão',
                severity: 'warning',
                device: 'DEV-002'
            }
        ];

        for (const event of events) {
            await sql`
                INSERT INTO events (organization_id, type, action, title, description, severity, device_id, occurred_at, created_at)
                VALUES (${orgId}, ${event.type}, ${event.action}, ${event.title}, ${event.description}, ${event.severity}, ${event.device}, NOW(), NOW())
            `;
        }
        console.log(`✅ ${events.length} eventos criados`);

        // 7. Verificar dados inseridos
        const deviceCount = await sql`SELECT COUNT(*) as count FROM devices`;
        const eventCount = await sql`SELECT COUNT(*) as count FROM events`;
        const orgCount = await sql`SELECT COUNT(*) as count FROM organizations`;

        console.log('\n📊 RESUMO DOS DADOS INSERIDOS:');
        console.log(`   📱 Dispositivos: ${deviceCount[0].count}`);
        console.log(`   📋 Eventos: ${eventCount[0].count}`);
        console.log(`   🏢 Organizações: ${orgCount[0].count}`);
        console.log(`   👤 Usuários: 1`);
        console.log(`   📝 Políticas: 1`);

        await sql.end();
        console.log('\n🎉 DADOS DE TESTE INSERIDOS COM SUCESSO!');
        console.log('💡 Agora o sistema pode ser testado com dados reais do Neon PostgreSQL');

    } catch (error) {
        console.error('❌ Erro ao popular dados:', error.message);
    }
}

populateWithTestData();