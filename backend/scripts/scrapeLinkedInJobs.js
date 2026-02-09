
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const axios = require('axios');

const BASE_URL = process.env.MIPIE_BACKEND_URL || 'http://localhost:8080';

// Get arguments from command line
// searchQuery can be empty to get ALL jobs from all sectors
const searchQuery = process.argv[2] || ''; // Empty = all jobs
const location = process.argv[3] || 'India'; // Default to India for all jobs
const maxPages = parseInt(process.argv[4]) || 15; 
const sheetName = process.argv[5] || 'LinkedIn Jobs';

async function scrapeLinkedInJobs() {
  console.log('\n🚀 LinkedIn Job Scraper\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 Search Parameters:');
  console.log(`   Query: "${searchQuery || 'ALL JOBS (all sectors)'}"`);
  console.log(`   Location: "${location}"`);
  console.log(`   Pages: ${maxPages}`);
  console.log(`   Sheet: "${sheetName}"`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    console.log(`⏳ Scraping LinkedIn... (This may take 1-2 minutes per page)`);
    console.log(`   Expected jobs: ~${maxPages * 25} jobs (25 per page)\n`);
    
    const response = await axios.post(`${BASE_URL}/api/ai/scrape-jobs/linkedin`, {
      searchQuery: searchQuery,
      location: location,
      maxPages: maxPages,
      sheetName: sheetName,
      enrichContactInfo: false // Disable contact enrichment for faster scraping (can enable if needed)
    }, {
      timeout: 600000 // 10 minutes timeout for multiple pages
    });

    console.log('✅ Scraping completed!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Results:');
    console.log(`   Status: ${response.data.status ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Message: ${response.data.message}`);
    console.log(`   Jobs Found: ${response.data.jobs?.length || 0}`);
    console.log(`   Saved to Sheet: ${response.data.savedToSheet ? '✅ Yes' : '❌ No'}`);
    console.log(`   Saved Count: ${response.data.savedCount || 0} new jobs`);
    if (response.data.duplicateCount > 0) {
      console.log(`   Duplicates Skipped: ${response.data.duplicateCount} (already in sheet)`);
    }
    console.log(`   Sheet Name: ${response.data.sheetName}`);

    if (response.data.jobs && response.data.jobs.length > 0) {
      console.log('\n📋 Sample Jobs:');
      response.data.jobs.slice(0, 3).forEach((job, index) => {
        console.log(`\n   ${index + 1}. ${job.title}`);
        console.log(`      Company: ${job.company}`);
        console.log(`      Location: ${job.location?.city || 'N/A'} ${job.location?.state || ''}`);
        if (job.salary) {
          console.log(`      Salary: ${job.salary.min || 'N/A'} - ${job.salary.max || 'N/A'}`);
        }
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Next Steps:');
    console.log(`   1. Open Google Sheet: https://docs.google.com/spreadsheets/d/${process.env.sheetId || 'YOUR_SHEET_ID'}/edit`);
    console.log(`   2. Check "${sheetName}" tab`);
    console.log(`   3. Verify ${response.data.jobs?.length || 0} jobs are saved\n`);

  } catch (error) {
    console.log('❌ Scraping failed!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Error Details:');
    console.log(`   Message: ${error.message}`);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    if (error.code === 'ECONNREFUSED' || !BASE_URL || BASE_URL === 'undefined') {
      console.log('\n💡 Tip: Make sure your server is running');
      console.log(`   Current URL: ${BASE_URL || 'NOT SET'}`);
      console.log('   Run: npm start (in backend folder)');
      console.log('   Or set MIPIE_BACKEND_URL in .env file');
      console.log('   Default will use: http://localhost:5000');
    }
    
    if (!error.message || error.message === '') {
      console.log('\n💡 Possible Issues:');
      console.log('   1. Server not running - Run: npm start');
      console.log('   2. Wrong URL - Check MIPIE_BACKEND_URL in .env');
      console.log('   3. Network issue - Check internet connection');
    }
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 Tip: LinkedIn scraping takes time. Try:');
      console.log('   - Reduce maxPages to 1');
      console.log('   - Check your internet connection');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

// Run scraper
scrapeLinkedInJobs().catch(console.error);

