const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const B2BLeadSchema = new mongoose.Schema({
  leadCategory: { type: ObjectId, ref: 'LeadCategory', required: true },
  typeOfB2B: { type: ObjectId, ref: 'TypeOfB2B', required: true },
  businessName: { type: String, required: true },
  address: { type: String },  
  city: { type: String },
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
  updatedBy: { type: ObjectId, ref: 'User' },
}, {
  timestamps: true // adds createdAt and updatedAt
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
      
      console.log('College found:', college ? college._id : 'No college found');
      
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
