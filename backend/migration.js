const mongoose = require("mongoose");
const NewCandidate = require("./models/CandidateProfile"); // Purane model ka import
const OldCandidate = require("./models/Candidate"); // Naye model ka import

const { mongodbUri } = require("./config");

mongoose.connect(mongodbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrateCandidates = async () => {
  try {
    const oldCandidates = await OldCandidate.find();

    for (const old of oldCandidates) {
      const data = {
        name: old.personalInfo?.name || "",
        mobile: old.personalInfo?.mobile || null,
        email: old.personalInfo?.email || "",
        place: old.personalInfo?.place || "",
        profilevideo: old.personalInfo?.profilevideo || "",
        sex: old.personalInfo?.sex || "",
        dob: old.personalInfo?.dob || null,
        whatsapp: old.personalInfo?.whatsapp || null,
        resume: old.personalInfo?.resume || "",
        linkedInUrl: old.personalInfo?.linkedInUrl || "",
        facebookUrl: old.personalInfo?.facebookUrl || "",
        twitterUrl: old.personalInfo?.twitterUrl || "",
        image: old.personalInfo?.image || "",
        location: {
          type: "Point",
          coordinates: old.personalInfo?.location?.coordinates || [0, 0]
        },
        presentAddress: {
          city: old.personalInfo?.location?.city || "",
          state: old.personalInfo?.location?.state || "",
          latitude: old.personalInfo?.location?.latitude || "",
          longitude: old.personalInfo?.location?.longitude || "",
          fullAddress: old.personalInfo?.location?.fullAddress || ""
        },
        locationPreferences: old.personalInfo?.jobLocationPreferences || [],
        techSkills: (old.personalInfo?.skill || []).map(skill => ({
          id: null, // Agar ID available ho to map karo
          URL: ""
        })),
        nonTechSkills: [],
        interests: (old.personalInfo?.interest || []).map(i => i),
        qualifications: old.qualifications,
        experiences: old.experiences,
        hiringStatus: old.hiringStatus,
        appliedJobs: old.appliedJobs,
        appliedCourses: (old.appliedCourses || []).map(e => e.courseId),
        selectedCenter: (old.appliedCourses || []).map(e => ({
          courseId: e.courseId,
          centerId: e.centerId
        })),
        docsForCourses: (old.appliedCourses || []).flatMap(e => e.docsForCourses || []),
        isProfileCompleted: old.isProfileCompleted,
        accessToken: old.accessToken,
        status: old.status,
        isDeleted: old.isDeleted,
        isImported: old.isImported,
        verified: old.verified,
        availableCredit: old.availableCredit,
        creditLeft: old.creditLeft,
        flag: old.flag,
        referredBy: old.referredBy,
        highestQualification: old.highestQualification
      };

      const newCandidate = new NewCandidate(data);
      await newCandidate.save();
    }

    console.log("✅ Migration completed!");
  } catch (err) {
    console.error("❌ Migration error:", err);
  } finally {
    mongoose.connection.close();
  }
};

migrateCandidates();
