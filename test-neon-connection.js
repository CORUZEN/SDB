// Teste de conectividade direta com o banco Neon
const postgres = require('postgres');
require('dotenv').config({ path: './apps/web/.env.local' });

async function testNeonConnection() {
    console.log('🔌 Testando conectividade com banco Neon...');
    console.log('📍 DATABASE_URL configurada:', process.env.DATABASE_URL ? 'SIM' : 'NÃO');
    
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL não encontrada!');
        return;
    }
    
    try {
        // Conectar com o banco Neon
        const sql = postgres(process.env.DATABASE_URL, { 
            ssl: 'require',
            max: 1 // Apenas uma conexão para teste
        });
        
        console.log('⏳ Conectando com Neon PostgreSQL...');
        
        // Teste simples: verificar versão do PostgreSQL
        const result = await sql`SELECT version() as version, now() as timestamp`;
        
        console.log('✅ CONECTADO COM SUCESSO!');
        console.log('📊 Versão PostgreSQL:', result[0].version.substring(0, 50) + '...');
        console.log('⏰ Timestamp servidor:', result[0].timestamp);
        
        // Testar se existem tabelas
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `;
        
        console.log(`📋 Tabelas encontradas: ${tables.length}`);
        tables.forEach(table => {
            console.log(`   - ${table.table_name}`);
        });
        
        // Fechar conexão
        await sql.end();
        console.log('🔒 Conexão fechada com sucesso');
        
    } catch (error) {
        console.error('❌ ERRO na conexão com Neon:');
        console.error('   Mensagem:', error.message);
        console.error('   Código:', error.code || 'N/A');
    }
}

testNeonConnection();