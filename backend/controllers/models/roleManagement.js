// models/RoleManagement.js
const { defaults } = require('joi');
const mongoose = require('mongoose');
const { Schema } = mongoose;

const roleManagementSchema = new Schema({
  roleName: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  permissions: [{ key: { type: String, required: true } }],
  status:{type:Boolean, default:true}
}, { timestamps: true });

module.exports = mongoose.model('RoleManagement', roleManagementSchema);
