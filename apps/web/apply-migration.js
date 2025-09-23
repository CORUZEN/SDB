const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  try {
    console.log('📦 Conectando ao banco Neon...');
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    
    // Ler a migração
    console.log('📄 Lendo migração...');
    const migrationPath = path.join(__dirname, '../../infra/migrations/002_device_registrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
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
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

applyMigration();