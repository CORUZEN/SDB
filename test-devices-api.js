const testDevicesAPI = async () => {
  console.log('🧪 Testing devices API...');
  
  try {
    const response = await fetch('https://friaxis.coruzen.com/api/devices', {
      headers: {
        'Authorization': 'Bearer dev-token-mock',
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Response Status:', response.status);
      console.log('📱 Total devices returned:', result.data?.length || 'Unknown');
      
      if (result.data && Array.isArray(result.data)) {
        console.log('\n📋 Devices list:');
        result.data.forEach((device, index) => {
          console.log(`${index + 1}. ID: ${device.id}`);
          console.log(`   Nome: ${device.name}`);
          console.log(`   Status: ${device.status}`);
          console.log(`   Org ID: ${device.organization_id}`);
          console.log('');
        });
      } else {
        console.log('❌ Unexpected response format:', result);
      }
    } else {
      const error = await response.text();
      console.error('❌ API Failed:', response.status, error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
};

testDevicesAPI();