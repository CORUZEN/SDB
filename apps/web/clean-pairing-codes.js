// Script para limpar códigos de pairing antigos da tabela pairing_codes
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function cleanPairingCodes() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  try {
    console.log('🧹 Limpando códigos de pairing antigos...\n');
    
    // Mostrar códigos existentes
    const codesBefore = await sql`SELECT COUNT(*) as count FROM pairing_codes`;
    console.log(`📊 Total de códigos antes da limpeza: ${codesBefore[0].count}\n`);
    
    // Mostrar códigos problemáticos
    const oldCodes = await sql`
      SELECT code, description, expires_at, used, created_at
      FROM pairing_codes 
      WHERE expires_at < NOW() OR used = TRUE
      ORDER BY created_at DESC
    `;
    
    if (oldCodes.length > 0) {
      console.log(`🔍 Códigos expirados/usados encontrados (${oldCodes.length}):\n`);
      oldCodes.forEach((code, index) => {
        console.log(`${index + 1}. Código: ${code.code}`);
        console.log(`   Descrição: ${code.description}`);
        console.log(`   Expira em: ${code.expires_at}`);
        console.log(`   Usado: ${code.used}`);
        console.log(`   Criado: ${code.created_at}\n`);
      });
      
      // Deletar códigos antigos/usados
      const deleted = await sql`
        DELETE FROM pairing_codes 
        WHERE expires_at < NOW() OR used = TRUE
      `;
      
      console.log(`✅ Deletados ${deleted.count} códigos antigos/usados\n`);
    }
    
    // Mostrar códigos válidos restantes
    const validCodes = await sql`
      SELECT code, description, expires_at, created_at
      FROM pairing_codes 
      WHERE expires_at > NOW() AND used = FALSE
      ORDER BY created_at DESC
    `;
    
    console.log(`📱 Códigos válidos restantes (${validCodes.length}):\n`);
    
    if (validCodes.length > 0) {
      validCodes.forEach((code, index) => {
        console.log(`${index + 1}. Código: ${code.code}`);
        console.log(`   Descrição: ${code.description}`);
        console.log(`   Expira em: ${code.expires_at}`);
        console.log(`   Criado: ${code.created_at}\n`);
      });
    }
    
    const codesAfter = await sql`SELECT COUNT(*) as count FROM pairing_codes`;
    console.log(`📊 Total de códigos após limpeza: ${codesAfter[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro na limpeza de códigos:', error);
  } finally {
    await sql.end();
  }
}

cleanPairingCodes();