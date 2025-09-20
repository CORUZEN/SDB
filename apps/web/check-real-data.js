const postgres = require('postgres');

async function checkRealData() {
    try {
        const DATABASE_URL = "postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
        const sql = postgres(DATABASE_URL, { ssl: 'require' });

        console.log('🔍 AUDITORIA DE DADOS REAIS NO NEON:');
        console.log('='.repeat(50));

        // 1. Dispositivos
        const devices = await sql`SELECT COUNT(*) as total, 
                                  SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online,
                                  SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline
                                  FROM devices`;
        console.log('📱 DISPOSITIVOS:');
        console.log(`   Total: ${devices[0].total}`);
        console.log(`   Online: ${devices[0].online}`);
        console.log(`   Offline: ${devices[0].offline}`);

        // 2. Comandos
        const commands = await sql`SELECT COUNT(*) as total FROM commands`;
        console.log(`\n⚡ COMANDOS: ${commands[0].total}`);

        // 3. Políticas
        const policies = await sql`SELECT COUNT(*) as total, 
                                   SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active
                                   FROM policies`;
        console.log(`\n📋 POLÍTICAS:`);
        console.log(`   Total: ${policies[0].total}`);
        console.log(`   Ativas: ${policies[0].active}`);

        // 4. Últimos comandos por tipo
        const commandsByType = await sql`
            SELECT command_type, COUNT(*) as count 
            FROM commands 
            GROUP BY command_type 
            ORDER BY count DESC`;
        
        console.log(`\n📊 COMANDOS POR TIPO:`);
        commandsByType.forEach(cmd => {
            console.log(`   ${cmd.command_type}: ${cmd.count}`);
        });

        // 5. Alertas
        const alerts = await sql`SELECT COUNT(*) as total FROM events WHERE event_type = 'alert'`;
        console.log(`\n🚨 ALERTAS: ${alerts[0].total}`);

        // 6. Dados específicos dos dispositivos
        const deviceDetails = await sql`
            SELECT device_id, name, status, last_seen, battery_level 
            FROM devices 
            ORDER BY last_seen DESC 
            LIMIT 5`;
        
        console.log(`\n📱 ÚLTIMOS 5 DISPOSITIVOS:`);
        deviceDetails.forEach(device => {
            console.log(`   ${device.name || device.device_id}: ${device.status} (bateria: ${device.battery_level}%)`);
        });

        await sql.end();
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

checkRealData();