const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const { stringify } = require("uuid");

const { ObjectId } = Schema.Types;

const vacancySchema = new Schema(
  {
    _company: { type: ObjectId, ref: "Company" },
    _qualification: { type: ObjectId, ref: "Qualification" },
    _courses: [{
      sectors: {
        type: Schema.Types.ObjectId,
        ref: 'CourseSectors'
      },
      courseLevel: { type: Schema.Types.ObjectId, ref: 'courses' },
      name: { type: Schema.Types.ObjectId, ref: 'courses' },
      isRecommended : {type : Boolean, default : false},
      // isVerifie : {type : Boolean, default : false},
    }],
    _subQualification: [{ type: ObjectId, ref: "SubQualification" }],
    _jobCategory: { type: ObjectId, ref: "JobCategory" },
    _industry: { type: ObjectId, ref: "Industry" },
    _techSkills: [{ type: ObjectId, ref: "Skill" }],
    _nonTechSkills: [{ type: ObjectId, ref: "Skill" }],
    displayCompanyName: { type: String, trim: true },
    title: { type: String },
    sequence: {
      type: Number,
      default: 50
    },
    state: { type: ObjectId, ref: "State" },
    countryId: String,
    city: { type: ObjectId, ref: "City" },
    jobType: { type: String },
    compensation: { type: String },
    pay: { type: String },
    shift: { type: String },
    shiftTimingFrom: { type: String },
    shiftTimingTo: { type: String },
    work: { type: String },
    questionsAnswers: [{ Question: String, Answer: String }],
    benifits: [String],
    remarks: String,
    place: String,
    latitude: String,
    longitude: String,
    applyReduction: Number,
    requirement: String,
    isFixed: Boolean,
    amount: Number,
    min: Number,
    max: Number,
    noOfPosition: Number,
    experience: { type: Number },
    experienceMonths: { type: Number },
    shortlisted: Number,
    dateOfPosting: Date,
    jobDescription: String,
    payOut: String,
    jobVideo: String,
    jobVideoThumbnail:String,
    distance: Number,
    isContact: Boolean,
    postingType: { type: String, enum: ['Public', 'Private'], default: 'Public' },
    nameof: String,
    phoneNumberof: Number,
    whatsappNumberof: Number,
    emailof: String,
    collegeAcNo: [String],
    ageMax: Number,
    ageMin: Number,
    shifttimings:String,
    duties: String,
    genderPreference: { type: String },
    status: {
      type: Boolean,
      default: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number]
      }
    },
    validity: {
      type: Date
    },
    cutprice:{
      type:Number
    },
    verified: {
      type: Boolean,
      default: false
    },
    isedited: {
      type: Boolean,
      default: false,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    hr: { type: ObjectId, ref: "User" },
    hrAssignmentStatus: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    hrAssignment: [{
      _hr: { type: ObjectId, ref: "User" },
      hrName: { type: String },
      assignDate: { type: Date },
      assignedBy: { type: ObjectId, ref: "User" },
    }],
  },
  { timestamps: true }
);

vacancySchema.index({ "hrAssignment._hr": 1, createdAt: -1 });
vacancySchema.index({ hr: 1 });

vacancySchema.methods.assignHr = async function () {
  try {
    require("./jobAssignmentRule");
    const JobAssignmentRule = mongoose.model("JobAssignmentRule");
    const Vacancy = this.constructor;
    const College = mongoose.model("College");
    const User = mongoose.model("User");

    const jobCategoryId = this._jobCategory;
    const vacancyId = this._id;
    const jobTitle = this.title;

    const categoryMatch = [{ "jobCategory.type": "any" }];
    if (jobCategoryId) {
      categoryMatch.push({
        "jobCategory.type": "includes",
        "jobCategory.values": jobCategoryId,
      });
    }

    const jobNameIds = new Set();
    if (vacancyId) {
      jobNameIds.add(vacancyId.toString());
    }
    if (jobTitle) {
      const sameNameJobs = await Vacancy.find({ status: true, title: jobTitle }).select("_id").lean();
      sameNameJobs.forEach((job) => jobNameIds.add(job._id.toString()));
    }

    const jobNameMatch = [
      { "jobName.type": "any" },
      { jobName: { $exists: false } },
    ];
    if (jobNameIds.size > 0) {
      jobNameMatch.push({
        "jobName.type": "includes",
        "jobName.values": { $in: [...jobNameIds] },
      });
    }

    const applicableRules = await JobAssignmentRule.find({
      status: "Active",
      $and: [
        { $or: categoryMatch },
        { $or: jobNameMatch },
      ],
    });

    let allHrs = [];

    if (applicableRules.length === 0) {
      const collegeId = Array.isArray(this.collegeAcNo) && this.collegeAcNo.length
        ? this.collegeAcNo[0]
        : null;

      if (!collegeId) {
        return null;
      }

      const college = await College.findById(collegeId);
      if (!college || !college._concernPerson || college._concernPerson.length === 0) {
        return null;
      }

      const defaultAdmin = college._concernPerson.find((person) => person.defaultAdmin === true);
      const fallback = defaultAdmin || college._concernPerson[0];
      if (!fallback || !fallback._id) {
        return null;
      }
      allHrs = [fallback._id.toString()];
    } else {
      applicableRules.forEach((rule) => {
        allHrs = allHrs.concat(rule.assignedHrs || []);
      });
      allHrs = [...new Set(allHrs.map((hr) => hr.toString()))];
    }

    if (allHrs.length === 0) {
      return null;
    }

    const hrAssignments = [];
    for (const hrId of allHrs) {
      const lastAssignment = await Vacancy.findOne({
        "hrAssignment._hr": hrId,
      }).sort({ createdAt: -1 });

      hrAssignments.push({
        hrId,
        lastAssignmentDate: lastAssignment ? lastAssignment.createdAt : null,
        hasAssignment: Boolean(lastAssignment),
      });
    }

    let selectedHr = null;
    if (allHrs.length === 1) {
      selectedHr = allHrs[0];
    } else {
      const withoutAssignment = hrAssignments.filter((item) => !item.hasAssignment);
      if (withoutAssignment.length > 0) {
        selectedHr = withoutAssignment[0].hrId;
      } else {
        const sortedByDate = hrAssignments.sort((a, b) => {
          return new Date(a.lastAssignmentDate) - new Date(b.lastAssignmentDate);
        });
        selectedHr = sortedByDate[0].hrId;
      }
    }

    if (!selectedHr) {
      return null;
    }

    const hrDetails = await User.findById(selectedHr);
    const hrName = hrDetails ? hrDetails.name : "Unknown";

    if (!Array.isArray(this.hrAssignment)) {
      this.hrAssignment = [];
    }

    this.hrAssignment.push({
      _hr: new mongoose.Types.ObjectId(selectedHr),
      hrName,
      assignDate: new Date(),
    });
    this.hr = new mongoose.Types.ObjectId(selectedHr);
    this.hrAssignmentStatus = 1;

    return selectedHr;
  } catch (error) {
    console.error("Error in assignHr:", error);
    throw error;
  }
};

vacancySchema.methods.manualAssignHr = async function () {
  const result = await this.assignHr();
  if (result) {
    await this.save();
  }
  return result;
};

vacancySchema.pre("save", async function (next) {
  try {
    if (this.isNew && (!this.hrAssignment || this.hrAssignment.length === 0)) {
      await this.assignHr();
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = model("Vacancy", vacancySchema);
