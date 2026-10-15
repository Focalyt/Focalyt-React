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
    docsRequired: [
      {
        Name: { type: String },
        mandatory: { type: Boolean, default: false },
        status: { type: Boolean, default: true },
      },
    ],
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
    vertical: { type: ObjectId, ref: "Vertical" },
    project: { type: ObjectId, ref: "Project" },
    center: { type: ObjectId, ref: "Center" },
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
    const { resolveWinningHr } = require("../../helpers/jobRuleMatch");
    const selected = await resolveWinningHr(this);
    if (!selected?.hrId) {
      return null;
    }

    if (!Array.isArray(this.hrAssignment)) {
      this.hrAssignment = [];
    }

    this.hrAssignment.push({
      _hr: new mongoose.Types.ObjectId(selected.hrId),
      hrName: selected.hrName || "Unknown",
      assignDate: new Date(),
    });
    this.hr = new mongoose.Types.ObjectId(selected.hrId);
    this.hrAssignmentStatus = 1;

    return selected.hrId;
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
