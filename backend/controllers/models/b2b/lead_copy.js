const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

/**
 * Copy of `lead.js` (B2BLead) for the Sales Copy / approval flow.
 * Same shape as the original + extra fields. Dedicated collection `b2bleads_copy` (Sales Copy flow only).
 */
const B2BLeadCopySchema = new mongoose.Schema({
  leadCategory: { type: ObjectId, ref: 'LeadCategory', required: true },
  typeOfB2B: { type: ObjectId, ref: 'TypeOfB2B', required: true },
  businessName: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  block: { type: String },
  coordinates: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  concernPersonName: { type: String, required: true },
  designation: { type: String },
  email: { type: String },
  mobile: { type: String, required: true },
  whatsapp: { type: String },
  landlineNumber: { type: String },
  leadOwner: { type: ObjectId, ref: 'User' },
  previousLeadOwners: { type: [ObjectId], ref: 'User' },
  leadAddedBy: { type: ObjectId, ref: 'User' },

  // --- Copy / approval flow only (not on original Lead model) ---
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  approvedBy: { type: ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  leadStatus: { type: String, enum: ['hot', 'warm', 'cold', 'prospect'] },
  /** Lock duration in days (1–60); lead owner is set to submitter when set. */
  lockLeadDays: { type: Number, min: 1, max: 60 },

  remark: { type: String },
  logs: [
    {
      user: {
        type: ObjectId,
        ref: 'User',
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      action: {
        type: String,
        required: true,
      },
      remarks: {
        type: String,
      },
    },
  ],
  status: {
    type: ObjectId,
    ref: 'StatusB2b',
  },
  subStatus: {
    type: ObjectId,
  },
  followUp: { type: ObjectId, ref: 'FollowUp' },
  updatedBy: { type: ObjectId, ref: 'User' },

  /** Sales copy: files attached to lead with institute review status */
  documents: [
    {
      name: { type: String, trim: true, default: 'Document' },
      fileUrl: { type: String, trim: true },
      approvalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
      },
      uploadedAt: { type: Date, default: Date.now },
      reviewedAt: { type: Date },
      reviewedBy: { type: ObjectId, ref: 'User' },
    },
  ],
}, {
  timestamps: true,
});

// Same pre-save as lead.js: default status for new leads
B2BLeadCopySchema.pre('save', async function (next) {
  if (this.isNew && !this.status) {
    try {
      const StatusB2b = require('../statusB2b');
      const College = require('../college');

      const college = await College.findOne({
        '_concernPerson._id': this.leadAddedBy,
      });

      if (college) {
        const defaultStatus = await StatusB2b.findOne({
          college: college._id,
          title: 'Untouch Lead',
        });

        if (defaultStatus) {
          this.status = defaultStatus._id;
          if (defaultStatus.substatuses && defaultStatus.substatuses.length > 0) {
            this.subStatus = defaultStatus.substatuses[0]._id;
          }
        } else {
          const anyStatus = await StatusB2b.findOne({ college: college._id });
          if (anyStatus) {
            this.status = anyStatus._id;
          }
        }
      }
    } catch (error) {
      console.error('[B2BLeadCopy] Error setting default status:', error);
    }
  }
  next();
});

module.exports = mongoose.model('B2BLeadCopy', B2BLeadCopySchema, 'b2bleads_copy');
