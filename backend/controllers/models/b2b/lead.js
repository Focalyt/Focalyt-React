const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const B2BLeadSchema = new mongoose.Schema({
  leadCategory: { type: ObjectId, ref:'LeadCategory', required: true },
  typeOfB2B: { type: ObjectId, ref:'TypeOfB2B', required: true },
  businessName: { type: String, required: true },
  address: { type: String },
  coordinates:{
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }
  },
  concernPersonName: { type: String, required: true },
  designation: { type: String },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  whatsapp: { type: String },
  leadOwner: { type: ObjectId, ref:'User' }, // Could be ref to user in future
  previousLeadOwners: { type: [ObjectId], ref:'User' },
  leadAddedBy:{type:ObjectId, ref:'User'},
  remark:[
    {
        remark:{type:String},
        addedBy:{type:ObjectId, ref:'User'},
        addedAt:{type:Date, default:Date.now},
    }
  ],
  status:{type:ObjectId, ref:'StatusB2b'},
  subStatus:{type:ObjectId},
  followUp:{type:ObjectId, ref:'FollowUp'},
  updatedBy:{type:ObjectId, ref:'User'},
}, {
  timestamps: true // adds createdAt and updatedAt
});

module.exports = mongoose.model('B2BLead', B2BLeadSchema);
