const { Schema, model } = require("mongoose");

const certificateIssueSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    course: { type: String, trim: true, required: true },
    dateFrom: { type: String, trim: true, default: "" },
    dateEnd: { type: String, trim: true, default: "" },

    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("CertificateIssue", certificateIssueSchema);

