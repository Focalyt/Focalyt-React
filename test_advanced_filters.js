const axios = require('axios');

// Test the counselor performance matrix API with advanced filters
async function testAdvancedFilters() {
  const baseUrl = 'http://localhost:8080/college/candidate/counselor-performance-matrix';
  
  // You'll need to replace with a valid token
  const headers = {
    'x-auth': 'test-token'
  };

  console.log('🧪 Testing Counselor Performance Matrix API with Advanced Filters\n');

  // Test 1: Basic date filter
  console.log('1️⃣ Testing basic date filter...');
  try {
    const response1 = await axios.get(baseUrl, {
      headers,
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      }
    });
    console.log('✅ Basic date filter - Status:', response1.data.status);
    console.log('   Data keys:', Object.keys(response1.data.data || {}));
  } catch (error) {
    console.log('❌ Basic date filter failed:', error.response?.data?.message || error.message);
  }

  // Test 2: Single value filters
  console.log('\n2️⃣ Testing single value filters...');
  try {
    const response2 = await axios.get(baseUrl, {
      headers,
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        centerId: 'all', // Test with 'all' value
        courseId: 'all',
        verticalId: 'all',
        projectId: 'all',
        counselorId: 'all'
      }
    });
    console.log('✅ Single value filters - Status:', response2.data.status);
  } catch (error) {
    console.log('❌ Single value filters failed:', error.response?.data?.message || error.message);
  }

  // Test 3: Multi-select filters (JSON arrays)
  console.log('\n3️⃣ Testing multi-select filters...');
  try {
    const response3 = await axios.get(baseUrl, {
      headers,
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        projects: JSON.stringify(['project1', 'project2']),
        verticals: JSON.stringify(['vertical1']),
        course: JSON.stringify(['course1', 'course2', 'course3']),
        center: JSON.stringify(['center1']),
        counselor: JSON.stringify(['counselor1', 'counselor2'])
      }
    });
    console.log('✅ Multi-select filters - Status:', response3.data.status);
  } catch (error) {
    console.log('❌ Multi-select filters failed:', error.response?.data?.message || error.message);
  }

  // Test 4: Boolean filters
  console.log('\n4️⃣ Testing boolean filters...');
  try {
    const response4 = await axios.get(baseUrl, {
      headers,
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        kycStage: 'true',
        kycApproved: 'false',
        admissionStatus: 'true',
        batchAssigned: 'false',
        zeroPeriodAssigned: 'true',
        batchFreezed: 'false',
        dropOut: 'true'
      }
    });
    console.log('✅ Boolean filters - Status:', response4.data.status);
  } catch (error) {
    console.log('❌ Boolean filters failed:', error.response?.data?.message || error.message);
  }

  // Test 5: Combined filters
  console.log('\n5️⃣ Testing combined filters...');
  try {
    const response5 = await axios.get(baseUrl, {
      headers,
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        centerId: 'center123',
        projects: JSON.stringify(['project1']),
        verticals: JSON.stringify(['vertical1', 'vertical2']),
        kycStage: 'true',
        admissionStatus: 'true'
      }
    });
    console.log('✅ Combined filters - Status:', response5.data.status);
  } catch (error) {
    console.log('❌ Combined filters failed:', error.response?.data?.message || error.message);
  }

  // Test 6: No filters (should return all data)
  console.log('\n6️⃣ Testing no filters...');
  try {
    const response6 = await axios.get(baseUrl, {
      headers
    });
    console.log('✅ No filters - Status:', response6.data.status);
  } catch (error) {
    console.log('❌ No filters failed:', error.response?.data?.message || error.message);
  }

  console.log('\n🎯 Advanced Filters Testing Complete!');
}

// Run the tests
testAdvancedFilters().catch(console.error);
