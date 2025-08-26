const axios = require('axios');

// Test the counselor performance matrix API
async function testCounselorAPI() {
  try {
    const response = await axios.get('http://localhost:3000/college/candidate/counselor-performance-matrix', {
      headers: {
        'x-auth': 'test-token' // You'll need to replace with a valid token
      },
      params: {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }
    });
    
    console.log('API Response:', response.data);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
}

testCounselorAPI();
