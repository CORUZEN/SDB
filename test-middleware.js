/**
 * Middleware Test - FRIAXIS v4.0.0
 * Teste simples para validar middleware multi-tenant
 */

const testMiddleware = async () => {
  console.log('🧪 Testing FRIAXIS v4.0.0 Middleware...\n');

  const baseUrl = 'http://localhost:3000';
  
  const tests = [
    {
      name: 'Public Route - Should Allow',
      url: `${baseUrl}/login`,
      expectedStatus: 200,
      headers: {}
    },
    {
      name: 'Protected Route Without Auth - Should Redirect',
      url: `${baseUrl}/dashboard`,
      expectedStatus: 307, // Next.js redirect
      headers: {}
    },
    {
      name: 'API Route Without Auth - Should Return 401',
      url: `${baseUrl}/api/devices`,
      expectedStatus: 401,
      headers: {}
    },
    {
      name: 'API Route With Auth - Should Allow',
      url: `${baseUrl}/api/organizations/me`,
      expectedStatus: 200,
      headers: {
        'Authorization': 'Bearer mock-token-for-testing'
      }
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      
      const response = await fetch(test.url, {
        method: 'GET',
        headers: test.headers,
      });

      const success = response.status === test.expectedStatus;
      
      if (success) {
        console.log(`✅ PASSED - Status: ${response.status}`);
        passed++;
      } else {
        console.log(`❌ FAILED - Expected: ${test.expectedStatus}, Got: ${response.status}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`❌ FAILED - Error: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }

  console.log(`📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All middleware tests passed! Multi-tenant system is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check Next.js server is running on localhost:3000');
  }
};

// Run tests
testMiddleware().catch(console.error);