const mongoose = require('mongoose');
const { Schema } = mongoose;

const appReleaseSchema = new Schema(
  {
    platform: {
      type: String,
      enum: ['android'],
      default: 'android',
      required: true,
    },
    versionCode: {
      type: Number,
      required: true,
    },
    versionName: {
      type: String,
      required: true,
      trim: true,
    },
    apkKey: {
      type: String,
      required: true,
    },
    apkUrl: {
      type: String,
      required: true,
    },
    releaseNotes: {
      type: String,
      default: '',
      trim: true,
    },
    forceUpdate: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    fileSizeBytes: {
      type: Number,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

appReleaseSchema.index({ platform: 1, versionCode: -1 });
appReleaseSchema.index({ platform: 1, isActive: 1, versionCode: -1 });

module.exports = mongoose.model('AppRelease', appReleaseSchema);
