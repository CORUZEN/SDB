// Script para limpar registros de device_registrations com estrutura correta
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function cleanDeviceRegistrationsCorrect() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  try {
    console.log('🧹 Limpando registros device_registrations...\n');
    
    const registrationsBefore = await sql`SELECT COUNT(*) as count FROM device_registrations`;
    console.log(`📊 Total de registros antes da limpeza: ${registrationsBefore[0].count}\n`);
    
    // Verificar registros com status pending
    const pendingRegistrations = await sql`
      SELECT id, pairing_code, status, expires_at, created_at, device_info
      FROM device_registrations 
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `;
    
    console.log(`🟡 Registros com status PENDING (${pendingRegistrations.length}):\n`);
    if (pendingRegistrations.length > 0) {
      pendingRegistrations.forEach((reg, index) => {
        const deviceName = reg.device_info?.name || reg.device_info?.device_name || 'Unknown';
        console.log(`${index + 1}. Device: ${deviceName}`);
        console.log(`   Código: ${reg.pairing_code}`);
        console.log(`   Status: ${reg.status}`);
        console.log(`   Expira: ${reg.expires_at}`);
        console.log(`   Criado: ${reg.created_at}\n`);
      });
    }
    
    // Verificar registros expirados OU já aprovados/rejeitados
    const oldRegistrations = await sql`
      SELECT id, pairing_code, status, expires_at, created_at, device_info
      FROM device_registrations 
      WHERE expires_at < NOW() OR (status != 'pending' AND status IS NOT NULL)
      ORDER BY created_at DESC
    `;
    
    if (oldRegistrations.length > 0) {
      console.log(`🔍 Registros expirados/processados encontrados (${oldRegistrations.length}):\n`);
      oldRegistrations.forEach((reg, index) => {
        const deviceName = reg.device_info?.name || reg.device_info?.device_name || 'Unknown';
        console.log(`${index + 1}. Device: ${deviceName}`);
        console.log(`   Código: ${reg.pairing_code}`);
        console.log(`   Status: ${reg.status || 'NULL'}`);
        console.log(`   Expira: ${reg.expires_at}`);
        console.log(`   Criado: ${reg.created_at}\n`);
      });
      
      // Deletar registros antigos/processados
      const deleted = await sql`
        DELETE FROM device_registrations 
        WHERE expires_at < NOW() OR (status != 'pending' AND status IS NOT NULL)
      `;
      
      console.log(`✅ Deletados ${deleted.count} registros antigos/processados\n`);
    }
    
    // Mostrar o que restou
    const registrationsAfter = await sql`SELECT COUNT(*) as count FROM device_registrations`;
    console.log(`📊 Total de registros após limpeza: ${registrationsAfter[0].count}`);
    
    // Mostrar registros restantes
    const remaining = await sql`SELECT * FROM device_registrations ORDER BY created_at DESC`;
    if (remaining.length > 0) {
      console.log(`\n📱 Registros restantes (${remaining.length}):\n`);
      remaining.forEach((reg, index) => {
        const deviceName = reg.device_info?.name || reg.device_info?.device_name || 'Unknown';
        console.log(`${index + 1}. Device: ${deviceName}`);
        console.log(`   Código: ${reg.pairing_code}`);
        console.log(`   Status: ${reg.status || 'NULL'}`);
        console.log(`   Expira: ${reg.expires_at}`);
        console.log(`   Criado: ${reg.created_at}\n`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  } finally {
    await sql.end();
  }
}

cleanDeviceRegistrationsCorrect();