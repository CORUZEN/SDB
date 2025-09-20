#!/usr/bin/env node

// Script para analisar dispositivos e identificar dados fictícios vs reais
const { Pool } = require('pg');

// Use the DATABASE_URL directly
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
});

async function analyzeDevices() {
  try {
    console.log('🔍 Analisando dispositivos na base de dados...\n');

    // 1. Verificar todos os dispositivos
    const allDevices = await pool.query(`
      SELECT 
        id,
        organization_id,
        name,
        device_identifier,
        status,
        device_type,
        manufacturer,
        model,
        os_type,
        os_version,
        owner_name,
        last_seen_at,
        created_at,
        fcm_token
      FROM devices 
      ORDER BY created_at DESC
    `);

    console.log(`📱 Total de dispositivos: ${allDevices.rows.length}\n`);

    // 2. Categorizar dispositivos
    const realDevices = [];
    const testDevices = [];
    const onlineDevices = [];

    allDevices.rows.forEach(device => {
      // Critérios para identificar dispositivos de teste:
      const isTestDevice = 
        device.name.includes('DEV-') ||
        device.name.includes('Smartwatch') ||
        device.name.includes('Notebook') ||
        device.name.includes('Desktop') ||
        device.name.includes('Tablet') ||
        device.manufacturer === null ||
        device.model?.includes('MacBook') ||
        device.model?.includes('Dell') ||
        device.model?.includes('iPad') ||
        device.model?.includes('Apple Watch');

      if (isTestDevice) {
        testDevices.push(device);
      } else {
        realDevices.push(device);
      }

      if (device.status === 'online') {
        onlineDevices.push(device);
      }
    });

    console.log('📊 ANÁLISE DE DISPOSITIVOS:\n');
    
    console.log(`✅ Dispositivos REAIS: ${realDevices.length}`);
    realDevices.forEach(device => {
      console.log(`   - ${device.name} (${device.device_identifier})`);
      console.log(`     Status: ${device.status}, Último acesso: ${device.last_seen_at || 'Nunca'}`);
    });

    console.log(`\n🧪 Dispositivos de TESTE: ${testDevices.length}`);
    testDevices.forEach(device => {
      console.log(`   - ${device.name} (${device.id})`);
      console.log(`     Status: ${device.status}, Tipo: ${device.device_type}`);
    });

    console.log(`\n🟢 Dispositivos marcados como ONLINE: ${onlineDevices.length}`);
    onlineDevices.forEach(device => {
      console.log(`   - ${device.name} (${device.status})`);
      console.log(`     Último acesso: ${device.last_seen_at || 'NUNCA!'}`);
    });

    // 3. Verificar heartbeat/conexões recentes
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    console.log('\n⏰ VERIFICAÇÃO DE CONECTIVIDADE REAL:');
    console.log(`Horário atual: ${now.toISOString()}`);
    console.log(`Dispositivos com heartbeat < 5min: `);
    
    const recentlyActive = allDevices.rows.filter(device => {
      if (!device.last_seen_at) return false;
      const lastSeen = new Date(device.last_seen_at);
      return lastSeen > fiveMinutesAgo;
    });

    if (recentlyActive.length === 0) {
      console.log('   ❌ NENHUM dispositivo com heartbeat recente!');
    } else {
      recentlyActive.forEach(device => {
        console.log(`   ✅ ${device.name}: ${device.last_seen_at}`);
      });
    }

    // 4. Verificar device_registrations pendentes
    const pendingRegistrations = await pool.query(`
      SELECT 
        id,
        pairing_code,
        device_info,
        status,
        created_at
      FROM device_registrations 
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `);

    console.log(`\n📋 Dispositivos pendentes de aprovação: ${pendingRegistrations.rows.length}`);
    pendingRegistrations.rows.forEach(reg => {
      const deviceInfo = reg.device_info;
      console.log(`   - Código: ${reg.pairing_code}`);
      console.log(`     Modelo: ${deviceInfo?.device_model || 'Desconhecido'}`);
      console.log(`     Criado: ${reg.created_at}`);
    });

    console.log('\n🔧 RECOMENDAÇÕES:');
    console.log('1. Remover dispositivos de teste da produção');
    console.log('2. Implementar heartbeat real para status online');
    console.log('3. Adicionar campos de bateria e localização');
    console.log('4. Configurar timeout para marcar offline automaticamente');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

analyzeDevices();