// Script para verificar heartbeats automáticos - usando schema correto
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function checkHeartbeats() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  try {
    console.log('🚀 TESTE DE HEARTBEAT AUTOMÁTICO - FRIAXIS v4.0.5');
    console.log('====================================================');
    console.log('Verificando se o HeartbeatService está funcionando...\n');
    
    const devices = await sql`
      SELECT 
        id, 
        name, 
        device_identifier,
        status,
        battery_level,
        location_lat,
        location_lng,
        last_heartbeat,
        created_at,
        updated_at,
        CASE 
          WHEN last_heartbeat IS NOT NULL AND last_heartbeat > NOW() - INTERVAL '5 minutes' THEN 'heartbeat_recent'
          WHEN last_heartbeat IS NOT NULL AND last_heartbeat > NOW() - INTERVAL '30 minutes' THEN 'heartbeat_medium'
          WHEN last_heartbeat IS NOT NULL THEN 'heartbeat_old'
          ELSE 'no_heartbeat'
        END as heartbeat_status,
        EXTRACT(EPOCH FROM (NOW() - COALESCE(last_heartbeat, created_at))) / 60 as minutes_since_heartbeat
      FROM devices 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY last_heartbeat DESC NULLS LAST
      LIMIT 5
    `;
    
    if (devices.length === 0) {
      console.log('❌ Nenhum dispositivo encontrado nas últimas 24 horas');
      console.log('\n🔧 AÇÃO NECESSÁRIA:');
      console.log('1. Instalar APK: FRIAXIS-Mobile-v4.0.5-DASHBOARD-FIX.apk');
      console.log('2. Fazer pairing de um dispositivo');
      console.log('3. Verificar se o HeartbeatService está funcionando');
      return;
    }
    
    console.log(`✅ Encontrados ${devices.length} dispositivos recentes:\n`);
    
    devices.forEach((device, index) => {
      console.log(`📱 Dispositivo ${index + 1}:`);
      console.log(`   ID: ${device.id}`);
      console.log(`   Nome: ${device.name || 'N/A'}`);
      console.log(`   Device ID: ${device.device_identifier || 'N/A'}`);
      console.log(`   Status: ${device.status}`);
      console.log(`   Último heartbeat: ${device.last_heartbeat ? device.last_heartbeat.toLocaleString('pt-BR') : 'Nunca'}`);
      console.log(`   Tempo desde heartbeat: ${Math.floor(device.minutes_since_heartbeat)} minutos`);
      
      // Análise do status do heartbeat
      switch(device.heartbeat_status) {
        case 'heartbeat_recent':
          console.log(`   ✅ HEARTBEAT MUITO RECENTE (< 5 min) - HeartbeatService funcionando!`);
          break;
        case 'heartbeat_medium':
          console.log(`   ⚠️ Heartbeat razoavelmente recente (5-30 min)`);
          break;
        case 'heartbeat_old':
          console.log(`   ❌ Heartbeat antigo (> 30 min) - HeartbeatService pode ter parado`);
          break;
        case 'no_heartbeat':
          console.log(`   ❌ Nenhum heartbeat registrado - HeartbeatService não está funcionando`);
          break;
      }
      
      console.log(`   Bateria: ${device.battery_level !== null ? device.battery_level + '%' : 'N/A'}`);
      console.log(`   Localização: ${device.location_lat && device.location_lng ? 
        `${device.location_lat}, ${device.location_lng}` : 'N/A'}`);
      console.log(`   Criado: ${device.created_at.toLocaleString('pt-BR')}`);
      console.log(`   Atualizado: ${device.updated_at.toLocaleString('pt-BR')}`);
      console.log('');
    });

    // Análise geral
    console.log('📋 ANÁLISE GERAL:');
    const recentDevices = devices.filter(d => d.heartbeat_status === 'heartbeat_recent');
    const mediumDevices = devices.filter(d => d.heartbeat_status === 'heartbeat_medium');
    const oldDevices = devices.filter(d => d.heartbeat_status === 'heartbeat_old');
    const noHeartbeatDevices = devices.filter(d => d.heartbeat_status === 'no_heartbeat');

    if (recentDevices.length > 0) {
      console.log(`✅ ${recentDevices.length} dispositivos com heartbeat recente (< 5 min) - HeartbeatService FUNCIONANDO!`);
    }
    
    if (mediumDevices.length > 0) {
      console.log(`⚠️ ${mediumDevices.length} dispositivos com heartbeat médio (5-30 min) - Talvez funcionando`);
    }
    
    if (oldDevices.length > 0) {
      console.log(`❌ ${oldDevices.length} dispositivos com heartbeat antigo (> 30 min) - Possível problema`);
    }
    
    if (noHeartbeatDevices.length > 0) {
      console.log(`❌ ${noHeartbeatDevices.length} dispositivos sem heartbeat - HeartbeatService não iniciou`);
    }

    // Recomendações
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    
    if (recentDevices.length > 0) {
      console.log('✅ HeartbeatService está funcionando corretamente!');
      console.log('✅ Dashboard deveria mostrar dados agora com o novo APK!');
    } else {
      console.log('⚠️ HeartbeatService não está enviando dados automaticamente');
      console.log('1. Instalar: FRIAXIS-Mobile-v4.0.5-DASHBOARD-FIX.apk');
      console.log('2. Fazer pairing do dispositivo');
      console.log('3. Verificar se HeartbeatService inicia automaticamente após pairing');
      console.log('4. Manter app aberto por alguns minutos para teste');
      console.log('5. Verificar logs do Android se persistir o problema');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar heartbeats:', error);
  } finally {
    await sql.end();
  }
}

checkHeartbeats();