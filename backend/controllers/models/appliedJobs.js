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
  },
  {
    timestamps: true,
  }
);

appliedJobsSchema.paths.createdAt.options.description = "Timestamp when the document was created";
appliedJobsSchema.paths.updatedAt.options.description = "Timestamp when the document was last updated";

module.exports = model("AppliedJobs", appliedJobsSchema);
