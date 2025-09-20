#!/usr/bin/env node

// Script para verificar se as colunas foram adicionadas no banco de produção
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
});

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Verificando estrutura do banco de dados...\n');

    // Verificar se as novas colunas existem
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      AND column_name IN (
        'battery_level', 'battery_status', 'location_accuracy', 
        'location_timestamp', 'network_info', 'last_heartbeat'
      )
      ORDER BY column_name
    `);

    console.log('📊 Colunas adicionadas:');
    if (columns.rows.length === 0) {
      console.log('   ❌ Nenhuma coluna nova encontrada!');
    } else {
      columns.rows.forEach(col => {
        console.log(`   ✅ ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Verificar estrutura completa da tabela devices
    console.log('\n📋 Estrutura completa da tabela devices:');
    const allColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      ORDER BY ordinal_position
    `);

    allColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    // Testar um dispositivo específico
    console.log('\n🧪 Testando consulta com novos campos:');
    try {
      const testQuery = await pool.query(`
        SELECT 
          id, name, status, battery_level, last_heartbeat,
          location_lat, location_lng
        FROM devices 
        WHERE id = 'admin_1758330145177_agckozilp'
        LIMIT 1
      `);

      if (testQuery.rows.length > 0) {
        console.log('   ✅ Consulta bem-sucedida:');
        console.log(`   ${JSON.stringify(testQuery.rows[0], null, 6)}`);
      } else {
        console.log('   ❌ Nenhum resultado encontrado');
      }
    } catch (queryError) {
      console.log('   ❌ Erro na consulta:', queryError.message);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseStructure();