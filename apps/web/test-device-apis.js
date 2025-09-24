/**
 * Test script for device APIs
 * Tests commands and locations endpoints for specific device
 */

const deviceId = "7b570a85-36c8-4990-9b25-ba20228336a4";
const baseUrl = "https://friaxis.coruzen.com";

async function testAPI(endpoint, description) {
    console.log(`\n🔍 ${description}`);
    console.log(`URL: ${baseUrl}${endpoint}`);
    
    try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer mock-token-for-testing',
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Success: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
        } else {
            const errorText = await response.text();
            console.log(`❌ Error: ${errorText.substring(0, 300)}...`);
        }
    } catch (error) {
        console.log(`❌ Network Error: ${error.message}`);
    }
}

async function testDeviceAPIs() {
    console.log(`🧪 Testing APIs for device: ${deviceId}`);
    
    // Test device info
    await testAPI(`/api/devices/${deviceId}`, "Device Info API");
    
    // Test commands
    await testAPI(`/api/devices/${deviceId}/commands`, "Device Commands API");
    
    // Test locations
    await testAPI(`/api/devices/${deviceId}/locations`, "Device Locations API");
}

// Run tests
testDeviceAPIs().catch(console.error);