/**
 * Test API to check actual table structure using information_schema
 */

const checkActualSchema = async () => {
    try {
        // Try to query the actual schema from information_schema
        const response = await fetch('https://friaxis.coruzen.com/api/debug/database', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer mock-token-for-testing'
            }
        });
        
        const data = await response.json();
        console.log('🗄️ Full debug response:');
        console.log(JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.error('Error:', error);
    }
};

checkActualSchema();