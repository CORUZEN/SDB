const postgres = require('postgres');

async function checkTables() {
    const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    const sql = postgres(DATABASE_URL, { ssl: 'require' });

    try {
        // Listar todas as tabelas
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `;
        
        console.log('📋 TABELAS DISPONÍVEIS:');
        tables.forEach(t => console.log('   -', t.table_name));

        // Verificar device_registrations
        try {
            const dr = await sql`SELECT COUNT(*) as count FROM device_registrations`;
            console.log('\n📱 DEVICE_REGISTRATIONS:', dr[0].count, 'registros');
            
            // Mostrar alguns registros pendentes
            const pending = await sql`
                SELECT id, pairing_code, device_info, status, created_at 
                FROM device_registrations 
                WHERE status = 'pending' 
                ORDER BY created_at DESC 
                LIMIT 3
            `;
            
            console.log('   🔍 Registros pendentes:');
            pending.forEach(p => {
                console.log(`      ID: ${p.id}, Código: ${p.pairing_code}, Status: ${p.status}`);
            });
            
        } catch (e) {
            console.log('\n❌ DEVICE_REGISTRATIONS: Tabela não existe');
        }

        // Verificar devices  
        try {
            const devices = await sql`SELECT COUNT(*) as count FROM devices`;
            console.log('\n🔧 DEVICES:', devices[0].count, 'dispositivos');
        } catch (e) {
            console.log('\n❌ DEVICES: Erro ao consultar');
        }

        await sql.end();

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

checkTables();