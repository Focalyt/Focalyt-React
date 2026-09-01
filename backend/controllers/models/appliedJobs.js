const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");

const { ObjectId } = Schema.Types;

const appliedJobsSchema = new Schema(
  {
    _candidate: {
      type: ObjectId,
      ref: "CandidateProfile",
    },
    _company: {
      type: ObjectId,
      ref: "Company",
    },
    _job: {
      type: ObjectId,
      ref: "Vacancy",
    },
    // Current HR owner — same role as AppliedCourses.counsellor
    hr: {
      type: ObjectId,
      ref: "User",
    },
    hrName: {
      type: String,
    },
    assignDate: {
      type: Date,
    },
    hrAssignmentStatus: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    hrAssignment: [
      {
        _hr: { type: ObjectId, ref: "User" },
        hrName: { type: String },
        assignDate: { type: Date },
        assignedBy: { type: ObjectId, ref: "User" },
      },
    ],
    coinsDeducted: {
      type: Number,
    },
    isRegisterInterview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

appliedJobsSchema.index({ hr: 1, createdAt: -1 });
appliedJobsSchema.index({ _candidate: 1, _job: 1 });

// Same idea as AppliedCourses.assignCounselor:
// job already has HR from Job Rules → that HR becomes owner of this applicant.
appliedJobsSchema.methods.assignHr = async function () {
  try {
    if (this.hr && Array.isArray(this.hrAssignment) && this.hrAssignment.length > 0) {
      return this.hr;
    }

    if (!this.hr) {
      const { resolveJobHrOwner } = require("../../../helpers/resolveJobHrOwner");
      const jobOwner = await resolveJobHrOwner({ jobId: this._job });
      if (!jobOwner.hrId) return null;
      this.hr = new mongoose.Types.ObjectId(jobOwner.hrId);
      this.hrName = jobOwner.hrName;
    } else if (!this.hrName) {
      const User = mongoose.model("User");
      const hrDetails = await User.findById(this.hr).select("name");
      this.hrName = hrDetails?.name || "Unknown";
    }

    this.assignDate = this.assignDate || new Date();
    this.hrAssignmentStatus = 1;
    if (!Array.isArray(this.hrAssignment) || this.hrAssignment.length === 0) {
      this.hrAssignment = [
        {
          _hr: this.hr,
          hrName: this.hrName,
          assignDate: this.assignDate,
        },
      ];
    }

    return this.hr;
  } catch (error) {
    console.error("Error in AppliedJobs.assignHr:", error);
    throw error;
  }
};

appliedJobsSchema.pre("save", async function (next) {
  try {
    if (this.isNew && (!this.hrAssignment || this.hrAssignment.length === 0)) {
      await this.assignHr();
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = model("AppliedJobs", appliedJobsSchema);
