const postgres = require('postgres');

async function checkCommandsTable() {
    try {
        const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
        const sql = postgres(DATABASE_URL, { ssl: 'require' });

        const commandStructure = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'commands'
            ORDER BY ordinal_position
        `;
        
        console.log('⚡ ESTRUTURA DA TABELA COMMANDS:');
        commandStructure.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        const eventStructure = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'events'
            ORDER BY ordinal_position
        `;
        
        console.log('\n📋 ESTRUTURA DA TABELA EVENTS:');
        eventStructure.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        await sql.end();

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

checkCommandsTable();