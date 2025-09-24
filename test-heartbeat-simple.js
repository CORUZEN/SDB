// Script para monitorar heartbeats automáticos
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
        status,
        battery_level,
        location,
        created_at,
        updated_at,
        EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_since_update
      FROM devices 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 5
    `;
    
    if (devices.length === 0) {
      console.log('❌ Nenhum dispositivo encontrado nas últimas 24 horas');
      return;
    }
    
    console.log(`✅ Encontrados ${devices.length} dispositivos recentes:\n`);
    
    devices.forEach((device, index) => {
      console.log(`📱 Dispositivo ${index + 1}:`);
      console.log(`   ID: ${device.id}`);
      console.log(`   Nome: ${device.name || 'N/A'}`);
      console.log(`   Status: ${device.status}`);
      
      const lastUpdate = new Date(device.updated_at);
      const now = new Date();
      const minutesAgo = Math.floor((now - lastUpdate) / (1000 * 60));
      
      console.log(`   Última atualização: ${device.updated_at}`);
      console.log(`   Tempo desde última atualização: ${minutesAgo} minutos`);
      
      if (minutesAgo < 5) {
        console.log(`   ✅ ATUALIZAÇÃO MUITO RECENTE - HeartbeatService ativo!`);
      } else if (minutesAgo < 30) {
        console.log(`   ⚠️ Atualização razoavelmente recente (${minutesAgo} min)`);
      } else if (minutesAgo < 120) {
        console.log(`   ⚠️ Atualização um pouco antiga (${minutesAgo} min)`);
      } else {
        console.log(`   ❌ Atualização muito antiga (${minutesAgo} min) - HeartbeatService pode estar parado`);
      }
      
      console.log(`   Bateria: ${device.battery_level !== null ? device.battery_level + '%' : 'N/A'}`);
      console.log(`   Localização: ${device.location || 'N/A'}`);
      console.log(`   Criado: ${device.created_at}`);
      console.log('');
    });

    console.log('📋 ANÁLISE GERAL:');
    const recentDevices = devices.filter(d => {
      const minutesAgo = Math.floor((new Date() - new Date(d.updated_at)) / (1000 * 60));
      return minutesAgo < 30;
    });

    if (recentDevices.length > 0) {
      console.log(`✅ ${recentDevices.length} dispositivos com atividade recente (< 30 min)`);
      console.log('   O HeartbeatService parece estar funcionando!');
    } else {
      console.log('❌ Nenhum dispositivo com atividade recente');
      console.log('   Possíveis problemas:');
      console.log('   1. HeartbeatService não está iniciando após pairing');
      console.log('   2. App foi fechado/morto pelo sistema');
      console.log('   3. Problemas de conectividade de rede');
      console.log('   4. Erro no código do HeartbeatService');
    }

    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Instalar novo APK: FRIAXIS-Mobile-v4.0.5-DASHBOARD-FIX.apk');
    console.log('2. Fazer pairing de um dispositivo');
    console.log('3. Deixar app aberto por alguns minutos');
    console.log('4. Executar este script novamente para verificar atualizações');
    
  } catch (error) {
    console.error('❌ Erro ao verificar heartbeats:', error);
  } finally {
    await sql.end();
  }
}

checkHeartbeats();