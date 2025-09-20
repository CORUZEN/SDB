const postgres = require('postgres');

async function approveDevice() {
    const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    const sql = postgres(DATABASE_URL, { ssl: 'require' });

    try {
        const deviceId = 3;
        console.log(`🔄 Aprovando dispositivo ID ${deviceId}...`);

        // 1. Buscar registro pendente
        const registration = await sql`
            SELECT * FROM device_registrations 
            WHERE id = ${deviceId} 
            AND status = 'pending'
        `;

        if (registration.length === 0) {
            console.log('❌ Registro não encontrado ou já processado');
            return;
        }

        const reg = registration[0];
        console.log('✅ Registro encontrado:', reg.pairing_code);

        // 2. Parse do device_info
        let deviceInfo = {};
        try {
            deviceInfo = typeof reg.device_info === 'string' 
                ? JSON.parse(reg.device_info) 
                : reg.device_info || {};
        } catch (e) {
            console.warn('⚠️ Erro ao fazer parse do device_info');
            deviceInfo = {};
        }

        console.log('📱 Device Info:', deviceInfo);

        // 3. Inserir na tabela devices
        await sql`
            INSERT INTO devices (
                id,
                organization_id,
                name, 
                status, 
                device_identifier,
                serial_number,
                device_type,
                manufacturer,
                model,
                os_type,
                os_version,
                created_at, 
                updated_at
            ) VALUES (
                ${deviceInfo.device_id || `device_${reg.id}`},
                1,
                ${deviceInfo.name || deviceInfo.device_name || 'Novo Dispositivo'},
                'offline',
                ${deviceInfo.device_id || `device_${reg.id}`},
                ${deviceInfo.device_id || `device_${reg.id}`},
                'smartphone',
                'Android',
                ${deviceInfo.model || deviceInfo.device_model || 'Unknown Model'},
                'android',
                ${deviceInfo.android_version || 'Unknown'},
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                status = 'offline',
                updated_at = NOW()
        `;

        // 4. Marcar como aprovado
        await sql`
            UPDATE device_registrations 
            SET 
                status = 'approved', 
                approved_at = NOW(), 
                approved_by = 'user_dev_001'
            WHERE id = ${deviceId}
        `;

        console.log('✅ Dispositivo aprovado com sucesso!');

        // 5. Verificar resultado
        const approved = await sql`
            SELECT status FROM device_registrations WHERE id = ${deviceId}
        `;
        
        const device = await sql`
            SELECT id, name, status FROM devices WHERE id = ${deviceInfo.device_id || `device_${reg.id}`}
        `;

        console.log('📊 Status final:');
        console.log('   Registration:', approved[0].status);
        console.log('   Device:', device[0]);

        await sql.end();

    } catch (error) {
        console.error('❌ Erro ao aprovar dispositivo:', error.message);
    }
}

approveDevice();