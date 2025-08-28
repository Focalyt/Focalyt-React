const axios = require('axios');

// Test the counselor performance matrix API with different parameters
async function testFrontendAPI() {
  try {
    console.log('🔍 Testing API with different parameters to match frontend...\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NGZmMzVlZGMxOTczMjdiYzkyZGVjOCIsImlhdCI6MTc1NjE4NTU3MX0.RJcD3mQN6huNyVwwEtDfH11s2wyW8I3znp9e1RZ9oQo';
    
    // Test with today's date (like frontend might be doing)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('📅 Testing with today\'s date:', todayStr);
    
    const response = await axios.get('http://localhost:8080/college/candidate/counselor-performance-matrix', {
      params: {
        startDate: todayStr,
        endDate: todayStr
      },
      headers: {
        'x-auth': token
      },
      timeout: 5000
    });
    
    console.log('✅ API Status:', response.status);
    
    if (response.data && response.data.data) {
      const dataKeys = Object.keys(response.data.data);
      console.log('📊 Number of counselors found:', dataKeys.length);
      
      if (dataKeys.length === 0) {
        console.log('⚠️ No data found with today\'s date. Testing with 2025 date range...');
        
        // Test with 2025 date range (where we know data exists)
        const response2025 = await axios.get('http://localhost:8080/college/candidate/counselor-performance-matrix', {
          params: {
            startDate: '2025-01-01',
            endDate: '2025-12-31'
          },
          headers: {
            'x-auth': token
          },
          timeout: 5000
        });
        
        const dataKeys2025 = Object.keys(response2025.data.data);
        console.log('📊 Number of counselors found with 2025 range:', dataKeys2025.length);
        console.log('👥 Counselor names:', dataKeys2025);
        
        if (dataKeys2025.length > 0) {
          console.log('\n💡 SOLUTION: Frontend is using today\'s date but data exists only in 2025!');
          console.log('   Frontend should use date range: 2025-01-01 to 2025-12-31');
        }
      } else {
        console.log('👥 Counselor names:', dataKeys);
      }
    }
    
    // Also test without any date parameters
    console.log('\n📅 Testing without date parameters...');
    const responseNoDate = await axios.get('http://localhost:8080/college/candidate/counselor-performance-matrix', {
      headers: {
        'x-auth': token
      },
      timeout: 5000
    });
    
    const dataKeysNoDate = Object.keys(responseNoDate.data.data);
    console.log('📊 Number of counselors found without date filter:', dataKeysNoDate.length);
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
  }
}

testFrontendAPI();
