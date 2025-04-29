const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const OldCandidate = require("./controllers/models/candidate"); // OLD schema
const NewCandidate = require("./controllers/models/candidateProfile"); // NEW schema

const migrateData = async () => {
  try {
    await mongoose.connect(process.env.MIPIE_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");

    const oldCandidates = await OldCandidate.find({});
    console.log(`🔍 Found ${oldCandidates.length} candidates to migrate\n`);

    for (const old of oldCandidates) {
      try {
        const newData = {
          _id:old._id,
          name: old.name,
          mobile: old.mobile,
          email: old.email,
          sex: old.sex,
          dob: old.dob,

          personalInfo: {
            profilevideo: old.profilevideo,
            whatsapp: old.whatsapp,
            resume: [{url:old.resume}],
            linkedInUrl: old.linkedInUrl,
            facebookUrl: old.facebookUrl,
            twitterUrl: old.twitterUrl,
            professionalTitle: old.careerObjective,
            currentAddress: {
              type: "Point",
              coordinates: old.location?.coordinates || [0, 0],
              latitude: old.latitude || "",
              longitude: old.longitude || "",
              city: old.city?.toString() || "",
              state: old.state?.toString() || "",
              fullAddress: old.address || "",
            },
            permanentAddress: {
              type: "Point",
              coordinates: old.location?.coordinates || [0, 0],
              latitude: old.latitude || "",
              longitude: old.longitude || "",
              city: old.city?.toString() || "",
              state: old.state?.toString() || "",
              fullAddress: old.address || "",
            },
            image: old.image,
            jobLocationPreferences: old.locationPreferences || [],
            skills: [
              ...(old.techSkills || []).map((s) => ({
                skillName: s.id?.toString(),
                skillPercent: 100,
              })),
              ...(old.nonTechSkills || []).map((s) => ({
                skillName: s.id?.toString(),
                skillPercent: 100,
              })),
            ],
            certifications: [],
            languages: [],
            projects: [],
            interest: old.interests || [],
            voiceIntro: [],
            declaration: {
              isChecked: true,
              text: "I hereby declare that all the information provided above is true to the best of my knowledge.",
            },
          },

          hiringStatus: old.hiringStatus || [],
          appliedJobs: old.appliedJobs || [],
          appliedCourses: (old.appliedCourses || []).map((courseId) => {
            const centerObj = old.selectedCenter?.find(
              (s) => s.courseId.toString() === courseId.toString()
            );
            const docObj = (old.docsForCourses || []).filter(
              (d) => d.courseId.toString() === courseId.toString()
            );
            return {
              courseId,
              centerId: centerObj?.centerId || null,
              docsForCourses: docObj || [],
            };
          }),

          qualifications: old.qualifications || [],
          experiences: old.experiences || [],

          availableCredit: old.availableCredit,
          otherUrls: old.otherUrls || [],
          highestQualification: old.highestQualification,
          isProfileCompleted: old.isProfileCompleted,
          flag: old.flag,
          isExperienced: old.isExperienced,
          status: old.status,
          accessToken: old.accessToken || [],
          isDeleted: old.isDeleted,
          isImported: old.isImported,
          creditLeft: old.creditLeft,
          visibility: old.visibility,
          upi: old.upi,
          referredBy: old.referredBy,
          verified: old.verified,
          createdAt: old.createdAt,
          updatedAt: old.updatedAt,
        };

        await NewCandidate.create(newData);
        console.log(`✅ Migrated: ${old.name} (${old.mobile})`);
      } catch (err) {
        console.error(`❌ Error for ${old.mobile}:`, err.message);
      }
    }

    console.log("\n🎉 All candidates migrated successfully.");
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    mongoose.disconnect();
  }
};

migrateData();
