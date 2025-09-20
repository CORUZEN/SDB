const postgres = require('postgres');

async function checkColumn() {
    const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    const sql = postgres(DATABASE_URL, { ssl: 'require' });

    try {
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'device_registrations' 
            AND column_name = 'approved_by'
        `;
        
        console.log('approved_by column:', columns);
        
        // Verificar toda a estrutura da tabela
        const allColumns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'device_registrations'
            ORDER BY ordinal_position
        `;
        
        console.log('\nAll columns in device_registrations:');
        allColumns.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        await sql.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkColumn();