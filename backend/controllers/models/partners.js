const { Schema, model } = require("mongoose");

const partnerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = model("Partner", partnerSchema);
