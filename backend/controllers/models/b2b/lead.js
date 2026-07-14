const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const B2BDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    docType: { type: String, trim: true }, 
    url: { type: String, trim: true, required: true }, 
    key: { type: String, trim: true }, 
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    remarks: { type: String, trim: true },
    uploadedBy: { type: ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ApprovalSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    approvedBy: { type: ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedBy: { type: ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
  },
  { _id: false }
);

function unwrapMongoDate(val) {
  if (val == null) return undefined;
  if (val instanceof Date) return val;
  if (typeof val === 'object' && val.$date != null) return new Date(val.$date);
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

function toObjectIdSafe(val) {
  if (val == null) return undefined;
  if (val instanceof mongoose.Types.ObjectId) return val;
  if (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)) {
    return new mongoose.Types.ObjectId(val);
  }
  if (typeof val === 'object') {
    const raw = val.$oid || val._id || val.id;
    if (raw && mongoose.Types.ObjectId.isValid(String(raw))) {
      return new mongoose.Types.ObjectId(String(raw));
    }
  }
  return undefined;
}

function approvalNeedsRepair(approval) {
  if (!approval || typeof approval !== 'object') return false;
  const dateKeys = ['approvedAt', 'rejectedAt'];
  for (const key of dateKeys) {
    const v = approval[key];
    if (v && typeof v === 'object' && !(v instanceof Date) && v.$date != null) return true;
  }
  const idKeys = ['approvedBy', 'rejectedBy'];
  for (const key of idKeys) {
    const v = approval[key];
    if (v && typeof v === 'object' && !(v instanceof mongoose.Types.ObjectId) && (v.$oid != null || v._id != null)) {
      return true;
    }
  }
  return false;
}

function normalizeB2BApproval(approval) {
  if (!approval || typeof approval !== 'object') {
    return { status: 'PENDING' };
  }
  const status = ['PENDING', 'APPROVED', 'REJECTED'].includes(approval.status)
    ? approval.status
    : 'PENDING';
  const out = { status };
  const approvedBy = toObjectIdSafe(approval.approvedBy);
  const rejectedBy = toObjectIdSafe(approval.rejectedBy);
  const approvedAt = unwrapMongoDate(approval.approvedAt);
  const rejectedAt = unwrapMongoDate(approval.rejectedAt);
  if (approvedBy) out.approvedBy = approvedBy;
  if (rejectedBy) out.rejectedBy = rejectedBy;
  if (approvedAt) out.approvedAt = approvedAt;
  if (rejectedAt) out.rejectedAt = rejectedAt;
  if (approval.rejectionReason) out.rejectionReason = String(approval.rejectionReason).trim();
  return out;
}

const B2BLeadSchema = new mongoose.Schema({
  leadCategory: { type: ObjectId, ref: 'LeadCategory', required: true },
  leadRanking: { type: ObjectId, ref: 'LeadRanking' },
  b2bProject: { type: ObjectId, ref: 'B2BProject' },
  b2bDepartment: { type: ObjectId, ref: 'B2BDepartment' },
  /** Root lead id for cross-sale group (same business, multiple projects) */
  crossSaleRootId: { type: ObjectId, ref: 'B2BLead', index: true },
  /** Set on cross-sale copies; points to the primary lead in the group */
  parentLeadId: { type: ObjectId, ref: 'B2BLead', index: true },
  typeOfB2B: { type: ObjectId, ref: 'TypeOfB2B', required: true },
  businessName: { type: String, required: true },
  address: { type: String },  
  city: { type: String },
  block: { type: String },
  state: { type: String },
  coordinates: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  },
  concernPersonName: { type: String, required: true },
  designation: { type: String },
  email: { type: String},
  mobile: { type: String, required: true },
  whatsapp: { type: String },
  landlineNumber: { type: String },
  leadOwner: { type: ObjectId, ref: 'User' }, // Could be ref to user in future
  previousLeadOwners: { type: [ObjectId], ref: 'User' },
  leadAddedBy: { type: ObjectId, ref: 'User' },
  remark: { type: String },
  approval: { type: ApprovalSchema, default: () => ({ status: 'PENDING' }) },
  documents: { type: [B2BDocumentSchema], default: [] },
  logs: [
    {
      user: {
        type: ObjectId,
        ref: "User",

      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      action: {
        type: String,
        required: true,
        // Example: "Status changed from Due to Assigned", "Followup set for 10 Oct", "Lead referred to John"
      },
      remarks: {
        type: String,
        // Example: "Status changed from Due to Assigned", "Followup set for 10 Oct", "Lead referred to John"
      }
    }
  ],
  status: { 
    type: ObjectId, 
    ref: 'StatusB2b'
  },
  subStatus: { 
    type: ObjectId
  },
  followUp: { type: ObjectId, ref: 'FollowUp' },
  followUpCall: { type: ObjectId, ref: 'FollowUp' },
  followUpVisit: { type: ObjectId, ref: 'FollowUp' },
  updatedBy: { type: ObjectId, ref: 'User' },
}, {
  timestamps: true // adds createdAt and updatedAt
});

B2BLeadSchema.statics.normalizeApproval = normalizeB2BApproval;
B2BLeadSchema.statics.approvalNeedsRepair = approvalNeedsRepair;

B2BLeadSchema.pre('validate', function(next) {
  if (!this.approval || typeof this.approval !== 'object' || approvalNeedsRepair(this.approval)) {
    this.approval = normalizeB2BApproval(this.approval);
  }
  next();
});

B2BLeadSchema.pre('save', function(next) {
  if (!this.approval || typeof this.approval !== 'object' || approvalNeedsRepair(this.approval)) {
    this.approval = normalizeB2BApproval(this.approval);
  }
  next();
});

// Pre-save middleware to set default status for new leads
B2BLeadSchema.pre('save', async function(next) {
  // Only set default status for new documents (not updates)
  if (this.isNew && !this.status) {
    try {
      const StatusB2b = require('../statusB2b');
      const User = require('../users');
      const College = require('../college');
      
      console.log('Setting default status for new lead...');
      console.log('leadAddedBy:', this.leadAddedBy);
      
      // Find the college that has this user as a concern person
      const college = await College.findOne({
        '_concernPerson._id': this.leadAddedBy
      });
      
      // console.log('College found:', college ? college._id : 'No college found');
      
      if (college) {
        const defaultStatus = await StatusB2b.findOne({
          college: college._id,
          title: "Untouch Lead"
        });
        
        console.log('Default status found:', defaultStatus ? defaultStatus._id : 'No status found');

        if (defaultStatus) {
          this.status = defaultStatus._id;
          
          // Set the first substatus as default
          if (defaultStatus.substatuses && defaultStatus.substatuses.length > 0) {
            this.subStatus = defaultStatus.substatuses[0]._id;
            console.log('Substatus set:', this.subStatus);
          }
          
          console.log('Status set successfully:', this.status);
        } else {
          console.log('No default status found for college:', college._id);
          // Try to find any status for this college as fallback
          const anyStatus = await StatusB2b.findOne({ college: college._id });
          if (anyStatus) {
            this.status = anyStatus._id;
            console.log('Using fallback status:', anyStatus.title);
          }
        }
      }
    } catch (error) {
      console.error('Error setting default status:', error);
      // Don't fail the save operation, just log the error
    }
  }
  next();
});

module.exports = mongoose.model('B2BLead', B2BLeadSchema);