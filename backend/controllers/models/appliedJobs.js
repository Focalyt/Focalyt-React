const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const appliedJobsSchema = new Schema(
  {
    _candidate: {
      type: ObjectId,
      ref: "CandidateProfile",
      description: "Reference to the Candidate who applied for the job",
    },
    _company: {
      type: ObjectId,
      ref: "Company",
      description: "Reference to the Company offering the job",
    },
    _job: {
      type: ObjectId,
      ref: "Vacancy",
      description: "Reference to the specific job vacancy that the candidate applied to",
    },
    coinsDeducted: {
      type: Number,
      description: "The number of coins deducted for applying to the job",
    },
    isRegisterInterview: {
      type: Boolean,
      default: false,
      description: "Indicates if the candidate has registered for an interview for the job",
    },
    college: { type: ObjectId, ref: "College", index: true },
    project: { type: ObjectId, ref: "Project" },
    department: { type: ObjectId, ref: "Vertical" },
    leadStatus: { type: ObjectId, ref: "StatusHr", index: true },
    leadSubstatus: { type: ObjectId, index: true },
    leadOwner: { type: ObjectId, ref: "User", index: true },
    leadCoOwner: { type: ObjectId, ref: "User" },
    assignedTo: { type: ObjectId, ref: "User" },
    remark: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "" },
    resume: { type: String, default: "" },
    documents: [
      {
        key: { type: String, trim: true },
        name: { type: String, trim: true },
        fileUrl: { type: String, trim: true, default: "" },
        uploadedAt: { type: Date },
      },
    ],
    followups: [
      {
        type: { type: String, enum: ["Call", "Visit"], default: "Call" },
        followupDate: { type: Date, required: true },
        remarks: { type: String, default: "" },
        status: { type: String, enum: ["planned", "done", "missed"], default: "planned" },
        createdBy: { type: ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
      },
    ],
    logs: [
      {
        user: { type: ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now },
        action: { type: String, required: true },
        remarks: { type: String, default: "" },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

appliedJobsSchema.index({ college: 1, createdAt: -1 });
appliedJobsSchema.paths.createdAt.options.description = "Timestamp when the document was created";
appliedJobsSchema.paths.updatedAt.options.description = "Timestamp when the document was last updated";

module.exports = model("AppliedJobs", appliedJobsSchema);
