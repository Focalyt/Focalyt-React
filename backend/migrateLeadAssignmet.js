const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();
const AppliedCourses = require('./controllers/models/appliedCourses');  // ✅ सही AppliedCourses model path


async function updateOldLeadAssignments() {
  try {

    await mongoose.connect(process.env.MIPIE_MONGODB_URI);
    console.log("✅ Connected to database");
    // Step 1: Find records where counsellorName is a string (old data)
    const recordsToUpdate = await AppliedCourses.find({
      'leadAssignment.counsellorName': { $type: 'string' },  // Check for records where counsellorName is a string
    });

    console.log(recordsToUpdate, 'recordsToUpdate');

    // Step 2: Loop through each record and update the counsellorName to ObjectId
    for (let record of recordsToUpdate) {
      console.log(record, 'record');
      for (let assignment of record.leadAssignment) {
        // If counsellorName is a string, we need to find the corresponding User and update it to ObjectId
        assignment._counsellor = assignment._id;        
        assignment._id =  new mongoose.Types.ObjectId();
      }
      console.log(record, 'record after update');
      // Save the updated record
      await record.save();
    }

    console.log('Old data updated and console logs added successfully');
  } catch (error) {
    console.error('Error updating old data and console logs:', error);
  }
}

updateOldLeadAssignments();