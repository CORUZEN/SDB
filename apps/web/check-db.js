const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkTables() {
  try {
    await client.connect();
    console.log('🔍 Verificando estrutura das tabelas...');
    
    // Verificar tabela commands
    const commandsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'commands' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Colunas da tabela commands:');
    commandsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Verificar se payload_json existe
    const hasPayloadJson = commandsResult.rows.some(row => row.column_name === 'payload_json');
    if (!hasPayloadJson) {
      console.log('❌ Coluna payload_json NÃO encontrada');
      console.log('🔧 Adicionando coluna payload_json...');
      
      await client.query(`
        ALTER TABLE commands 
        ADD COLUMN IF NOT EXISTS payload_json JSONB;
      `);
      
      console.log('✅ Coluna payload_json adicionada');
    } else {
      console.log('✅ Coluna payload_json encontrada');
    }
    
    await client.end();
    console.log('✅ Verificação de estrutura concluída');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

checkTables();