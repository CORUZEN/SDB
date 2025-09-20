const postgres = require('postgres');

async function checkTableStructure() {
    try {
        const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
        const sql = postgres(DATABASE_URL, { ssl: 'require' });

        console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS...');
        
        // Verificar estrutura da tabela organizations
        const orgStructure = await sql`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'organizations'
            ORDER BY ordinal_position
        `;
        
        console.log('\n📋 ESTRUTURA DA TABELA ORGANIZATIONS:');
        orgStructure.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // Verificar estrutura da tabela users
        const userStructure = await sql`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `;
        
        console.log('\n👤 ESTRUTURA DA TABELA USERS:');
        userStructure.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // Verificar estrutura da tabela policies
        const policyStructure = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'policies'
            ORDER BY ordinal_position
        `;
        
        console.log('\n📝 ESTRUTURA DA TABELA POLICIES:');
        policyStructure.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // Verificar estrutura da tabela devices
        const deviceStructure = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'devices'
            ORDER BY ordinal_position
        `;
        
        console.log('\n📱 ESTRUTURA DA TABELA DEVICES:');
        deviceStructure.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        await sql.end();

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

checkTableStructure();