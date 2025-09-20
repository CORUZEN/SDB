const postgres = require('postgres');

async function checkDevice() {
    const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    const sql = postgres(DATABASE_URL, { ssl: 'require' });

    try {
        const reg = await sql`SELECT * FROM device_registrations WHERE id = 3`;
        
        if (reg.length > 0) {
            console.log('📱 REGISTRO ID 3:');
            console.log(JSON.stringify(reg[0], null, 2));
        } else {
            console.log('❌ Registro ID 3 não encontrado');
        }

        await sql.end();

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

checkDevice();