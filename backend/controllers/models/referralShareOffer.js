const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const referralShareOfferSchema = new Schema(
  {
    offerType: {
      type: String,
      enum: ["JOB", "COURSE"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    referrerAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    referredAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

referralShareOfferSchema.index({ offerType: 1, isActive: 1 });

module.exports = model("ReferralShareOffer", referralShareOfferSchema);


