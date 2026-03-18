const { Schema, model } = require("mongoose");


const PreVerificationSchema = new Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      required: true,
      validate: (arr) => Array.isArray(arr) && arr.length > 0,
    },

    order: {
      type: Number,
      default: 0,
      index: true,
    },


    isActive: {
      type: Boolean,
      default: true,
    },


    type: {
      type: String,
      enum: ["default", "placementRecommendation", "visit"],
      default: "default",
    },
  },
  { timestamps: true }
);

module.exports = model("PreVerification", PreVerificationSchema);