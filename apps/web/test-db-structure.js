/**
 * Simple API test to check database structure
 */

const testDatabase = async () => {
    try {
        const response = await fetch('https://friaxis.coruzen.com/api/debug/database', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer mock-token-for-testing'
            }
        });
        
        const data = await response.json();
        
        console.log('🗄️ Database Structure:');
        console.log('\n📋 device_commands table:');
        if (data.device_commands) {
            console.log(JSON.stringify(data.device_commands, null, 2));
        } else {
            console.log('No device_commands structure found');
        }
        
        console.log('\n📍 locations table:');
        if (data.locations) {
            console.log(JSON.stringify(data.locations, null, 2));
        } else {
            console.log('No locations structure found');
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
};

testDatabase();