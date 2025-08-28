const axios = require('axios');

// Test the counselor performance matrix API
async function testCounselorAPI() {
  try {
    console.log('🎯 Testing Counselor Performance Matrix API...\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NGZmMzVlZGMxOTczMjdiYzkyZGVjOCIsImlhdCI6MTc1NjE4NTU3MX0.RJcD3mQN6huNyVwwEtDfH11s2wyW8I3znp9e1RZ9oQo';
    
    const response = await axios.get('http://localhost:8080/college/candidate/counselor-performance-matrix', {
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      },
      headers: {
        'x-auth': token
      },
      timeout: 5000
    });
    
    console.log('✅ API Status:', response.status);
    console.log('✅ API Working Successfully!\n');
    
    if (response.data && response.data.data) {
      const dataKeys = Object.keys(response.data.data);
      console.log('📊 Number of counselors found:', dataKeys.length);
      console.log('👥 Counselor names:', dataKeys);
      
      // Show sample data structure
      if (dataKeys.length > 0) {
        const firstCounselor = dataKeys[0];
        const counselorData = response.data.data[firstCounselor];
        console.log(`\n📋 Sample data for "${firstCounselor}":`);
        console.log('   Total:', counselorData.Total);
        console.log('   Admissions:', counselorData.Admissions);
        console.log('   Conversion Rate:', counselorData.ConversionRate + '%');
        
        // Show status breakdown
        if (counselorData.statuses) {
          console.log('   Status breakdown:');
          Object.keys(counselorData.statuses).forEach(status => {
            const statusData = counselorData.statuses[status];
            console.log(`     ${status}: ${statusData.total} leads`);
            
            // Show sub-status breakdown
            if (statusData.substatuses) {
              Object.keys(statusData.substatuses).forEach(subStatus => {
                console.log(`       - ${subStatus}: ${statusData.substatuses[subStatus]}`);
              });
            }
          });
        }
      }
      
      // Show summary
      if (response.data.summary) {
        console.log('\n📈 Summary:');
        console.log('   Total Counselors:', response.data.summary.totalCounselors);
        console.log('   Total Leads:', response.data.summary.totalLeads);
        console.log('   Total Admissions:', response.data.summary.totalAdmissions);
        console.log('   Average Conversion Rate:', response.data.summary.averageConversionRate.toFixed(1) + '%');
      }
    } else {
      console.log('⚠️ No data found in API response.');
    }
    
  } catch (error) {
    console.error('❌ API Error Status:', error.response?.status);
    console.error('❌ API Error Message:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Authentication required - this is expected');
    } else if (error.response?.status === 404) {
      console.log('🚫 Endpoint not found - check URL and server status');
    }
  }
}

testCounselorAPI();
