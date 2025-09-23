const { Client } = require('pg');

async function getPairingCode() {
  const client = new Client({
    connectionString: 'postgresql://user:password@localhost:5432/friaxis'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco...');

    // Buscar o pairing_code do dispositivo específico
    const deviceId = 'android_1758596382219_cdl0mv62c';
    const query = 'SELECT id, name, device_identifier, pairing_code, status FROM devices WHERE id = $1';
    const result = await client.query(query, [deviceId]);
    
    if (result.rows.length > 0) {
      console.log('📱 Dispositivo encontrado:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      return result.rows[0].pairing_code;
    } else {
      console.log('❌ Dispositivo não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

getPairingCode();