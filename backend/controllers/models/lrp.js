const { Schema, model } = require("mongoose");

const leadSourceQAItemSchema = new Schema(
  {
    metaKey: { type: String, trim: true },
    question: { type: String, trim: true },
    type: { type: String, enum: ["text", "number", "radio", "date"], default: "text" },
    options: [{ type: String, trim: true }],
    required: { type: Boolean, default: true },
    value: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const leadSourceQASchema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: "LeadCategory" },
    items: { type: [leadSourceQAItemSchema], default: [] },
  },
  { _id: false }
);

const lrpSchema = new Schema(
  {
    college: { type: Schema.Types.ObjectId, ref: "College" },
    b2bLeadId: { type: Schema.Types.ObjectId, ref: "Lead" },
    leadSourceQA: { type: leadSourceQASchema },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = model("LRP", lrpSchema);
