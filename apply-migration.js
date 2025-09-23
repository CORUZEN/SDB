const postgres = require('postgres');
const fs = require('fs');

async function applyMigration() {
  try {
    console.log('📦 Conectando ao banco Neon...');
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    
    // Ler a migração
    console.log('📄 Lendo migração...');
    const migrationSQL = fs.readFileSync('./infra/migrations/002_device_registrations.sql', 'utf8');
    
    // Aplicar migração
    console.log('🚀 Aplicando migração...');
    await sql.unsafe(migrationSQL);
    
    // Verificar se a tabela foi criada
    console.log('✅ Verificando tabela criada...');
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_registrations'
      );
    `;
    
    console.log('🎯 Tabela device_registrations existe:', tableExists[0].exists);
    
    await sql.end();
    console.log('✅ Migração aplicada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error.message);
    process.exit(1);
  }
}

applyMigration();