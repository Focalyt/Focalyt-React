const { Schema, model } = require("mongoose");

const BotTrainingRuleSchema = new Schema(
  {
    rule: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    priority: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("BotTrainingRule", BotTrainingRuleSchema);

