#!/usr/bin/env node

// Script para testar a API de heartbeat
async function testHeartbeat() {
  try {
    console.log('🫀 Testando API de heartbeat...\n');

    // Dados de exemplo de um dispositivo Android
    const heartbeatData = {
      battery_level: 85,
      battery_status: 'discharging',
      location_lat: -23.5505,
      location_lng: -46.6333,
      location_accuracy: 10.5,
      network_info: {
        type: 'wifi',
        strength: -45,
        ssid: 'CORUZEN_GUEST'
      },
      app_version: '1.0.0',
      os_version: 'Android 13'
    };

    // Testar com dispositivo real (usando o ID do dispositivo aprovado)
    const deviceId = 'admin_1758330145177_agckozilp'; // Dispositivo - 580726
    
    console.log(`📱 Enviando heartbeat para dispositivo: ${deviceId}`);
    console.log(`📊 Dados do heartbeat:`, JSON.stringify(heartbeatData, null, 2));

    const response = await fetch(`https://friaxis.coruzen.com/api/devices/${deviceId}/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-token-mock'
      },
      body: JSON.stringify(heartbeatData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Heartbeat enviado com sucesso!');
      console.log('📄 Resposta:', JSON.stringify(result, null, 2));
      
      // Aguardar um momento e verificar se o dispositivo aparece como online
      console.log('\n⏳ Aguardando 2 segundos...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('\n🔍 Verificando lista de dispositivos...');
      const devicesResponse = await fetch('https://friaxis.coruzen.com/api/devices', {
        headers: {
          'Authorization': 'Bearer dev-token-mock'
        }
      });
      
      const devicesResult = await devicesResponse.json();
      
      if (devicesResponse.ok) {
        const device = devicesResult.data.find(d => d.id === deviceId);
        if (device) {
          console.log(`📱 Status do dispositivo ${device.name}:`);
          console.log(`   ⚡ Status: ${device.status}`);
          console.log(`   🔋 Bateria: ${device.battery_level}% (${device.battery_status})`);
          console.log(`   📍 Localização: ${device.location_lat}, ${device.location_lng}`);
          console.log(`   💓 Último heartbeat: ${device.last_heartbeat}`);
          console.log(`   🌐 Rede: ${device.network_info?.ssid || 'Desconhecida'}`);
        } else {
          console.log('❌ Dispositivo não encontrado na lista');
        }
      } else {
        console.log('❌ Erro ao buscar dispositivos:', devicesResult);
      }
      
    } else {
      console.log('\n❌ Erro no heartbeat:');
      console.log('📄 Resposta:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testHeartbeat();