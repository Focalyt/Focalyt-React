const mongoose = require('mongoose');
const { Schema, model } = require("mongoose");
const { ObjectId } = Schema.Types;

const appliedCoursesSchema = new Schema(
  {
    _candidate: {
      type: ObjectId,
      ref: "CandidateProfile",
    },
    _course: {
      type: ObjectId,
      ref: "courses",
    },
    _center: {
      type: ObjectId,
      ref: "Center",
    },
   _leadStatus: {
        type: ObjectId,
        ref: "Status",
        default:new mongoose.Types.ObjectId('64ab1234abcd5678ef901234')
      },
   _leadSubStatus: {
        type: ObjectId,
        default:new mongoose.Types.ObjectId('64ab1234abcd5678ef901235')
      },
    _initialStatus: {
      type: String,
      enum:['Hot', 'Warm', 'Cold'],
    },
    registeredBy: {
      type: ObjectId,
      ref: "User",
    },
    // Current Status
    courseStatus: {
      type: Number,
      enum: [0, 1], // e.g. 0: Due, 1: Assigned, etc.
      default: 0,
    },

    // Followup info (optional, alag se track karenge)
    followupDate: {
      type: Date,
    },
    counsellorName: [{
      type: ObjectId,
      ref: "User",
    }],
    // Detailed activity logs with free text description
    logs: [
      {
        user: {
          type: ObjectId,
          ref: "User",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        action: {
          type: String,
          required: true,
          // Example: "Status changed from Due to Assigned", "Followup set for 10 Oct", "Lead referred to John"
        },
        remarks: {
          type: String,
          // Example: "Status changed from Due to Assigned", "Followup set for 10 Oct", "Lead referred to John"
        }
      }
    ],

    registrationFee: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
    url: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
    },
    assignDate: {
      type: Date,
    },
    selectedCenter: {
      centerId: { type: ObjectId, ref: "Center" },
    },
    uploadedDocs: [
      {
        docsId: { type: ObjectId, ref: "courses.docsRequired" },
        fileUrl: String,
        status: { type: String, enum: ["Pending", "Verified", "Rejected"], default: "Pending" },
        reason: { type: String },
        verifiedBy: { type: ObjectId, ref: "User" },
        verifiedDate: { type: Date },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = model("AppliedCourses", appliedCoursesSchema);
