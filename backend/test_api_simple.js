const axios = require('axios');

// Test the counselor performance matrix API without authentication
async function testCounselorAPI() {
  try {
    console.log('Testing API endpoint on port 8080...');
    
    const response = await axios.get('http://localhost:8080/college/candidate/counselor-performance-matrix', {
      params: {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      },
      timeout: 5000
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', response.data);
  } catch (error) {
    console.error('API Error Status:', error.response?.status);
    console.error('API Error Message:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('Authentication required - this is expected');
    } else if (error.response?.status === 404) {
      console.log('Endpoint not found - check route registration');
    }
  }
}

testCounselorAPI();
