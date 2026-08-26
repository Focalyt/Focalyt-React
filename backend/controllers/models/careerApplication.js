const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const careerApplicationSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      trim: true,
      default: '',
    },
    // Optional because digital lead forms often capture only name, mobile and email.
    applyingFor: {
      type: String,
      trim: true,
      default: '',
    },
    experience: {
      type: String,
      trim: true,
      default: '',
    },
    qualification: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    resume: {
      type: String,
      default: '',
    },
    documents: [
      {
        key: { type: String, trim: true },
        name: { type: String, trim: true },
        fileUrl: { type: String, trim: true, default: '' },
        uploadedAt: { type: Date },
      },
    ],
    college: {
      type: ObjectId,
      ref: 'College',
      index: true,
      default: null,
    },
    leadStatus: {
      type: ObjectId,
      ref: 'StatusHr',
      index: true,
    },
    leadSubstatus: {
      type: ObjectId,
      index: true,
    },
    remark: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      trim: true,
      default: 'website',
    },
    assignedTo: {
      type: ObjectId,
      ref: 'User',
    },
    leadOwner: {
      type: ObjectId,
      ref: 'User',
      index: true,
    },
    leadCoOwner: {
      type: ObjectId,
      ref: 'User',
      index: true,
    },
    followups: [
      {
        type: { type: String, enum: ['Call', 'Visit'], default: 'Call' },
        followupDate: { type: Date, required: true },
        remarks: { type: String, default: '' },
        status: { type: String, enum: ['planned', 'done'], default: 'planned' },
        createdBy: { type: ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
      },
    ],
    logs: [
      {
        user: { type: ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        action: { type: String, required: true },
        remarks: { type: String, default: '' },
      },
    ],
    status: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

careerApplicationSchema.index({ createdAt: -1 });
careerApplicationSchema.index({ fullName: 1 });
careerApplicationSchema.index({ mobile: 1 });
careerApplicationSchema.index({ applyingFor: 1 });
careerApplicationSchema.index({ college: 1, mobile: 1, applyingFor: 1 });

module.exports = model('CareerApplication', careerApplicationSchema);
