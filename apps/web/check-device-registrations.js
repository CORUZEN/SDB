// Script para verificar estrutura da tabela device_registrations
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function checkDeviceRegistrationsStructure() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  try {
    console.log('🔍 Verificando estrutura da tabela device_registrations...\n');
    
    // Verificar se a tabela existe
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'device_registrations'
      )
    `;
    
    if (!tableExists[0].exists) {
      console.log('❌ Tabela device_registrations não existe');
      return;
    }
    
    // Verificar estrutura da tabela
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'device_registrations'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Estrutura da tabela device_registrations:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n📊 Dados na tabela:');
    
    // Ver os dados sem especificar colunas específicas
    const data = await sql`SELECT * FROM device_registrations LIMIT 5`;
    
    if (data.length > 0) {
      console.log(`\n🔍 Encontrados ${data.length} registros (mostrando primeiros 5):\n`);
      data.forEach((row, index) => {
        console.log(`--- Registro ${index + 1} ---`);
        Object.keys(row).forEach(key => {
          console.log(`${key}: ${row[key]}`);
        });
        console.log('');
      });
    } else {
      console.log('📭 Tabela vazia');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error);
  } finally {
    await sql.end();
  }
}

checkDeviceRegistrationsStructure();