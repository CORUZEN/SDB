/**
 * Test to check the actual structure of device_commands table
 */

const testTableStructure = async () => {
    try {
        // Test 1: Try getting all columns from a device_commands query that should work
        console.log('🔍 Testing device_commands table structure...');
        
        const testQuery = await fetch('https://friaxis.coruzen.com/api/debug/database', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer mock-token-for-testing'
            }
        });
        
        if (testQuery.ok) {
            const data = await testQuery.json();
            console.log('✅ Debug database response received');
            
            // List all available keys
            console.log('\n📋 Available table structures:');
            Object.keys(data).forEach(key => {
                console.log(`- ${key}`);
            });
        }
        
        // Test 2: Try a simple SELECT * from device_commands to see the error
        console.log('\n🧪 Testing direct SELECT on device_commands...');
        
        const response = await fetch('https://friaxis.coruzen.com/api/devices/7b570a85-36c8-4990-9b25-ba20228336a4/commands?limit=1', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer mock-token-for-testing',
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Status: ${response.status}`);
        const result = await response.text();
        console.log(`Response: ${result.substring(0, 500)}...`);
        
    } catch (error) {
        console.error('Error:', error);
    }
};

testTableStructure();