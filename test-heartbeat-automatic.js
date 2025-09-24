#!/usr/bin/env node

/**
 * Test automatic heartbeat functionality
 * Monitors database for device status updates over time
 * This simulates checking if the HeartbeatService in the Android app
 * is automatically sending telemetry data
 */

const https = require('https');

// Configuration
const NEON_CONNECTION_STRING = 'postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        const { Client } = require('pg');
        const client = new Client({
            connectionString: NEON_CONNECTION_STRING,
        });

        client.connect()
            .then(() => client.query(query, params))
            .then(result => {
                client.end();
                resolve(result);
            })
            .catch(error => {
                client.end();
                reject(error);
            });
    });
}

async function checkDeviceStatus() {
    try {
        console.log('\n🔍 Verificando status atual dos dispositivos...\n');
        
        const query = `
            SELECT 
                id,
                name,
                status,
                updated_at,
                battery_level,
                location,
                created_at,
                EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_since_update
            FROM devices 
            WHERE created_at > NOW() - INTERVAL '24 hours'
            ORDER BY updated_at DESC NULLS LAST
        `;
        
        const result = await executeQuery(query);
        
        if (result.rows.length === 0) {
            console.log('❌ Nenhum dispositivo encontrado nas últimas 24 horas');
            return false;
        }
        
        result.rows.forEach((device, index) => {
            console.log(`📱 Dispositivo ${index + 1}:`);
            console.log(`   ID: ${device.id}`);
            console.log(`   Nome: ${device.name || 'N/A'}`);
            console.log(`   Status: ${device.status}`);
            console.log(`   Última atualização: ${device.updated_at || 'Nunca'}`);
            
            if (device.seconds_since_update !== null) {
                const minutes = Math.floor(device.seconds_since_update / 60);
                console.log(`   Tempo desde última atualização: ${minutes} minutos`);
                
                if (minutes < 5) {
                    console.log(`   ✅ ATUALIZAÇÃO RECENTE - HeartbeatService funcionando!`);
                } else if (minutes < 30) {
                    console.log(`   ⚠️ Atualização um pouco antiga (${minutes} min)`);
                } else {
                    console.log(`   ❌ Atualização muito antiga (${minutes} min)`);
                }
            } else {
                console.log(`   ❌ Nenhuma atualização registrada`);
            }
            
            console.log(`   Bateria: ${device.battery_level !== null ? device.battery_level + '%' : 'N/A'}`);
            console.log(`   Localização: ${device.location || 'N/A'}`);
            console.log(`   Criado em: ${device.created_at}`);
            console.log('');
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao verificar dispositivos:', error.message);
        return false;
    }
}

async function monitorHeartbeats() {
    console.log('🚀 TESTE DE HEARTBEAT AUTOMÁTICO - FRIAXIS v4.0.5');
    console.log('====================================================');
    console.log('Este script monitora se o HeartbeatService do Android');
    console.log('está enviando dados automaticamente para o servidor.');
    console.log('');
    
    // Check initial status
    await checkDeviceStatus();
    
    console.log('🔄 Monitorando por 3 minutos...');
    console.log('(O HeartbeatService deve enviar dados a cada 60 segundos)');
    console.log('');
    
    let checkCount = 0;
    const maxChecks = 6; // 3 minutos, checking every 30 seconds
    
    const interval = setInterval(async () => {
        checkCount++;
        console.log(`\n⏰ Verificação ${checkCount}/${maxChecks} (${new Date().toLocaleTimeString()}):`);
        console.log('─'.repeat(50));
        
        await checkDeviceStatus();
        
        if (checkCount >= maxChecks) {
            clearInterval(interval);
            console.log('\n🏁 Monitoramento concluído.');
            console.log('\n📋 ANÁLISE:');
            console.log('- Se você viu heartbeats recentes (< 5 min), o HeartbeatService está funcionando ✅');
            console.log('- Se os heartbeats são antigos (> 30 min), verifique se o app está rodando ⚠️');
            console.log('- Se não há heartbeats, o HeartbeatService pode não estar iniciando ❌');
            console.log('\n🔧 PRÓXIMOS PASSOS se não estiver funcionando:');
            console.log('1. Instalar novo APK: FRIAXIS-Mobile-v4.0.5-DASHBOARD-FIX.apk');
            console.log('2. Fazer pairing do dispositivo');
            console.log('3. Verificar se o HeartbeatService inicia após o pairing');
            console.log('4. Checar logs do Android para erros');
            process.exit(0);
        }
    }, 30000); // Check every 30 seconds
}

// Run the monitor
monitorHeartbeats().catch(console.error);