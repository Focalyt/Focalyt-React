const axios = require('axios');

// Test the updated counselor performance matrix API
async function testUpdatedAPI() {
  try {
    console.log('🎯 Testing Updated API with today\'s date...\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NGZmMzVlZGMxOTczMjdiYzkyZGVjOCIsImlhdCI6MTc1NjE4NTU3MX0.RJcD3mQN6huNyVwwEtDfH11s2wyW8I3znp9e1RZ9oQo';
    
    // Test with today's date (like frontend)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
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
      
      if (dataKeys.length > 0) {
        console.log('👥 Counselor names:', dataKeys);
        console.log('🎉 SUCCESS: API now returns data even with today\'s date!');
        
        // Show sample data
        const firstCounselor = dataKeys[0];
        const counselorData = response.data.data[firstCounselor];
        console.log(`\n📋 Sample data for "${firstCounselor}":`);
        console.log('   Total:', counselorData.Total);
        console.log('   Admissions:', counselorData.Admissions);
        console.log('   Conversion Rate:', counselorData.ConversionRate + '%');
      } else {
        console.log('⚠️ Still no data found. Testing without date parameters...');
        
        const responseNoDate = await axios.get('http://localhost:8080/college/candidate/counselor-performance-matrix', {
          headers: {
            'x-auth': token
          },
          timeout: 5000
        });
        
        const dataKeysNoDate = Object.keys(responseNoDate.data.data);
        console.log('📊 Number of counselors found without date filter:', dataKeysNoDate.length);
        
        if (dataKeysNoDate.length > 0) {
          console.log('👥 Counselor names:', dataKeysNoDate);
          console.log('🎉 SUCCESS: API returns data without date parameters!');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
  }
}

testUpdatedAPI();
