const mongoose = require('mongoose');
const Candidate = require('./controllers/models/candidate');  // ✅ सही Candidate model path
const AppliedCourses = require('./controllers/models/appliedCourses');  // ✅ सही AppliedCourses model path


async function migrateSelectedCenter() {
  try {
    await mongoose.connect(process.env.MIPIE_MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to database");   

    const candidates = await Candidate.find({ selectedCenter: { $exists: true, $not: { $size: 0 } } });

    console.log(`Candidates found with selectedCenter: ${candidates.length}`);

    for (const candidate of candidates) {
      const { selectedCenter = [] } = candidate;

      for (const centerEntry of selectedCenter) {
        if (!centerEntry.courseId || !centerEntry.centerId) continue;

        const appliedCourse = await AppliedCourses.findOne({
          _candidate: candidate._id,
          _course: centerEntry.courseId
        });

        if (appliedCourse) {
          appliedCourse.selectedCenter = {
            centerId: centerEntry.centerId
          };
          await appliedCourse.save();
          console.log(`✅ Updated selectedCenter for candidate ${candidate.mobile} course ${centerEntry.courseId}`);
        } else {
          console.log(`⚠️ No AppliedCourse found for candidate ${candidate.mobile} and course ${centerEntry.courseId}`);
        }
      }
    }

    console.log("🎯 selectedCenter migration completed successfully!");
    mongoose.disconnect();
  } catch (error) {
    console.error("Migration Error:", error);
    mongoose.disconnect();
  }
}

migrateSelectedCenter();