const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const dotenv = require("dotenv");
dotenv.config();

const CandidateProfile = require("./controllers/models/candidate");
const AppliedCourses = require("./controllers/models/appliedCourses");

async function migrateDocsForCourses() {
  try {
    await mongoose.connect(process.env.MIPIE_MONGODB_URI);
    console.log("✅ Connected to database");

    const candidates = await CandidateProfile.find({
      appliedCourses: { $exists: true, $not: { $size: 0 } }
    });

    for (const candidate of candidates) {
      for (const appliedCourse of candidate.appliedCourses) {
        const courseId = appliedCourse.courseId;
        const docsForCourses = appliedCourse.docsForCourses || [];

        if (!courseId || docsForCourses.length === 0) continue;

        const appliedCourseDoc = await AppliedCourses.findOne({
          _candidate: candidate._id,
          _course: courseId
        });

        if (appliedCourseDoc) {
          // 🛑 Now direct uploadedDocs fill karni hai
          let uploadedDocsArray = [];
          for (const doc of docsForCourses) {
            if (Array.isArray(doc.uploadedDocs)) {
              uploadedDocsArray = uploadedDocsArray.concat(doc.uploadedDocs);
            }
          }

          appliedCourseDoc.uploadedDocs = uploadedDocsArray;
          await appliedCourseDoc.save();

          console.log(`✅ Migrated uploadedDocs for candidate: ${candidate.name}`);
        } else {
          console.log(`⚠️ AppliedCourse not found for candidate: ${candidate.name}`);
        }
      }
    }

    console.log('🎉 Migration Completed Successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Migration Failed:', err);
    process.exit(1);
  }
}

migrateDocsForCourses();
