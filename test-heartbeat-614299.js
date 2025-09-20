const https = require('https');

// Dados do dispositivo mais recente (614299)
const deviceId = 'admin_1758335037381_cnby3021j';
const apiUrl = 'https://friaxis.coruzen.com';

function sendHeartbeat() {
    const heartbeatData = {
        battery_level: 92,
        battery_status: 'discharging',
        location_lat: -23.5505,
        location_lng: -46.6333,
        location_accuracy: 8.2,
        network_info: {
            type: 'wifi',
            strength: null
        },
        app_version: '1.0.0',
        os_version: '13'
    };

    const postData = JSON.stringify(heartbeatData);
    
    const options = {
        hostname: 'friaxis.coruzen.com',
        port: 443,
        path: `/api/devices/${deviceId}/heartbeat`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': 'Bearer dev-token-mock'
        }
    };

    const req = https.request(options, (res) => {
        console.log(`💓 Heartbeat Response Status: ${res.statusCode}`);
        
        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(responseData);
                console.log('✅ Heartbeat enviado com sucesso!');
                console.log(`   Dispositivo: ${response.device?.name}`);
                console.log(`   Status: ${response.device?.status}`);
                console.log(`   Bateria: ${heartbeatData.battery_level}% (${heartbeatData.battery_status})`);
                console.log(`   Localização: ${heartbeatData.location_lat}, ${heartbeatData.location_lng}`);
                console.log(`   Rede: ${heartbeatData.network_info.type}`);
                console.log(`   Timestamp: ${response.timestamp}`);
            } catch (e) {
                console.log('Response Data:', responseData);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Erro ao enviar heartbeat:', error.message);
    });

    req.write(postData);
    req.end();
}

console.log(`🚀 Simulando heartbeat para dispositivo: ${deviceId}`);
console.log(`📱 Simulando app Android enviando dados em tempo real...`);
sendHeartbeat();