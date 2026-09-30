const { Schema, model } = require("mongoose");

const tempLrpLeadSchema = new Schema(
  {
    candidateName: { type: String, required: true, trim: true },
    candidateNumber: { type: String, required: true, trim: true },
    whatsapp: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    center: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ["male", "female", "other"] },
    highestQualification: { type: String, required: true, trim: true },
    counsellorName: { type: String, required: true, trim: true },
    source: { type: String, required: true, enum: ["LRP", "FO"], trim: true },
  },
  { timestamps: true, collection: "templrpleads" }
);

module.exports = model("TempLrpLead", tempLrpLeadSchema);
