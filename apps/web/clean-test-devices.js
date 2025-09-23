// Script para limpar dispositivos de teste e manter apenas dispositivos reais
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function cleanTestDevices() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  try {
    console.log('🧹 Iniciando limpeza de dispositivos de teste...\n');
    
    // Primeiro, mostrar quantos dispositivos existem
    const totalBefore = await sql`SELECT COUNT(*) as count FROM devices`;
    console.log(`📊 Total de dispositivos antes da limpeza: ${totalBefore[0].count}\n`);
    
    // Identificar dispositivos que são claramente de teste
    const testDevices = await sql`
      SELECT id, name, device_identifier, created_at
      FROM devices 
      WHERE 
        name LIKE 'Test%' OR
        name LIKE '%test%' OR
        name LIKE '%Test%' OR
        device_identifier LIKE 'test_%' OR
        device_identifier LIKE 'admin_%' OR
        device_identifier LIKE 'integration_test_%' OR
        device_identifier LIKE 'android_%' OR
        model = 'Pendente de Configuração' OR
        model = 'Test Model' OR
        model = 'Android Test' OR
        status = 'inactive'
      ORDER BY created_at DESC
    `;
    
    console.log(`🔍 Encontrados ${testDevices.length} dispositivos de teste/inativos:\n`);
    
    if (testDevices.length > 0) {
      testDevices.forEach((device, index) => {
        console.log(`${index + 1}. ID: ${device.id}`);
        console.log(`   Nome: ${device.name}`);
        console.log(`   Device ID: ${device.device_identifier}`);
        console.log(`   Criado: ${device.created_at}\n`);
      });
      
      // Deletar dispositivos de teste
      const deleted = await sql`
        DELETE FROM devices 
        WHERE 
          name LIKE 'Test%' OR
          name LIKE '%test%' OR
          name LIKE '%Test%' OR
          device_identifier LIKE 'test_%' OR
          device_identifier LIKE 'admin_%' OR
          device_identifier LIKE 'integration_test_%' OR
          device_identifier LIKE 'android_%' OR
          model = 'Pendente de Configuração' OR
          model = 'Test Model' OR
          model = 'Android Test' OR
          status = 'inactive'
      `;
      
      console.log(`✅ Deletados ${deleted.count} dispositivos de teste\n`);
    }
    
    // Mostrar dispositivos restantes
    const remainingDevices = await sql`
      SELECT id, name, model, os_version, status, created_at
      FROM devices 
      ORDER BY created_at DESC
    `;
    
    console.log(`📱 Dispositivos restantes (${remainingDevices.length}):\n`);
    
    if (remainingDevices.length > 0) {
      remainingDevices.forEach((device, index) => {
        console.log(`${index + 1}. ${device.name} (${device.model})`);
        console.log(`   Status: ${device.status}`);
        console.log(`   OS: ${device.os_version}`);
        console.log(`   ID: ${device.id}`);
        console.log(`   Criado: ${device.created_at}\n`);
      });
    }
    
    const totalAfter = await sql`SELECT COUNT(*) as count FROM devices`;
    console.log(`📊 Total de dispositivos após limpeza: ${totalAfter[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  } finally {
    await sql.end();
  }
}

cleanTestDevices();