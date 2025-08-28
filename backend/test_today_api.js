const axios = require('axios');

// Test the counselor performance matrix API with today's date range
async function testTodayAPI() {
  try {
    console.log('🎯 Testing API with today\'s date range (25-08-2025 18:30 to 26-08-2025 18:30)...\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NGZmMzVlZGMxOTczMjdiYzkyZGVjOCIsImlhdCI6MTc1NjE4NTU3MX0.RJcD3mQN6huNyVwwEtDfH11s2wyW8I3znp9e1RZ9oQo';
    
    // Test with today's date (26-08-2025)
    const today = '2025-08-26';
    
    console.log('📅 Testing with today\'s date:', today);
    console.log('⏰ Expected range: 25-08-2025 18:30 to 26-08-2025 18:30');
    
    const response = await axios.get('http://localhost:8080/college/candidate/counselor-performance-matrix', {
      params: {
        startDate: today,
        endDate: today
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
        console.log('🎉 SUCCESS: API returns data for today\'s date range!');
        
        // Show sample data
        const firstCounselor = dataKeys[0];
        const counselorData = response.data.data[firstCounselor];
        console.log(`\n📋 Sample data for "${firstCounselor}":`);
        console.log('   Total:', counselorData.Total);
        console.log('   Admissions:', counselorData.Admissions);
        console.log('   Conversion Rate:', counselorData.ConversionRate + '%');
        
        // Show status breakdown
        if (counselorData.statuses) {
          console.log('\n📊 Status breakdown:');
          Object.keys(counselorData.statuses).forEach(status => {
            const statusData = counselorData.statuses[status];
            console.log(`   ${status}: ${statusData.total} leads`);
          });
        }
      } else {
        console.log('⚠️ No data found for today\'s date range.');
        console.log('💡 This means no StatusLogs were created between 25-08-2025 18:30 to 26-08-2025 18:30');
      }
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
  }
}

testTodayAPI();
