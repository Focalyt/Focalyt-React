const { Schema, model } = require("mongoose");

const BotTrainingSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["job-search", "qa"],
      required: true,
    },
    userQuery: {
      type: String,
      trim: true,
    },
    expectedPreferences: {
      type: Schema.Types.Mixed,
      default: {},
    },
    expectedResponse: {
      type: String,
      default: "",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("BotTraining", BotTrainingSchema);

