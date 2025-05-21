// models/UserActivityLog.js
const { Schema, model, Types } = require("mongoose");

const userActivityLogSchema = new Schema({
  user: { type: Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true }, // e.g., login, logout, update_profile
  meta: { type: Schema.Types.Mixed },       // optional data like { ip: '...', page: '/dashboard' }
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = model("UserActivityLog", userActivityLogSchema);
