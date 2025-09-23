// Script para limpar registros pendentes antigos da tabela device_registrations
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function cleanDeviceRegistrations() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  try {
    console.log('🧹 Limpando registros pendentes antigos...\n');
    
    // Verificar se a tabela existe
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'device_registrations'
      )
    `;
    
    if (!tableExists[0].exists) {
      console.log('ℹ️ Tabela device_registrations não existe - nada para limpar');
      return;
    }
    
    // Mostrar registros existentes
    const registrationsBefore = await sql`SELECT COUNT(*) as count FROM device_registrations`;
    console.log(`📊 Total de registros antes da limpeza: ${registrationsBefore[0].count}\n`);
    
    // Mostrar registros problemáticos
    const oldRegistrations = await sql`
      SELECT id, device_name, pairing_code, status, expires_at, created_at
      FROM device_registrations 
      WHERE expires_at < NOW() OR status != 'pending'
      ORDER BY created_at DESC
    `;
    
    if (oldRegistrations.length > 0) {
      console.log(`🔍 Registros expirados/processados encontrados (${oldRegistrations.length}):\n`);
      oldRegistrations.forEach((reg, index) => {
        console.log(`${index + 1}. Device: ${reg.device_name}`);
        console.log(`   Código: ${reg.pairing_code}`);
        console.log(`   Status: ${reg.status}`);
        console.log(`   Expira: ${reg.expires_at}`);
        console.log(`   Criado: ${reg.created_at}\n`);
      });
      
      // Deletar registros antigos/processados
      const deleted = await sql`
        DELETE FROM device_registrations 
        WHERE expires_at < NOW() OR status != 'pending'
      `;
      
      console.log(`✅ Deletados ${deleted.count} registros antigos/processados\n`);
    }
    
    // Mostrar registros válidos restantes
    const validRegistrations = await sql`
      SELECT id, device_name, pairing_code, status, expires_at, created_at
      FROM device_registrations 
      WHERE expires_at > NOW() AND status = 'pending'
      ORDER BY created_at DESC
    `;
    
    console.log(`📱 Registros pendentes válidos restantes (${validRegistrations.length}):\n`);
    
    if (validRegistrations.length > 0) {
      validRegistrations.forEach((reg, index) => {
        console.log(`${index + 1}. Device: ${reg.device_name}`);
        console.log(`   Código: ${reg.pairing_code}`);
        console.log(`   Status: ${reg.status}`);
        console.log(`   Expira: ${reg.expires_at}`);
        console.log(`   Criado: ${reg.created_at}\n`);
      });
    }
    
    const registrationsAfter = await sql`SELECT COUNT(*) as count FROM device_registrations`;
    console.log(`📊 Total de registros após limpeza: ${registrationsAfter[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro na limpeza de registros:', error);
  } finally {
    await sql.end();
  }
}

cleanDeviceRegistrations();