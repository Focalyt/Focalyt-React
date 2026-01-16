const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const collegeSchema = new Schema({
  _concernPerson: [{
    _id: { type: ObjectId, ref: 'User' },
    defaultAdmin: { type: Boolean, default: false }
  }],
  trainers: [
    {
       type: ObjectId, ref: 'User' 
    }
  ],
  defaultTrainer: { type: ObjectId, ref: 'User' },

  _courses: [{ type: ObjectId, ref: 'courses' }],
  _branches: [{ type: ObjectId, ref: 'Center' }],
  _qualification: [{ type: ObjectId, ref: 'Qualification' }],
  _university: { type: ObjectId, ref: 'University' },
  name: { type: String, trim: true },
  type: { type: String, enum: ['School', 'College', 'Computer Center', 'University', 'Private University'] },
  website: {
    type: String, lowercase: true, trim: true,
  },
  logo: String,
  banner: String,
  mediaGallery: [String],
  cityId: { type: ObjectId, ref: 'City' },
  stateId: { type: ObjectId, ref: 'State' },
  uploadCandidates: [String],
  countryId: String,
  linkedin: String,
  twitter: String,
  facebook: String,
  address: String,
  description: String,
  zipcode: String,
  place: String,
  latitude: String,
  longitude: String,
  collegeRepresentatives: [{ name: String, designation: String, email: String, mobile: String }],
  status: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isProfileCompleted: {
    type: Boolean,
    default: false
  },
  flag: {
    type: Boolean
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    city: { type: String },
    state: { type: String },
    fullAddress: { type: String }
  },
  
  // WhatsApp Business API Configuration
  whatsappConfig: {
    accessToken: { type: String },
    businessAccountId: { type: String },
    phoneNumber: { type: String },
    lastConnected: { type: Date },
    lastMessageSent: { type: Date },
    lastBulkMessageSent: { type: Date },
    messageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = model('College', collegeSchema);
