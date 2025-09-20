const postgres = require('postgres');

async function checkApprovedDevice() {
    const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    const sql = postgres(DATABASE_URL, { ssl: 'require' });

    try {
        console.log('🔍 Verificando dispositivos aprovados...\n');

        // 1. Verificar registros aprovados
        const approvedRegs = await sql`
            SELECT id, pairing_code, status, approved_at, device_info
            FROM device_registrations 
            WHERE status = 'approved'
            ORDER BY approved_at DESC
        `;
        
        console.log('✅ Registros aprovados:', approvedRegs.length);
        approvedRegs.forEach(reg => {
            const deviceInfo = typeof reg.device_info === 'string' ? JSON.parse(reg.device_info) : reg.device_info;
            console.log(`   - ID: ${reg.id}, Código: ${reg.pairing_code}, Device ID: ${deviceInfo.device_id}`);
        });

        // 2. Verificar dispositivos na tabela principal
        const devices = await sql`
            SELECT id, name, status, created_at, organization_id
            FROM devices 
            ORDER BY created_at DESC
        `;
        
        console.log('\n📱 Dispositivos na tabela principal:', devices.length);
        devices.forEach(device => {
            console.log(`   - ID: ${device.id}, Nome: ${device.name}, Status: ${device.status}`);
        });

        // 3. Verificar se há problemas de correspondência
        if (approvedRegs.length > 0 && devices.length === 0) {
            console.log('\n❌ PROBLEMA: Há registros aprovados mas nenhum dispositivo na tabela principal!');
        }

        await sql.end();

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

checkApprovedDevice();