const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const dotenv = require("dotenv");
dotenv.config();

const AppliedCourses = require('./controllers/models/appliedCourses');
const Candidate = require('./controllers/models/candidate'); // Old model
const CandidateProfile = require('./controllers/models/candidateProfile'); // New model

async function migrateAppliedCourses() {
  try {
    // Connect to database - FIXED THIS LINE
    await mongoose.connect(process.env.MIPIE_MONGODB_URI);
    console.log("Connected to database");
    
    // Rest of your function remains the same
    const courses = await AppliedCourses.find({ _candidate: { $ne: null } });
    console.log(`Found ${courses.length} courses with candidate references`);
    
    // ...remainder of your function...
  } catch (error) {
    console.error("Error migrating references:", error);
  } finally {
    mongoose.disconnect();
  }
}

migrateAppliedCourses();