const testAPI = async () => {
  console.log('🧪 Testing API endpoints...');
  
  try {
    // Test 1: List pending devices
    console.log('1️⃣ Testing GET /api/admin/pending-devices');
    const listResponse = await fetch('https://friaxis.coruzen.com/api/admin/pending-devices', {
      headers: {
        'Authorization': 'Bearer dev-token-mock',
        'Content-Type': 'application/json',
      },
    });
    
    if (listResponse.ok) {
      const devices = await listResponse.json();
      console.log('✅ GET Success:', devices.length, 'devices found');
      
      if (devices.length > 0) {
        const deviceId = devices[0].id;
        console.log('📱 Testing approval for device ID:', deviceId);
        
        // Test 2: Approve first device
        console.log('2️⃣ Testing POST /api/admin/pending-devices/' + deviceId + '/approve');
        const approveResponse = await fetch(`https://friaxis.coruzen.com/api/admin/pending-devices/${deviceId}/approve`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer dev-token-mock',
            'Content-Type': 'application/json',
          },
        });
        
        if (approveResponse.ok) {
          const result = await approveResponse.json();
          console.log('✅ APPROVE Success:', result);
        } else {
          const error = await approveResponse.text();
          console.error('❌ APPROVE Failed:', approveResponse.status, error);
        }
      }
    } else {
      const error = await listResponse.text();
      console.error('❌ GET Failed:', listResponse.status, error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
};

testAPI();