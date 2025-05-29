const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const dotenv = require("dotenv");
dotenv.config();

const AppliedCourses = require('./controllers/models/appliedCourses');
const Candidate = require('./controllers/models/candidate'); // Old model
const CandidateProfile = require('./controllers/models/candidateProfile'); // New model


async function migrateAppliedCoursesToCandidateProfile() {
  try {
    // Step 1: Get all AppliedCourses documents
    const allAppliedCourses = await AppliedCourses.find({}, '_id _candidate').lean();

    // Step 2: Loop through each AppliedCourse document
    for (const appliedCourse of allAppliedCourses) {
      if (!appliedCourse._candidate) {
        console.log(`AppliedCourse ${appliedCourse._id} has no _candidate reference, skipping.`);
        continue;
      }

      // Step 3: Update CandidateProfile's _appliedCourses array, add AppliedCourse _id if not present
      await CandidateProfile.updateOne(
        { _id: appliedCourse._candidate },
        { $addToSet: { _appliedCourses: appliedCourse._id } }
      );

      console.log(`Added AppliedCourse ${appliedCourse._id} to Candidate ${appliedCourse._candidate}`);
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    mongoose.connection.close();
  }
}

async function run() {
  try {
    // Connect to database - FIXED THIS LINE
    await mongoose.connect(process.env.MIPIE_MONGODB_URI);
    console.log("Connected to database");
    
    // Rest of your function remains the same
    await migrateAppliedCoursesToCandidateProfile();
    
    // ...remainder of your function...
  } catch (error) {
    console.error("Error migrating references:", error);
  } finally {
    mongoose.disconnect();
  }
}

run();