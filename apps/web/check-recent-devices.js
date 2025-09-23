// Script para verificar dispositivos recentes no banco
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function checkRecentDevices() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  try {
    console.log('🔍 Verificando dispositivos criados nas últimas 24 horas...\n');
    
    const devices = await sql`
      SELECT 
        id, 
        name, 
        device_identifier,
        model,
        os_version,
        status,
        metadata,
        created_at,
        updated_at
      FROM devices 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    if (devices.length === 0) {
      console.log('❌ Nenhum dispositivo encontrado nas últimas 24 horas');
      return;
    }
    
    console.log(`✅ Encontrados ${devices.length} dispositivos recentes:\n`);
    
    devices.forEach((device, index) => {
      console.log(`--- Dispositivo ${index + 1} ---`);
      console.log(`ID: ${device.id}`);
      console.log(`Nome: ${device.name}`);
      console.log(`Modelo: ${device.model || 'N/A'}`);
      console.log(`OS Version: ${device.os_version || 'N/A'}`);
      console.log(`Status: ${device.status}`);
      console.log(`Device Identifier: ${device.device_identifier}`);
      console.log(`Pairing Code: ${device.metadata?.pairing_code || 'N/A'}`);
      console.log(`Criado em: ${device.created_at}`);
      console.log(`Atualizado em: ${device.updated_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar dispositivos:', error);
  } finally {
    await sql.end();
  }
}

checkRecentDevices();