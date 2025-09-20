#!/usr/bin/env node

// Script para limpar dispositivos de teste e implementar lógica real de status
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
});

async function cleanAndUpdateDevices() {
  try {
    console.log('🧹 Iniciando limpeza e atualização de dispositivos...\n');

    // 1. Remover dispositivos de teste (DEV-*)
    console.log('1. 🗑️ Removendo dispositivos de teste...');
    const deleteTestDevices = await pool.query(`
      DELETE FROM devices 
      WHERE name LIKE 'DEV-%' 
         OR name LIKE '%Smartwatch%'
         OR name LIKE '%Notebook%'
         OR name LIKE '%Desktop%'
         OR name LIKE '%Tablet%'
         OR model LIKE '%MacBook%'
         OR model LIKE '%Dell%'
         OR model LIKE '%iPad%'
         OR model LIKE '%Apple Watch%'
      RETURNING id, name
    `);
    
    console.log(`   ✅ Removidos ${deleteTestDevices.rows.length} dispositivos de teste:`);
    deleteTestDevices.rows.forEach(device => {
      console.log(`      - ${device.name} (${device.id})`);
    });

    // 2. Adicionar campos necessários para status real (se não existirem)
    console.log('\n2. 📊 Adicionando campos para status real...');
    
    try {
      await pool.query(`
        ALTER TABLE devices 
        ADD COLUMN IF NOT EXISTS battery_level INTEGER DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS battery_status VARCHAR(20) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS location_accuracy FLOAT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS location_timestamp TIMESTAMPTZ DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS network_info JSONB DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ DEFAULT NULL
      `);
      console.log('   ✅ Campos adicionados com sucesso');
    } catch (alterError) {
      console.log('   ⚠️  Alguns campos já existem:', alterError.message);
    }

    // 3. Implementar lógica de status online baseada em heartbeat
    console.log('\n3. ⏰ Implementando lógica de status baseada em heartbeat...');
    
    // Dispositivos são considerados online se heartbeat < 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Marcar todos como offline primeiro
    await pool.query(`
      UPDATE devices 
      SET status = 'offline', 
          updated_at = NOW()
      WHERE status != 'offline'
    `);
    
    // Marcar como online apenas os que têm heartbeat recente
    const onlineUpdate = await pool.query(`
      UPDATE devices 
      SET status = 'online', 
          updated_at = NOW()
      WHERE last_heartbeat > $1
      RETURNING id, name, last_heartbeat
    `, [fiveMinutesAgo]);

    console.log(`   ✅ Lógica de status implementada:`);
    console.log(`      - Dispositivos marcados como offline: todos`);
    console.log(`      - Dispositivos realmente online: ${onlineUpdate.rows.length}`);
    
    if (onlineUpdate.rows.length > 0) {
      onlineUpdate.rows.forEach(device => {
        console.log(`        * ${device.name}: ${device.last_heartbeat}`);
      });
    }

    // 4. Atualizar dispositivos reais com campos padrão
    console.log('\n4. 🔧 Configurando dispositivos reais...');
    
    const realDevicesUpdate = await pool.query(`
      UPDATE devices 
      SET 
        battery_level = NULL,
        battery_status = 'unknown',
        location_accuracy = NULL,
        location_timestamp = NULL,
        last_heartbeat = NULL,
        network_info = '{"type": "unknown", "strength": null}'::jsonb
      WHERE device_identifier LIKE 'admin_%'
      RETURNING id, name, device_identifier
    `);

    console.log(`   ✅ ${realDevicesUpdate.rows.length} dispositivos reais configurados:`);
    realDevicesUpdate.rows.forEach(device => {
      console.log(`      - ${device.name} (${device.device_identifier})`);
    });

    // 5. Verificar resultado final
    console.log('\n5. 📋 Estado final dos dispositivos:');
    
    const finalDevices = await pool.query(`
      SELECT 
        id,
        name,
        device_identifier,
        status,
        battery_level,
        last_heartbeat,
        last_seen_at,
        created_at
      FROM devices 
      ORDER BY created_at DESC
    `);

    console.log(`   📱 Total de dispositivos restantes: ${finalDevices.rows.length}`);
    finalDevices.rows.forEach(device => {
      console.log(`      - ${device.name}`);
      console.log(`        Status: ${device.status}`);
      console.log(`        Heartbeat: ${device.last_heartbeat || 'Nunca'}`);
      console.log(`        Last seen: ${device.last_seen_at || 'Nunca'}`);
      console.log(`        Bateria: ${device.battery_level ? device.battery_level + '%' : 'Desconhecida'}`);
    });

    console.log('\n✅ Limpeza e atualização concluída com sucesso!');
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Aplicar a API de heartbeat nos dispositivos Android');
    console.log('2. Implementar envio de dados de bateria e localização');
    console.log('3. Configurar timeout automático para marcar offline');

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
  } finally {
    await pool.end();
  }
}

cleanAndUpdateDevices();